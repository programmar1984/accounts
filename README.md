# SHIME (締) — Simple Bookkeeping for Small Businesses in Japan

## MVP-0 (ledger + receipt uploads)

Record a full year of **sales (売上) / purchases (仕入) / expenses (経費)** and attach **uploaded receipt/evidence files** (images/PDF) to each transaction. Bilingual UI (English / 日本語). Seeded admin user who can create more users.

**Note:** Uploading a receipt or scanned invoice is **not** the same as **issuing** a sales invoice from SHIME.

## MVP-1 (counterparties, invoices, POs, payments)

- **Customers** — master data for buyers; link to sales and invoices
- **Vendors** — master data for vendors; link to purchases and POs
- **Invoices** — create numbered draft invoices with line items; issue as PDF; optional linked SALE transaction
- **Purchase orders** — full workflow: draft → sent → partially received → closed; receipt uploads; creates PURCHASE on receive
- **Payment tracking** — due date, amount paid, unpaid / partial / paid on transactions

The long-term product vision (compliance engine, year-end closing, tax output) is in [`docs/REQUIREMENTS_RESEARCH.md`](docs/REQUIREMENTS_RESEARCH.md).

## Features

- **Authentication** — email + password sessions (signed HTTP-only cookie). Admin can create/deactivate users.
- **Transactions** — SALE (money in), PURCHASE / EXPENSE (money out); payment status; customer/vendor links
- **Attachments** — upload proof documents to transactions or POs (up to 15 MB)
- **Dashboard** — per-year totals: sales, purchases, expenses, net
- **Language toggle** — English / Japanese

## Stack

- **Monorepo**: pnpm workspaces
- **App**: Next.js 16 (App Router, server actions) + TypeScript + Tailwind CSS 4
- **Database**: Drizzle ORM + PostgreSQL (`@shime/db`)
- **Shared utilities**: `@shime/shared` (formatting, payment status, PO status)
- pdfkit for invoice PDF generation
- Local `apps/web/uploads/` for files (S3 later)

## Monorepo structure

```text
apps/web/              @shime/web — Next.js application
packages/db/           @shime/db — schema, client, migrations, seed
packages/shared/       @shime/shared — pure utilities
docs/                  Product vision research and UAT checklists
openspec/              Spec-driven workflow (specs, changes, config)
.planning/             Transitional requirements and roadmap (migrating to openspec/specs/)
```

## Getting started

**Prerequisites:** Node.js 20+, pnpm 9+, PostgreSQL on `localhost:5432`.

```bash
pnpm install
cp .env.example .env

# CREATE DATABASE shime;

pnpm db:migrate
pnpm db:seed
pnpm dev                   # http://localhost:3000
```

Default admin: `admin@shime.local` / `admin1234` (override via `SEED_ADMIN_*` in `.env`).

`.env` lives at the **repository root** and is loaded by both the web app and database package.

## Commands (from repository root)

| Command | Purpose |
|---|---|
| `pnpm dev` | Start Next.js dev server (`@shime/web`) |
| `pnpm build` | Build all workspace packages |
| `pnpm start` | Start production server |
| `pnpm lint` | Lint all packages |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed admin user |
| `pnpm db:generate` | Generate migration after schema changes |
| `pnpm db:push` | Push schema directly (dev only) |
| `pnpm db:studio` | Open Drizzle Studio |

## Application routes (`apps/web/app/`)

```
(app)/
  customers/          Customer CRUD
  suppliers/          Vendor CRUD (route unchanged; UI label: Vendors)
  invoices/           Invoice drafts + PDF issue
  purchase-orders/    PO workflow
  transactions/       Ledger entries
  users/              Admin user management
```

## Notes

- Amounts are integer JPY (no fractional unit).
- Invoice PDFs are simple documents — not Japanese 適格請求書 compliant yet.
- Deactivated users are locked out on next request.
