## Context

Expenses today: manual form → DRAFT → optional attachment → POST. Attachments are JPEG/PNG/PDF up to 15 MB on local disk. No category field existed before this change.

User constraints (confirmed in discovery):
- ~20 receipts/week — sync on-upload is sufficient
- Receipt types: convenience store, toll, parking, office supplies
- Category purpose: expense reporting (not 勘定科目 / chart of accounts)
- AI: local LM Studio + `qwen/qwen2.5-vl-7b` at `http://127.0.0.1:1234/v1`
- Merge small lines by default (threshold ¥1,000)

## Goals / Non-Goals

**Goals:**

- Scan-to-draft on `/expenses/new` with human review gate
- Structured JSON extraction → validated integer JPY lines with tax rates 8/10/0
- Expense category for reporting
- Merge small lines within same tax-rate bucket
- Receipt saved as attachment on created expense
- Clear errors when LM Studio is unreachable or parse fails

**Non-goals:**

- See proposal Non-goals

## Decisions

### 1. LM Studio via OpenAI-compatible API

**Choice:** Server-side `fetch` to `{LMSTUDIO_BASE_URL}/chat/completions` with base64 image in message.

**Rationale:** User already runs Qwen2.5-VL in LM Studio; no API keys; same pattern as cloud providers later.

**Alternative:** Browser → LM Studio directly — rejected (CORS, exposes local server to client).

### 2. Server Action orchestration

**Choice:** Single `scanReceiptAndCreateExpense` action: validate file → extract → map lines → insert expense + lines + attachment → redirect.

**Rationale:** Matches existing `createExpense` / `addExpenseAttachments` patterns; auth via `requireUser()`.

### 3. Category on Expense header

**Choice:** Nullable `Expense.category` text; enum validated in shared package.

**Rationale:** Reporting dimension without line-level complexity; mirrors SVO `serviceCategory` pattern.

### 4. Line merge policy

**Choice:** `mergeSmallReceiptLines` in `@shime/shared` — merge lines where `amount <= threshold` grouped by `taxRate`.

**Default threshold:** 1000 JPY via `RECEIPT_MERGE_THRESHOLD`.

**Rationale:** User requested merge; grouping by tax rate preserves JCT bucket integrity.

### 5. Tax amount handling

**Choice:** Treat receipt amounts as tax-inclusive; use existing `splitLineAmount` / `computeLineExTax` when company `priceBasis` is TAX_EXCLUSIVE.

**Rationale:** Japanese retail receipts print inclusive totals; reuses FR-JCT line/bucket logic.

### 6. Never auto-post

**Choice:** Created expenses always `status: DRAFT`; user edits and posts explicitly.

**Rationale:** Extraction errors must not hit ledger or JCT aggregates.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| LM Studio not running | Redirect with `scan_lmstudio` error; manual form still available |
| Wrong tax rate on receipt | User reviews draft; editable lines |
| Slow inference (10–30s) | Acceptable at 20/week; no async queue in v1 |
| Local-only AI | Document LM Studio must be running; cloud provider is future env switch |

## Migration Plan

1. Apply migration `0006_expense_category.sql`
2. Add env vars to `.env` from `.env.example`
3. Deploy app; LM Studio remains operator responsibility on client machine

**Rollback:** Revert migration (drop column) and remove scan UI; manual expense entry unaffected.

## Open Questions

None for v1.
