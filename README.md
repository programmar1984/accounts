# SHIME (締) — Simple Bookkeeping for Small Businesses in Japan

First MVP: record a full year of **sales (売上) / purchases (仕入) / expenses (経費)** and attach **receipts & invoices** to each transaction. Bilingual UI (English / 日本語). Seeded admin user who can create more users.

The long-term product vision (compliance engine, year-end closing, tax output) is documented in [`docs/REQUIREMENTS_RESEARCH.md`](docs/REQUIREMENTS_RESEARCH.md) — this MVP intentionally defers all of that.

## Features (MVP-0)

- **Authentication** — email + password sessions (signed HTTP-only cookie). A seeded **admin** can create/deactivate users (admin or member role).
- **Transactions** — type (sale / purchase / expense), date, counterparty, description, amount (integer JPY), memo. Filter by year and type, free-text search, yearly totals.
- **Attachments** — upload images/PDFs (up to 15 MB each) against any transaction; view inline or download; auth-gated file serving.
- **Dashboard** — per-year totals: sales, purchases, expenses, and net.
- **Language toggle** — English / Japanese across the entire UI.

## Stack

- Next.js (App Router, server actions) + TypeScript + Tailwind CSS
- Prisma ORM + SQLite (file DB — zero-setup for the MVP; the schema is portable to PostgreSQL, the target for multi-tenant SaaS)
- Local `uploads/` directory for files (S3-compatible storage later)

## Getting started

```bash
npm install
cp .env.example .env          # adjust AUTH_SECRET; optionally SEED_ADMIN_* vars
npx prisma migrate dev        # creates prisma/dev.db and applies migrations
npx prisma db seed            # seeds the admin user
npm run dev                   # http://localhost:3000
```

Default seeded admin (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` in `.env` before seeding):

| Email | Password |
|---|---|
| `admin@shime.local` | `admin1234` |

Change the password/secret before deploying anywhere public.

## Project structure

```
app/                  Next.js routes
  login/              sign-in page
  (app)/              authenticated area: dashboard, transactions, users
  api/files/[id]/     auth-gated attachment serving
components/           shared UI components
lib/                  db client, auth/session, i18n dictionaries, server actions, file storage
prisma/               schema, migrations, seed script
docs/                 research & requirements (full platform vision)
uploads/              uploaded receipt/invoice files (gitignored)
```

## Notes

- Amounts are stored as **integer yen** (JPY has no fractional unit). No floating point in money paths.
- Transaction dates are stored as UTC midnight of the calendar date entered.
- Deactivated users are locked out on their next request even with a live session cookie.
