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
import { decrypt } from "../utils/encrypt";
import prisma from "../config/prisma";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET ?? "your_access_token_secret";
const STATE_TOKEN_TTL = "5m";

// ─── GET /api/notion/auth/start ───────────────────────────────────────────────
// Redirect user sang Notion OAuth page

export const startOAuth = (req: Request, res: Response): void => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // State token: short-lived JWT chứa user_id để verify ở callback
  const stateToken = jwt.sign({ userId, purpose: "notion_oauth" }, JWT_SECRET, {
    expiresIn: STATE_TOKEN_TTL,
  } as jwt.SignOptions);

  const oauthUrl = buildOAuthUrl(stateToken);
  res.redirect(302, oauthUrl);
};

// ─── GET /api/notion/auth/callback ───────────────────────────────────────────
// Nhận code từ Notion, exchange token, lưu DB

export const oauthCallback = async (req: Request, res: Response): Promise<void> => {
  const { code, state, error } = req.query as Record<string, string>;

  // Notion trả error nếu user từ chối
  if (error) {
    res.redirect(`${FRONTEND_URL}/notion/setup?error=access_denied`);
    return;
  }

  if (!code || !state) {
    res.status(400).json({ error: "Missing code or state" });
    return;
  }

  // Verify state token
  let userId: string;
  try {
    const payload = jwt.verify(state, JWT_SECRET) as { userId: string; purpose: string };
    if (payload.purpose !== "notion_oauth") {
      throw new Error("Invalid purpose");
    }
    userId = payload.userId;
  } catch {
    res.status(400).json({ error: "Invalid or expired state token" });
    return;
  }

  // Exchange code → token
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
// Lấy danh sách pages user có quyền truy cập

export const getPages = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const pages = await listPages(userId);
    res.status(200).json({ pages });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("No Notion connection")) {
      res.status(404).json({ error: "Notion not connected" });
      return;
    }
    console.error("[notion:oauth] List pages error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ error: "Failed to fetch pages" });
  }
};

// ─── PATCH /api/notion/pages/select ──────────────────────────────────────────
// Lưu page_id user đã chọn

export const selectPageHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { page_id } = req.body as { page_id?: string };
  if (!page_id) {
    res.status(400).json({ error: "page_id is required" });
    return;
  }

  try {
    await selectPage(userId, page_id);
    res.status(200).json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("No Notion connection")) {
      res.status(404).json({ error: "Notion not connected" });
      return;
    }
    console.error("[notion:oauth] Select page error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ error: "Failed to select page" });
  }
};

// ─── GET /api/notion/status ───────────────────────────────────────────────────
// Kiểm tra trạng thái kết nối Notion

export const getStatus = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const status = await getConnectionStatus(userId);
    res.status(200).json(status);
  } catch (err: unknown) {
    console.error("[notion:oauth] Status error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ error: "Failed to get status" });
  }
};

// ─── POST /api/notion/pages/:page_id/extract ─────────────────────────────────
// Extract to_do blocks từ Notion page + AI gợi ý

export const extractPage = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { page_id } = req.params as { page_id: string };

  try {
    // 1. Lấy connection + decrypt token
    const connection = await prisma.notionConnection.findUnique({
      where: { user_id: userId },
    });
    if (!connection) {
      res.status(404).json({ error: "Notion not connected" });
      return;
    }

    const accessToken = decrypt(connection.access_token);

    // 2. Lấy blocks từ Notion (có pagination + rate limit)
    const blocks = await getPageBlocks(accessToken, page_id);

    // 3. Parse to_do blocks — TypeScript thuần
    const extractedTasks = parseToDoBlocks(blocks);

    // 4. Upsert vào NotionTask (idempotent)
    await upsertNotionTasks(connection.id, extractedTasks);

    // 5. Lấy goals của user để AI gợi ý
    const goals = await prisma.goal.findMany({
      where: { user_id: userId, deleted_at: null, status: "ACTIVE" },
      select: { id: true, title: true, target_amount: true },
    });

    // 6. Gọi Claude Haiku gợi ý (fail gracefully)
    const suggestions = await suggestSetup(extractedTasks, goals.map((g) => ({
      id: g.id,
      title: g.title,
      target_amount: g.target_amount.toString(),
    })));

    // 7. Merge tasks + suggestions
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
// User confirm setup → tạo Task + link NotionTask + generate widget_token

interface ConfirmTaskInput {
  notion_block_id: string;
  name: string;
  type: "Habit" | "OneTime";
  reward_amount: number;
  goal_id: string | null;
}

export const confirmTasks = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { tasks } = req.body as { tasks?: ConfirmTaskInput[] };
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    res.status(400).json({ error: "tasks array is required" });
    return;
  }

  try {
    const connection = await prisma.notionConnection.findUnique({
      where: { user_id: userId },
    });
    if (!connection) {
      res.status(404).json({ error: "Notion not connected" });
      return;
    }

    let createdCount = 0;

    // Prisma transaction: tạo Task + link NotionTask
    await prisma.$transaction(async (tx) => {
      for (const taskInput of tasks) {
        // Tìm NotionTask tương ứng
        const notionTask = await tx.notionTask.findUnique({
          where: { notion_block_id: taskInput.notion_block_id },
        });

        if (!notionTask) continue;

        // Idempotency: nếu đã có task_id thì skip
        if (notionTask.task_id) continue;

        // Tạo Task mới
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

        // Gắn task với goal nếu có
        if (taskInput.goal_id) {
          await tx.taskGoal.create({
            data: {
              task_id: newTask.id,
              goal_id: taskInput.goal_id,
              reward_amount: taskInput.reward_amount,
            },
          });
        }

        // Link NotionTask → Task
        await tx.notionTask.update({
          where: { notion_block_id: taskInput.notion_block_id },
          data: { task_id: newTask.id },
        });

        createdCount++;
      }
    });

    // Generate widget_token (JWT scope hẹp, read-only, 1 year)
    const jwtSecret = process.env.JWT_SECRET ?? "your_access_token_secret";
    const widgetToken = jwt.sign(
      { user_id: userId, scope: "widget" },
      jwtSecret,
      { expiresIn: "1y" } as jwt.SignOptions
    );

    const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
    const widgetUrl = `${baseUrl}/widget/${widgetToken}`;

    res.status(200).json({
      created_count: createdCount,
      widget_token: widgetToken,
      widget_url: widgetUrl,
    });
  } catch (err: unknown) {
    console.error("[notion:extract] Confirm error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ error: "Failed to confirm tasks" });
  }
};
