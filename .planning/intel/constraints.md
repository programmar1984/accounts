# Constraints — SHIME

## Hard Constraints (cannot change without significant rework)

CONSTRAINT-01: PostgreSQL only
Drizzle schema is PostgreSQL-dialect; no adapter for other databases exists.

CONSTRAINT-02: JPY integer amounts
All money columns are integer JPY. Adding multi-currency would require schema changes
and rework of all formatter and tax math.

CONSTRAINT-03: Single database / single tenant (MVP)
No org/tenant boundary in the schema. Adding multi-tenancy requires a full tenancy layer
and data migration.

CONSTRAINT-04: Local filesystem for uploads (until S3 is wired)
apps/web/uploads/ is the only storage. Production SaaS requires S3-compatible storage.
The storage coupling is in lib/files.ts (direct Node fs usage).

CONSTRAINT-05: UTC midnight date storage
All calendar dates stored as UTC midnight. Year filters use UTC boundaries. Changing this
would require a migration and client-side timezone handling.

## Soft Constraints (policy / preference, overridable)

CONSTRAINT-06: No test suite configured (current gap)
Zero unit, integration, or E2E tests. Production hardening is blocked by this.

CONSTRAINT-07: Hardcoded dev secrets
DATABASE_URL and AUTH_SECRET are development defaults; production requires env-based config.

CONSTRAINT-08: No CI/CD pipeline
No GitHub Actions or equivalent. Required for production SaaS path.

CONSTRAINT-09: Security baseline applies to all future Construction phases
Decided in requirement-verification-questions.md: security rules are blocking for applicable work.

CONSTRAINT-10: Property-based testing applies to pure functions only
Decided in requirement-verification-questions.md: PBT partial — pure functions and serialization
round-trips only (formatYen, formatDate, tax math in packages/shared/src/tax.ts).

## Non-Functional Requirements Met in MVP

NFR-SEC-01  Passwords hashed with bcrypt cost 10                  MET
NFR-SEC-02  httpOnly session cookies; secure in production         MET
NFR-SEC-03  Auth-gated file access                                 MET
NFR-SEC-04  MIME whitelist and file size limits                    MET
NFR-SEC-05  No secrets in source for production deploy             NOT MET → FR-NEXT-02
NFR-SEC-06  Rate limiting on auth                                  NOT MET → Milestone 2
NFR-PERF-01 DB indexes on date/type for dashboard queries          MET
NFR-PERF-02 Pagination for large sets                              NOT MET → FR-NEXT-06
NFR-REL-01  Attachment DB + filesystem consistency on delete       PARTIAL
NFR-REL-02  Automated regression tests                             NOT MET → FR-NEXT-03
NFR-OPS-01  Drizzle migrations for schema changes                  MET
NFR-OPS-02  Seed script for admin bootstrap                        MET
NFR-OPS-03  CI/CD deployment pipeline                              NOT MET → FR-NEXT-04
NFR-I18N-01 EN/JA UI parity                                        MET
NFR-LEGAL-01 Self-preparation tool positioning (not Zeirishi)      DOCUMENTED
