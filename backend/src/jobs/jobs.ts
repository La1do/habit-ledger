import cron from "node-cron";
import prisma from "../config/prisma";

const getNextDeadline = (current: Date, frequency: string): Date => {
  const next = new Date(current);
  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
};

export const confirmDailyTasks = async () => {
  const now = new Date();

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { status: "DONE_TODAY" },
        { deadline: { lte: now }, status: "PENDING" },
      ],
    },
    include: { taskGoals: true },
  });

  if (tasks.length === 0) {
    await prisma.schedulerRun.create({ data: { confirmed: 0, missed: 0 } });
    return { confirmed: 0, missed: 0 };
  }

  let confirmed = 0;
  let missed = 0;

  await prisma.$transaction(async (tx) => {
    for (const task of tasks) {
      if (task.status === "DONE_TODAY") {
        // Lấy user để check total_money
        const user = await tx.user.findUnique({ where: { id: task.user_id } });
        if (!user) continue;

        let remainingBalance = Number(user.total_money);
        let totalDeducted = 0;

        for (const tg of task.taskGoals) {
          const goal = await tx.goal.findUnique({ where: { id: tg.goal_id } });

          // Bỏ qua goal đã completed (nếu không phải saving mode) hoặc soft deleted
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

          // Ghi CompletionLog (immutable)
          await tx.completionLog.create({
            data: {
              task: { connect: { id: task.id } },
              user: { connect: { id: task.user_id } },
              goal: { connect: { id: tg.goal_id } },
              type: "COMPLETED",
              reward_status: rewardStatus,
              money_earned: rewardAmount,
            },
          });

          // Check goal completion (chỉ khi không phải saving mode)
          if (
            !goal.is_saving &&
            Number(updatedGoal.current_amount) >= Number(updatedGoal.target_amount)
          ) {
            await tx.goal.update({
              where: { id: tg.goal_id },
              data: { status: "COMPLETED" },
            });
          }

          // Chỉ trừ tiền nếu đủ
          if (!isDebt) {
            remainingBalance -= rewardAmount;
            totalDeducted += rewardAmount;
          }
        }

        // Trừ tổng từ user.total_money
        if (totalDeducted > 0) {
          await tx.user.update({
            where: { id: task.user_id },
            data: { total_money: { decrement: totalDeducted } },
          });
        }

        // Reset recurring hoặc set COMPLETED
        if (task.isRecurring && task.repeatFrequency && task.deadline) {
          await tx.task.update({
            where: { id: task.id },
            data: {
              status: "PENDING",
              deadline: getNextDeadline(task.deadline, task.repeatFrequency),
            },
          });
        } else {
          await tx.task.update({
            where: { id: task.id },
            data: { status: "COMPLETED" },
          });
        }

        confirmed++;

      } else if (task.status === "PENDING" && task.deadline && task.deadline <= now) {
        if (task.isRecurring && task.repeatFrequency) {
          await tx.task.update({
            where: { id: task.id },
            data: {
              status: "PENDING",
              deadline: getNextDeadline(task.deadline, task.repeatFrequency),
            },
          });
        } else {
          await tx.task.update({
            where: { id: task.id },
            data: { status: "MISSED" },
          });
        }
        missed++;
      }
    }
  });

  await prisma.schedulerRun.create({ data: { confirmed, missed } });
  return { confirmed, missed };
};

export const catchUpIfNeeded = async () => {
  const lastRun = await prisma.schedulerRun.findFirst({
    orderBy: { ran_at: "desc" },
  });

  if (!lastRun) return;

  const now = new Date();
  const hoursSinceLastRun =
    (now.getTime() - lastRun.ran_at.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastRun > 23) {
    console.log("[Scheduler] Catch-up detected, running missed job...");
    await confirmDailyTasks();
  }
};

cron.schedule("1 0 * * *", async () => {
  console.log("[Scheduler] Running daily task confirmation...");
  try {
    const result = await confirmDailyTasks();
    console.log(
      `[Scheduler] Done. Confirmed: ${result.confirmed}, Missed: ${result.missed}`,
    );
  } catch (err) {
    console.error("[Scheduler] Error:", err);
  }
});
