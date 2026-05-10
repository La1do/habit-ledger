import type { AIProvider } from "./ai.provider";
import { GeminiProvider } from "./gemini.provider";
import { AnthropicProvider } from "./anthropic.provider";
import { GroqProvider } from "./groq.provider";

/**
 * Factory — trả về AI provider dựa trên AI_PROVIDER env var.
 *
 * Để đổi model: chỉ cần đổi trong .env
 *   AI_PROVIDER=gemini        → Gemini Flash (free, có region limit)
 *   AI_PROVIDER=groq          → Groq (free, nhanh, không region limit)
 *   AI_PROVIDER=anthropic     → Claude Haiku
 *
 * Model cụ thể có thể override qua:
 *   AI_MODEL=llama-3.1-8b-instant   (hoặc bất kỳ model nào)
 */
export function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();
  const model = process.env.AI_MODEL;

  switch (provider) {
    case "anthropic":
      return new AnthropicProvider(model);
    case "groq":
      return new GroqProvider(model);
    case "gemini":
    default:
      return new GeminiProvider(model);
  }
}

export type { AIProvider };
