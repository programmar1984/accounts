## 1. Shared domain helpers

- [x] 1.1 Add `EXPENSE_CATEGORIES`, `parseExpenseCategory`, `expenseCategoryLabel` in `packages/shared/src/expense/categories.ts`
- [x] 1.2 Add `mergeSmallReceiptLines` in `packages/shared/src/expense/receipt-lines.ts` and export from `@shime/shared`

## 2. Database

- [x] 2.1 Add nullable `category` column to `Expense` in schema and migration `0006_expense_category.sql`
- [x] 2.2 Run `pnpm db:migrate`

## 3. Receipt extraction pipeline

- [x] 3.1 Implement `apps/web/lib/receipt-extract.ts` — LM Studio vision API, JSON parse, env config
- [x] 3.2 Implement `apps/web/lib/receipt-to-expense.ts` — map extraction to `ParsedDocumentLine[]` with JCT settings

## 4. Server action and UI

- [x] 4.1 Add `scanReceiptAndCreateExpense` to `actions-expenses.ts` (validate file, extract, create DRAFT + attachment)
- [x] 4.2 Add scan receipt card on `/expenses/new` with error handling
- [x] 4.3 Show scan success alert and category on expense detail draft view
- [x] 4.4 Add EN/JA i18n keys for scan UI and errors

## 5. Configuration and verification

- [x] 5.1 Document `LMSTUDIO_BASE_URL`, `RECEIPT_AI_MODEL`, `RECEIPT_MERGE_THRESHOLD` in `.env.example`
- [x] 5.2 Run `pnpm build`
- [x] 5.3 Manual test: LM Studio running → scan konbini receipt → review DRAFT → post → verify ledger row
