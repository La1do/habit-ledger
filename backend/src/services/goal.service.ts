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
  return prisma.goal.findMany({
    where: { user_id, deleted_at: null },
  });
};

export const updateGoal = async (
  user_id: string,
  goal_id: string,
  data: { title?: string; target_amount?: number; is_saving?: boolean },
) => {
  const goal = await prisma.goal.findFirst({
    where: { id: goal_id, user_id, deleted_at: null },
  });
  if (!goal) {
    throw new Error("Not found or unauthorized");
  }

  // target_amount chỉ được tăng, không giảm xuống dưới current_amount
  if (data.target_amount !== undefined) {
    if (data.target_amount <= 0) {
      throw new Error("target_amount must be greater than 0");
    }
    if (data.target_amount < Number(goal.current_amount)) {
      throw new Error("target_amount cannot be less than current_amount");
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.target_amount !== undefined) updateData.target_amount = data.target_amount;
  if (data.is_saving !== undefined) updateData.is_saving = data.is_saving;

  return prisma.goal.update({ where: { id: goal_id }, data: updateData });
};

export const getGoalHistory = async (user_id: string, goal_id: string) => {
  const goal = await prisma.goal.findFirst({
    where: { id: goal_id, user_id, deleted_at: null },
  });
  if (!goal) {
    throw new Error("Not found or unauthorized");
  }

  return prisma.completionLog.findMany({
    where: { goal_id, user_id, type: "COMPLETED", reward_status: "SETTLED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      money_earned: true,
      createdAt: true,
      task: { select: { id: true, title: true } },
    },
  });
};

export const deleteGoal = async (user_id: string, goal_id: string) => {
  const goal = await prisma.goal.findFirst({
    where: { id: goal_id, user_id, deleted_at: null },
  });
  if (!goal) {
    throw new Error("Not found or unauthorized");
  }

  await prisma.goal.update({
    where: { id: goal_id },
    data: { deleted_at: new Date() },
  });
};
