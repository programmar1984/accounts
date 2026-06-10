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
- Drizzle ORM + PostgreSQL (local dev; same engine as the target multi-tenant SaaS)
- Local `uploads/` directory for files (S3-compatible storage later)

## Getting started

**Prerequisites:** PostgreSQL running locally (default `localhost:5432`).

```bash
npm install
cp .env.example .env          # adjust DATABASE_URL and AUTH_SECRET; optionally SEED_ADMIN_* vars

# Create the database once (psql or any client):
#   CREATE DATABASE shime;

npm run db:migrate            # apply migrations
npm run db:seed               # seeds the admin user
npm run dev                   # http://localhost:3000
```

Default seeded admin (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` in `.env` before seeding):

| Email | Password |
|---|---|
| `admin@shime.local` | `admin1234` |

Change the password/secret before deploying anywhere public.

## Database (Drizzle ORM)

Schema lives in `lib/db/schema.ts`. Migrations are generated and applied with [Drizzle Kit](https://orm.drizzle.team/):

| Command | Purpose |
|---|---|
| `npm run db:migrate` | Apply migrations to PostgreSQL |
| `npm run db:seed` | Seed the admin user |
| `npm run db:generate` | Generate a migration after schema changes |
| `npm run db:push` | Push schema directly (local dev only) |
| `npm run db:studio` | Open Drizzle Studio |

`DATABASE_URL` in `.env` defaults to `postgresql://postgres:ammars@localhost:5432/shime`.

## Project structure

```
app/                  Next.js routes
  login/              sign-in page
  (app)/              authenticated area: dashboard, transactions, users
  api/files/[id]/     auth-gated attachment serving
components/           shared UI components
lib/                  auth/session, i18n dictionaries, server actions, file storage
  db/                 Drizzle schema (`schema.ts`)
  db.ts               Drizzle client (postgres.js)
drizzle/              SQL migrations & seed script
drizzle.config.ts     Drizzle Kit config
docs/                 research & requirements (full platform vision)
uploads/              uploaded receipt/invoice files (gitignored)
```

## Notes

- Amounts are stored as **integer yen** (JPY has no fractional unit). No floating point in money paths.
- Transaction dates are stored as UTC midnight of the calendar date entered.
- Deactivated users are locked out on their next request even with a live session cookie.
