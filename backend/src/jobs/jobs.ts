import cron from "node-cron";
import prisma from "../config/prisma";

export const confirmDailyTasks = async () => {
  const now = new Date();

  // Lấy tất cả tasks DONE_TODAY hoặc PENDING đã qua deadline
  const tasks = await prisma.task.findMany({
    where: {
      status: { in: ["DONE_TODAY", "PENDING"] },
      OR: [
        { status: "DONE_TODAY" },
        { deadline: { lte: now }, status: "PENDING" },
      ],
    },
    include: { taskGoals: true },
  });

  if (tasks.length === 0) return { confirmed: 0, missed: 0 };

  let confirmed = 0;
  let missed = 0;

  await prisma.$transaction(async (tx) => {
    for (const task of tasks) {
      if (task.status === "DONE_TODAY") {
        // Set COMPLETED
        await tx.task.update({
          where: { id: task.id },
          data: { status: "COMPLETED" },
        });

        // Ghi CompletionLog + check goal completion
        for (const tg of task.taskGoals) {
          await tx.completionLog.create({
            data: {
              task: { connect: { id: task.id } },
              user: { connect: { id: task.user_id } },
              goal: { connect: { id: tg.goal_id } },
              type: "COMPLETED",
              money_earned: tg.reward_amount,
            },
          });

          // Nếu goal đạt target → set COMPLETED
          const goal = await tx.goal.findUnique({ where: { id: tg.goal_id } });
          if (
            goal &&
            goal.status === "ACTIVE" &&
            Number(goal.current_amount) >= Number(goal.target_amount)
          ) {
            await tx.goal.update({
              where: { id: tg.goal_id },
              data: { status: "COMPLETED" },
            });
          }
        }

        confirmed++;
      } else if (task.status === "PENDING" && task.deadline && task.deadline <= now) {
        // Task bị MISSED: set status + ghi log
        await tx.task.update({
          where: { id: task.id },
          data: { status: "MISSED" },
        });

        for (const tg of task.taskGoals) {
          await tx.completionLog.create({
            data: {
              task: { connect: { id: task.id } },
              user: { connect: { id: task.user_id } },
              goal: { connect: { id: tg.goal_id } },
              type: "MISSED",
              money_earned: 0,
            },
          });
        }

        missed++;
      }
    }
  });

  return { confirmed, missed };
};

// Cron job: chạy lúc 00:01 mỗi ngày
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
