# ROADMAP — SHIME

## Milestone 1: SHIME MVP
**Status:** COMPLETE (verified 2026-06-13)
**Goal:** Deliver a functional bilingual bookkeeping app covering the full Japanese SMB
document workflow: Sales Orders, Purchase Orders, Service Orders, Expenses, Ledger,
consumption tax calculation, and issued PDF invoices.

### Phase 1: MVP-0 Core
**Status:** COMPLETE
**Goal:** Basic bookkeeping: auth, legacy transaction ledger, receipt uploads, dashboard, i18n.
**Delivered:**
- Email/password auth with httpOnly JWT sessions
- Transaction ledger (SALE / PURCHASE / EXPENSE)
- Receipt attachment upload + auth-gated download
- Yearly dashboard totals
- User administration (ADMIN / MEMBER)
- EN/JA internationalization

### Phase 2: MVP-1 Document Workflow
**Status:** COMPLETE
**Goal:** Add structured counterparty masters and first-class documents for sales and purchases.
**Delivered:**
- Customer and Supplier (Vendor) master CRUD
- Sales Orders (numbered PDF invoices, SO-YYYY-NNNN)
- Purchase Orders (bill recording, DRAFT → POSTED lifecycle)
- Payment tracking (UNPAID / PARTIAL / PAID) on all documents

### Phase 3: Infrastructure & UI Shell
**Status:** COMPLETE
**Goal:** Migrate to pnpm monorepo, apply AdminLTE UI shell, and add JCT consumption tax.
**Delivered:**
- pnpm monorepo (@shime/web + @shime/db + @shime/shared)
- AdminLTE-inspired shell: fixed sidebar, dark/light mode, semantic color tokens
- Consumption tax (JCT): company settings, per-line rates, header rounding, PDF breakdown,
  dashboard output/input tax summary, draft disclaimer

### Phase 4: Document Model Refactor
**Status:** COMPLETE
**Goal:** Replace legacy transaction-centric model with document-centric ledger.
**Delivered:**
- PO bill-only workflow (no send/receive, no PURCHASE transaction on post)
- Sales Orders rename (Invoice DB table → SO- prefix UI)
- Expenses module (EXP- prefix, optional supplier, post/void lifecycle)
- Unified Ledger view (replaces Transactions nav)
- /invoices → /sales-orders redirect; /transactions → /ledger redirect

### Phase 5: Service Orders
**Status:** COMPLETE
**Goal:** Add Service Order document type for logistics and service costs (transport, shipping,
inspection, vanning) to support vehicle export workflows.
**Delivered:**
- ServiceOrder + ServiceOrderLine schema (migration 0005)
- SVO-YYYY-NNNN numbering; serviceCategory field
- Lifecycle: DRAFT → POSTED (+ VOID, CANCELLED)
- Ledger integration: "Service" type, Purchase column aggregation, JCT input tax
- Migrated 8 legacy POs to SVO with category inference

---

## Milestone 2: Production Hardening
**Status:** ACTIVE (not started)
**Goal:** Make SHIME production-deployable: secure secrets handling, centralized auth,
automated tests, CI pipeline, and cloud attachment storage.

### Phase 6: Security & Auth Hardening
**Status:** OPEN
**Goal:** Eliminate the MVP security gaps that block production deployment.
**Scope:**
- Next.js middleware for centralized auth routing (replace per-page requireUser/requireAdmin)
- Remove hardcoded DATABASE_URL and AUTH_SECRET from source; env-only config
- Rate limiting on /login (e.g. via middleware or upstash-ratelimit)
- Verify secure cookie flag is set in production

### Phase 7: Test Suite
**Status:** OPEN
**Goal:** Add automated tests covering critical business logic and server action paths.
**Scope:**
- Unit tests for pure functions in packages/shared (tax math, format, payment status)
- Integration tests for core server actions: login, createCustomer, postPurchaseOrder, issueInvoice
- Property-based tests for tax calculation round-trips (packages/shared/src/tax.ts)

### Phase 8: CI Pipeline
**Status:** OPEN
**Goal:** Automated quality gate on every pull request.
**Scope:**
- GitHub Actions workflow: pnpm install → lint → pnpm build → test
- Branch protection: require CI pass before merge

### Phase 9: Cloud Attachment Storage
**Status:** OPEN
**Goal:** Replace local uploads/ filesystem with S3-compatible object storage.
**Scope:**
- Storage adapter in lib/files.ts (presigned upload / presigned download)
- Migrate existing attachment files to S3 bucket
- Remove uploads/ from .gitignore / deployment (no longer needed)
- Auth-gated file route continues to work via presigned URLs or proxy

---

## Milestone 3: Platform Vision
**Status:** PLANNED
**Goal:** Evolve SHIME into a multi-tenant SaaS with full Japanese tax compliance capabilities
and Zeirishi collaboration.

### Phase 10: Multi-Tenancy
**Status:** PLANNED
**Scope:** Organization model, per-org user scoping, tenant data isolation, org-level JCT settings

### Phase 11: Compliance Engine
**Status:** PLANNED
**Scope:** Full 適格請求書 (qualified invoice) compliance, NTA API, Denchōhō electronic books,
80%/50% purchase credit rules, journal 仮払/仮受消費税

### Phase 12: Financial Statements & Year-End
**Status:** PLANNED
**Scope:** Chart of accounts, double-entry journal entries, trial balance, year-end closing workflow,
draft tax schedule export for Zeirishi

### Phase 13: Zeirishi Collaboration
**Status:** PLANNED
**Scope:** Review workspace, comment threads on documents, draft labeling, sign-off flow
