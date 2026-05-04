import prisma from "../config/prisma";

export const completeTask = async (user_id: string, task_id: string) => {
  // 1. Check task tồn tại + thuộc user
  const task = await prisma.task.findFirst({
    where: { id: task_id, user_id },
    include: { taskGoals: true },
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

  // 4. Toggle status
  const isDoneToday = task.status === "PENDING";
  const newStatus = isDoneToday ? "DONE_TODAY" : "PENDING";

  // 5. Tính tổng reward từ TaskGoal
  const taskGoals = task.taskGoals;
  const totalReward = taskGoals.reduce(
    (sum, tg) => sum + Number(tg.reward_amount),
    0,
  );

  // 6. Transaction: update task + cộng/trừ reward vào goal và user
  const [updatedTask] = await prisma.$transaction([
    prisma.task.update({
      where: { id: task_id },
      data: { status: newStatus },
    }),
    // Cộng hoặc trừ reward_amount vào từng goal liên quan
    ...taskGoals.map((tg) =>
      prisma.goal.update({
        where: { id: tg.goal_id },
        data: {
          current_amount: {
            increment: isDoneToday
              ? Number(tg.reward_amount)
              : -Number(tg.reward_amount),
          },
        },
      }),
    ),
    // Cộng hoặc trừ tổng reward vào user.total_money
    prisma.user.update({
      where: { id: user_id },
      data: {
        total_money: {
          increment: isDoneToday ? totalReward : -totalReward,
        },
      },
    }),
  ]);

  return updatedTask;
};
