# Code Quality Assessment

## Test Coverage

- **Overall**: None
- **Unit Tests**: Not configured — no `*.test.*` or `*.spec.*` files; no Jest/Vitest/Playwright in `package.json`
- **Integration Tests**: Not configured
- **E2E Tests**: Not configured

## Code Quality Indicators

- **Linting**: Configured — `npm run lint` with `eslint-config-next`
- **Code Style**: Consistent — uniform Tailwind patterns, shared input classes, typed Drizzle schema
- **Documentation**: Fair — `README.md` covers MVP setup; inline comments minimal but code is readable; full vision in `docs/REQUIREMENTS_RESEARCH.md`
- **TypeScript**: Strict mode enabled; path aliases configured

## CI/CD

- **GitHub Actions / other CI**: Not present
- **Pre-commit hooks**: Not configured
- **Automated build on push**: Not configured

## Technical Debt

| Issue | Location | Severity |
|-------|----------|----------|
| No `middleware.ts` for auth | `app/` | Medium — auth checks duplicated per layout/page |
| Dev fallback `AUTH_SECRET` | `lib/auth.ts` | High for production — hardcoded default secret |
| Dev fallback `DATABASE_URL` | `lib/db.ts` | Medium — credentials in source |
| Local file storage | `lib/files.ts` | Medium — not multi-instance or cloud ready |
| JWT stale role claims | `lib/auth.ts` | Low — role change in DB not reflected until re-login |
| No pagination on transaction list | `transactions/page.tsx` | Low at MVP scale — will matter with large datasets |
| SQL LIKE wildcard injection | `transactions/page.tsx` | Low — `%` and `_` in search not escaped |
| No password reset/change flow | — | Medium — admin sets initial password only |
| No audit trail | schema | Medium — only `createdById`; no edit history |
| No rate limiting on login | `lib/actions.ts` | Medium — brute force not mitigated |
| Orphan file risk | `deleteUpload` | Low — delete is best-effort; DB cascade handles metadata |

## Patterns and Anti-patterns

### Good Patterns
- Server Components first — minimal client bundle
- Centralized mutations in `actions.ts`
- Integer JPY amounts throughout money path
- `getActiveSession` re-validates user against DB
- Cascade delete attachments when transaction deleted
- Shared `TransactionFields` component for create/edit DRY
- Bilingual i18n with typed keys (`TKey`)
- Environment example file (`.env.example`)

### Anti-patterns / Gaps
- Redirect-only error handling — no structured error types
- Pages mix data access and presentation (acceptable at MVP scale)
- File upload and DB insert not in single transaction — partial failure possible
- No input sanitization beyond trim/lowercase on email
- Default seeded admin credentials documented in README (dev only risk)

## Security Posture (MVP)

| Control | Status |
|---------|--------|
| httpOnly session cookie | Implemented |
| bcrypt password hashing | Implemented |
| Auth-gated file access | Implemented |
| MIME type whitelist | Implemented |
| File size limit | Implemented (15 MB) |
| CSRF protection for Server Actions | Next.js built-in (framework default) |
| HTTPS-only cookies in production | `secure` flag when `NODE_ENV=production` |
| Secrets management | Dev fallbacks present — needs hardening for deploy |
| Multi-tenancy isolation | Not applicable yet (single-tenant MVP) |

## Maintainability

- **Strengths**: Small codebase (~27 TS files), clear folder layout, single mutation module
- **Risks**: `actions.ts` will grow as features add; no test safety net for refactors
- **Recommended next steps**: Add middleware auth, extract storage interface, introduce test runner, remove dev secret fallbacks
