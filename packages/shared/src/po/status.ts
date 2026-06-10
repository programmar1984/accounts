export const PO_STATUSES = ["DRAFT", "POSTED", "VOID", "CANCELLED"] as const;

export type PoStatus = (typeof PO_STATUSES)[number];

export function canPostPo(status: string): boolean {
  return status === "DRAFT";
}

export function canCancelPo(status: string): boolean {
  return status === "DRAFT" || status === "POSTED";
}

export function canVoidPo(status: string): boolean {
  return status === "POSTED";
}
