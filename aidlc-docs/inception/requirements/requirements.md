# Requirements — SHIME MVP

## Intent Analysis

| Field | Value |
|-------|-------|
| **User request** | Analyze brownfield SHIME codebase; document current architecture via AI-DLC Reverse Engineering; continue through Requirements Analysis and Workflow Planning |
| **Request type** | Documentation / architecture capture (brownfield analysis) |
| **Scope estimate** | System-wide documentation of existing MVP |
| **Complexity estimate** | Moderate — small codebase but full domain context and long-term vision in research doc |

## Business Context

SHIME (締) targets small businesses in Japan with bilingual bookkeeping. The **implemented MVP** records sales (売上), purchases (仕入), and expenses (経費) with receipt attachments and yearly dashboard totals. The **vision** in `docs/REQUIREMENTS_RESEARCH.md` adds compliance engine, year-end closing, and Zeirishi collaboration — explicitly deferred.

**Success criteria for this Inception phase:**
- Complete reverse-engineering artifacts describing as-built architecture
- Consolidated requirements baseline for MVP and roadmap gaps
- Execution plan for recommended next Construction phases

## Extension Configuration (from verification questions)

| Extension | Enabled | Scope |
|-----------|---------|-------|
| Security Baseline | Yes | Blocking for applicable Construction stages |
| Property-Based Testing | Partial | Pure functions and serialization round-trips only |

---

## Terminology

| Term | Meaning |
|------|---------|
| Receipt upload | User-uploaded proof file attached to a transaction or PO |
| Invoice issuance | SHIME-generated numbered PDF invoice (MVP-1) |
| Ledger transaction | SALE / PURCHASE / EXPENSE entry (money in/out) |

## Functional Requirements — Implemented (MVP-0)

### FR-AUTH: Authentication
| ID | Requirement | Status |
|----|-------------|--------|
| FR-AUTH-01 | Users sign in with email and password | Implemented |
| FR-AUTH-02 | Session stored in signed httpOnly cookie (7-day TTL) | Implemented |
| FR-AUTH-03 | Deactivated users cannot access protected routes | Implemented |
| FR-AUTH-04 | Users can sign out | Implemented |
| FR-AUTH-05 | Seeded admin user on first deploy | Implemented |

### FR-TX: Transactions
| ID | Requirement | Status |
|----|-------------|--------|
| FR-TX-01 | Record transaction types: SALE, PURCHASE, EXPENSE | Implemented |
| FR-TX-02 | Fields: date, counterparty, description, amount (integer JPY), memo | Implemented |
| FR-TX-03 | Create, edit, delete transactions | Implemented |
| FR-TX-04 | Filter list by calendar year and type | Implemented |
| FR-TX-05 | Free-text search on counterparty, description, memo | Implemented |
| FR-TX-06 | Show list total for current filter | Implemented |
| FR-TX-07 | Store dates as UTC midnight of entered calendar date | Implemented |

### FR-ATT: Attachments
| ID | Requirement | Status |
|----|-------------|--------|
| FR-ATT-01 | Upload images and PDFs up to 15 MB per file | Implemented |
| FR-ATT-02 | Attach files on create or add later on edit | Implemented |
| FR-ATT-03 | View inline or download via auth-gated API | Implemented |
| FR-ATT-04 | Delete attachment removes DB row and disk file | Implemented |
| FR-ATT-05 | Delete transaction removes attachments and files | Implemented |

### FR-DASH: Dashboard
| ID | Requirement | Status |
|----|-------------|--------|
| FR-DASH-01 | Per-year totals: sales, purchases, expenses, net | Implemented |
| FR-DASH-02 | Year selector | Implemented |
| FR-DASH-03 | Six most recent transactions with attachment indicator | Implemented |

### FR-USER: User Administration
| ID | Requirement | Status |
|----|-------------|--------|
| FR-USER-01 | Admin creates users with ADMIN or MEMBER role | Implemented |
| FR-USER-02 | Admin activates/deactivates users (not self) | Implemented |
| FR-USER-03 | Members cannot access user management | Implemented |

### FR-I18N: Internationalization
| ID | Requirement | Status |
|----|-------------|--------|
| FR-I18N-01 | Full UI in English and Japanese | Implemented |
| FR-I18N-02 | Language preference via cookie | Implemented |
| FR-I18N-03 | JPY and date formatting per locale | Implemented |

---

## Functional Requirements — Implemented (MVP-1)

### FR-CUST: Customers
| ID | Requirement | Status |
|----|-------------|--------|
| FR-CUST-01 | CRUD customers (name, code, email, address, phone, tax ID, payment terms) | Implemented |
| FR-CUST-02 | Activate/deactivate customers | Implemented |
| FR-CUST-03 | Link SALE transactions and invoices via customerId | Implemented |

### FR-SUPP: Suppliers
| ID | Requirement | Status |
|----|-------------|--------|
| FR-SUPP-01 | CRUD suppliers (same field pattern as customers) | Implemented |
| FR-SUPP-02 | Activate/deactivate suppliers | Implemented |
| FR-SUPP-03 | Link PURCHASE transactions and POs via supplierId | Implemented |

### FR-INV: Invoice issuance (simple PDF)
| ID | Requirement | Status |
|----|-------------|--------|
| FR-INV-01 | Draft invoice with line items for a customer | Implemented |
| FR-INV-02 | Auto-number invoices INV-YYYY-NNNN | Implemented |
| FR-INV-03 | Issue invoice → generate PDF (pdfkit) | Implemented |
| FR-INV-04 | Optional SALE transaction on issue | Implemented |
| FR-INV-05 | Void issued invoice | Implemented |
| FR-INV-06 | Filter invoices by year, customer, status | Implemented |

### FR-PO: Purchase orders
| ID | Requirement | Status |
|----|-------------|--------|
| FR-PO-01 | Draft PO with line items for a supplier | Implemented |
| FR-PO-02 | Auto-number PO-YYYY-NNNN | Implemented |
| FR-PO-03 | Lifecycle: DRAFT → SENT → PARTIALLY_RECEIVED → CLOSED | Implemented |
| FR-PO-04 | Cancel PO from draft/sent/partial | Implemented |
| FR-PO-05 | Record partial/full receipt per line (qtyReceived) | Implemented |
| FR-PO-06 | Create PURCHASE transaction on receipt | Implemented |
| FR-PO-07 | Upload receipt attachments to PO | Implemented |

### FR-PAY: Payment tracking
| ID | Requirement | Status |
|----|-------------|--------|
| FR-PAY-01 | dueDate on transactions | Implemented |
| FR-PAY-02 | amountPaid and paymentStatus UNPAID/PARTIAL/PAID | Implemented |
| FR-PAY-03 | Record payment on transaction detail | Implemented |

---

## Functional Requirements — Planned (Gap / Roadmap)

### FR-NEXT: Production Hardening
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-NEXT-01 | Next.js middleware for centralized auth routing | High |
| FR-NEXT-02 | Remove hardcoded dev secrets and database URLs | High |
| FR-NEXT-03 | Automated test suite (unit + integration) | High |
| FR-NEXT-04 | CI pipeline (lint, build, test) | High |
| FR-NEXT-05 | S3-compatible object storage for attachments | High |
| FR-NEXT-06 | Pagination on transaction list | Medium |
| FR-NEXT-07 | Password change and reset flows | Medium |
| FR-NEXT-08 | Audit log for transaction changes | Medium |

### FR-VISION: Platform Vision (from REQUIREMENTS_RESEARCH.md)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-VISION-01 | Multi-tenant organization model | Future |
| FR-VISION-02 | Chart of accounts and journal entries | Future |
| FR-VISION-03 | Denchōhō electronic books compliance | Future |
| FR-VISION-04 | Year-end closing workflow | Future |
| FR-VISION-05 | Draft tax schedule export (Zeirishi review) | Future |
| FR-VISION-06 | Zeirishi collaboration workspace | Future |

---

## Non-Functional Requirements

### NFR-SEC: Security
| ID | Requirement | MVP Status |
|----|-------------|------------|
| NFR-SEC-01 | Passwords hashed with bcrypt (cost 10) | Met |
| NFR-SEC-02 | httpOnly session cookies; secure in production | Met |
| NFR-SEC-03 | Auth-gated file access | Met |
| NFR-SEC-04 | MIME whitelist and file size limits | Met |
| NFR-SEC-05 | No secrets in source for production deploy | Not met |
| NFR-SEC-06 | Rate limiting on authentication | Not met |
| NFR-SEC-07 | Tenant data isolation | N/A (single-tenant MVP) |

### NFR-PERF: Performance
| ID | Requirement | MVP Status |
|----|-------------|------------|
| NFR-PERF-01 | Dashboard and list queries use DB indexes on date/type | Met |
| NFR-PERF-02 | Pagination for large transaction sets | Not met |

### NFR-REL: Reliability
| ID | Requirement | MVP Status |
|----|-------------|------------|
| NFR-REL-01 | Attachment DB + filesystem consistency on delete | Partial |
| NFR-REL-02 | Automated regression tests | Not met |

### NFR-OPS: Operability
| ID | Requirement | MVP Status |
|----|-------------|------------|
| NFR-OPS-01 | Drizzle migrations for schema changes | Met |
| NFR-OPS-02 | Seed script for admin bootstrap | Met |
| NFR-OPS-03 | CI/CD deployment pipeline | Not met |

### NFR-I18N: Localization
| ID | Requirement | MVP Status |
|----|-------------|------------|
| NFR-I18N-01 | EN/JA UI parity | Met |
| NFR-I18N-02 | Japanese statutory report language (future) | Not met |

### NFR-LEGAL: Compliance Positioning
| ID | Requirement | MVP Status |
|----|-------------|------------|
| NFR-LEGAL-01 | Product positioned as self-preparation tool, not Zeirishi service | Documented in research |
| NFR-LEGAL-02 | Draft outputs labeled for professional review | Future |

---

## Traceability Matrix (MVP vs. Vision)

| Capability | MVP | Research Doc | Gap |
|------------|-----|--------------|-----|
| Transaction logging | Yes | Yes | — |
| Customer/supplier masters | Yes (MVP-1) | Yes | — |
| Invoice issuance | Simple PDF | Qualified 適格請求書 | Tax fields, T+13 |
| Purchase orders | Full workflow | Yes | — |
| Payment tracking | Yes (MVP-1) | AR/AP subledgers | Full subledger |
| Receipt storage | Local disk | Cloud + compliance metadata | Storage + Denchōhō |
| Yearly totals | Yes | Full financial statements | Reporting engine |
| User roles | ADMIN/MEMBER | + Zeirishi workspace roles | Role model expansion |
| Bilingual UI | Yes | Yes (incl. reports) | Report localization |
| Tax output | No | Yes | Entire compliance module |
| Multi-tenant | No | Yes | Tenancy layer |

---

## Assumptions and Constraints

1. **Single database** shared by all users in MVP (no org/tenant boundary).
2. **JPY only** — integer amounts, no multi-currency.
3. **Calendar year** filtering uses UTC boundaries (documented in README).
4. **Local dev** defaults acceptable for development only; production requires env-based config.
5. **Target deployment**: Multi-tenant SaaS on managed cloud within 12-month horizon (per verification answers).

---

## Out of Scope (Current Inception)

- Code changes to application
- Construction phase execution
- Operations / deployment automation
