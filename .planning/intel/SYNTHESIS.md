# Synthesis — SHIME Ingest

Ingested: 20 docs from aidlc-docs/ (2 PRD, 5 SPEC, 13 DOC)
Mode: new
Date: 2026-06-27

## Project Summary

SHIME (締) is a brownfield bilingual bookkeeping SaaS for Japanese small businesses.
Built with Next.js 16 App Router + Drizzle ORM + PostgreSQL in a pnpm monorepo.
MVP is functionally complete through Service Orders (SVO). Production hardening is
the immediate next milestone.

## What Was Implemented (Milestone 1 — COMPLETE)

Phase 1 — MVP-0: auth, legacy transaction ledger, receipt attachments, dashboard, i18n EN/JA
Phase 2 — MVP-1: customer/supplier masters, sales orders (issued PDF), PO bill workflow,
                  payment tracking (UNPAID/PARTIAL/PAID)
Phase 3 — Infrastructure & UI: pnpm monorepo, AdminLTE shell, dark/light mode,
                  consumption tax (JCT) with company settings, per-line tax rates,
                  PDF tax breakdown, dashboard JCT summary
Phase 4 — Document Model: PO bill-only workflow, Sales Orders rename (Invoice table),
                  Expenses module, Ledger (unified view replacing Transactions nav)
Phase 5 — Service Orders: SVO document type for logistics costs, migration of 8 legacy POs

## What Is Next (Milestone 2 — ACTIVE, not started)

Six unmet production requirements gate the SaaS path:
1. Next.js middleware for centralized auth (currently per-page requireUser/requireAdmin)
2. Remove hardcoded dev secrets from source
3. Automated test suite (zero tests currently)
4. CI pipeline (lint, build, test)
5. S3-compatible object storage (currently local uploads/)
6. Rate limiting on authentication endpoint

## Strategic Horizon (Milestone 3 — PLANNED)

Multi-tenancy, full 適格請求書 compliance, Denchōhō electronic books, year-end closing,
Zeirishi collaboration workspace, AR/AP subledgers.

## Key Locked Decisions (see intel/decisions.md)
- pnpm monorepo with apps/web, packages/db, packages/shared
- Next.js App Router + Server Actions (no separate API layer)
- Drizzle + postgres.js on PostgreSQL (tightly coupled)
- CUID2 primary keys
- JPY integer amounts (no multi-currency)
- Vendor/Suppliers UI/DB split to avoid migration churn
- Local uploads/ → S3 is the documented migration path

## Conflicts
See INGEST-CONFLICTS.md — 0 blockers, 0 warnings, 1 INFO (outdated RE docs pre-monorepo)
