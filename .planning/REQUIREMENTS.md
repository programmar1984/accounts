# REQUIREMENTS — SHIME

## Milestone 1: SHIME MVP — COMPLETE

All requirements below are implemented and verified (pnpm build + pnpm db:migrate as of 2026-06-13).

### Authentication
FR-AUTH-01  Email/password sign-in                                                [DONE]
FR-AUTH-02  httpOnly session cookie, 7-day TTL, signed JWT                       [DONE]
FR-AUTH-03  Deactivated users blocked on all routes (live DB check per request)  [DONE]
FR-AUTH-04  Sign out destroys cookie                                              [DONE]
FR-AUTH-05  Seeded admin user on first deploy (pnpm db:seed)                     [DONE]

### Attachments
FR-ATT-01   Upload images/PDFs up to 15 MB per file                              [DONE]
FR-ATT-02   Attach on create or add later                                        [DONE]
FR-ATT-03   Auth-gated view/download via GET /api/files/[id]                    [DONE]
FR-ATT-04   Delete removes DB row + disk file                                    [DONE]
FR-ATT-05   Delete parent document cascades to attachments                       [DONE]

### Dashboard
FR-DASH-01  Per-year totals: sales, purchases, expenses, net                     [DONE]
FR-DASH-02  Year selector                                                         [DONE]
FR-DASH-03  Six most recent ledger entries                                        [DONE]

### User Administration
FR-USER-01  Admin creates users (ADMIN or MEMBER)                                [DONE]
FR-USER-02  Admin activates/deactivates (not self)                               [DONE]
FR-USER-03  Members cannot access /users                                          [DONE]

### Internationalization
FR-I18N-01  Full UI in English and Japanese                                       [DONE]
FR-I18N-02  Language via shime_lang cookie                                        [DONE]
FR-I18N-03  JPY (Intl) and date formatting per locale                            [DONE]

### Customers
FR-CUST-01  CRUD (name, code, email, address, phone, tax ID, payment terms)      [DONE]
FR-CUST-02  Activate/deactivate (preserves document history)                     [DONE]
FR-CUST-03  Linked to Sales Orders via customerId                                 [DONE]

### Vendors (UI) / Suppliers (DB)
FR-SUPP-01  CRUD vendors (same field pattern as customers)                        [DONE]
FR-SUPP-02  Activate/deactivate                                                   [DONE]
FR-SUPP-03  Linked to POs and SVOs via supplierId                                 [DONE]

### Sales Orders
FR-SO-01    Draft with line items; customer required                              [DONE]
FR-SO-02    Auto-number SO-YYYY-NNNN                                             [DONE]
FR-SO-03    Issue → generate PDF (pdfkit); no transaction row                    [DONE]
FR-SO-04    Void issued SO                                                        [DONE]
FR-SO-05    Filter by year, customer, status                                      [DONE]
FR-SO-06    Per-line tax rate (10%/8%/0%); header bucket rounding                [DONE]
FR-SO-07    Payment tracking (dueDate, amountPaid, paymentStatus)                [DONE]
FR-SO-08    /invoices/* redirects to /sales-orders/*                             [DONE]

### Purchase Orders
FR-PO-01    Draft with line items; supplier required                              [DONE]
FR-PO-02    Auto-number PO-YYYY-NNNN                                             [DONE]
FR-PO-03    Lifecycle DRAFT → POSTED (+ VOID, CANCELLED)                        [DONE]
FR-PO-04    Cancel from draft                                                     [DONE]
FR-PO-05    Post to ledger (no send/receive workflow)                            [DONE]
FR-PO-06    No transaction row on post                                            [DONE]
FR-PO-07    Receipt attachments                                                   [DONE]
FR-PO-08    Per-line tax rate; payment on posted PO                              [DONE]

### Expenses
FR-EXP-01   Draft with optional supplier                                          [DONE]
FR-EXP-02   Auto-number EXP-YYYY-NNNN                                           [DONE]
FR-EXP-03   Line items with per-line tax rate                                    [DONE]
FR-EXP-04   Post / void lifecycle                                                 [DONE]
FR-EXP-05   Receipt attachments                                                   [DONE]
FR-EXP-06   Payment tracking when posted                                         [DONE]

### Service Orders
FR-SVO-01   New document type (parity with PO bill model)                        [DONE]
FR-SVO-02   serviceCategory: TRANSPORT|INSPECTION|SHIPPING|VANNING|OTHER         [DONE]
FR-SVO-03   Numbering SVO-YYYY-NNNN                                              [DONE]
FR-SVO-04   Ledger type "Service"; amounts in Purchase column footer             [DONE]
FR-SVO-05   JCT input tax aggregates include posted SVO                          [DONE]
FR-SVO-06   8 legacy POs migrated to SVO (migration 0005)                       [DONE]

### Ledger
FR-LED-01   Unified list: POSTED PO, ISSUED SO, POSTED Expense, POSTED SVO      [DONE]
FR-LED-02   Party code from Customer/Supplier master                             [DONE]
FR-LED-03   Filter by year, doc type, payment status, search                    [DONE]
FR-LED-04   Row links to document detail                                          [DONE]
FR-LED-05   Replaces Transactions in navigation                                  [DONE]

### Payment Tracking
FR-PAY-01   dueDate on all documents                                              [DONE]
FR-PAY-02   amountPaid + paymentStatus UNPAID/PARTIAL/PAID                      [DONE]
FR-PAY-03   Record payment on document detail                                    [DONE]

### Consumption Tax (JCT)
FR-JCT-01   Tenant setting: EXEMPT / TAXABLE                                     [DONE]
FR-JCT-02   TAXABLE: subtotalExTax, totalTax, totalAmount on headers             [DONE]
FR-JCT-03   Per-line tax rate; header rounding per rate bucket                  [DONE]
FR-JCT-04   CompanySettings: T+13 number, price basis, rounding method          [DONE]
FR-JCT-05   Dashboard JCT: output tax, input tax, net (draft)                   [DONE]
FR-JCT-06   PDF tax breakdown when taxable                                        [DONE]
FR-JCT-07   Exempt mode hides tax UI                                             [DONE]
FR-JCT-08   Draft disclaimer on all tax figures                                  [DONE]

### UI Shell
FR-UI-01    Fixed sidebar, sticky topbar, responsive collapse at 992px           [DONE]
FR-UI-02    Semantic color tokens (primary/success/warning/danger/info)          [DONE]
FR-UI-03    Light/dark mode via shime_theme cookie                               [DONE]
FR-UI-04    Sidebar brand: SHIME expanded, SM collapsed                         [DONE]
FR-UI-05    Bilingual shell chrome                                               [DONE]
FR-UI-06    Shared primitives: Button, Card, Alert, Badge, PageToolbar, DataTable [DONE]

---

## Milestone 2: Production Hardening — PENDING

### Security & Auth
FR-NEXT-01  Next.js middleware for centralized auth routing                      [OPEN] High
FR-NEXT-02  Remove hardcoded dev secrets; env-based DATABASE_URL + AUTH_SECRET  [OPEN] High
            NFR-SEC-06 Rate limiting on authentication endpoint                  [OPEN] High

### Testing
FR-NEXT-03  Automated test suite: unit tests for pure functions (packages/shared),
            integration tests for critical server actions (auth, post, issue)    [OPEN] High

### CI/CD
FR-NEXT-04  CI pipeline: lint, build, test on every PR                          [OPEN] High

### Storage
FR-NEXT-05  S3-compatible object storage for attachments (replace local uploads/) [OPEN] High
            Migration: lib/files.ts storage adapter; preserve existing file IDs

### UX Improvements
FR-NEXT-06  Pagination on ledger and document list pages                         [OPEN] Medium
FR-NEXT-07  Password change and reset flows                                      [OPEN] Medium
FR-NEXT-08  Audit log for document changes (who, when, what changed)            [OPEN] Medium
            NFR-REL-01 Attachment DB + filesystem consistency on delete          [OPEN] Medium
                       (currently partial — no rollback if disk write fails)

---

## Milestone 3: Platform Vision — PLANNED

FR-VISION-01  Multi-tenant organization model (org → users, documents scoped)
FR-VISION-02  Chart of accounts and double-entry journal entries
FR-VISION-03  Denchōhō electronic books compliance (retention, audit trail)
FR-VISION-04  Year-end closing workflow
FR-VISION-05  Draft tax schedule export for Zeirishi review
FR-VISION-06  Zeirishi collaboration workspace (review, comment, sign-off)
FR-VISION-07  Full 適格請求書 compliance (NTA API, T+13, 80%/50% credit rules)
FR-VISION-08  AR/AP subledger views (beyond simple payment status)
FR-VISION-09  Multi-currency support
