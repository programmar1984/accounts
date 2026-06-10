# Application Design — MVP-1

## Components

| Layer | Module | Responsibility |
|-------|--------|----------------|
| UI | `app/(app)/customers/*` | Customer list, create, edit |
| UI | `app/(app)/suppliers/*` | Supplier list, create, edit |
| UI | `app/(app)/invoices/*` | Invoice list, draft edit, issue |
| UI | `app/(app)/purchase-orders/*` | PO list, draft, send, receive, attachments |
| UI | `app/(app)/transactions/*` | Ledger + payment + receipt uploads |
| Actions | `lib/actions-counterparties.ts` | Customer/supplier CRUD |
| Actions | `lib/actions-invoices.ts` | Invoice CRUD, issue, void |
| Actions | `lib/actions-purchase-orders.ts` | PO lifecycle, receipts, attachments |
| Actions | `lib/actions.ts` | Auth, transactions, payments, tx attachments |
| Lib | `lib/invoices/pdf.ts` | PDF generation (pdfkit) |
| Lib | `lib/numbers.ts` | INV-/PO- number sequences |
| Lib | `lib/payment.ts` | Payment status computation |
| Lib | `lib/po/status.ts` | PO state machine helpers |
| API | `api/invoices/[id]/pdf` | Auth-gated invoice PDF download |
| API | `api/files/[id]` | Auth-gated attachment download |

## Data model

See [`lib/db/schema.ts`](../../../lib/db/schema.ts): `Customer`, `Supplier`, `Invoice`, `InvoiceLine`, `PurchaseOrder`, `PurchaseOrderLine`; extended `Transaction` and `Attachment`.

## PO state machine

```
DRAFT --send--> SENT --partial receive--> PARTIALLY_RECEIVED --full receive--> CLOSED
  |               |                              |
  cancel          cancel                         cancel
  v               v                              v
CANCELLED      CANCELLED                      CANCELLED
```

`recordPurchaseOrderReceipt` updates `qtyReceived`, creates PURCHASE transaction for received value, recomputes status via `computePoStatus`.

## Invoice lifecycle

```
DRAFT --issue (+ optional SALE tx)--> ISSUED --void--> VOID
```

PDF stored in `uploads/` as `pdfStoredName`.

## Server action map

| Action | Auth | Validates |
|--------|------|-----------|
| `createCustomer` | user | name required |
| `createInvoice` | user | customer, dates, lines |
| `issueInvoice` | user | status DRAFT |
| `sendPurchaseOrder` | user | status DRAFT |
| `recordPurchaseOrderReceipt` | user | status SENT or PARTIALLY_RECEIVED |
| `recordPayment` | user | 0 <= amountPaid <= amount |

## i18n

All new UI strings in `lib/i18n.ts` under `cust.*`, `supp.*`, `inv.*`, `po.*`, `pay.*`, extended `tx.*` and `nav.*`.
