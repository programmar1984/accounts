# Locked Decisions — SHIME

Extracted from ingested docs. These are implementation-settled choices that carry cost to reverse.

## Architecture

DECISION-001: pnpm monorepo
Chosen over a single-package repo. Structure: apps/web (@shime/web), packages/db (@shime/db),
packages/shared (@shime/shared). Root commands: pnpm dev, pnpm build, pnpm db:*.
Source: aidlc-state.md, audit.md (2026-06-10 course correction)

DECISION-002: Next.js App Router (Server Actions first)
All mutations via "use server" functions; pages are RSC; no client-side state management.
Single exception: LangToggle + ConfirmSubmit are client components.
Source: architecture.md, code-structure.md

DECISION-003: Drizzle ORM + postgres.js on PostgreSQL
No abstraction over the DB driver; tightly coupled to PostgreSQL. Schema in packages/db/src/schema.ts.
Migrations via drizzle-kit.
Source: technology-stack.md, dependencies.md

DECISION-004: CUID2 primary keys
All entity IDs are @paralleldrive/cuid2 strings, not auto-increment integers.
Source: code-structure.md, api-documentation.md

DECISION-005: JPY only, integer amounts
No decimal money columns; all amounts stored as integer JPY (no fractional unit).
Multi-currency is explicitly out of scope.
Source: requirements.md (Assumptions and Constraints)

DECISION-006: UTC midnight for calendar dates
Transaction and document dates stored as UTC midnight of the entered calendar date.
Year filtering uses UTC boundaries.
Source: requirements.md

DECISION-007: JWT httpOnly cookie sessions (7-day TTL)
Auth via jose; bcryptjs cost 10 for password hashing. getActiveSession does DB lookup
on every request to catch deactivated users.
Source: api-documentation.md, requirements.md FR-AUTH

DECISION-008: Local filesystem uploads/ (S3 planned)
MVP stores attachments on disk at apps/web/uploads/. S3-compatible object storage
is the documented next step for production SaaS.
Source: architecture.md, aidlc-state.md

DECISION-009: Vendor/Supplier terminology split
UI and README use "Vendor / Vendors" (EN) / "ベンダー" (JA).
Internal DB table remains `Supplier`; routes remain /suppliers; i18n keys remain supp.*.
Source: audit.md (2026-06-13 decision)

DECISION-010: AdminLTE-inspired shell with Tailwind v4 semantic tokens
Fixed sidebar, sticky topbar, responsive collapse at 992px. Light/dark mode via shime_theme cookie.
Tailwind v4 utility classes with CSS custom property tokens.
Source: requirements.md FR-UI, application-design.md
