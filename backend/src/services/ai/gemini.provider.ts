import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider } from "./ai.provider";

export class GeminiProvider implements AIProvider {
  private readonly model: string;

  constructor(model = "gemini-2.0-flash") {
    this.model = model;
  }

  async complete(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("[ai:gemini] GEMINI_API_KEY is not set");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Gemini SDK cần tên model không có prefix "models/"
    const modelName = this.model.replace(/^models\//, "");
    const geminiModel = genAI.getGenerativeModel({ model: modelName });

    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    return response.text();
  }
}
