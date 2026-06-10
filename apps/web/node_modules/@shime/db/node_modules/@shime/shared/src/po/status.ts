export const PO_STATUSES = [
  "DRAFT",
  "SENT",
  "PARTIALLY_RECEIVED",
  "CLOSED",
  "CANCELLED",
] as const;

export type PoStatus = (typeof PO_STATUSES)[number];

export function computePoStatus(
  lines: { quantity: number; qtyReceived: number }[]
): PoStatus {
  if (lines.length === 0) return "DRAFT";
  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const totalReceived = lines.reduce((s, l) => s + l.qtyReceived, 0);
  if (totalReceived <= 0) return "SENT";
  if (totalReceived >= totalQty) return "CLOSED";
  return "PARTIALLY_RECEIVED";
}

export function canSendPo(status: string): boolean {
  return status === "DRAFT";
}

export function canReceivePo(status: string): boolean {
  return status === "SENT" || status === "PARTIALLY_RECEIVED";
}

export function canCancelPo(status: string): boolean {
  return (
    status === "DRAFT" ||
    status === "SENT" ||
    status === "PARTIALLY_RECEIVED"
  );
}
