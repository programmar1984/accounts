# Context — SHIME

## Business Domain

SHIME (締) is a bilingual bookkeeping application for small businesses in Japan. "締" means
closing/settlement in Japanese. The product targets business owners who self-prepare their books
and need a Zeirishi (税理士 — licensed tax accountant) to review and sign off at year-end.

Primary language: English UI with full Japanese translation. Japanese statutory terms preserved
in the business dictionary and i18n keys.

## User Personas

Aki (ADMIN): business owner or office manager who manages users, counterparty masters,
JCT settings, and reviews yearly summaries.

Ken (MEMBER): bookkeeper who records daily transactions, creates and posts documents,
uploads receipts, tracks payments.

## Implemented Document Types

| Prefix | Document | Party | Ledger type |
|--------|----------|-------|-------------|
| SO-    | Sales Order     | Customer (required) | Sales    |
| PO-    | Purchase Order  | Supplier (required) | Purchase |
| SVO-   | Service Order   | Supplier (required) | Service  |
| EXP-   | Expense         | Supplier (optional) | Expense  |

Legacy Transaction table retained for historical rows; no new Transaction rows created by
any current document workflow.

## Consumption Tax (JCT) Context

Japan's consumption tax (消費税) has two active rates: 10% (standard) and 8% (reduced, food).
Businesses below the 免税 threshold are tax-exempt; above it are 課税事業者 (taxable).

SHIME's JCT module:
- Company settings: exemption status, T+13 registration number, tax-inclusive/exclusive basis,
  rounding method (切捨て / 切上げ / 四捨五入)
- Per-line tax rate on all document types
- Header aggregation by tax bucket (separate rounding per rate)
- Dashboard summary: 売上税額 (output tax), 仕入税額 (input tax), estimated net (draft)
- Draft disclaimer on all tax figures (not a substitute for Zeirishi review)

## Target Deployment

12-month horizon: multi-tenant SaaS on managed cloud (Vercel + RDS + S3-compatible or
equivalent). Single-tenant MVP first; tenancy layer is Milestone 3 scope.

## Business Dictionary

Sale (売上)     Money in; SO-* documents
Purchase (仕入) Goods cost; PO-* documents
Expense (経費)  Operating cost; EXP-* documents
Service (役務)  Logistics/service cost; SVO-* documents
Attachment (添付) Uploaded proof doc (receipt, third-party invoice) — not an issued SO PDF
Ledger (台帳)   Unified view of posted/issued documents
Vendor (ベンダー) UI label for Supplier master (DB: Supplier, routes: /suppliers)
Zeirishi (税理士) Licensed tax accountant; reviews SHIME's draft figures

## Migration History

0000: Initial MVP-0 schema (User, Transaction, Attachment)
0001: MVP-1 counterparties (Customer, Supplier, Invoice/SO, PurchaseOrder)
0002: JCT MVP-2 (CompanySettings, tax columns on Invoice/PO)
0003: (internal numbering gap — may not exist)
0004: Document Model refactor (Expense, InvoiceLine/PurchaseOrderLine, Ledger union)
0005: Service Orders (ServiceOrder, ServiceOrderLine, 8 PO→SVO migrations)
