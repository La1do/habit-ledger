// ─── AI Provider Interface ────────────────────────────────────────────────────
// Tất cả AI providers phải implement interface này.
// Khi đổi model: chỉ cần đổi AI_PROVIDER trong .env

export interface AIProvider {
  /**
   * Gửi prompt và nhận text response.
   * Throw error nếu API call thất bại.
   */
  complete(prompt: string): Promise<string>
}
