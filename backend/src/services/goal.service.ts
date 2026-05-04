import prisma from "../config/prisma";

export const createGoal = async (
  user_id: string,
  data: { title: string; target_amount: number },
) => {
  if (!data.title) {
    throw new Error("Title is required");
  }
  if (data.target_amount <= 0) {
    throw new Error("target_amount must be greater than 0");
  }

  return prisma.goal.create({
    data: {
      title: data.title,
      target_amount: data.target_amount,
      user: { connect: { id: user_id } },
    },
  });
};

export const getGoals = async (user_id: string) => {
  return prisma.goal.findMany({ where: { user_id } });
};

export const deleteGoal = async (user_id: string, goal_id: string) => {
  const goal = await prisma.goal.findFirst({ where: { id: goal_id, user_id } });
  if (!goal) {
    throw new Error("Not found or unauthorized");
  }

  await prisma.$transaction([
    prisma.taskGoal.deleteMany({ where: { goal_id } }),
    prisma.completionLog.deleteMany({ where: { goal_id } }),
    prisma.goal.delete({ where: { id: goal_id } }),
  ]);
};
