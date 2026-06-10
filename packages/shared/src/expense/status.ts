export const EXPENSE_STATUSES = ["DRAFT", "POSTED", "VOID"] as const;

export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export function canPostExpense(status: string): boolean {
  return status === "DRAFT";
}

export function canVoidExpense(status: string): boolean {
  return status === "POSTED";
}
