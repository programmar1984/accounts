# Component Inventory

## Application Packages

| Package | Type | Purpose |
|---------|------|---------|
| `shime` (root) | Application | Next.js bookkeeping MVP — sole deployable unit |

## Infrastructure Packages

None. No CDK, Terraform, Docker, or CI configuration in repository.

## Shared Packages

None. All code lives in the monolith root.

## Test Packages

None. No test files or test runner configured.

## Route Inventory

| Route | Component | Auth | Role |
|-------|-----------|------|------|
| `/login` | `app/login/page.tsx` | Public | — |
| `/` | `app/(app)/page.tsx` | Required | Any |
| `/transactions` | `app/(app)/transactions/page.tsx` | Required | Any |
| `/transactions/new` | `app/(app)/transactions/new/page.tsx` | Required | Any |
| `/transactions/[id]` | `app/(app)/transactions/[id]/page.tsx` | Required | Any |
| `/users` | `app/(app)/users/page.tsx` | Required | ADMIN |
| `GET /api/files/[id]` | `app/api/files/[id]/route.ts` | Required | Any |

## UI Component Inventory

| Component | Server/Client | Used by |
|-----------|---------------|---------|
| `TransactionFields` | Server (async) | new transaction, edit transaction |
| `TypeBadge` | Server | dashboard, transaction list, detail |
| `LangToggle` | Client | app layout, login |
| `ConfirmSubmit` | Client | delete transaction, delete attachment |

## Library Module Inventory

| Module | Exports | Consumers |
|--------|---------|-----------|
| `@shime/db` (`packages/db`) | `db`, schema re-exports, number sequences | pages, actions, auth, API, seed |
| `@shime/shared` (`packages/shared`) | format, payment, PO status, `createId` | pages, actions, i18n |
| `lib/auth.ts` | session helpers | layout, pages, actions, API |
| `lib/actions.ts` | 9 server actions | forms across app |
| `lib/files.ts` | upload helpers, constants | actions, API |
| `lib/i18n.ts` | `getLang`, `getT`, types | layout, all pages |
| `lib/format.ts` | formatters | dashboard, transactions, users |
| `lib/id.ts` | `createId` | actions, seed |

## Database Objects

| Object | Type |
|--------|------|
| `User` | Table |
| `Transaction` | Table |
| `Attachment` | Table |
| `User_email_key` | Unique index |
| `Attachment_storedName_key` | Unique index |
| `Transaction_date_idx` | Index |
| `Transaction_type_date_idx` | Composite index |

## Total Count

- **Total Packages**: 1
- **Application**: 1
- **Infrastructure**: 0
- **Shared**: 0
- **Test**: 0
- **Source files (TS/TSX)**: 27
- **SQL migrations**: 1
- **UI components**: 4
- **Server actions**: 9
- **API routes**: 1
