import prisma from "../config/prisma";

export const getUserSummary = async (user_id: string) => {
  const user = await prisma.user.findUnique({ where: { id: user_id } });
  if (!user) throw new Error("User not found");

  const [totalEarned, totalDebt, goalsCompleted, goalsActive] =
    await Promise.all([
      // Tổng tiền đã earn (SETTLED)
      prisma.completionLog.aggregate({
        where: { user_id, type: "COMPLETED", reward_status: "SETTLED" },
        _sum: { money_earned: true },
      }),
      // Tổng nợ (DEBT)
      prisma.completionLog.aggregate({
        where: { user_id, type: "COMPLETED", reward_status: "DEBT" },
        _sum: { money_earned: true },
      }),
      // Số goals đã completed
      prisma.goal.count({
        where: { user_id, status: "COMPLETED", deleted_at: null },
      }),
      // Số goals đang active
      prisma.goal.count({
        where: { user_id, status: "ACTIVE", deleted_at: null },
      }),
    ]);

  return {
    total_money: Number(user.total_money),
    total_earned: Number(totalEarned._sum.money_earned ?? 0),
    total_debt: Number(totalDebt._sum.money_earned ?? 0),
    goals_completed: goalsCompleted,
    goals_active: goalsActive,
  };
};
