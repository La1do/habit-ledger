import prisma from "../config/prisma";
import { calculatePendingForUser } from "./reward.service";

export const getUserSummary = async (user_id: string) => {
  const user = await prisma.user.findUnique({ where: { id: user_id } });
  if (!user) throw new Error("User not found");

  const [totalEarned, totalDebt, goalsCompleted, goalsActive, { totalPending }] =
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
      // Pending reward từ tasks DONE_TODAY (computed, không lưu DB)
      calculatePendingForUser(user_id),
    ]);

  return {
    // Trừ pending khỏi total_money để hiển thị số dư tạm thời
    total_money: Number(user.total_money) - totalPending,
    total_earned: Number(totalEarned._sum.money_earned ?? 0),
    total_debt: Number(totalDebt._sum.money_earned ?? 0),
    goals_completed: goalsCompleted,
    goals_active: goalsActive,
  };
};
