## Why

Manual expense entry for ~20 small receipts per week (konbini, toll, parking, office supplies) is repetitive. Users already attach receipt images as evidence after typing line items. Vision AI (Qwen2.5-VL via local LM Studio) can extract vendor, date, lines, and category, then pre-fill a DRAFT expense for human review before posting.

## What Changes

- Add **Scan receipt** flow on `/expenses/new`: upload image/PDF → LM Studio extraction → DRAFT expense + attachment
- Add LM Studio client (`receipt-extract.ts`) using OpenAI-compatible `/v1/chat/completions` with vision
- Map extraction to expense lines with JCT-aware amounts (`receipt-to-expense.ts`)
- Add expense **category** field (CONVENIENCE, TOLL, PARKING, OFFICE, OTHER) for reporting — migration `0006_expense_category`
- Merge line items ≤ ¥1,000 within the same tax-rate bucket (configurable via `RECEIPT_MERGE_THRESHOLD`)
- Server action `scanReceiptAndCreateExpense` — never auto-posts; redirects to draft review
- Bilingual UI strings (EN/JA) for scan form, success, and error states
- Env config: `LMSTUDIO_BASE_URL`, `RECEIPT_AI_MODEL`, optional `RECEIPT_MERGE_THRESHOLD`

Extends existing expense module (FR-EXP-01..06): attachments remain evidence; posting and ledger behavior unchanged until user posts manually.

## Capabilities

### New Capabilities

- `expense-receipt-scan`: Upload receipt image/PDF, extract structured data via LM Studio, create DRAFT expense with categorized lines, merged small items, and linked attachment

### Modified Capabilities

<!-- No existing openspec/specs/ capabilities yet -->

## Impact

- **Schema**: `Expense.category` nullable text column
- **packages/shared**: `EXPENSE_CATEGORIES`, `mergeSmallReceiptLines`, category labels
- **apps/web**: new lib modules, `scanReceiptAndCreateExpense`, `/expenses/new` scan card, detail page scan success + category display
- **Ledger / JCT**: unchanged until user posts draft; extracted tax rates feed existing `summarizeDocumentLines` / JCT aggregates
- **i18n**: new `exp.scan.*` and `exp.error.scan_*` keys in EN and JA
- **Runtime dependency**: LM Studio local server with `qwen/qwen2.5-vl-7b` loaded (not bundled in app)
- **No new npm dependencies** for AI — uses `fetch` to local API

## Non-goals

- Auto-posting expenses without user review
- Batch/inbox queue for high-volume scanning
- Supplier master fuzzy matching from vendor name
- Cloud OpenAI/Anthropic provider switch (local LM Studio only in v1)
- Auction invoices, vehicle purchase receipts, or SVO routing
- OCR for posted expenses (scan only on create flow)
