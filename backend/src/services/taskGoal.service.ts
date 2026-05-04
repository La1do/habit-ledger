import prisma from "../config/prisma";

export const linkTaskGoal = async (
  user_id: string,
  task_id: string,
  data: { goal_id: string; reward_amount: number },
) => {
  if (!data.goal_id) {
    throw new Error("goal_id is required");
  }
  if (!data.reward_amount || data.reward_amount <= 0) {
    throw new Error("reward_amount must be greater than 0");
  }

  const task = await prisma.task.findFirst({ where: { id: task_id, user_id } });
  if (!task) {
    throw new Error("Not found or unauthorized");
  }

  const goal = await prisma.goal.findFirst({ where: { id: data.goal_id, user_id } });
  if (!goal) {
    throw new Error("Not found or unauthorized");
  }

  const existing = await prisma.taskGoal.findFirst({
    where: { task_id, goal_id: data.goal_id },
  });
  if (existing) {
    throw new Error("Task is already linked to this goal");
  }

  return prisma.taskGoal.create({
    data: {
      task: { connect: { id: task_id } },
      goal: { connect: { id: data.goal_id } },
      reward_amount: data.reward_amount,
    },
  });
};

export const unlinkTaskGoal = async (
  user_id: string,
  task_id: string,
  goal_id: string,
) => {
  const task = await prisma.task.findFirst({ where: { id: task_id, user_id } });
  if (!task) {
    throw new Error("Not found or unauthorized");
  }

  const link = await prisma.taskGoal.findFirst({ where: { task_id, goal_id } });
  if (!link) {
    throw new Error("Not found or unauthorized");
  }

  await prisma.taskGoal.delete({
    where: { task_id_goal_id: { task_id, goal_id } },
  });
};
