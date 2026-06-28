## ADDED Requirements

### Requirement: Scan receipt creates draft expense

The system SHALL accept a receipt image or PDF on the new expense page, extract data via the configured vision model, and create an expense in DRAFT status with line items and an attachment. The system SHALL NOT post the expense automatically.

#### Scenario: Successful scan

- **WHEN** an authenticated user uploads a valid receipt file and LM Studio returns parseable extraction JSON
- **THEN** the system creates a DRAFT expense with extracted lines, vendor as header description, linked attachment, and redirects to the expense detail page for review

#### Scenario: Scan does not auto-post

- **WHEN** a receipt scan completes successfully
- **THEN** the expense status is DRAFT until the user explicitly posts it

### Requirement: Supported receipt file types

The scan flow SHALL accept the same MIME types as existing attachments: JPEG, PNG, GIF, WebP, HEIC, HEIF, and PDF, up to 15 MB.

#### Scenario: Invalid file type rejected

- **WHEN** the user uploads a file with an unsupported MIME type
- **THEN** the system redirects to the new expense page with a scan type error

#### Scenario: Oversized file rejected

- **WHEN** the user uploads a file larger than 15 MB
- **THEN** the system redirects with a scan size error

### Requirement: LM Studio vision extraction

The system SHALL call the OpenAI-compatible chat completions endpoint configured by `LMSTUDIO_BASE_URL` (default `http://localhost:1234/v1`) using model `RECEIPT_AI_MODEL` (default `qwen/qwen2.5-vl-7b`) and SHALL request structured JSON containing vendor, date, category, line items, and confidence.

#### Scenario: LM Studio unreachable

- **WHEN** the extraction request fails to connect to LM Studio
- **THEN** the system redirects with an error indicating LM Studio is unavailable

#### Scenario: Unparseable model response

- **WHEN** the model response is empty or not valid extraction JSON with at least one line item
- **THEN** the system redirects with a parse or empty-lines error

### Requirement: Expense category assignment

The system SHALL assign one of CONVENIENCE, TOLL, PARKING, OFFICE, or OTHER to the expense based on model output, storing it in `Expense.category` for reporting.

#### Scenario: Category stored on expense

- **WHEN** extraction returns category CONVENIENCE
- **THEN** the created expense has category CONVENIENCE and the detail page displays the localized category label

### Requirement: Merge small line items

The system SHALL merge extracted line items with amount less than or equal to `RECEIPT_MERGE_THRESHOLD` (default 1000 JPY) within the same tax-rate bucket into a single line labeled `Misc (N items)`.

#### Scenario: Multiple small items merged

- **WHEN** extraction returns three lines of ¥300, ¥500, and ¥400 all at 10% tax
- **THEN** the draft expense contains one merged line for ¥1,200 at 10% tax

#### Scenario: Large lines preserved

- **WHEN** extraction includes a line above the merge threshold
- **THEN** that line remains separate in the draft expense

### Requirement: JCT-aware line mapping

Extracted lines SHALL be mapped using existing company JCT settings (taxable/exempt, price basis, rounding) so header totals match the same rules as manually entered expenses.

#### Scenario: Taxable company with inclusive receipts

- **WHEN** company JCT status is TAXABLE and price basis is TAX_INCLUSIVE
- **THEN** scanned line amounts are interpreted consistently with manual expense line entry

### Requirement: Bilingual scan UI

The scan form, success message, and error messages SHALL be available in English and Japanese via existing i18n.

#### Scenario: Japanese UI shows scan labels

- **WHEN** the user interface language is Japanese
- **THEN** the scan section title and submit button display Japanese strings

### Requirement: Manual expense entry preserved

The existing manual expense creation form SHALL remain available on the same page when scan is not used.

#### Scenario: Manual path unchanged

- **WHEN** the user completes the manual form without scanning
- **THEN** expense creation behaves as before this change
