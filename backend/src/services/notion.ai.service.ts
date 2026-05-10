import { getAIProvider } from "./ai";
import type { ExtractedTask } from "./notion.extract.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoalForSuggestion {
  id: string;
  title: string;
  target_amount: string | number;
}

export interface TaskSuggestion {
  notion_block_id: string;
  type: "Habit" | "OneTime";
  reward_amount: number;
  goal_id: string | null;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(tasks: ExtractedTask[], goals: GoalForSuggestion[]): string {
  const goalsList =
    goals.length > 0
      ? goals.map((g) => `- ${g.id}: ${g.title} (target: ${g.target_amount} VND)`).join("\n")
      : "(Không có goal nào)";

  const tasksJson = JSON.stringify(
    tasks.map((t) => ({ notion_block_id: t.notion_block_id, title: t.raw_title }))
  );

  return `User có các goals sau (id: tên — target):
${goalsList}

Với mỗi task title dưới đây, gợi ý:
- type: "Habit" nếu là việc lặp lại hàng ngày, "OneTime" nếu chỉ làm 1 lần
- reward_amount: số tiền VND hợp lý (5000–100000), tương xứng độ khó
- goal_id: id của goal phù hợp nhất, hoặc null nếu không có goal nào hợp

Trả về JSON array. Mỗi phần tử gồm: notion_block_id, type, reward_amount, goal_id.
Không thêm gì khác. Không markdown. Chỉ JSON array thuần.

Tasks:
${tasksJson}`;
}

function parseResponse(text: string): TaskSuggestion[] {
  // Strip markdown code blocks nếu có
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const parsed = JSON.parse(cleaned) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Response is not an array");
  }
  return parsed as TaskSuggestion[];
}

// ─── suggestSetup — dùng AI provider từ env ───────────────────────────────────

export async function suggestSetup(
  tasks: ExtractedTask[],
  goals: GoalForSuggestion[]
): Promise<TaskSuggestion[]> {
  if (tasks.length === 0) return [];

  const ai = getAIProvider();
  const prompt = buildPrompt(tasks, goals);

  let attempt = 0;
  while (attempt < 2) {
    try {
      const text = await ai.complete(prompt);
      return parseResponse(text);
    } catch (err: unknown) {
      attempt++;
      if (attempt >= 2) {
        console.error(
          "[notion:ai] suggestSetup failed after 2 attempts:",
          err instanceof Error ? err.message : "unknown"
        );
        return []; // AI fail không block user
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return [];
}
