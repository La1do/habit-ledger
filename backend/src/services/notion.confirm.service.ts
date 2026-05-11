import jwt from "jsonwebtoken";
import prisma from "../config/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfirmTaskInput {
  notion_block_id: string;
  name: string;
  type: "Habit" | "OneTime";
  reward_amount: number;
  goal_id: string | null;
}

export interface ConfirmResult {
  created_count: number;
  widget_token: string;
  widget_url: string;
}

// ─── confirmSetup ─────────────────────────────────────────────────────────────

export async function confirmSetup(
  userId: string,
  tasks: ConfirmTaskInput[]
): Promise<ConfirmResult> {
  const connection = await prisma.notionConnection.findUnique({
    where: { user_id: userId },
  });
  if (!connection) {
    throw new Error("Notion not connected");
  }

  let createdCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const taskInput of tasks) {
      const notionTask = await tx.notionTask.findUnique({
        where: { notion_block_id: taskInput.notion_block_id },
      });

      // Idempotency: skip nếu không tìm thấy hoặc đã link
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

  // Generate widget token (JWT scope hẹp, read-only, 1 year)
  const jwtSecret = process.env.JWT_SECRET ?? "your_access_token_secret";
  const widgetToken = jwt.sign(
    { user_id: userId, scope: "widget" },
    jwtSecret,
    { expiresIn: "1y" } as jwt.SignOptions
  );

  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

  return {
    created_count: createdCount,
    widget_token: widgetToken,
    widget_url: `${baseUrl}/widget/${widgetToken}`,
  };
}
