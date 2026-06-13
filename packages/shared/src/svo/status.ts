export const SVO_STATUSES = ["DRAFT", "POSTED", "VOID", "CANCELLED"] as const;

export type SvoStatus = (typeof SVO_STATUSES)[number];

export function canPostSvo(status: string): boolean {
  return status === "DRAFT";
}

export function canCancelSvo(status: string): boolean {
  return status === "DRAFT" || status === "POSTED";
}

export function canVoidSvo(status: string): boolean {
  return status === "POSTED";
}
