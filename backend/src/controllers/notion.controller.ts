import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { readFileSync } from "fs";
import { join } from "path";
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
import { decrypt } from "../utils/encrypt";
import { formatMoney } from "../utils/format";
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

  const { page_id } = req.params;

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

interface ConfirmTaskInput {
  notion_block_id: string;
  name: string;
  type: "Habit" | "OneTime";
  reward_amount: number;
  goal_id: string | null;
}

export const confirmTasks = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { tasks } = req.body as { tasks?: ConfirmTaskInput[] };
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    res.status(400).json({ error: "tasks array is required" }); return;
  }

  try {
    const connection = await prisma.notionConnection.findUnique({ where: { user_id: userId } });
    if (!connection) { res.status(404).json({ error: "Notion not connected" }); return; }

    let createdCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const taskInput of tasks) {
        const notionTask = await tx.notionTask.findUnique({
          where: { notion_block_id: taskInput.notion_block_id },
        });
        if (!notionTask || notionTask.task_id) continue;

        const newTask = await tx.task.create({
          data: {
            user_id: userId,
            title: taskInput.name,
            type: taskInput.type,
            isRecurring: taskInput.type === "Habit",
            repeatFrequency: taskInput.type === "Habit" ? "DAILY" : null,
            status: "PENDING",
          },
        });

        if (taskInput.goal_id) {
          await tx.taskGoal.create({
            data: {
              task_id: newTask.id,
              goal_id: taskInput.goal_id,
              reward_amount: taskInput.reward_amount,
            },
          });
        }

        await tx.notionTask.update({
          where: { notion_block_id: taskInput.notion_block_id },
          data: { task_id: newTask.id },
        });

        createdCount++;
      }
    });

    const widgetToken = jwt.sign(
      { user_id: userId, scope: "widget" },
      JWT_SECRET,
      { expiresIn: "1y" } as jwt.SignOptions
    );

    const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
    res.status(200).json({
      created_count: createdCount,
      widget_token: widgetToken,
      widget_url: `${baseUrl}/widget/${widgetToken}`,
    });
  } catch (err: unknown) {
    console.error("[notion:extract] Confirm error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ error: "Failed to confirm tasks" });
  }
};

// ─── POST /api/notion/webhook ─────────────────────────────────────────────────
// Dùng express.raw() middleware — không dùng express.json()

interface WebhookRequest extends Request {
  rawBody?: Buffer;
}

interface NotionWebhookPayload {
  type?: string;
  // Format mới: page.content_updated
  data?: {
    updated_blocks?: Array<{ id: string; type: string }>;
  };
  // Format cũ: block.updated
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

  // ─── Verification handshake ───────────────────────────────────────────────
  // Notion gửi verification_token khi setup webhook — echo lại để verify
  if ("verification_token" in payload) {
    const verificationToken = (payload as { verification_token: string }).verification_token;
    console.info("[notion:webhook] Verification token:", verificationToken);
    res.status(200).json({ verification_token: verificationToken });
    return;
  }

  // ─── Verify signature cho các event thật ─────────────────────────────────
  const secret = process.env.NOTION_WEBHOOK_SECRET;
  console.info(`[notion:webhook] secret set: ${!!secret}, signature: ${signature?.slice(0, 20)}...`);
  if (secret && signature && !verifyWebhookSignature(rawBody, signature)) {
    console.warn("[notion:webhook] Signature mismatch — rejecting");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  // Xử lý page.content_updated — fetch từng block để check to_do.checked
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

  // Format cũ: block.updated (giữ lại để tương thích)
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
// Public route — không cần JWT header, verify qua URL param

export const widgetHandler = async (req: Request, res: Response): Promise<void> => {
  const { user_token } = req.params;

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
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [user, activeGoal, earnedTodayResult] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { total_money: true } }),
      prisma.goal.findFirst({
        where: { user_id: userId, status: "ACTIVE", deleted_at: null },
        orderBy: { id: "desc" },
      }),
      prisma.completionLog.aggregate({
        where: { user_id: userId, createdAt: { gte: todayStart } },
        _sum: { money_earned: true },
      }),
    ]);

    const totalMoney = Number(user?.total_money ?? 0);
    const earnedToday = Number(earnedTodayResult._sum.money_earned ?? 0);

    const templatePath = join(__dirname, "..", "..", "..", "widget", "template.html");
    let html = readFileSync(templatePath, "utf8");

    if (activeGoal) {
      const current = Number(activeGoal.current_amount);
      const target = Number(activeGoal.target_amount);
      const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

      html = html
        .replace("{{goal_name}}", activeGoal.title)
        .replace("{{goal_percent}}", String(percent))
        .replace("{{current_amount}}", formatMoney(current))
        .replace("{{target_amount}}", formatMoney(target))
        .replace(/\{\{#if_goal\}\}/g, "")
        .replace(/\{\{\/if_goal\}\}/g, "")
        .replace(/\{\{#no_goal\}\}[\s\S]*?\{\{\/no_goal\}\}/g, "");
    } else {
      html = html
        .replace("{{goal_name}}", "Goal")
        .replace(/\{\{#if_goal\}\}[\s\S]*?\{\{\/if_goal\}\}/g, "")
        .replace(/\{\{#no_goal\}\}/g, "")
        .replace(/\{\{\/no_goal\}\}/g, "");
    }

    html = html
      .replace("{{total_money}}", formatMoney(totalMoney))
      .replace("{{earned_today}}", formatMoney(earnedToday));

    res.setHeader("Content-Type", "text/html; charset=utf-8").send(html);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[notion:widget] Error:", msg);
    res.status(500).send(`<p>Error loading widget: ${msg}</p>`);
  }
};
