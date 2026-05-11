import { createHmac } from "crypto";
import { Client } from "@notionhq/client";
import prisma from "../config/prisma";
import { createLedgerLog } from "./ledger.service";
import { decrypt } from "../utils/encrypt";
import { notifyUser } from "./widget.sse.service";

// ─── Signature verification ───────────────────────────────────────────────────

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.NOTION_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[notion:webhook] NOTION_WEBHOOK_SECRET not set — skipping verification");
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return `sha256=${expected}` === signature;
}

// ─── Idempotency helpers ──────────────────────────────────────────────────────

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ─── Process webhook ──────────────────────────────────────────────────────────

export async function processWebhook(
  blockId: string
): Promise<{ ok: boolean; skipped?: boolean; reason?: string }> {
  // 1. Tìm NotionTask theo notion_block_id
  const notionTask = await prisma.notionTask.findUnique({
    where: { notion_block_id: blockId },
  });

  if (!notionTask) {
    return { ok: true, skipped: true, reason: "block_not_found" };
  }

  if (!notionTask.task_id) {
    return { ok: true, skipped: true, reason: "task_not_linked" };
  }

  // 2. Fetch block từ Notion để check to_do.checked
  try {
    const connection = await prisma.notionConnection.findFirst({
      where: { notionTasks: { some: { id: notionTask.id } } },
    });

    if (connection) {
      const accessToken = decrypt(connection.access_token);
      const notion = new Client({ auth: accessToken });
      const block = await notion.blocks.retrieve({ block_id: blockId });

      if ("type" in block && block.type === "to_do") {
        const toDo = block as { type: "to_do"; to_do: { checked: boolean } };
        if (!toDo.to_do.checked) {
          console.info(`[notion:webhook] Block ${blockId} is unchecked — skipping`);
          return { ok: true, skipped: true, reason: "unchecked" };
        }
      } else {
        return { ok: true, skipped: true, reason: "not_todo_block" };
      }
    }
  } catch (err: unknown) {
    // Nếu không fetch được Notion API, vẫn tiếp tục xử lý (best effort)
    console.warn("[notion:webhook] Could not verify block status:", err instanceof Error ? err.message : "unknown");
  }

  // 2. Lấy Task + TaskGoals
  const task = await prisma.task.findUnique({
    where: { id: notionTask.task_id },
    include: { taskGoals: true },
  });

  if (!task) {
    console.warn(`[notion:webhook] Task not found: ${notionTask.task_id}`);
    return { ok: true, skipped: true, reason: "task_not_found" };
  }

  // 3. Idempotency check — đã cộng reward hôm nay chưa?
  const now = new Date();
  const existing = await prisma.completionLog.findFirst({
    where: {
      task_id: task.id,
      createdAt: {
        gte: startOfDay(now),
        lte: endOfDay(now),
      },
    },
  });

  if (existing) {
    console.info(`[notion:webhook] Duplicate webhook for task: ${task.id} — skipping`);
    return { ok: true, skipped: true, reason: "already_processed_today" };
  }

  // 4. Prisma transaction: CompletionLog + Goal + User.total_money
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: task.user_id } });
    if (!user) throw new Error(`User not found: ${task.user_id}`);

    let remainingBalance = Number(user.total_money);
    let totalDeducted = 0;

    for (const tg of task.taskGoals) {
      const goal = await tx.goal.findUnique({ where: { id: tg.goal_id } });
      if (!goal || goal.deleted_at !== null) continue;
      if (goal.status === "COMPLETED" && !goal.is_saving) continue;

      const rewardAmount = Number(tg.reward_amount);
      const isDebt = remainingBalance < rewardAmount;
      const rewardStatus = isDebt ? "DEBT" : "SETTLED";

      // Cộng vào goal.current_amount
      const updatedGoal = await tx.goal.update({
        where: { id: tg.goal_id },
        data: { current_amount: { increment: rewardAmount } },
      });

      // Ghi CompletionLog qua ledger (hash chain dùng chung)
      await createLedgerLog(tx, {
        task_id: task.id,
        user_id: task.user_id,
        goal_id: tg.goal_id,
        type: "COMPLETED",
        reward_status: rewardStatus,
        money_earned: tg.reward_amount,
      });

      // Check goal completion
      if (
        !goal.is_saving &&
        Number(updatedGoal.current_amount) >= Number(updatedGoal.target_amount)
      ) {
        await tx.goal.update({
          where: { id: tg.goal_id },
          data: { status: "COMPLETED" },
        });
      }

      if (!isDebt) {
        remainingBalance -= rewardAmount;
        totalDeducted += rewardAmount;
      }
    }

    // Trừ total_money
    if (totalDeducted > 0) {
      await tx.user.update({
        where: { id: task.user_id },
        data: { total_money: { decrement: totalDeducted } },
      });
    }
  });

  // Push SSE event đến widget đang mở
  notifyUser(task.user_id);

  return { ok: true };
}
