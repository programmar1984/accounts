export const EXPENSE_CATEGORIES = [
  "CONVENIENCE",
  "TOLL",
  "PARKING",
  "OFFICE",
  "OTHER",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export function parseExpenseCategory(value: string | null | undefined): ExpenseCategory {
  if (!value) return "OTHER";
  const upper = value.trim().toUpperCase();
  return EXPENSE_CATEGORIES.includes(upper as ExpenseCategory)
    ? (upper as ExpenseCategory)
    : "OTHER";
}

export function expenseCategoryLabel(category: ExpenseCategory, lang: "en" | "ja"): string {
  const labels: Record<ExpenseCategory, { en: string; ja: string }> = {
    CONVENIENCE: { en: "Convenience store", ja: "コンビニ" },
    TOLL: { en: "Toll / highway", ja: "通行料" },
    PARKING: { en: "Parking", ja: "駐車場" },
    OFFICE: { en: "Office supplies", ja: "事務用品" },
    OTHER: { en: "Other", ja: "その他" },
  };
  return labels[category][lang];
}
