# API Documentation

## REST APIs

### Serve Attachment
- **Method**: GET
- **Path**: `/api/files/[id]`
- **Purpose**: Stream an attachment file inline or as download for authenticated users
- **Authentication**: Requires valid `shime_session` cookie; uses `getActiveSession()`
- **Query Parameters**:
  | Param | Values | Effect |
  |-------|--------|--------|
  | `download` | `1` | `Content-Disposition: attachment`; omit for inline view |
- **Request**: No body
- **Response**:
  - `200`: Binary body with `Content-Type` from `mimeType`, `Content-Length`, `Content-Disposition` with UTF-8 filename, `Cache-Control: private, no-store`
  - `401`: Unauthorized (no/invalid session or inactive user)
  - `404`: Attachment not found or file missing on disk

## Internal APIs — Server Actions

All server actions are in `lib/actions.ts` with `"use server"`. They accept `FormData` from HTML forms and use redirect for outcomes.

### Authentication

#### `login(formData: FormData)`
- **Purpose**: Authenticate user and create session
- **Parameters**: `email` (string), `password` (string)
- **Behavior**: Lowercase email trim; bcrypt verify; check `active`; `createSession`; redirect `/` or `/login?error=1`

#### `logout()`
- **Purpose**: End session
- **Parameters**: None
- **Behavior**: `destroySession`; redirect `/login`

### Transactions

#### `createTransaction(formData: FormData)`
- **Purpose**: Create transaction with optional attachments
- **Parameters**: `type`, `date`, `counterparty`, `description`, `memo`, `files` (multiple File)
- **Validation**: `type` in SALE/PURCHASE/EXPENSE; positive integer amount; non-empty counterparty; valid date
- **Redirects**: `/transactions/new?error=required` | `/transactions/{id}?saved=1` | `/transactions/{id}?error=type|size`

#### `updateTransaction(formData: FormData)`
- **Purpose**: Update existing transaction fields (not attachments)
- **Parameters**: `id`, `type`, `date`, `counterparty`, `description`, `memo`
- **Redirects**: `/transactions/{id}?error=required` | `/transactions/{id}?saved=1`

#### `deleteTransaction(formData: FormData)`
- **Purpose**: Delete transaction, attachment rows, and disk files
- **Parameters**: `id`
- **Redirects**: `/transactions`

### Attachments

#### `addAttachments(formData: FormData)`
- **Purpose**: Add files to existing transaction
- **Parameters**: `transactionId`, `files` (multiple File)
- **Redirects**: `/transactions` (if tx missing) | `/transactions/{id}` with optional `?error=type|size`

#### `deleteAttachment(formData: FormData)`
- **Purpose**: Remove one attachment record and disk file
- **Parameters**: `id` (attachment id)
- **Redirects**: `/transactions/{transactionId}`

### Users (Admin)

#### `createUser(formData: FormData)`
- **Purpose**: Create new user account
- **Parameters**: `name`, `email`, `password`, `role` (ADMIN or MEMBER)
- **Validation**: Email format; password min 8 chars; unique email
- **Redirects**: `/users?error=required|exists` | `/users?created=1`

#### `setUserActive(formData: FormData)`
- **Purpose**: Activate or deactivate user
- **Parameters**: `id`, `active` (`"true"` or `"false"`)
- **Constraints**: Cannot deactivate self
- **Redirects**: `/users`

## Internal APIs — Auth Helpers

### `lib/auth.ts`

| Function | Signature | Return | Purpose |
|----------|-----------|--------|---------|
| `createSession` | `(session: Session) => Promise<void>` | void | Set JWT cookie |
| `destroySession` | `() => Promise<void>` | void | Clear cookie |
| `getSession` | `() => Promise<Session \| null>` | JWT payload or null | Cookie verify only |
| `getActiveSession` | `() => Promise<Session \| null>` | Session or null | JWT + DB active check |
| `requireUser` | `() => Promise<Session>` | Session | Redirect `/login` if missing |
| `requireAdmin` | `() => Promise<Session>` | Session | Redirect `/` if not ADMIN |

**Session type**: `{ userId, role, name, email }`

## Data Models

### User (`User` table)
- **Fields**:
  | Field | Type | Notes |
  |-------|------|-------|
  | id | text PK | CUID2 |
  | email | text | Unique, lowercase on create |
  | name | text | Display name |
  | passwordHash | text | bcrypt hash |
  | role | text | `ADMIN` or `MEMBER`, default MEMBER |
  | active | boolean | Default true |
  | createdAt | timestamp | Auto |
- **Relationships**: One-to-many transactions (as creator), attachments (as uploader)
- **Validation**: Email unique; password min 8 on create; admin cannot deactivate self

### Transaction (`Transaction` table)
- **Fields**:
  | Field | Type | Notes |
  |-------|------|-------|
  | id | text PK | CUID2 |
  | type | text | SALE, PURCHASE, or EXPENSE |
  | date | timestamp | UTC midnight of calendar date |
  | counterparty | text | Required |
  | description | text | Default empty string |
  | amount | integer | Positive JPY, no decimals |
  | memo | text | Optional |
  | createdById | text FK | References User |
  | createdAt | timestamp | Auto |
  | updatedAt | timestamp | Updated on edit |
- **Relationships**: Many attachments; one creator user
- **Validation**: Type enum; amount > 0; counterparty non-empty
- **Indexes**: `date`; composite `type, date`

### Attachment (`Attachment` table)
- **Fields**:
  | Field | Type | Notes |
  |-------|------|-------|
  | id | text PK | CUID2 |
  | transactionId | text FK | Cascade delete with transaction |
  | originalName | text | User-facing filename |
  | storedName | text | UUID filename on disk, unique |
  | mimeType | text | Whitelist enforced on upload |
  | size | integer | Bytes |
  | uploadedById | text FK | References User |
  | createdAt | timestamp | Auto |
- **Relationships**: One transaction; one uploader
- **Validation**: MIME in jpeg/png/gif/webp/heic/heif/pdf; max 15 MB per file

## Page-Level Read Queries (Server Components)

Pages perform direct Drizzle queries (not exposed as API):

| Page | Query pattern |
|------|---------------|
| Dashboard | `groupBy` type sums, count, recent 6 with attachment count |
| Transactions list | `findMany` with filters, `sum` for footer |
| Transaction detail | `findFirst` with attachments and createdBy |
| Users | `findMany` ordered by createdAt |
