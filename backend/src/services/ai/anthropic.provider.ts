import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider } from "./ai.provider";

export class AnthropicProvider implements AIProvider {
  private readonly model: string;

  constructor(model = "claude-haiku-4-5-20251001") {
    this.model = model;
  }

  async complete(prompt: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("[ai:anthropic] ANTHROPIC_API_KEY is not set");
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    return response.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");
  }
}
