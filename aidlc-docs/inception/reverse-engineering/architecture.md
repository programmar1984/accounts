# System Architecture

## System Overview

SHIME is a **pnpm monorepo** with a server-first Next.js 16 application (`apps/web`, package `@shime/web`) using the App Router. Server Components render pages and query PostgreSQL via `@shime/db` (Drizzle ORM). Pure utilities live in `@shime/shared`. Mutations flow through **Server Actions** in `apps/web/lib/actions*.ts`. REST endpoints serve invoice PDFs and attachment binaries with authentication. File uploads land in `apps/web/uploads/` (S3-compatible storage planned for production SaaS).

There is no separate API layer, background job processor, or microservice decomposition in the MVP.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph browser [Browser]
        Pages[RSC Pages and HTML Forms]
    end

    subgraph nextjs [Next.js Application]
        RootLayout[app/layout.tsx]
        AppLayout["app/(app)/layout.tsx"]
        ServerActions[lib/actions.ts]
        FileRoute["api/files/id route"]
        AuthMod[lib/auth.ts]
        I18n[lib/i18n.ts]
        FilesMod[lib/files.ts]
    end

    subgraph persistence [Persistence]
        PG[(PostgreSQL)]
        Disk["uploads/ directory"]
    end

    Pages --> RootLayout
    Pages --> AppLayout
    AppLayout --> AuthMod
    AppLayout --> I18n
    Pages --> ServerActions
    Pages --> FileRoute
    ServerActions --> AuthMod
    ServerActions --> FilesMod
    ServerActions --> PG
    FileRoute --> AuthMod
    FileRoute --> PG
    FileRoute --> Disk
    FilesMod --> Disk
    AppLayout --> PG
    Pages --> PG
```

**Text alternative:** Browser talks to Next.js pages. Protected layout checks auth. Pages read/write PostgreSQL via Drizzle. Mutations go through server actions. Files are written to disk; downloads go through the file API route.

## Component Descriptions

### `app/` — Presentation Layer
- **Purpose**: Route definitions, layouts, and page-level data fetching
- **Responsibilities**: Render UI; call `requireUser`/`requireAdmin`; query Drizzle for read models; bind forms to server actions
- **Dependencies**: `lib/auth`, `lib/db`, `lib/i18n`, `lib/actions`, `components/`
- **Type**: Application

### `lib/actions.ts` — Mutation Layer
- **Purpose**: Centralized server-side command handlers
- **Responsibilities**: Validate form input; enforce auth; persist changes; revalidate cache; redirect with status query params
- **Dependencies**: `lib/auth`, `lib/db`, `lib/files`, `lib/id`
- **Type**: Application

### `lib/auth.ts` — Session Management
- **Purpose**: JWT cookie sessions with live account status check
- **Responsibilities**: `createSession`, `destroySession`, `getActiveSession`, `requireUser`, `requireAdmin`
- **Dependencies**: `jose`, `next/headers`, `lib/db`
- **Type**: Application

### `lib/db/` — Data Access
- **Purpose**: Schema definition and database client
- **Responsibilities**: Drizzle schema, relations, singleton postgres.js connection
- **Dependencies**: `drizzle-orm`, `postgres`
- **Type**: Application / Model

### `lib/files.ts` — Local File Storage
- **Purpose**: Upload persistence on filesystem
- **Responsibilities**: MIME validation, size limits, UUID filenames, delete
- **Dependencies**: Node.js `fs/promises`
- **Type**: Application

### `app/api/files/[id]/route.ts` — File Serving
- **Purpose**: Auth-gated binary delivery
- **Responsibilities**: Session check; lookup attachment metadata; stream file inline or as download
- **Dependencies**: `lib/auth`, `lib/db`, `lib/files`
- **Type**: Application

## Data Flow — Key Business Transactions

### Login

```mermaid
sequenceDiagram
    participant U as User
    participant LP as login/page.tsx
    participant A as login action
    participant DB as PostgreSQL
    participant Auth as lib/auth

    U->>LP: Submit email and password
    LP->>A: FormData POST
    A->>DB: find user by email
    A->>A: bcrypt.compare password
    A->>Auth: createSession JWT cookie
    A->>LP: redirect /
    LP->>U: Dashboard
```

### Session Guard (Protected Routes)

```mermaid
sequenceDiagram
    participant U as User
    participant L as app layout
    participant Auth as getActiveSession
    participant DB as PostgreSQL

    U->>L: Request protected page
    L->>Auth: requireUser
    Auth->>Auth: Verify JWT cookie
    Auth->>DB: Check user active
    alt inactive or missing
        Auth->>U: redirect /login
    else valid
        L->>U: Render page
    end
```

### Create Transaction with Attachments

```mermaid
sequenceDiagram
    participant U as User
    participant P as transactions/new
    participant A as createTransaction
    participant DB as PostgreSQL
    participant F as lib/files

    U->>P: Submit form with files
    P->>A: FormData
    A->>A: requireUser parse validate
    A->>DB: insert Transaction
    loop each file
        A->>F: saveUpload
        F->>F: write uploads/uuid
        A->>DB: insert Attachment
    end
    A->>P: redirect /transactions/id
```

### List and Filter Transactions

```mermaid
sequenceDiagram
    participant U as User
    participant P as transactions/page
    participant DB as PostgreSQL

    U->>P: GET with year type q params
    P->>P: requireUser build where clause
    P->>DB: findMany with attachments count
    P->>DB: sum amounts for footer
    P->>U: Render table
```

### Serve Attachment

```mermaid
sequenceDiagram
    participant U as User
    participant API as api/files/id
    participant Auth as getActiveSession
    participant DB as PostgreSQL
    participant Disk as uploads/

    U->>API: GET /api/files/id
    API->>Auth: session check
    API->>DB: find attachment
    API->>Disk: readFile storedName
    API->>U: Response with Content-Type
```

### Admin User Management

```mermaid
sequenceDiagram
    participant A as Admin
    participant P as users/page
    participant Act as createUser setUserActive
    participant DB as PostgreSQL

    A->>P: Create or toggle user
    P->>Act: FormData
    Act->>Act: requireAdmin
    Act->>DB: insert or update User
    Act->>P: redirect /users
```

### Dashboard Aggregation

```mermaid
sequenceDiagram
    participant U as User
    participant D as dashboard page
    participant DB as PostgreSQL

    U->>D: GET ?year=
    D->>DB: groupBy type sum amounts
    D->>DB: count transactions
    D->>DB: findMany recent 6
    D->>U: Render cards and list
```

## Integration Points

- **External APIs**: None in MVP
- **Databases**: PostgreSQL via `DATABASE_URL` (default local `shime` database)
- **Third-party Services**: None (fonts loaded from Google Fonts at build/runtime via `next/font`)

## Infrastructure Components

- **CDK Stacks**: None
- **Deployment Model**: Local development (`pnpm dev` from monorepo root); production deployment not yet configured. Intended target: multi-tenant SaaS on PostgreSQL with S3-compatible object storage (per README and research doc)
- **Networking**: Single-process Next.js server; no load balancer, VPC, or container orchestration in codebase

## MVP vs. Vision Gap

| Area | MVP (implemented) | Vision (`docs/REQUIREMENTS_RESEARCH.md`) |
|------|-------------------|------------------------------------------|
| Bookkeeping | Simple sale/purchase/expense log | Full chart of accounts, journals, statutory ledgers |
| Compliance | None | Denchōhō, invoice system, retention rules |
| Tax | None | Year-end closing, draft tax schedules, e-Tax export |
| Tenancy | Single shared database | Multi-tenant SaaS |
| Storage | Local `uploads/` | S3-compatible cloud storage |
| Zeirishi workflow | None | Collaboration workspace for tax advisor review |
