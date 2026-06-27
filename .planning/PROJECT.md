# PROJECT — SHIME (締)

## Description

Bilingual bookkeeping application for small businesses in Japan. Records sales (売上),
purchases (仕入), expenses (経費), and logistics service costs (役務) with receipt
attachments, issued PDF invoices, consumption tax (JCT) calculation, and a unified
ledger view. Targets single-tenant MVP → multi-tenant SaaS on managed cloud.

## Type

Brownfield — active codebase, MVP functionally complete through Service Orders (SVO).

## Tech Stack

Language:    TypeScript ^5
Framework:   Next.js 16.2.9 (App Router, RSC, Server Actions)
UI:          React 19, Tailwind CSS v4, AdminLTE-inspired shell
ORM:         Drizzle ORM 0.45.1 + postgres.js 3.4.7
Database:    PostgreSQL (local dev; RDS/managed cloud for production)
Auth:        jose (JWT httpOnly cookie), bcryptjs cost 10
IDs:         @paralleldrive/cuid2
PDF:         pdfkit
i18n:        Custom EN/JA dictionary in lib/i18n.ts
Workspace:   pnpm monorepo

## Workspace Layout

apps/web/         @shime/web      Next.js app (pages, actions, components, lib)
packages/db/      @shime/db       Schema, Drizzle client, migrations, seed
packages/shared/  @shime/shared   Pure utils (tax math, format, payment, PO status, IDs)

Root commands: pnpm dev | pnpm build | pnpm db:migrate | pnpm db:seed | pnpm db:studio

## Locked Decisions

<decision id="D-001" status="LOCKED">
pnpm monorepo (apps/web + packages/db + packages/shared). No Turborepo.
</decision>

<decision id="D-002" status="LOCKED">
Next.js App Router with Server Actions. No separate REST API except file download.
All mutations are "use server" functions; pages are RSC.
</decision>

<decision id="D-003" status="LOCKED">
Drizzle ORM on PostgreSQL. No database abstraction layer.
Schema lives in packages/db/src/schema.ts; migrations via drizzle-kit.
</decision>

<decision id="D-004" status="LOCKED">
CUID2 primary keys for all entities (no integer auto-increment).
</decision>

<decision id="D-005" status="LOCKED">
JPY only. Integer amounts (no decimal columns). No multi-currency.
</decision>

<decision id="D-006" status="LOCKED">
UTC midnight for all calendar dates. Year filters use UTC boundaries.
</decision>

<decision id="D-007" status="LOCKED">
Vendor/Suppliers UI–DB split: UI shows "Vendor/Vendors / ベンダー",
internal routes stay /suppliers, DB table stays Supplier, i18n keys stay supp.*.
Avoids migration churn.
</decision>

<decision id="D-008" status="LOCKED">
AdminLTE-inspired Tailwind shell with semantic CSS custom property tokens.
Light/dark mode persisted in shime_theme cookie.
</decision>

## Goals

1. Full bookkeeping coverage for Japanese SMBs: SO, PO, SVO, Expense, Ledger, Dashboard
2. Bilingual EN/JA UI with JCT (消費税) calculation and draft compliance figures
3. Issued PDF sales invoices with tax breakdown
4. Attachment evidence on all document types
5. Path to multi-tenant SaaS with cloud storage and compliance engine

## Non-Goals

- Multi-currency (JPY only in MVP and Milestone 2)
- Full 適格請求書 compliance, NTA API, journal 仮払/仮受消費税 (Milestone 3)
- Multi-tenancy (single shared database through Milestone 2)
- Chart of accounts / double-entry bookkeeping (Milestone 3)
- Zeirishi collaboration workspace (Milestone 3)

## Constraints

- PostgreSQL only (Drizzle schema is PG-dialect)
- Local uploads/ until S3 is wired (FR-NEXT-05)
- Zero tests currently — production hardening required before SaaS
- Security baseline is blocking for all future Construction phases
- Property-based testing applies to pure functions only (packages/shared/src/tax.ts, formatters)
