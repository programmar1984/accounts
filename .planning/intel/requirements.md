# Requirements Intel — SHIME

Synthesized from PRD and SPEC docs. Organized by milestone.

## Implemented (Milestone 1 — COMPLETE)

### Authentication (FR-AUTH)
FR-AUTH-01  Email/password sign-in
FR-AUTH-02  httpOnly session cookie, 7-day TTL
FR-AUTH-03  Deactivated users blocked on all routes
FR-AUTH-04  Sign out
FR-AUTH-05  Seeded admin user on first deploy

### Attachments (FR-ATT)
FR-ATT-01   Upload images/PDFs up to 15 MB per file
FR-ATT-02   Attach on create or add later on edit
FR-ATT-03   Inline view or download via auth-gated API
FR-ATT-04   Delete attachment removes DB row + disk file
FR-ATT-05   Delete parent document cascades to attachments

### Dashboard (FR-DASH)
FR-DASH-01  Per-year totals: sales, purchases, expenses, net
FR-DASH-02  Year selector
FR-DASH-03  Six most recent ledger entries

### User Administration (FR-USER)
FR-USER-01  Admin creates users (ADMIN or MEMBER role)
FR-USER-02  Admin activates/deactivates users (not self)
FR-USER-03  Members cannot access user management

### Internationalization (FR-I18N)
FR-I18N-01  Full UI in English and Japanese
FR-I18N-02  Language preference via shime_lang cookie
FR-I18N-03  JPY and date formatting per locale

### Customers (FR-CUST)
FR-CUST-01  CRUD customers (name, code, email, address, phone, tax ID, payment terms)
FR-CUST-02  Activate/deactivate customers
FR-CUST-03  Link SO and sales via customerId

### Vendors/Suppliers (FR-SUPP)
FR-SUPP-01  CRUD vendors (same field pattern as customers)
FR-SUPP-02  Activate/deactivate vendors
FR-SUPP-03  Link POs and purchases via supplierId

### Sales Orders (FR-SO)
FR-SO-01    Draft SO with line items for a customer
FR-SO-02    Auto-number SO-YYYY-NNNN
FR-SO-03    Issue → generate PDF (pdfkit); no transaction row created
FR-SO-04    Void issued SO
FR-SO-05    Filter by year, customer, status at /sales-orders
FR-SO-06    Per-line tax rate (10% / 8% / 0%); header bucket rounding
FR-SO-07    Payment tracking (dueDate, amountPaid, paymentStatus)
FR-SO-08    /invoices routes redirect to /sales-orders

### Purchase Orders (FR-PO)
FR-PO-01    Draft PO with line items for a supplier (required)
FR-PO-02    Auto-number PO-YYYY-NNNN
FR-PO-03    Lifecycle: DRAFT → POSTED (+ VOID, CANCELLED)
FR-PO-04    Cancel PO from draft
FR-PO-05    Post PO to ledger (no send/receive workflow)
FR-PO-06    No transaction row on post
FR-PO-07    Upload receipt attachments to PO
FR-PO-08    Per-line tax rate; payment on posted PO

### Expenses (FR-EXP)
FR-EXP-01   Draft expense with optional supplier
FR-EXP-02   Auto-number EXP-YYYY-NNNN
FR-EXP-03   Line items with per-line tax rate
FR-EXP-04   Post / void lifecycle
FR-EXP-05   Receipt attachments
FR-EXP-06   Payment tracking when posted

### Service Orders (FR-SVO)
FR-SVO-01   New document type Service Order (parity with PO bill model)
FR-SVO-02   Required serviceCategory: TRANSPORT | INSPECTION | SHIPPING | VANNING | OTHER
FR-SVO-03   Numbering: SVO-YYYY-NNNN
FR-SVO-04   Ledger type "Service"; amounts in Purchase column footer
FR-SVO-05   JCT input tax aggregates include posted SVO
FR-SVO-06   Migrate 8 legacy POs to SVO (completed in migration 0005)

### Ledger (FR-LED)
FR-LED-01   Unified list of POSTED POs, ISSUED SOs, POSTED Expenses, POSTED SVOs
FR-LED-02   Party code column from Customer/Supplier master
FR-LED-03   Filter by year, document type, payment status, search
FR-LED-04   Row links to document detail
FR-LED-05   Replaces Transactions in navigation

### Payment Tracking (FR-PAY)
FR-PAY-01   dueDate on documents
FR-PAY-02   amountPaid and paymentStatus UNPAID/PARTIAL/PAID
FR-PAY-03   Record payment on document detail

### Consumption Tax / JCT (FR-JCT)
FR-JCT-01   Tenant setting: 免税事業者 (EXEMPT) vs 課税事業者 (TAXABLE)
FR-JCT-02   When TAXABLE: subtotalExTax, totalTax, totalAmount on document headers
FR-JCT-03   Per-line tax rate; header rounding per rate bucket
FR-JCT-04   Company settings: T+13 number, price basis, rounding method
FR-JCT-05   Dashboard JCT summary: output tax, input tax, estimated net (draft)
FR-JCT-06   Invoice PDF shows tax breakdown when taxable
FR-JCT-07   Exempt mode hides tax UI
FR-JCT-08   Draft disclaimer on all tax figures

### UI Shell (FR-UI)
FR-UI-01    AdminLTE-inspired: fixed sidebar, sticky topbar, responsive at 992px
FR-UI-02    Semantic color tokens (primary/success/warning/danger/info)
FR-UI-03    Light/dark mode via shime_theme cookie
FR-UI-04    Sidebar brand: SHIME expanded, SM collapsed
FR-UI-05    Bilingual shell chrome
FR-UI-06    Shared UI primitives: Button, Card, Alert, Badge, PageToolbar, DataTable

## Pending (Milestone 2 — Production Hardening)

FR-NEXT-01  Next.js middleware for centralized auth routing        [High]
FR-NEXT-02  Remove hardcoded dev secrets and DATABASE_URL          [High]
FR-NEXT-03  Automated test suite (unit + integration)             [High]
FR-NEXT-04  CI pipeline (lint, build, test)                       [High]
FR-NEXT-05  S3-compatible object storage for attachments          [High]
FR-NEXT-06  Pagination on ledger/document lists                   [Medium]
FR-NEXT-07  Password change and reset flows                       [Medium]
FR-NEXT-08  Audit log for document changes                        [Medium]

## Future (Milestone 3 — Platform Vision)

FR-VISION-01  Multi-tenant organization model
FR-VISION-02  Chart of accounts and journal entries
FR-VISION-03  Denchōhō electronic books compliance
FR-VISION-04  Year-end closing workflow
FR-VISION-05  Draft tax schedule export (Zeirishi review)
FR-VISION-06  Zeirishi collaboration workspace
FR-VISION-07  Full 適格請求書 compliance (T+13 qualified invoices, NTA API)
FR-VISION-08  AR/AP subledgers (beyond payment tracking)
FR-VISION-09  Multi-currency support (beyond JPY)
