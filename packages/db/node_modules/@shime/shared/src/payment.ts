export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export function computePaymentStatus(
  amount: number,
  amountPaid: number
): PaymentStatus {
  if (amountPaid <= 0) return "UNPAID";
  if (amountPaid >= amount) return "PAID";
  return "PARTIAL";
}
