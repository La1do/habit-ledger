import Groq from "groq-sdk";
import type { AIProvider } from "./ai.provider";

export class GroqProvider implements AIProvider {
  private readonly model: string;

  constructor(model = "llama-3.1-8b-instant") {
    this.model = model;
  }

  async complete(prompt: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("[ai:groq] GROQ_API_KEY is not set");
    }

    const client = new Groq({ apiKey });

    const response = await client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content ?? "";
  }
}
