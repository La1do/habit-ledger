import { readFileSync } from "fs";
import { join } from "path";
import prisma from "../config/prisma";
import { formatMoney } from "../utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoalProgress {
  id: string;
  title: string;
  current: number;
  target: number;
  percent: number;
  is_saving: boolean;
}

export interface WidgetData {
  totalMoney: number;
  earnedToday: number;
  goals: GoalProgress[];
}

// ─── getWidgetData ────────────────────────────────────────────────────────────
// Lấy goals được gắn với tasks có trong NotionTask (qua chain: NotionTask → Task → TaskGoal → Goal)

export async function getWidgetData(userId: string): Promise<WidgetData> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // 1. Lấy NotionConnection của user (có page_id đã chọn)
  const connection = await prisma.notionConnection.findUnique({
    where: { user_id: userId },
    select: { id: true, page_id: true },
  });

  // 2. Lấy NotionTask đã link với Task, filter theo page_id nếu có
  const notionTaskWhere: {
    connection_id: string;
    task_id: { not: null };
    page_id?: string;
  } = {
    connection_id: connection?.id ?? "",
    task_id: { not: null },
  };

  if (connection?.page_id) {
    notionTaskWhere.page_id = connection.page_id;
  }

  const notionTasks = connection
    ? await prisma.notionTask.findMany({
        where: notionTaskWhere,
        select: { task_id: true },
      })
    : [];

  const taskIds = notionTasks
    .map((nt) => nt.task_id)
    .filter((id): id is string => id !== null);

  // 3. Lấy unique goal_ids từ TaskGoal của các tasks đó
  const taskGoals = taskIds.length > 0
    ? await prisma.taskGoal.findMany({
        where: { task_id: { in: taskIds } },
        select: { goal_id: true },
        distinct: ["goal_id"],
      })
    : [];

  const goalIds = taskGoals.map((tg) => tg.goal_id);

  // 4. Lấy Goals theo goalIds (chỉ ACTIVE, chưa deleted)
  const goals = goalIds.length > 0
    ? await prisma.goal.findMany({
        where: {
          id: { in: goalIds },
          user_id: userId,
          status: "ACTIVE",
          deleted_at: null,
        },
        orderBy: { id: "asc" },
      })
    : [];

  // 5. Lấy user.total_money và earned today song song
  const [user, earnedTodayResult] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { total_money: true } }),
    prisma.completionLog.aggregate({
      where: { user_id: userId, createdAt: { gte: todayStart } },
      _sum: { money_earned: true },
    }),
  ]);

  const totalMoney = Number(user?.total_money ?? 0);
  const earnedToday = Number(earnedTodayResult._sum.money_earned ?? 0);

  const goalProgressList: GoalProgress[] = goals.map((goal) => {
    const current = Number(goal.current_amount);
    const target = Number(goal.target_amount);
    const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
    return {
      id: goal.id,
      title: goal.title,
      current,
      target,
      percent,
      is_saving: goal.is_saving,
    };
  });

  return { totalMoney, earnedToday, goals: goalProgressList };
}

// ─── renderWidget ─────────────────────────────────────────────────────────────

export function renderWidget(data: WidgetData, widgetToken: string): string {
  const templatePath = join(process.cwd(), "widget", "template.html");
  let html = readFileSync(templatePath, "utf8");

  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

  // Build goals HTML (server-side initial render)
  let goalsHtml = "";
  if (data.goals.length === 0) {
    goalsHtml = `<div class="card"><div class="label">🎯 Goals</div><div class="no-goal">Chưa có goal nào được gắn với Notion tasks.</div></div>`;
  } else {
    goalsHtml = data.goals
      .map(
        (goal) => `
      <div class="card">
        <div class="label">🎯 ${escapeHtml(goal.title)}${goal.is_saving ? ' <span class="saving-badge">Saving</span>' : ""}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${goal.percent}%"></div>
        </div>
        <div class="amounts">
          <span>${formatMoney(goal.current)} ₫</span>
          <span class="percent-label">${goal.percent}%</span>
          <span>${formatMoney(goal.target)} ₫</span>
        </div>
      </div>`
      )
      .join("\n");
  }

  return html
    .replace("{{goals_html}}", goalsHtml)
    .replace("{{total_money}}", `${formatMoney(data.totalMoney)} ₫`)
    .replace("{{earned_today}}", `+${formatMoney(data.earnedToday)} ₫`)
    .replace("{{widget_token}}", widgetToken)
    .replace("{{base_url}}", baseUrl);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── getWidgetDataFormatted ───────────────────────────────────────────────────
// Trả JSON đã format (số tiền dạng string) cho widget JS fetch

export interface WidgetDataFormatted {
  totalMoney: string;
  earnedToday: string;
  goals: Array<{
    id: string;
    title: string;
    current: string;
    target: string;
    percent: number;
    is_saving: boolean;
  }>;
}

export async function getWidgetDataFormatted(userId: string): Promise<WidgetDataFormatted> {
  const data = await getWidgetData(userId);
  return {
    totalMoney: `${formatMoney(data.totalMoney)} ₫`,
    earnedToday: `+${formatMoney(data.earnedToday)} ₫`,
    goals: data.goals.map((g) => ({
      id: g.id,
      title: g.title,
      current: `${formatMoney(g.current)} ₫`,
      target: `${formatMoney(g.target)} ₫`,
      percent: g.percent,
      is_saving: g.is_saving,
    })),
  };
}
