import prisma from "../config/prisma";
import type { Decimal } from "../generated/prisma/internal/prismaNamespace";

// ─── Helper: tính pending reward cho user (in-memory, không update DB) ────────
// Tìm tất cả tasks DONE_TODAY có TaskGoal → sum reward_amount theo goal_id
export interface PendingRewardResult {
  pendingByGoal: Record<string, number>  // goal_id → pending amount
  totalPending: number                    // tổng pending của user
}

export const calculatePendingForUser = async (user_id: string): Promise<PendingRewardResult> => {
  // Lấy tất cả tasks DONE_TODAY của user có gắn goal
  const doneTodayTasks = await prisma.task.findMany({
    where: { user_id, status: "DONE_TODAY" },
    include: { taskGoals: true },
  });

  const pendingByGoal: Record<string, number> = {};
  let totalPending = 0;

  for (const task of doneTodayTasks) {
    for (const tg of task.taskGoals) {
      const amount = Number(tg.reward_amount as Decimal);
      pendingByGoal[tg.goal_id] = (pendingByGoal[tg.goal_id] ?? 0) + amount;
      totalPending += amount;
    }
  }

  return { pendingByGoal, totalPending };
};

// ─── Toggle complete task (chỉ đổi status, KHÔNG update DB tiền) ─────────────
export const completeTask = async (user_id: string, task_id: string) => {
  // 1. Check task tồn tại + thuộc user
  const task = await prisma.task.findFirst({
    where: { id: task_id, user_id },
  });
  if (!task) {
    throw new Error("Not found or unauthorized");
  }

  // 2. Check deadline chưa qua
  if (task.deadline && task.deadline < new Date()) {
    throw new Error("Cannot complete task past its deadline");
  }

  // 3. Check status không phải COMPLETED/MISSED
  if (task.status === "COMPLETED") {
    throw new Error("Task is already completed");
  }
  if (task.status === "MISSED") {
    throw new Error("Cannot complete a missed task");
  }

  // 4. Toggle status only — tiền được tính bởi scheduler khi deadline đến
  const newStatus = task.status === "PENDING" ? "DONE_TODAY" : "PENDING";

  return prisma.task.update({
    where: { id: task_id },
    data: { status: newStatus },
  });
};
