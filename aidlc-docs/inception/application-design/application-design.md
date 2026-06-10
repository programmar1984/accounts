# Application Design — Document Model (MVP-2.5)

## Components

| Layer | Module | Responsibility |
|-------|--------|----------------|
| UI | `app/(app)/ledger/*` | Unified ledger list (replaces Transactions nav) |
| UI | `app/(app)/purchase-orders/*` | PO bill entry: draft → post, attachments, payment |
| UI | `app/(app)/sales-orders/*` | Sales orders (Invoice table); issue PDF, payment |
| UI | `app/(app)/expenses/*` | Expense vouchers; optional supplier, post, attachments |
| UI | `app/(app)/customers/*` | Customer masters (code shown on ledger) |
| UI | `app/(app)/suppliers/*` | Supplier masters (code shown on ledger) |
| UI | `app/(app)/settings/tax/*` | JCT company settings |
| Actions | `lib/actions-purchase-orders.ts` | PO CRUD, post, void, cancel, payment, attachments |
| Actions | `lib/actions-invoices.ts` | SO CRUD, issue, void, payment (no transaction on issue) |
| Actions | `lib/actions-expenses.ts` | Expense CRUD, post, void, payment, attachments |
| Actions | `lib/ledger.ts` | Union queries for ledger + JCT aggregates |
| Actions | `lib/actions-counterparties.ts` | Customer/supplier CRUD |
| Lib | `lib/tax-helpers.ts` | `parseDocumentLines`, `summarizeDocumentLines` |
| Lib | `lib/invoices/pdf.ts` | PDF generation (pdfkit) |
| Lib | `lib/company-settings.ts` | JCT settings read |
| Shared | `packages/shared/src/po/status.ts` | PO: DRAFT → POSTED |
| Shared | `packages/shared/src/expense/status.ts` | Expense: DRAFT → POSTED |
| API | `api/invoices/[id]/pdf` | Auth-gated SO PDF download |
| API | `api/files/[id]` | Auth-gated attachment download |

**Redirects:** `/invoices/*` → `/sales-orders/*`; `/transactions/*` → `/ledger`.

## Data model

See `packages/db/src/schema.ts`:

- `Invoice` + `InvoiceLine` — Sales Orders (UI); `paymentStatus`, `amountPaid` on header
- `PurchaseOrder` + `PurchaseOrderLine` — bill model; `dueDate`, `paymentStatus`, `amountPaid`, `postedAt`; no `qtyReceived`
- `Expense` + `ExpenseLine` — new; optional `supplierId`
- `Attachment` — `expenseId` FK added; links to PO, SO, Expense
- `Transaction` — legacy; no new rows from PO/SO flows

Migration: `0004_document_model.sql`

## PO state machine (bill recording)

```
DRAFT --post--> POSTED --void--> VOID
  |
  cancel
  v
CANCELLED
```

`postPurchaseOrder` sets totals, `postedAt`, status POSTED. No send/receive or PURCHASE transaction creation.

## Sales Order lifecycle

```
DRAFT --issue (+ PDF)--> ISSUED --void--> VOID
```

`issueInvoice` generates PDF; does **not** create a SALE transaction. Payment tracked on document header.

## Expense lifecycle

```
DRAFT --post--> POSTED --void--> VOID
```

Supplier optional. Posted expenses appear on ledger with supplier code or `—`.

## Ledger

`lib/ledger.ts` unions:

| Source | Status filter | Party code |
|--------|---------------|------------|
| PurchaseOrder | POSTED | `Supplier.code` |
| Invoice (SO) | ISSUED | `Customer.code` |
| Expense | POSTED | `Supplier.code` if linked |

Dashboard JCT: output tax from ISSUED SOs; input tax from POSTED POs + POSTED Expenses.

## Shared line-item UX

`LineItemsEditor` — default 1 row; **Add line item** (`line.add`); per-line tax 10% / 8% / 0%.

## Server action map

| Action | Auth | Validates |
|--------|------|-----------|
| `postPurchaseOrder` | user | status DRAFT, lines |
| `recordPoPayment` | user | status POSTED |
| `issueInvoice` | user | status DRAFT |
| `recordSoPayment` | user | status ISSUED |
| `postExpense` | user | status DRAFT |
| `recordExpensePayment` | user | status POSTED |

## i18n

Keys: `ledger.*`, `so.*`, `exp.*`, `line.*`, updated `po.*`, `nav.*` (EN/JA in `lib/i18n.ts`).

## UI shell and theme

Unchanged from MVP-1 — AdminLTE-inspired shell, light/dark theme, shared primitives.

## Consumption tax (MVP-2)

Tax math in `packages/shared/src/tax.ts`; document headers store aggregated `subtotalExTax`, `totalTax`, `totalAmount` via `summarizeDocumentLines`.
