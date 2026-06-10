# Technology Stack

## Programming Languages

| Language | Version | Usage |
|----------|---------|-------|
| TypeScript | ^5 | All application source |
| SQL | PostgreSQL dialect | Drizzle migrations |
| CSS | Tailwind v4 | Styling via utility classes |

## Frameworks

| Framework | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.2.9 | App Router, RSC, Server Actions, API routes |
| React | 19.2.4 | UI rendering |
| React DOM | 19.2.4 | DOM bindings |
| Drizzle ORM | 0.45.1 | Schema, queries, migrations |
| Tailwind CSS | ^4 | Utility-first styling |

## Infrastructure

| Service | Purpose |
|---------|---------|
| PostgreSQL | Primary relational database (local dev; target SaaS engine) |
| Local filesystem (`uploads/`) | Attachment binary storage (MVP) |
| Node.js runtime | Server-side execution for Next.js |

**Not yet in codebase:** S3/object storage, Redis, message queues, CDN, container orchestration, cloud IaC.

## Build Tools

| Tool | Version | Purpose |
|------|---------|---------|
| npm | (project default) | Package management and scripts |
| drizzle-kit | 0.31.9 | Migration generate/migrate/studio |
| tsx | 4.22.4 | Run TypeScript seed script |
| ESLint | ^9 | Linting via `eslint-config-next` |
| PostCSS | via `@tailwindcss/postcss` ^4 | CSS processing |

## Runtime Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| postgres (postgres.js) | 3.4.7 | PostgreSQL driver |
| jose | 6.2.3 | JWT sign/verify |
| bcryptjs | 3.0.3 | Password hashing |
| @paralleldrive/cuid2 | 3.0.4 | ID generation |
| dotenv | 17.4.2 | Environment loading (seed script) |

## Testing Tools

| Tool | Status |
|------|--------|
| Unit test framework | Not configured |
| Integration test framework | Not configured |
| E2E test framework | Not configured |
| Coverage tooling | Not configured |

## Development Prerequisites

- Node.js (compatible with Next.js 16)
- PostgreSQL on `localhost:5432` (default database `shime`)
- Environment: `DATABASE_URL`, `AUTH_SECRET`, optional `SEED_ADMIN_*`

## Fonts

- Geist Sans and Geist Mono via `next/font/google`
