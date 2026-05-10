import "dotenv/config";
import { getAIProvider } from "../services/ai";

async function main() {
  console.log("AI_PROVIDER:", process.env.AI_PROVIDER);
  console.log("AI_MODEL:", process.env.AI_MODEL);

  const ai = getAIProvider();

  const prompt = `User có các goals sau:
- goal-1: Mua laptop (target: 10000000 VND)
- goal-2: Du lịch Đà Lạt (target: 5000000 VND)

Tasks:
[{"notion_block_id":"block-1","title":"Tập gym 30 phút"},{"notion_block_id":"block-2","title":"Đọc sách 20 trang"},{"notion_block_id":"block-3","title":"Mua tai nghe"}]

Với mỗi task, gợi ý type (Habit/OneTime), reward_amount (VND), goal_id.
Trả về JSON array thuần, không markdown.`;

  console.log("\nCalling AI...\n");
  const result = await ai.complete(prompt);
  console.log("Response:\n", result);
}

main().catch(console.error);
