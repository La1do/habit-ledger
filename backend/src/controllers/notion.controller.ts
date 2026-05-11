import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  buildOAuthUrl,
  exchangeToken,
  upsertConnection,
  listPages,
  selectPage,
  getConnectionStatus,
} from "../services/notion.oauth.service";
import {
  getPageBlocks,
  parseToDoBlocks,
  upsertNotionTasks,
} from "../services/notion.extract.service";
import { suggestSetup } from "../services/notion.ai.service";
import { verifyWebhookSignature, processWebhook } from "../services/notion.webhook.service";
import { confirmSetup } from "../services/notion.confirm.service";
import type { ConfirmTaskInput } from "../services/notion.confirm.service";
import { getWidgetData, renderWidget } from "../services/notion.widget.service";
import { decrypt } from "../utils/encrypt";
import prisma from "../config/prisma";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET ?? "your_access_token_secret";
const STATE_TOKEN_TTL = "5m";

// ─── GET /api/notion/auth/start ───────────────────────────────────────────────

export const startOAuth = (req: Request, res: Response): void => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const stateToken = jwt.sign({ userId, purpose: "notion_oauth" }, JWT_SECRET, {
    expiresIn: STATE_TOKEN_TTL,
  } as jwt.SignOptions);

  const oauthUrl = buildOAuthUrl(stateToken);

  // FE SPA gọi với Accept: application/json → trả URL thay vì redirect
  if (req.headers.accept?.includes("application/json")) {
    res.status(200).json({ url: oauthUrl });
    return;
  }

  res.redirect(302, oauthUrl);
};

// ─── GET /api/notion/auth/callback ───────────────────────────────────────────

export const oauthCallback = async (req: Request, res: Response): Promise<void> => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) { res.redirect(`${FRONTEND_URL}/notion/setup?error=access_denied`); return; }
  if (!code || !state) { res.status(400).json({ error: "Missing code or state" }); return; }

  let userId: string;
  try {
    const payload = jwt.verify(state, JWT_SECRET) as { userId: string; purpose: string };
    if (payload.purpose !== "notion_oauth") throw new Error("Invalid purpose");
    userId = payload.userId;
  } catch {
    res.status(400).json({ error: "Invalid or expired state token" });
    return;
  }

  try {
    const tokenResponse = await exchangeToken(code);
    await upsertConnection(userId, tokenResponse);
    res.redirect(`${FRONTEND_URL}/notion/setup?connected=true`);
  } catch (err: unknown) {
    console.error("[notion:oauth] Callback error:", err instanceof Error ? err.message : "unknown");
    res.redirect(`${FRONTEND_URL}/notion/setup?error=exchange_failed`);
  }
};

// ─── GET /api/notion/pages ────────────────────────────────────────────────────

export const getPages = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const pages = await listPages(userId);
    res.status(200).json({ pages });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("No Notion connection")) {
      res.status(404).json({ error: "Notion not connected" }); return;
    }
    console.error("[notion:oauth] List pages error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ error: "Failed to fetch pages" });
  }
};

// ─── PATCH /api/notion/pages/select ──────────────────────────────────────────

export const selectPageHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { page_id } = req.body as { page_id?: string };
  if (!page_id) { res.status(400).json({ error: "page_id is required" }); return; }

  try {
    await selectPage(userId, page_id);
    res.status(200).json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("No Notion connection")) {
      res.status(404).json({ error: "Notion not connected" }); return;
    }
    console.error("[notion:oauth] Select page error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ error: "Failed to select page" });
  }
};

// ─── GET /api/notion/status ───────────────────────────────────────────────────

export const getStatus = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const status = await getConnectionStatus(userId);
    res.status(200).json(status);
  } catch (err: unknown) {
    console.error("[notion:oauth] Status error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ error: "Failed to get status" });
  }
};

// ─── POST /api/notion/pages/:page_id/extract ─────────────────────────────────

export const extractPage = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const page_id  = req.params.page_id as string;

  try {
    const connection = await prisma.notionConnection.findUnique({ where: { user_id: userId } });
    if (!connection) { res.status(404).json({ error: "Notion not connected" }); return; }

    const accessToken = decrypt(connection.access_token);
    const blocks = await getPageBlocks(accessToken, page_id);
    const extractedTasks = parseToDoBlocks(blocks);
    await upsertNotionTasks(connection.id, extractedTasks);

    const goals = await prisma.goal.findMany({
      where: { user_id: userId, deleted_at: null, status: "ACTIVE" },
      select: { id: true, title: true, target_amount: true },
    });

    const suggestions = await suggestSetup(
      extractedTasks,
      goals.map((g) => ({ id: g.id, title: g.title, target_amount: g.target_amount.toString() }))
    );

    const suggestionsMap = new Map(suggestions.map((s) => [s.notion_block_id, s]));
    const result = extractedTasks.map((task) => ({
      notion_block_id: task.notion_block_id,
      raw_title: task.raw_title,
      suggestion: suggestionsMap.get(task.notion_block_id) ?? {
        type: "OneTime" as const,
        reward_amount: 10000,
        goal_id: null,
      },
    }));

    res.status(200).json({ tasks: result });
  } catch (err: unknown) {
    console.error("[notion:extract] Extract error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ error: "Failed to extract page" });
  }
};

// ─── POST /api/notion/tasks/confirm ──────────────────────────────────────────

export const confirmTasks = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { tasks } = req.body as { tasks?: ConfirmTaskInput[] };
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    res.status(400).json({ error: "tasks array is required" }); return;
  }

  try {
    const result = await confirmSetup(userId, tasks);
    res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Notion not connected") {
      res.status(404).json({ error: "Notion not connected" }); return;
    }
    console.error("[notion:confirm] Error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ error: "Failed to confirm tasks" });
  }
};

// ─── POST /api/notion/webhook ─────────────────────────────────────────────────

interface WebhookRequest extends Request {
  rawBody?: Buffer;
}

interface NotionWebhookPayload {
  type?: string;
  verification_token?: string;
  data?: {
    updated_blocks?: Array<{ id: string; type: string }>;
  };
  block?: {
    id?: string;
    type?: string;
    to_do?: { checked?: boolean };
  };
}

export const webhookHandler = async (req: WebhookRequest, res: Response): Promise<void> => {
  const signature = req.headers["notion-signature"] as string ?? "";
  const rawBody = req.rawBody?.toString("utf8") ?? "";

  let payload: NotionWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as NotionWebhookPayload;
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  // Verification handshake
  if (payload.verification_token) {
    console.info("[notion:webhook] Verification token:", payload.verification_token);
    res.status(200).json({ verification_token: payload.verification_token });
    return;
  }

  // Verify signature
  const secret = process.env.NOTION_WEBHOOK_SECRET;
  console.info(`[notion:webhook] secret set: ${!!secret}, signature: ${signature?.slice(0, 20)}...`);
  if (secret && signature && !verifyWebhookSignature(rawBody, signature)) {
    console.warn("[notion:webhook] Signature mismatch — rejecting");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  // page.content_updated
  if (payload.type === "page.content_updated" && payload.data?.updated_blocks) {
    const blockIds = payload.data.updated_blocks.map((b) => b.id);
    console.info(`[notion:webhook] page.content_updated — ${blockIds.length} blocks`);

    let processed = 0;
    for (const blockId of blockIds) {
      try {
        const result = await processWebhook(blockId);
        if (!result.skipped) processed++;
      } catch (err: unknown) {
        console.error("[notion:webhook] Block error:", err instanceof Error ? err.message : "unknown");
      }
    }

    res.status(200).json({ ok: true, processed });
    return;
  }

  // block.updated (legacy format)
  if (
    payload.type !== "block.updated" ||
    payload.block?.type !== "to_do" ||
    payload.block?.to_do?.checked !== true
  ) {
    res.status(200).json({ ok: true, skipped: true });
    return;
  }

  const blockId = payload.block?.id;
  if (!blockId) { res.status(200).json({ ok: true, skipped: true }); return; }

  try {
    const result = await processWebhook(blockId);
    res.status(200).json(result);
  } catch (err: unknown) {
    console.error("[notion:webhook] DB error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ error: "Internal error" });
  }
};

// ─── GET /widget/:user_token ──────────────────────────────────────────────────

export const widgetHandler = async (req: Request, res: Response): Promise<void> => {
  const  user_token  = req.params.user_token as string;

  let userId: string;
  try {
    const payload = jwt.verify(user_token, JWT_SECRET) as { user_id?: string; scope?: string };
    if (payload.scope !== "widget" || !payload.user_id) throw new Error("Invalid scope");
    userId = payload.user_id;
  } catch {
    res.status(401).send("<p>Invalid or expired token</p>");
    return;
  }

  try {
    const data = await getWidgetData(userId);
    const html = renderWidget(data);
    res.setHeader("Content-Type", "text/html; charset=utf-8").send(html);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[notion:widget] Error:", msg);
    res.status(500).send(`<p>Error loading widget: ${msg}</p>`);
  }
};
