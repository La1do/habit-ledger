/**
 * Format số tiền theo locale Việt Nam.
 * Ví dụ: 1500000 → "1.500.000"
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(amount));
}
