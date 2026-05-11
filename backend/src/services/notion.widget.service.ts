import { readFileSync } from "fs";
import { join } from "path";
import prisma from "../config/prisma";
import { formatMoney } from "../utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WidgetData {
  totalMoney: number;
  earnedToday: number;
  activeGoal: {
    title: string;
    current: number;
    target: number;
    percent: number;
  } | null;
}

// ─── getWidgetData ────────────────────────────────────────────────────────────

export async function getWidgetData(userId: string): Promise<WidgetData> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [user, activeGoal, earnedTodayResult] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { total_money: true } }),
    prisma.goal.findFirst({
      where: { user_id: userId, status: "ACTIVE", deleted_at: null },
      orderBy: { id: "desc" },
    }),
    prisma.completionLog.aggregate({
      where: { user_id: userId, createdAt: { gte: todayStart } },
      _sum: { money_earned: true },
    }),
  ]);

  const totalMoney = Number(user?.total_money ?? 0);
  const earnedToday = Number(earnedTodayResult._sum.money_earned ?? 0);

  let goalData: WidgetData["activeGoal"] = null;
  if (activeGoal) {
    const current = Number(activeGoal.current_amount);
    const target = Number(activeGoal.target_amount);
    const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
    goalData = { title: activeGoal.title, current, target, percent };
  }

  return { totalMoney, earnedToday, activeGoal: goalData };
}

// ─── renderWidget ─────────────────────────────────────────────────────────────
// template.html nằm ở backend/widget/ — từ src/services/ đi lên 2 cấp rồi vào widget/

export function renderWidget(data: WidgetData): string {
  const templatePath = join(__dirname, "..", "..", "widget", "template.html");
  let html = readFileSync(templatePath, "utf8");

  if (data.activeGoal) {
    const { title, current, target, percent } = data.activeGoal;
    html = html
      .replace("{{goal_name}}", title)
      .replace("{{goal_percent}}", String(percent))
      .replace("{{current_amount}}", formatMoney(current))
      .replace("{{target_amount}}", formatMoney(target))
      .replace(/\{\{#if_goal\}\}/g, "")
      .replace(/\{\{\/if_goal\}\}/g, "")
      .replace(/\{\{#no_goal\}\}[\s\S]*?\{\{\/no_goal\}\}/g, "");
  } else {
    html = html
      .replace("{{goal_name}}", "Goal")
      .replace(/\{\{#if_goal\}\}[\s\S]*?\{\{\/if_goal\}\}/g, "")
      .replace(/\{\{#no_goal\}\}/g, "")
      .replace(/\{\{\/no_goal\}\}/g, "");
  }

  return html
    .replace("{{total_money}}", formatMoney(data.totalMoney))
    .replace("{{earned_today}}", formatMoney(data.earnedToday));
}
