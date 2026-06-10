# Project "SHIME" (締) — SaaS Bookkeeping & Automated Year-End Closing Platform for Japanese SMEs

**Technical & Functional Requirement Specification — Research Phase Deliverable**

| | |
|---|---|
| **Document status** | Research / Pre-development (no code initiated) |
| **Regulatory baseline** | Japanese tax & commercial law as understood for fiscal years beginning in 2025–2026 (Reiwa 7–8). All statutory parameters must be re-verified against the annual Tax Reform (税制改正) before each release. |
| **Audience** | Product, engineering, and compliance teams; reviewing Zeirishi advisors |
| **Languages of the product** | Japanese (primary, statutory) + English (full UI/report parity) |

---

## 0. Project Naming, Problem Statement & Positioning

### 0.1 Suggested Project Name

**Primary recommendation: "SHIME" (締 / しめ)** — from *shime* ("closing"), as in 月次締め (monthly close) and 決算を締める (closing the books). It is short, pronounceable in both English and Japanese, trademark-friendly, and describes the product's core promise: *getting the books closed*.

Alternative candidates:

| Name | Reading | Meaning / Rationale |
|---|---|---|
| **KessanFlow** | けっさんフロー | "Kessan" (決算, financial closing) + workflow. Self-explanatory to the JP market. |
| **Aoiro** | あおいろ | "Blue" — evokes Blue Return (青色申告) status the product protects. |
| **Tsumiki** | つみき | "Building blocks" — journals stacking into statements. |
| **ChoboCloud** | ちょうぼクラウド | 帳簿 (books/ledgers) + cloud. Descriptive, less brandable. |

The rest of this document uses **SHIME** as the working name.

### 0.2 Problem Statement

Foreign-owned and foreign-managed SMEs (小規模・中小企業) in Japan face a structural bottleneck:

1. **Language and convention barrier.** Japanese bookkeeping uses a standardized chart of accounts (勘定科目), strict statutory ledgers, and tax-driven adjustments that do not map 1:1 to IFRS/US-GAAP habits. Mainstream Japanese cloud tools (freee, Money Forward, Yayoi) are Japanese-first with limited or no English.
2. **Zeirishi dependency and scarcity.** Companies are heavily reliant on Certified Public Tax Accountants (税理士, *Zeirishi*) for everything from daily account-title questions to the corporate return. English-capable Zeirishi are scarce, expensive, and oversubscribed — especially in the **two-month statutory window** between fiscal year-end and the corporate tax filing deadline.
3. **The two-month window (Kessan crunch).** A Japanese company must file its corporate tax return (法人税申告書) and pay national and local taxes **within 2 months of fiscal year-end** (extendable by 1 month for filing only, with interest accruing on late payment). Most Japanese SMEs choose a March 31 year-end, so the entire industry compresses into April–May.

**SHIME's positioning:** *not* a replacement for the Zeirishi. SHIME continuously keeps the books in a statutorily compliant, audit-ready state during the year, runs the mechanical year-end adjustment workflow, and produces **draft** financial statements, tax schedules, and e-Tax/eLTAX-ready data — so that the Zeirishi's role collapses to **verification, professional judgment, signing, and filing**. This reduces Zeirishi hours per client by an order of magnitude and lets one bilingual Zeirishi serve far more foreign-run SMEs.

### 0.3 Critical Legal Positioning Constraint (Zeirishi Law)

> ⚠️ **Zeirishi Act (税理士法) Articles 2 & 52:** preparation of tax returns *on behalf of others*, tax representation, and tax consultation are exclusive to licensed Zeirishi (and Zeirishi corporations). Unlicensed provision of these services — even free of charge for consultation/representation — is prohibited.

Consequences for SHIME's design and marketing:

- SHIME must be positioned as a **self-preparation software tool** operated by the taxpayer (like Yayoi/freee/Money Forward are), and/or a **practice tool used by the engaging Zeirishi**.
- All tax-return outputs are labeled **"DRAFT — requires review by taxpayer or engaged Zeirishi" (税理士確認前ドラフト)**.
- The product must support a **Zeirishi collaboration workspace**: the advisor reviews, adjusts, signs (税理士署名欄), and files via their own e-Tax/eLTAX credentials.
- In-app guidance must be generic ("how the law works"), never client-specific tax advice generated as a service by the operator. (AI explanations must carry the same disclaimer.)

---

# Module 1 — Compliance Architecture & Legislative Ground Rules

This module defines the non-negotiable legal constraints the engine must enforce. These are **architecture-level** requirements: they dictate data immutability, metadata schemas, retention, and search — they cannot be bolted on later.

## 1.1 Electronic Books Preservation Act (電子帳簿保存法, *Denshi Chōbo Hozon Hō*)

The Act (commonly "Denchōhō") governs how tax-relevant books and documents may/must be kept electronically. It has **three pillars**; each has distinct rules:

| Pillar | Japanese | Applies to | Mandatory? |
|---|---|---|---|
| 1. Electronic books storage | 電子帳簿等保存 | Books you create digitally from the start: journal (仕訳帳), general ledger (総勘定元帳), subsidiary ledgers, and self-issued document copies | Optional (vs. printing), but SHIME's core value |
| 2. Scanner storage | スキャナ保存 | Paper documents received/issued (invoices, receipts, contracts) digitized to discard paper | Optional |
| 3. Electronic transaction data | 電子取引データ保存 | Invoices/receipts/POs **received or sent electronically** (e-mail PDF, EC download, EDI, Peppol) | **MANDATORY since 2024-01-01** — printing-and-filing-paper is no longer a permitted substitute |

### 1.1.1 Pillar 3 — Electronic Transaction Data (mandatory; SHIME's document vault core)

Every electronically exchanged transaction document must be stored satisfying **authenticity (真実性)** and **visibility (可視性)**.

**Authenticity — at least ONE of the following:**

| Option | Requirement | SHIME implementation implication |
|---|---|---|
| (a) Sender timestamp | Data received already bearing a qualified timestamp | Verify & preserve timestamp token |
| (b) Recipient timestamp | Affix a **qualified timestamp** (総務大臣認定タイムスタンプ — time-stamping service accredited by the Minister of Internal Affairs and Communications, e.g. Amano, Seiko) **within the ordinary business processing period — max ~2 months + 7 business days** from receipt | Integrate an accredited TSA; enforce SLA timers per document |
| (c) Tamper-proof system | Store in a system where **correction/deletion is impossible, or where a complete correction/deletion history is retained** | Append-only document store + immutable version history (recommended primary mechanism — removes timestamp cost) |
| (d) Internal rules | Documented internal anti-tampering administrative rules (訂正削除の防止に関する事務処理規程) | Provide NTA-template policy generator as fallback for imported legacy data |

**SHIME design decision:** implement **(c)** natively (immutable, versioned object storage with hash-chained audit log) and offer **(b)** as an optional add-on; auto-generate **(d)** policy documents for the tenant.

**Visibility (可視性) requirements:**

1. Data must be displayable and printable **on demand, clearly and promptly**, at the place of preservation (PC + display + printer + operation manual available).
2. System documentation (システム概要書・操作説明書) must be available.
3. **Search function (検索機能)** — records must be searchable by:
   - **Transaction date (取引年月日)**
   - **Transaction amount (取引金額)**
   - **Counterparty (取引先)**
   - **Range search** on date and amount (e.g., 2025-04-01–2025-04-30, ¥10,000–¥50,000), and
   - **Combination (AND) search** of two or more of the three keys.
   - *Relaxations:* range/combination search may be waived if the taxpayer can comply with the tax office's **data download requests (ダウンロードの求め)**; the **entire** search requirement is waived for businesses with prior-2-year (基準期間) sales **≤ ¥50,000,000** that comply with download requests. SHIME should implement full search anyway (it is a product feature, not a burden).

**Mandatory metadata schema per stored document (minimum):**

```
document_id, tenant_id, doc_type (invoice/receipt/PO/contract/delivery note/…),
transaction_date, total_amount_jpy, counterparty_name, counterparty_id (link to partner master),
direction (received/issued), source_channel (email/upload/EDI/peppol/scan/api),
file_hash (SHA-256), received_at, stored_at, timestamp_token (optional),
version_no, superseded_by (for corrections — never hard-delete), linked_journal_entry_ids[]
```

### 1.1.2 Pillar 1 — Electronic Books & the "Excellent Electronic Books" (優良な電子帳簿) tier

Two compliance tiers exist for self-created books:

| Tier | Requirements | Benefit |
|---|---|---|
| **Standard (その他の電子帳簿)** | System docs available; display/print on demand; comply with download requests | Books may legally be kept electronically (no paper printout) |
| **Excellent (優良な電子帳簿)** | All of: (1) **correction/deletion history retained** (訂正・削除履歴), including record of entries made after the input deadline; (2) **mutual traceability** (相互関連性) between journal entries and ledger postings; (3) full **search** by date/amount/counterparty + range + combination | **5-percentage-point reduction of under-reporting penalty (過少申告加算税)** on related taxes, upon advance notification (届出). Strong audit-defense selling point |
| | Scope of books for the benefit | Journal, general ledger, and tax-relevant subsidiary books (sales, purchases, AR, AP, fixed assets, etc.) |

**SHIME requirement:** the journal engine must be **append-only with reversal/correction semantics** (a "correction" creates a visible amended version or a reversing entry; original rows are never destroyed) so every tenant qualifies as an *excellent electronic book* keeper by default. SHIME should obtain **JIIMA certification** (公益社団法人日本文書情報マネジメント協会) for: ① 電子帳簿ソフト法的要件認証, ② 電子取引ソフト法的要件認証, ③ スキャナ保存ソフト法的要件認証 — JIIMA marks are the de-facto market signal of Denchōhō compliance and simplify the tenant's filing for the excellent-books penalty reduction.

### 1.1.3 Pillar 2 — Scanner Storage (スキャナ保存)

For tenants who want to discard paper originals:

- **Resolution ≥ 200 dpi; 24-bit color** (grayscale permitted for "general documents" (一般書類) such as quotations/delivery notes; **important documents (重要書類)** — contracts, invoices, receipts — require color).
- **Input deadline:** scan within the ordinary business processing period (**max ~2 months + 7 business days**).
- **Authenticity:** qualified timestamp on the scan, **or** storage in a system that retains correction/deletion history (and where stored data input timing is verifiable).
- **Mutual linkage (帳簿との相互関連性):** required **only for important documents** (post-2024 reform) — each scan must be linkable to its journal entry (SHIME: `linked_journal_entry_ids`).
- Search requirements as per §1.1.1.
- 2024 reform removed: requirement to retain resolution/gradation/size metadata, and the "input person information" requirement — but SHIME should retain capture metadata anyway for forensic value.

### 1.1.4 Retention Periods (corporate)

| Item | Period |
|---|---|
| Books & documents (帳簿書類) — corporation | **7 years** from the filing deadline of the relevant fiscal year |
| Fiscal years with a tax loss carryforward (欠損金) | **10 years** |
| Qualified invoices (issued copies & received) | 7 years |
| SHIME policy | Retain **10 years + buffer** for everything; tenant-level legal hold; no physical deletion within retention window even on contract termination (export + escrow obligations to be defined in ToS) |

## 1.2 Qualified Invoice System (適格請求書等保存方式, "Invoice Seido") — in force since 2023-10-01

The Qualified Invoice System governs **consumption tax (消費税, JCT)** input credit. The engine must treat consumption tax as a **first-class dimension of every journal line**, not an afterthought.

### 1.2.1 Registration numbers & verification

- Issuers must be registered **Qualified Invoice Issuers (適格請求書発行事業者)** with a registration number: **"T" + 13 digits** (for companies, T + the Corporate Number / 法人番号).
- **System must verify numbers via public Web-APIs:**
  - **NTA Qualified Invoice Issuer Publication Site Web-API (国税庁適格請求書発行事業者公表サイト)** — validate registration status **and registration validity period** (issuers can register/deregister mid-year; credit eligibility depends on the *transaction date* falling within the registration window).
  - **NTA Corporate Number Publication Site Web-API (法人番号公表サイト)** — resolve/validate corporate numbers, fetch official name & address for the partner master.
- Partner master (取引先マスタ) must cache: registration number, verification timestamp, validity period, and re-verify periodically and at year-end close.

### 1.2.2 Qualified Invoice (適格請求書, *Tekikaku Seikyūsho*) — mandatory contents the system must generate

1. Issuer name & **registration number**
2. **Transaction date**
3. Description of goods/services, **flagging reduced-rate (軽減税率) items** (e.g., ※ marker)
4. **Total amount per tax rate** (tax-inclusive or tax-exclusive) **and the applicable rate**
5. **Consumption tax amount per tax rate**
6. Recipient's name

A **Simplified Qualified Invoice (適格簡易請求書)** — permitted for retail, restaurants, taxis, parking, etc. — may omit the recipient name and may show *either* the tax amount *or* the applicable rate.

**Rounding rule (hard engine constraint):** consumption tax on a qualified invoice may be rounded **only once per tax rate per invoice** (not per line). Rounding method (floor 切捨て / round 四捨五入 / ceiling 切上げ) is the issuer's choice — must be configurable per tenant (and stored per partner for received invoices to reproduce totals).

**Returns/credits:** a **Return Invoice (適格返還請求書)** is required for rebates/returns, **except** when the amount is **< ¥10,000 tax-inclusive** (permanent exemption — designed for the "buyer deducts bank transfer fee" practice; engine must auto-classify such deductions as 売上値引 without demanding a return invoice).

### 1.2.3 Tax rates and tax-category codes (税区分)

| Code group | Rate | Examples |
|---|---|---|
| Standard rate (標準税率) | **10%** (national 7.8% + local 2.2%) | Default |
| Reduced rate (軽減税率) | **8%** (national 6.24% + local 1.76%) | Food & beverages (excluding alcohol and dining-out/restaurant services), subscription newspapers (≥2 issues/week) |
| Legacy 8% (旧税率) | 8% (6.3% + 1.7%) | Pre-2019-10 transitional contracts — rare but must be representable |
| Non-taxable (非課税) | — | Land, securities, interest, insurance premiums, residential rent, certain medical/welfare/education |
| Out of scope (不課税) | — | Salaries, dividends, donations, overseas transactions outside JCT scope |
| Export zero-rated (免税/輸出免税) | 0% | Exports, international transport — input credit still available |
| Purchases — split by credit eligibility | | 課税仕入 10% / 8%(軽減), from registered vs **non-registered** issuers (see §1.2.4), import JCT (輸入消費税), etc. |

Every journal line must carry: `tax_category_code`, `tax_rate`, `tax_amount`, `is_reduced_rate`, `invoice_registration_status_of_counterparty`, `credit_ratio (100/80/50/0%)`.

### 1.2.4 Transitional partial-deduction rules (経過措置) — ⚠ regime change on 2026-10-01

Purchases from **non-registered** suppliers (immune/unregistered businesses) earn only a partial input credit:

| Period (by transaction date) | Deductible portion of the input tax |
|---|---|
| 2023-10-01 → 2026-09-30 | **80%** |
| **2026-10-01 → 2029-09-30** | **50%** |
| From 2029-10-01 | **0%** |

Engine requirements:

- Credit ratio is selected by **transaction date**, not posting date — a fiscal year spanning 2026-10-01 contains **both 80% and 50% purchases**; the consumption tax working papers must subtotal each bucket separately.
- The non-deductible portion is, in principle, added to the cost of the asset/expense (税抜経理 treatment guidance: the 20%/50% disallowed piece is treated as part of the consideration).
- Ledger must record the statutory annotation (e.g., 「80%控除対象」) and retain the received (non-qualified) invoice.

### 1.2.5 Small-amount and small-business special rules (must be parameterized with sunset dates)

| Rule | Content | Sunset |
|---|---|---|
| **Small-amount special (少額特例)** | Businesses with base-period taxable sales **≤ ¥100M** (or specified-period ≤ ¥50M): purchases **< ¥10,000 (tax-inclusive)** get full input credit **with ledger entry only — no invoice retention needed** | Transactions through **2029-09-30** |
| **20% special (2割特例)** | Formerly-exempt businesses that became taxable *because* they registered as invoice issuers may pay JCT = **20% of output tax** (no input computation needed); per-return election | Fiscal periods up to the one **including 2026-09-30** — i.e., **expiring during 2026**; SHIME must support it for trailing periods and warn tenants of the cliff (typically: evaluate 簡易課税 election before expiry) |
| Return invoice < ¥10,000 exemption | §1.2.2 | Permanent |

### 1.2.6 Tax calculation methods (計算方法) — return-level engine rules

- **Output tax:** aggregate method (割戻し計算 — annual tax-inclusive sales per rate × rate-fraction) is the principle; **invoice-piling method (積上げ計算 — sum the tax amounts actually printed on issued qualified invoices)** is permitted if invoice copies are retained.
- **Input tax:** invoice-piling (積上げ) is the principle (sum tax on received invoices, or ledger-piling 帳簿積上げ with per-transaction computed tax); aggregate (割戻し) is allowed **only if** output tax also uses the aggregate method.
- **Constraint matrix the engine must enforce:** a seller using 積上げ for output **must** use 積上げ for input; mixing 積上げ(output) with 割戻し(input) is prohibited. (積上げ on output generally favors high-volume small-ticket retailers.)

### 1.2.7 Digital invoices (Peppol / JP PINT)

Japan's standardized digital invoice network uses **Peppol (JP PINT specification)** promoted by the Digital Agency / EIPA. Not legally mandatory, but SHIME should plan a Peppol Access Point integration (Phase 4) — structured invoices eliminate OCR and make Denchōhō Pillar-3 compliance automatic.

## 1.3 Blue Return Status (青色申告, *Aoiro Shinkoku*) — Corporate

Blue Return status is granted upon application (青色申告の承認申請書 — due **the day before the fiscal year starts**, or within 3 months of incorporation for new companies) and is conditioned on **keeping proper double-entry books**. Losing it is catastrophic for an SME. SHIME's ledger integrity *is* the tenant's Blue Return defense.

### 1.3.1 Books the system must maintain automatically (per Corporate Tax Act & its Ordinance)

| Book | Japanese | Romaji | SHIME implementation |
|---|---|---|---|
| Journal | 仕訳帳 | Shiwake-chō | The append-only journal entry store; chronological record of all transactions with date, counterparty, description, amount |
| General Ledger | 総勘定元帳 | Sō-kanjō Moto-chō | Materialized per-account posting view derived from the journal (account, date, counter-account, amount, running balance) |
| Inventory list | 棚卸表 | Tana-oroshi-hyō | Year-end physical inventory valuation report (Module 3) |
| Cash book | 現金出納帳 | Genkin Suitō-chō | Subsidiary ledger view filtered on cash accounts |
| Bank book | 預金出納帳 | Yokin Suitō-chō | Per-bank-account subsidiary ledger, reconciled to feeds |
| Sales ledger / AR | 売掛帳・売上帳 | Urikake-chō | Per-customer receivable subledger |
| Purchases ledger / AP | 買掛帳・仕入帳 | Kaikake-chō | Per-vendor payable subledger |
| Fixed asset register | 固定資産台帳 | Kotei Shisan Daichō | Asset master + depreciation schedules (Module 3) |
| Balance Sheet & P/L | 貸借対照表・損益計算書 | — | Generated statements (Module 4) |

All must be **derivable on demand for any past date**, printable, and retained 7–10 years (§1.1.4).

### 1.3.2 Blue Return benefits the platform protects (why this matters to the tenant)

- **Tax loss carryforward (欠損金の繰越控除) — 10 years**; SMEs (capital ≤ ¥100M, non-large-subsidiary) may offset **100%** of income (large companies capped at 50%).
- **Loss carryback refund (欠損金の繰戻し還付)** — 1 year, SMEs only.
- **SME immediate write-off of minor depreciable assets (< ¥300,000)** — §3.2.4; Blue status is a precondition.
- Special depreciation / tax credits (中小企業投資促進税制, 賃上げ促進税制 etc.) — Blue status is a precondition.
- Estimation-based assessment (推計課税) by the tax office is not permitted against blue filers; books are presumed.

**Engine duty:** continuous validation that books are complete (no unposted bank lines, no negative cash days, no orphaned suspense balances at close, ledger ↔ statement tie-outs) — i.e., a permanent "Blue-Return health check" dashboard.

---

# Module 2 — Day-to-Day & Monthly Bookkeeping Workflows

## 2.1 Account Title Mapping (勘定科目, *Kanjō Kamoku*) — Standard SME Chart of Accounts

Japanese bookkeeping is built around a **conventional, quasi-standardized chart of accounts**. SHIME must ship a canonical CoA with stable internal codes, **Japanese statutory labels + English labels**, tax-category defaults, and B/S–P/L mappings. Tenants may add sub-accounts (補助科目) but the statutory roll-up must remain intact.

### 2.1.1 Canonical SME Chart of Accounts (representative; full master to be ~150–250 titles)

**Balance Sheet — Assets (資産)**

| Code grp | Japanese | Romaji | English | Notes for the engine |
|---|---|---|---|---|
| 111 | 現金 | Genkin | Cash | Negative balance = hard validation error |
| 112 | 小口現金 | Koguchi genkin | Petty cash | |
| 113 | 普通預金 / 当座預金 / 定期預金 | Futsū/Tōza/Teiki yokin | Ordinary / current / time deposits | One sub-account per bank account; feed-reconciled |
| 121 | 売掛金 | Urikake-kin | Accounts receivable – trade | Per-customer subledger; aging report |
| 122 | 受取手形 / 電子記録債権 | Uketori tegata / Densai | Notes receivable / electronically recorded receivables | Densai is common; maturity tracking |
| 131 | 商品 / 製品 / 原材料 / 仕掛品 | Shōhin / Seihin / Genzairyō / Shikakari-hin | Merchandise / finished goods / raw materials / WIP | Inventory accounts adjusted only at close (periodic method typical for SMEs) |
| 141 | **仮払金** | **Karibarai-kin** | **Suspense payments** | Money advanced before nature is known (e.g., cash given to an employee for a trip). **Must be cleared to real expense accounts; engine flags balances aging > 30/60/90 days and blocks year-end close sign-off with uncleared material balances** |
| 142 | 前払費用 / 長期前払費用 | Maebarai hiyō | Prepaid expenses (short/long-term) | Cut-off engine §3.4 |
| 143 | 立替金 | Tatekae-kin | Advances paid on behalf of others | Distinct from 仮払金 (known counterparty owes it back) |
| 144 | 仮払消費税 | Karibarai shōhizei | Suspense consumption tax paid (input JCT) | Auto-generated under tax-exclusive method (税抜経理); cleared at close §3.6 |
| 145 | 未収入金 / 未収収益 | Mishū-nyūkin / Mishū shūeki | Other receivables / accrued revenue | |
| 151 | 短期貸付金 / 役員貸付金 | Tanki kashitsuke-kin / Yakuin kashitsuke-kin | Short-term loans / loans to directors | Director loans trigger deemed-interest issues — warn |
| 161 | 建物 / 建物附属設備 / 構築物 / 機械装置 / 車両運搬具 / 工具器具備品 | — | Buildings / building fixtures / structures / machinery / vehicles / tools, furniture & fixtures | Each maps to statutory useful-life tables (§3.2) |
| 162 | 一括償却資産 | Ikkatsu shōkyaku shisan | Lump-sum depreciable assets (¥100k–¥200k, 3-yr) | §3.2.4 |
| 163 | 土地 | Tochi | Land | Non-depreciable |
| 164 | ソフトウェア | Sofutowea | Software | 5-yr SL (in-house use) |
| 171 | 敷金・保証金 | Shikikin / Hoshōkin | Security deposits / guarantee money | Non-expense; refundability tracking |
| 172 | 保険積立金 | Hoken tsumitate-kin | Insurance reserve asset | Split premium asset/expense per policy rules |
| 181 | 繰延資産 | Kurinobe shisan | Deferred charges (incorporation costs 創立費・開業費 etc.) | Voluntary amortization allowed (任意償却) |

**Balance Sheet — Liabilities & Net Assets (負債・純資産)**

| Code grp | Japanese | Romaji | English | Notes |
|---|---|---|---|---|
| 211 | 買掛金 | Kaikake-kin | Accounts payable – trade | Per-vendor subledger |
| 212 | 支払手形 / 電子記録債務 | Shiharai tegata / Densai | Notes payable / electronically recorded payables | |
| 213 | 未払金 / 未払費用 | Mibarai-kin / Mibarai hiyō | Other payables / accrued expenses | 未払金 = determined amounts for non-trade purchases; 未払費用 = continuous-service accruals (rent, utilities, salaries) |
| 214 | **仮受金** | **Kariuke-kin** | **Suspense receipts** | Unidentified deposits (e.g., bank transfer that can't be matched). Same aging/clearance enforcement as 仮払金 |
| 215 | 前受金 / 前受収益 | Maeuke-kin / Maeuke shūeki | Advances received / deferred revenue | Cut-off engine §3.4 |
| 216 | **預り金** | **Azukari-kin** | **Deposits received (withholdings)** | Sub-accounts per type: 源泉所得税 (withheld income tax), 住民税 (resident tax), 社会保険料 (SI employee share), 雇用保険 (employment insurance employee share) — payroll engine §2.2 |
| 217 | 仮受消費税 | Kariuke shōhizei | Suspense consumption tax received (output JCT) | Tax-exclusive method; cleared at close §3.6 |
| 218 | 未払法人税等 / 未払消費税等 | Mibarai hōjinzei-tō / shōhizei-tō | Income taxes payable / consumption tax payable | Auto-posted by the closing engine §3.6 |
| 221 | 短期借入金 / 長期借入金 / 役員借入金 | Kariire-kin | Short/long-term borrowings / loans from directors | 役員借入金 very common in SMEs; flag for DES/relief planning notes |
| 231 | 賞与引当金 / 退職給付引当金 | Shōyo / Taishoku-kyūfu hikiate-kin | Accrued bonus / retirement benefit provisions | Book-only; tax addback §3.3.2 |
| 311 | 資本金 / 資本準備金 | Shihon-kin | Share capital / capital reserve | Capital drives tax thresholds (¥10M JCT, ¥100M SME status, 均等割 brackets) — keep authoritative |
| 321 | 利益準備金 / 繰越利益剰余金 | Rieki jōyokin | Retained earnings | Ties to 別表五(一) §4.2.3 |

**P/L (損益計算書科目)**

| Code grp | Japanese | Romaji | English | Notes |
|---|---|---|---|---|
| 411 | 売上高 | Uriage-daka | Sales revenue | Per-tax-rate, per-customer dimensions |
| 451 | 期首/期末商品棚卸高・仕入高 | — | Opening/closing inventory & purchases | COGS = 期首 + 仕入 − 期末 (periodic method) |
| 511 | 役員報酬 | Yakuin hōshū | Directors' compensation | **Deductible only if 定期同額給与 (fixed monthly) or pre-notified 事前確定届出給与. Engine must hard-warn on mid-year changes outside the 3-month window after period start** |
| 512 | 給料手当 / 賞与 / 雑給 | Kyūryō teate / Shōyo | Salaries / bonuses / part-time wages | |
| 513 | **法定福利費** | **Hōtei fukuri-hi** | **Statutory welfare expenses** | Employer share of social insurance + labor insurance + child-rearing contribution. *Never* mixed with 福利厚生費 |
| 514 | **福利厚生費** | **Fukuri kōsei-hi** | **(Non-statutory) welfare expenses** | Employee welfare: company outings, health checkups, condolence/celebration money, subsidized meals — must be **available to all employees, socially reasonable amounts**. See disambiguation table below |
| 515 | **交際費** | **Kōsai-hi** | **Entertainment expenses** | Tax-limited! §2.1.2. Requires metadata capture (who/with whom/relationship) |
| 516 | 会議費 | Kaigi-hi | Meeting expenses | Includes business meals **≤ ¥10,000/person** with required records (raised from ¥5,000 effective April 2024) |
| 517 | 旅費交通費 | Ryohi kōtsū-hi | Travel & transportation | Commuter allowance tax-free limits interact with payroll |
| 518 | 通信費 / 水道光熱費 / 消耗品費 / 事務用品費 | — | Communications / utilities / supplies | |
| 519 | 地代家賃 | Chidai yachin | Rent | Residential sublease = 非課税; office = 10% taxable — tax-category default per contract |
| 520 | 支払手数料 | Shiharai tesūryō | Fees & commissions | Bank fees, professional fees (note: Zeirishi fees have withholding only for individuals) |
| 521 | 広告宣伝費 | Kōkoku senden-hi | Advertising | vs 交際費 boundary (general public vs specific partners) |
| 522 | 租税公課 | Sozei kōka | Taxes & dues | Stamp duty, fixed asset tax, 償却資産税; **NOT corporate/resident tax** (those are 法人税等). Deductibility split feeds 別表四 |
| 523 | 減価償却費 | Genka shōkyaku-hi | Depreciation | Posted by asset engine §3.2 |
| 524 | 貸倒損失 / 貸倒引当金繰入 | Kashidaore sonshitsu / hikiate-kin kurīre | Bad debt loss / provision | §3.3 |
| 525 | 保険料 / 修繕費 / 車両費 / 新聞図書費 / 研修費 | — | Insurance / repairs / vehicle / books / training | 修繕費 vs 資本的支出 (capital expenditure) decision support |
| 531 | 雑費 / 雑収入 / 雑損失 | Zappi / Zatsushūnyū / Zassonshitsu | Misc. expense / income / loss | Engine should discourage 雑費 dumping (audit flag if > threshold) |
| 611 | 支払利息 / 受取利息 / 受取配当金 | — | Interest expense / interest income / dividends received | Dividend exclusion feeds 別表八 |
| 711 | 法人税、住民税及び事業税 | Hōjinzei-tō | Income taxes (corp/resident/enterprise) | Posted by closing engine |

### 2.1.2 The 交際費 / 会議費 / 福利厚生費 disambiguation engine (high-value UX feature)

This is where SMEs make the most errors and where Zeirishi spend review time. Entertainment expense (交際費) is **not fully deductible**; SMEs (capital ≤ ¥100M) may deduct up to the **greater-of election**: **(a) ¥8,000,000 per year flat allowance**, or **(b) 50% of food-and-drink entertainment**. Excess is added back on **別表十五** (§4.2).

| Scenario | Correct account | Rule |
|---|---|---|
| Dinner with a client, **≤ ¥10,000/person** (tax treatment per tenant's 税抜/税込 method), with record of date, participants, business relationship, restaurant name | 会議費 (Meeting expense) — **excluded from 交際費 entirely** | Threshold raised from ¥5,000 to **¥10,000 effective 2024-04-01**. Engine: per-receipt prompt for headcount + counterpart names → auto-route |
| Dinner with a client over ¥10,000/person | 交際費 (Entertainment) | Feeds 別表十五 limit calculation |
| Company-wide year-end party (忘年会), trip open to all employees, reasonable cost | 福利厚生費 (Welfare) | Must be open to **all** employees; per-person cost socially reasonable; otherwise reclass to 交際費 (external) or 給与 (deemed salary to specific employees!) |
| Gifts (お中元/お歳暮) to clients | 交際費 | |
| Golf with clients | 交際費 (green fees etc.) | |
| Internal meeting bento & coffee | 会議費 | |
| Celebration/condolence money to **employees** per internal rules | 福利厚生費 | To **clients** → 交際費 |

**UX requirement:** receipt capture flow asks 3 questions (internal/external? headcount? per-person amount auto-computed) and routes the account title + captures the statutorily required memo fields.

### 2.1.3 Suspense account hygiene (仮払金 / 仮受金 / 仮払・仮受消費税)

- Dashboard widget: suspense balances with aging; monthly close cannot be "locked" while unexplained items remain (override with reason, logged).
- Year-end: **hard gate** — 仮払金/仮受金 should be ¥0 or documented; auditors and banks treat large suspense balances as red flags (and 仮払金 to directors risks recharacterization as 役員貸付金 with deemed interest, or 役員賞与 — non-deductible **and** withholding-taxable).

## 2.2 Payroll & Social Insurance (給与計算・社会保険, *Shakai Hoken*) Intersection with Bookkeeping

SHIME's MVP does **not** need to *compute* payroll (integration with payroll SaaS is acceptable — see Phase plan), but it **must** model the journals natively, because payroll touches 6+ balance-sheet accounts monthly and is the #1 source of reconciliation errors.

### 2.2.1 The monthly deduction stack (employee-side withholdings → 預り金)

| Item | Japanese | Who pays | Mechanics |
|---|---|---|---|
| Withholding income tax | 源泉所得税 (源泉徴収, *Gensen Chōshū*) | Employee (withheld) | Per the **monthly withholding tax table (源泉徴収税額表, 月額表)**, 甲欄 (with 扶養控除等申告書 on file) vs 乙欄; based on taxable pay after SI deductions and dependents count. Remit by the **10th of the following month**; companies with < 10 employees may elect semi-annual remittance (納期の特例: Jul 10 / Jan 20) |
| Resident tax | 住民税 (特別徴収, *Jūminzei*) | Employee (withheld) | **Fixed monthly amounts dictated by each municipality** (special collection notice, June→May cycle; the June installment differs). Engine stores the per-employee 12-month schedule; remit by the 10th of following month (納期の特例 available) |
| Health insurance | 健康保険 | 50/50 employer/employee | Premium = **standard monthly remuneration (標準報酬月額)** × prefecture-specific rate (協会けんぽ ~10% ± by prefecture; rates revised every March) |
| Nursing care insurance | 介護保険 | 50/50 | Only employees aged **40–64**; ~1.6% added to health rate |
| Employees' pension | 厚生年金 | 50/50 | 標準報酬月額 × **18.3%** (fixed) |
| Employment insurance | 雇用保険 | Split (employee ~0.55%, employer ~0.9% for general industries — **rates revised annually each April**; keep as versioned parameters) | On actual gross pay |
| Workers' accident comp. | 労災保険 | **Employer only** | Industry-rate × payroll; paid via annual labor insurance declaration (年度更新, June–July) |
| Child-rearing contribution | 子ども・子育て拠出金 | **Employer only** | 標準報酬月額 × 0.36% |

Key engine concepts:

- **標準報酬月額 (Standard Monthly Remuneration):** salaries are bucketed into statutory grades; recalculated annually via the July **算定基礎届** (based on Apr–Jun pay) effective September, and ad-hoc via **月額変更届** when pay changes ≥ 2 grades for 3 months. SHIME needs the grade tables as versioned reference data.
- **Timing offset:** social insurance premiums for month *M* are debited by JPY-bank-transfer **at the end of month M+1** (当月分翌月末引落). The employee share withheld in month M sits in 預り金 until then — reconciliation must tolerate the 1-month lag and the "did we withhold previous-month or current-month premiums" convention choice per tenant.

### 2.2.2 Canonical monthly payroll journal (the template SHIME must generate)

Example: gross ¥400,000; SI employee share ¥60,000; employment ins. ¥2,200; WHT ¥8,500; resident tax ¥15,000; net pay ¥314,300.

| Dr | Cr | Amount |
|---|---|---|
| 給料手当 (Salaries) 400,000 | 預り金/社会保険料 (SI withheld) | 60,000 |
| | 預り金/雇用保険 (EI withheld) | 2,200 |
| | 預り金/源泉所得税 (WHT) | 8,500 |
| | 預り金/住民税 (Resident tax) | 15,000 |
| | 普通預金 (Bank — net pay) | 314,300 |

Employer-burden accrual in the same month (best practice):

| Dr | Cr | Amount |
|---|---|---|
| 法定福利費 (Statutory welfare — employer SI share + child contribution) ~61,440 | 未払費用 (Accrued SI) | 61,440 |

Following month-end (bank debit of the full SI invoice 保険料納入告知書):

| Dr | Cr | Amount |
|---|---|---|
| 預り金/社会保険料 60,000 + 未払費用 61,440 | 普通預金 | 121,440 |

The engine ships these as **parameterized auto-journal templates** bound to payroll-register imports (CSV/API from payroll SaaS such as SmartHR, freee人事労務, Money Forward給与, KING OF TIME ecosystem) and to the bank-feed matcher (recognize 「ネンキンジムショ」/「コクホレンゴウ」 debits etc.).

### 2.2.3 Year-end payroll events the bookkeeping must absorb

- **年末調整 (Nenmatsu Chōsei, year-end adjustment):** December recalculation of each employee's annual income tax; refunds/collections flow through 預り金/源泉所得税 (account may go temporarily negative — allowed with explanation flag).
- **法定調書合計表 + 給与支払報告書** (statutory reports to NTA and municipalities by **Jan 31**) and **償却資産申告書** (depreciable-asset tax return, also Jan 31) — calendar engine items even for non-December year-ends.
- **賞与 (bonuses):** separate SI premium calculation on 標準賞与額 and a separate withholding table; journal templates as above.

## 2.3 Monthly Close (月次決算) Routine — the workflow spine of the product

A disciplined monthly close is what makes the two-month year-end window feasible. SHIME's monthly checklist (per tenant, role-assignable, with status tracking):

1. **Bank/cash reconciliation** — all feed lines matched to journal entries; cash count attached (現金実査表).
2. **AR/AP roll-forward** — invoices issued/received all posted; 売掛金・買掛金 subledgers tie to GL control accounts (hard constraint, enforced by design since subledgers are views).
3. **Suspense clearance** (§2.1.3).
4. **Payroll tie-out** — payroll register total = journal; 預り金 balances = next remittance amounts.
5. **Withholding & resident tax remittance** confirmed (due 10th).
6. **JCT health check** — every line has a tax category; unverified invoice registration numbers flagged; non-registered-supplier purchases listed with 80/50% annotation.
7. **Depreciation (monthly provisional)** — optional 月次償却 posting (1/12) for management accounts, reversed/trued-up at year-end.
8. **Period lock (月次締め)** — locks all entries dated in the month; subsequent corrections only via dated correction entries (Denchōhō excellent-books history requirement §1.1.2).
9. **Management report pack** — monthly trial balance (合計残高試算表), B/S, P/L vs budget, cash position — bilingual PDF.

---

# Module 3 — The Year-End Adjustments Workflow (決算整理, *Kessan Seiri*)

This is SHIME's flagship feature: a **sequential, guided closing wizard** that takes the books from "draft trial balance" to "closed", producing the adjusting entries (決算整理仕訳) and the working papers a Zeirishi needs for verification. The two-month clock starts at fiscal year-end (期末); the wizard's steps are ordered because later steps consume earlier results (e.g., depreciation feeds 別表十六 feeds 別表四 feeds the tax provision which feeds the final B/S).

### Step 0 — Pre-closing gate (決算予備調査)

Automated checks that must pass (or be overridden with logged reasons):

- All 12 monthly closes locked; bank balances = bank statements/feeds at year-end date (certificates 残高証明書 attachable).
- 仮払金 / 仮受金 cleared (§2.1.3); director loan balances confirmed with interest accrual check.
- AR/AP confirmations (残高確認) issued/received for material balances; unmatched differences journaled.
- All electronic transaction documents for the period ingested (Denchōhō Pillar-3 completeness scan: bank-feed lines with no linked document → exception list).
- Invoice registration numbers re-verified against the NTA API as of period end (§1.2.1).

## 3.1 Inventory Valuation (棚卸資産の評価, *Tanaoroshi Shisan no Hyōka*)

### 3.1.1 Physical count & the 棚卸表 (inventory list)

- Wizard collects the **physical count (実地棚卸)** at the year-end date: item, quantity, unit cost, valuation; supports CSV import and mobile count-sheet capture.
- Output: the statutory **棚卸表 (Tana-oroshi-hyō)** — a mandatory Blue Return book (§1.3.1).

### 3.1.2 Valuation methods (tax law catalog — the elected method is filed with the tax office; default applies if no election)

| Method | Japanese | Use case | Engine logic |
|---|---|---|---|
| **Last purchase cost** | 最終仕入原価法 | **Statutory DEFAULT when no election filed — the overwhelmingly common SME method** | Ending qty × most recent purchase unit price before period end |
| FIFO | 先入先出法 | Trading/retail | Layered cost consumption |
| Moving average | 移動平均法 | Perpetual systems | Recompute average on each receipt |
| Total average | 総平均法 | Simple wholesale | (Opening cost + period purchases) ÷ (opening qty + purchased qty) |
| Specific identification | 個別法 | Real estate, machinery dealers, unique goods | Per-unit tracking |
| Retail method | 売価還元法 | Multi-SKU retail | Selling price × cost ratio |
| **Lower of cost or market** | **低価法 (Teika-hō)** | **Blue Return filers, upon election** — each method above "with 低価法" | Ending value = min(cost, period-end market value); write-down loss is deductible. Engine: per-item NRV input + automatic 商品評価損 entry |

Obsolescence/damage write-downs (評価損) outside 低価法 require specific facts (damage, significant deterioration) — wizard collects evidence attachments.

### 3.1.3 Adjusting entries (periodic method)

```
Dr 期首商品棚卸高 (Opening inventory – P/L)   / Cr 商品 (Merchandise – B/S)     … roll out opening balance
Dr 商品 (Merchandise – B/S)                  / Cr 期末商品棚卸高 (Closing inventory – P/L) … set ending balance
```

COGS materializes on the P/L as 期首 + 当期仕入 − 期末. For manufacturers, equivalent entries per 原材料/仕掛品/製品 feed the **製造原価報告書** (§4.1).

## 3.2 Depreciation of Fixed Assets (減価償却, *Genka Shōkyaku*)

### 3.2.1 Statutory methods & defaults (corporate)

| Asset class | Permitted methods | Corporate default (no election) |
|---|---|---|
| Buildings (acquired ≥ 1998-04-01) | **Straight-line only (定額法)** | 定額法 |
| Building fixtures (建物附属設備) & structures (構築物) acquired ≥ 2016-04-01 | **Straight-line only** | 定額法 |
| Machinery, vehicles, tools/furniture/fixtures | 定額法 or 定率法 (election) | **Declining balance (定率法)** for corporations |
| Software (self-use) | Straight-line, 5 years | 定額法 |
| Land, art ≥ ¥1M (non-displayed) | Non-depreciable | — |

- **定額法 (Straight-line):** annual = acquisition cost × SL rate (1/useful life), prorated monthly in acquisition year (month of service start counts as a full month).
- **定率法 (200% Declining balance, post-2012 acquisitions):** rate = 2.0 ÷ useful life; annual = opening book value × rate; when computed amount < **guaranteed amount (取得価額 × 保証率)**, switch to **改定償却率 × 改定取得価額** for the remainder. Residual ¥1 memorandum value (備忘価額) retained until disposal.
- **Useful lives (法定耐用年数):** per the statutory table (耐用年数省令) — e.g., RC office building 50 yrs, wooden store 22 yrs, passenger car 6 yrs (light vehicles 4), PCs 4, server equipment 5, office furniture (metal) 15. Ship as versioned reference data with a guided picker (asset-type wizard, since misclassification is a top Zeirishi correction).
- **Tax nature:** for corporations, depreciation is deductible **up to the statutory limit (償却限度額) only if booked** (損金経理要件); under-booking is permanently fine, over-booking creates a 別表四 addback carried on 別表十六. The engine computes both book amount and tax limit and surfaces deviations.

### 3.2.2 Mid-year events

- Acquisitions: monthly proration (months in service ÷ 12, partial month rounds up).
- Disposals/sales: compute 固定資産除却損 / 売却損益 with JCT on the sale price; remove from the 固定資産台帳.
- Capital expenditure vs repair (資本的支出 vs 修繕費) decision tree (< ¥200,000 or ~3-year cycle → expense; formulaic 30%/continuity tests) built into the receipt-coding flow.

### 3.2.3 Depreciable-asset tax interplay (償却資産税 — local, 1.4%)

The January 31 declaration (償却資産申告書) to each municipality covers depreciable assets **except** vehicles and **except 一括償却資産** — but assets expensed under the SME ¥300k special **ARE included**. The asset register must therefore tag every asset's 償却資産税 status. Exemption threshold: assessed base < ¥1.5M per municipality.

### 3.2.4 Small-asset regimes (the three-tier decision the wizard automates)

| Tier | Japanese | Rule | 償却資産税 |
|---|---|---|---|
| < ¥100,000 (or useful life < 1 yr) | 少額の減価償却資産 | Immediate expense (消耗品費), any company | Excluded |
| ¥100,000 ≤ x < ¥200,000 | **一括償却資産 (lump-sum depreciable assets)** | Expense **1/3 per year over 3 years** (no proration), any company | **Excluded** |
| **< ¥300,000** | **中小企業者等の少額減価償却資産の特例 (SME minor-sum immediate write-off)** | **Immediate full expense**, capped at **¥3,000,000 aggregate per fiscal year**; requirements: **Blue Return** SME (capital ≤ ¥100M, not an excluded large-subsidiary, employees ≤ 300), asset detail attached to the return (明細書), **assets acquired for lending/leasing excluded** (2022 reform). A sunset-dated measure historically renewed every 2 years (last extension covered acquisitions through 2026-03-31; verify renewal in each year's tax reform — keep as a dated parameter) | **Included** |

The wizard recommends the optimal tier per asset (e.g., a ¥180,000 PC: 一括償却 saves 償却資産税 but spreads deduction; ¥300k special front-loads deduction) and tracks the ¥3M annual cap with a running meter.

### 3.2.5 Year-end output

- Posting: `Dr 減価償却費 / Cr 減価償却累計額` (indirect method, 間接法) or `Cr 各資産` (direct method, 直接法 — common in SME practice; tenant setting).
- Working papers: full **固定資産台帳**, per-asset schedule feeding **別表十六(一)(二)(七)(八)** (§4.2) and the 償却資産申告書 data set.

## 3.3 Provisions & Allowances (引当金, *Hikiate-kin*)

### 3.3.1 Allowance for doubtful accounts (貸倒引当金, *Kashidaore Hikiate-kin*)

Tax-deductible **only for SMEs** (capital ≤ ¥100M and not 100%-owned by a large corporation; plus banks/insurers etc.). Two layers:

1. **Individually assessed receivables (個別評価金銭債権):** counterparties in bankruptcy, rehabilitation, suspension of bank transactions, etc. — deduct 50–100% per statutory tests; wizard collects the legal-status evidence per debtor.
2. **Collectively assessed (一括評価金銭債権):** remaining year-end receivables (売掛金, 受取手形, 貸付金 — net of "amounts not substantively receivable" (実質的に債権とみられない金額), e.g. payables owed to the same counterparty, when applying the statutory rate; provide guided netting) × rate:
   - **Statutory rate (法定繰入率)** — SMEs only: wholesale/retail **1.0%** (10/1000), manufacturing **0.8%**, finance/insurance **0.3%**, installment retail etc. **1.3%**, other **0.6%**;
   - or **actual historical loss ratio (貸倒実績率)** — engine computes from trailing 3-year write-off history; pick the larger benefit.
3. Mechanics: prior-year allowance is reversed into income (洗替法): `Dr 貸倒引当金 / Cr 貸倒引当金戻入益` then `Dr 貸倒引当金繰入 / Cr 貸倒引当金`. Feeds **別表十一(一)・(一の二)**.

Actual bad-debt write-offs (貸倒損失) have separate strict tests (legal extinguishment / full uncollectibility / 1-year trade suspension + memo value ¥1) — checklist-driven evidence capture, because this is a classic audit battleground.

### 3.3.2 Accrued bonuses & retirement benefits (賞与引当金・退職給付引当金)

- **Book treatment:** accrue bonuses earned but unpaid at year-end (賞与引当金) and retirement obligations (退職給付引当金) per 中小企業の会計に関する基本要領 ("中小会計要領" — the SME accounting framework SHIME's statements follow).
- **Tax treatment: NOT deductible** (these statutory provisions were abolished for tax) → automatic **別表四 addback** (加算・留保) and **別表五(一)** tracking; reversal recognized when actually paid (減算).
- Distinguish from **未払賞与 deductible exception:** a bonus is deductible as 未払金 if the amount is communicated to each employee by year-end, paid within 1 month, and expensed in the period — wizard tests the three conditions before choosing 未払費用 vs 引当金 routing.

## 3.4 Prepaid / Deferred / Accrued Items — Cut-off Engine (経過勘定)

| Item | Japanese | Logic |
|---|---|---|
| Prepaid expenses | 前払費用 | Service periods spanning year-end → split; portion beyond 1 year → 長期前払費用. Recurring contracts (insurance, rent, subscriptions, maintenance) get a coverage-period attribute at posting time so the engine can compute splits automatically |
| **Short-term prepaid special (短期前払費用の特例)** | — | If paid within the period and covering services **≤ 1 year ahead**, and treated consistently every year, the full payment may be deducted when paid (no split) — common for annual rent/insurance prepayments. Engine: per-contract election flag with consistency enforcement (warn if the tenant flip-flops) |
| Accrued expenses | 未払費用 | Continuous services received, unbilled/unpaid: final-month payroll (when payroll spans the cut-off), utilities, interest, social insurance employer share for the final month |
| Other payables | 未払金 | Determined one-off obligations (e.g., year-end purchases delivered, invoice next period). 債務確定主義 (debt-determination principle) test: obligation established + cause occurred + amount reasonably computable by year-end |
| Deferred revenue | 前受収益 / 前受金 | Receipts for next-period services → liability; revenue recognition on delivery/period basis (SMEs follow 引渡基準/役務完了基準; the new revenue standard is optional for non-audited SMEs) |
| Accrued revenue | 未収収益 / 未収入金 | Earned, unbilled interest/rent/fees |

The wizard renders a **cut-off worksheet**: every recurring contract with coverage dates, the computed split, and the proposed entry — the single biggest time-saver for the reviewing Zeirishi.

## 3.5 Other standard closing items (checklist continuation)

- Foreign currency balances: revalue monetary items at period-end TTM (発生時換算法/期末時換算法 per election; FX gains/losses 為替差損益).
- 役員報酬 conformity scan (§2.1 — flags any mid-year change for the 別表四 addback discussion).
- Director/related-party balances: deemed interest on 役員貸付金 (認定利息), rent-free issues.
- Non-deductible taxes coding audit: 延滞税/加算税/罰金 (penalties — never deductible), 法人税・住民税 (non-deductible), vs 事業税 (deductible when **filed**, i.e., prior-year enterprise tax paid this year — automatic 別表四 減算/加算 schedule).
- 売上計上基準 cut-off test: shipments/deliveries around year-end vs invoice dates (出荷基準/検収基準 consistency).

## 3.6 Consumption tax settlement & the tax provision (the final loop)

**JCT settlement entry (tax-exclusive method 税抜経理):**

```
Dr 仮受消費税 (Output JCT suspense)      XXX
   Cr 仮払消費税 (Input JCT suspense)        XXX
   Cr 未払消費税等 (JCT payable)             XXX   ← amount per the JCT return (§4.4)
   Cr/Dr 雑収入 / 雑損失                     (rounding & non-deductible-input differences)
```

**Corporate/local tax provision:** after Steps 1–5 produce pre-tax accounting income, the tax engine (§4.2–4.3) computes national & local taxes; post `Dr 法人税、住民税及び事業税 / Cr 未払法人税等`. Because 事業税 affects next year's deduction and 住民税均等割 is income-independent, the engine runs the **circular computation** (provision ↔ 別表四) to convergence automatically — a step that is manual agony in spreadsheet practice.

**Final gate:** lock the fiscal year (年次締め); generate the closing package (§4); open next period with rolled-forward balances and the 別表五(一)/(二) carryforward state.

---

# Module 4 — Year-End Reporting & Corporate Tax Return Output

**Statutory deadline architecture:** corporate tax (法人税), local corporate taxes (via eLTAX), and consumption tax (消費税) returns are due **within 2 months after fiscal year-end**, with payment due the same day. A 1-month **filing** extension (申告期限の延長の特例) is available for corporate/local taxes (and, by election, consumption tax) where the AGM convenes late — but **payment must still be estimated and made within 2 months** to avoid interest (利子税). The calendar engine must model: filing due date, payment due date, extension status, interim (中間) prepayment obligations, and the Jan-31 cluster (法定調書, 給与支払報告書, 償却資産申告).

## 4.1 Financial Statements (決算書 / 財務諸表, *Kessansho / Zaimu Shohyō*)

Per the Companies Act (会社法計算書類) — SHIME generates, bilingually, with the Japanese version being the statutory original:

| Statement | Japanese | Romaji | Notes |
|---|---|---|---|
| Balance Sheet | 貸借対照表 | Taishaku Taishō-hyō | Account-form (勘定式) or report-form (報告式); Companies-Act classification (流動/固定/繰延; 純資産 section per 会社計算規則) |
| Profit & Loss Statement | 損益計算書 | Son'eki Keisansho | Step format: 売上総利益 → 営業利益 → 経常利益 → 税引前当期純利益 → 当期純利益 (the 経常利益 "ordinary income" subtotal is a Japanese banking-culture KPI — preserve it) |
| Statement of Changes in Equity | 株主資本等変動計算書 | Kabunushi Shihon-tō Hendō Keisansho | Mandatory; ties retained-earnings movement incl. dividends to 別表五(一) |
| Notes | 個別注記表 | Kobetsu Chūki-hyō | SME-scale notes (going concern not required for 非公開会社; accounting policies, 中小会計要領 adoption note) |
| Manufacturing Cost Report | 製造原価報告書 | Seizō Genka Hōkokusho | **If applicable** (manufacturers/construction 完成工事原価報告書): 材料費/労務費/経費 → 当期総製造費用 → ±仕掛品 → 当期製品製造原価, feeding the P/L COGS line. Requires the CoA's manufacturing-account segment (製造原価科目) toggle per tenant |
| Detail of SG&A | 販売費及び一般管理費の明細 | — | Conventional attachment |

**Companion statutory attachments for the tax return:**

- **勘定科目内訳明細書 (Breakdown Statements of Account Balances)** — ~16 standardized schedules itemizing year-end balances: deposits by bank, AR/AP by counterparty (with address & corporate number), loans & interest by lender, 役員報酬 by officer, rent by property/lessor, 仮払金/貸付金 details, etc. **e-Tax requires fixed CSV layouts — SHIME auto-fills 100% of these from subledgers** (this is hours of Zeirishi clerk time today).
- **法人事業概況説明書 (Corporate Business Overview)** — mandatory NTA form: headcount, branch count, monthly sales/wages table, accounting software usage, e-commerce flags. Auto-fill from ledger + HR data.
- **適用額明細書** — mandatory whenever SME special measures (reduced rate, ¥300k asset expensing, etc.) are claimed; auto-generated from the incentives actually used.

## 4.2 Corporate Tax Return (法人税申告書, *Hōjinzei Shinkokusho*) — the Schedules ("Beppyō", 別表)

The return is a graph of interdependent schedules. SHIME's **reconciliation engine** owns the data flow; the Zeirishi reviews/overrides with full audit trail.

### 4.2.1 Schedule map (SME-relevant core set)

| Schedule | Japanese | Function | Fed by |
|---|---|---|---|
| 別表一(一) + 次葉 | Tax computation & return cover | Taxable income × rates → national corporate tax; 地方法人税 (10.3% of corporate tax) | 別表四 |
| 別表二 | 同族会社の判定 | Family-company determination (shareholder concentration test; 特定同族会社 retained-earnings tax rarely hits SMEs with capital ≤ ¥100M) | Shareholder registry master |
| **別表四** | **所得の金額の計算に関する明細書** | **Accounting profit → taxable income reconciliation** (§4.2.2) | P/L + adjustment subledger |
| **別表五(一)** | **利益積立金額・資本金等の額の計算** | Tax-basis retained earnings & capital; carries **temporary differences (留保)** across years | 別表四 留保 column |
| **別表五(二)** | **租税公課の納付状況** | Taxes paid/payable tracking (corporate, resident, enterprise, 源泉) by 充当金取崩し/仮払/損金経理 | Tax payment ledger |
| 別表七(一) | 欠損金の損金算入 | Loss carryforward register (10 years; SME 100% offset) | Prior returns + current 別表四 |
| 別表八(一) | 受取配当等の益金不算入 | Dividend-received exclusion | Dividend income lines |
| 別表十一(一)(一の二) | 貸倒引当金 | Doubtful-debt allowance limits (§3.3.1) | AR/receivable subledger |
| 別表十五 | 交際費等の損金算入 | Entertainment-expense limitation (§2.1.2: ¥8M flat vs 50%食事) | 交際費/会議費 coding metadata |
| 別表十六(一)(二) | 減価償却 (定額法/定率法) | Per-method depreciation limit vs booked | Fixed-asset register |
| 別表十六(七)(八) | 少額・一括償却資産 | ¥300k special detail / 3-yr lump-sum detail | Asset register tiers (§3.2.4) |
| 別表六(一)等 | 所得税額控除 | Credit for WHT on interest/dividends received | Bank/dividend entries |

### 4.2.2 別表四 — the reconciliation engine (accounting profit → taxable income)

```
Taxable income = 当期純利益 (Net income per P/L)
  + 加算 (Additions — non-deductible expenses / unrecognized income)
  − 減算 (Subtractions — non-taxable income / additionally deductible items)
```

Standard automated adjustment catalog (each tagged 留保 (temporary → 別表五(一)) vs 社外流出 (permanent)):

| Direction | Item | Source in SHIME |
|---|---|---|
| 加算 | 損金経理をした法人税・住民税 (booked corporate/resident tax) | 法人税等 postings |
| 加算 | 損金不算入の租税公課: penalties (罰金・加算税・延滞税) | 租税公課 sub-coding |
| 加算 | 交際費等の損金不算入額 | 別表十五 |
| 加算 | 減価償却超過額 (excess depreciation) | 別表十六 |
| 加算 | 引当金繰入超過 (賞与・退職給付引当金 etc.) | §3.3.2 provisions |
| 加算 | 役員給与の損金不算入 (non-conforming directors' pay) | §2.1 conformity scan |
| 加算/減算 | 棚卸資産・売上計上漏れ等の申告調整 | Close-out findings |
| 減算 | 受取配当等の益金不算入 | 別表八 |
| 減算 | 納税充当金から支出した事業税 (prior-year enterprise tax paid) | 別表五(二) flow |
| 減算 | 還付金等の益金不算入 | Refund postings |
| 減算 | 欠損金の当期控除 | 別表七 |

The engine maintains a **typed adjustment ledger** so that every 別表四 line is traceable to journal entries/documents (one-click drill-down for the Zeirishi — the core verification UX).

### 4.2.3 別表五(一)/(二) — carryforward state machine

- 別表五(一) is the **tax-basis equity roll-forward**: opening 利益積立金 ± current-year 留保 adjustments = closing; must tie to: accounting retained earnings ± cumulative temporary differences ± 未納法人税等. SHIME validates the **検算式** (期首利益積立金 + 別表四留保所得 − 中間・確定税額 = 期末利益積立金) automatically every run.
- 別表五(二) tracks each tax (national corporate, 地方法人税, prefectural/municipal inhabitant, enterprise, 源泉所得税) across: opening payable → accrued → paid (by charge against provision 充当金取崩し / interim 仮払経理 / expensed 損金経理) → closing payable. Feeds both 別表四 and next year's opening state. **This is a persistent multi-year entity in the data model, not a report.**

### 4.2.4 National corporate tax rates (SME, capital ≤ ¥100M and not wholly-owned by large corp)

| Income slice | Rate |
|---|---|
| First ¥8,000,000 of annual income | **15%** (reduced rate, 租税特別措置 — periodically renewed; raised to 17% for companies with income > ¥1B by the FY2025 reform; keep as dated parameters) |
| Above ¥8,000,000 | **23.2%** |
| 地方法人税 (national surtax routed to local finance) | **10.3% × corporate tax amount** |

(Defense-funding surtax (防衛特別法人税, ~4% of corporate tax with a ¥5M credit, effective for fiscal years from April 2026 per the FY2025 reform) — parameterize; most micro-SMEs fall under the credit threshold but the engine must compute it.)

## 4.3 Local Taxes (地方税) — filed via eLTAX

### 4.3.1 Corporate Inhabitant Tax (法人住民税, *Hōjin Jūminzei*) — prefectural + municipal

Two components, **both filed to every prefecture/municipality where the company has an office (分割基準 apportionment by employee count for multi-location tenants):**

1. **Corporate-tax levy (法人税割):** national corporate tax amount × rate — standard rates **prefectural 1.0% + municipal 6.0%** (= 7.0% combined; Tokyo 23-ku special wards: a single metropolitan filing at the combined rate; many municipalities apply 超過税率 excess rates — **rate master must be per-municipality and versioned**).
2. **Per-Capita Levy (均等割, *Kintō-wari*):** **fixed amount owed even in loss years** — the line item that surprises foreign founders. Determined by **capital-plus-capital-reserve bracket × employee-count bracket**, prorated by months with an office:

| Capital etc. | Employees ≤ 50 | Employees > 50 |
|---|---|---|
| ≤ ¥10M | **¥70,000/yr** (pref ¥20,000 + muni ¥50,000) — the standard micro-SME amount | ¥140,000 |
| ¥10M–¥100M | ¥180,000 | ¥200,000 |
| ¥100M–¥1B | ¥290,000 | ¥530,000 |
| (larger brackets continue to ¥3.8M) | | |

### 4.3.2 Corporate Enterprise Tax (法人事業税, *Hōjin Jigyōzei*) + Special Corporate Enterprise Tax (特別法人事業税)

- SMEs (capital ≤ ¥100M) are **income-taxed only** (所得割); companies with capital > ¥100M face size-based taxation (外形標準課税: 付加価値割+資本割) — out of core SME scope but the engine must detect the threshold (and the 2024 anti-avoidance rules for capital reductions).
- Standard graduated rates (income-based, 普通法人, 軽減税率適用法人):

| Annual income slice | Standard rate |
|---|---|
| ≤ ¥4,000,000 | **3.5%** |
| ¥4,000,000–¥8,000,000 | **5.3%** |
| > ¥8,000,000 | **7.0%** |

  (Multi-prefecture companies with capital ≥ ¥10M lose the graduation; Tokyo etc. apply 超過税率 — per-prefecture rate master.)
- **特別法人事業税:** income-based enterprise tax (standard-rate amount) × **37%** (for income-taxed ordinary corporations); collected with 事業税 via eLTAX.
- **Deductibility quirk the engine must own:** enterprise tax (+特別法人事業税) is **deductible for corporate tax — but in the fiscal year it is FILED/paid**, not the year accrued → systematic 別表四/五 adjustments (§4.2.2) and effective-tax-rate impact (combined statutory effective rate for an SME ≈ 33–34% above ¥8M income; ~21–23% under it — the simulator should display this).

### 4.3.3 Interim (中間) obligations

- Corporate/inhabitant/enterprise tax: interim return & prepayment due **within 2 months after the 6-month mark** when prior-year national corporate tax > ¥200,000 (predecessor-基準 or provisional-account 仮決算 method — engine computes both, recommends cheaper).
- Consumption tax: 0/1/3/11 interim payments depending on prior-year national JCT (>¥480k / >¥4M / >¥48M). Calendar engine auto-schedules.

## 4.4 Consumption Tax Return (消費税及び地方消費税の確定申告)

Final reconciliation of the year's JCT, due in the same 2-month window (extension electable if corporate tax is extended).

### 4.4.1 Regime determination tree (per fiscal year — the engine maintains an election/notification register with statutory deadlines)

```
Taxable person? — base period (基準期間 = FY-2) taxable sales > ¥10M, or specified-period test,
                  or voluntary 課税事業者選択, or qualified-invoice issuer registration (→ always taxable)
   ├── 2割特例 eligible? (became taxable only due to invoice registration; periods through the one
   │    including 2026-09-30) → JCT = output tax × 20%; per-return election
   ├── 簡易課税 (Simplified) — elected (届出 by day before period start; 2-year lock-in;
   │    base-period taxable sales ≤ ¥50M)
   └── 本則課税 / 一般課税 (Principle method) — default
```

### 4.4.2 Principle method (本則課税) computation

- JCT payable = output tax − creditable input tax (per the 積上げ/割戻し method matrix §1.2.6, with 80%/50% transitional buckets §1.2.4).
- **Taxable-sales-ratio (課税売上割合) gate:** if taxable sales ≤ ¥500M **and** ratio ≥ 95% → full input credit (全額控除). Otherwise apportion by **個別対応方式** (item-by-item: 課税対応/非課税対応/共通対応) or **一括比例配分方式** (pro-rata; 2-year lock) — engine computes both and recommends. This requires the **3-way purpose tag on purchase lines** for tenants with significant non-taxable revenue (clinics, real estate, finance).
- Fixed-asset watch rules: 調整対象固定資産 (≥¥1M) and 高額特定資産 (≥¥10M) lock-in periods restricting return to 免税/簡易 — compliance calendar warnings.

### 4.4.3 Simplified method (簡易課税)

Input credit = output tax × **deemed purchase ratio (みなし仕入率)** by business type; multi-type businesses apportion by sales (with the 75% dominance shortcut):

| Type | Business | Deemed ratio |
|---|---|---|
| 第1種 | Wholesale | 90% |
| 第2種 | Retail | 80% |
| 第3種 | Manufacturing/construction/agriculture | 70% |
| 第4種 | Other (incl. restaurants) | 60% |
| 第5種 | Services/finance/transport | 50% |
| 第6種 | Real estate | 40% |

The engine requires per-revenue-line business-type tagging for 簡易課税 tenants, and runs an annual **本則 vs 簡易 vs (2割特例) simulation** to advise the next-year election before its deadline — a signature "Zeirishi-grade" feature.

### 4.4.4 Output forms

申告書第一表・第二表 (一般用/簡易課税用), 付表1-3・2-3 (general) or 付表4-3・5-3 (simplified), plus the 還付申告明細書 for refund positions (typical for exporters — zero-rated sales with full input credit). National (7.8%/6.24%) and local (2.2%/1.76%) portions computed separately as the forms require.

## 4.5 e-Tax / eLTAX Output Architecture

| Channel | Scope | Formats SHIME must produce |
|---|---|---|
| **e-Tax (国税電子申告・納税システム)** | Corporate tax, consumption tax, 法定調書 | ① **CSV per NTA-published record layouts** for 別表 attachments, 勘定科目内訳明細書, 法定調書; ② **financial statements as e-Tax XBRL** (勘定科目コード mapping to the NTA standard taxonomy — design the CoA with this mapping from day 1); ③ **.xtx return-data files** importable into e-Tax software / 税理士 practice suites (達人, 魔法陣, JDL, TKC, ミロク); ④ (later) direct submission via the **e-Tax API/SDK** as a registered software vendor with 利用者識別番号 + Zeirishi 電子署名 flows |
| **eLTAX (地方税ポータル)** | Inhabitant tax, enterprise tax, 給与支払報告書, 償却資産申告 | PCdesk-importable data / eLTAX API (CSV/XML per spec); multi-municipality bundle filing |
| **Paper fallback** | All | Pixel-faithful PDF renderings of every statutory form (OCR-band compliant where required) — non-negotiable for the Zeirishi review workflow even when e-filing |

**MVP stance:** generate *review-ready data + PDFs + import files* (the Zeirishi files via their own credentials and software — consistent with §0.3 legal positioning); direct API e-filing is a later milestone.

---

# Module 5 — Bilingual (JA/EN) Product Requirements

1. **Canonical-code architecture:** every account title, tax category, form line, and enum is a **language-neutral code** with `ja` and `en` display strings (i18n tables, not hardcoded). Statutory outputs render Japanese; management outputs render either/both (side-by-side bilingual PDF mode for foreign directors + Japanese bank/Zeirishi audiences).
2. **Terminology registry:** the glossary in Appendix A is a *product asset* — the same registry drives UI labels, report headers, and in-app education tooltips ("What is 均等割?" in English).
3. **Input bilinguality:** descriptions/memos accept both languages; counterparty master stores 商号 (Japanese legal name), カナ, and romanized name; full-text search must handle Japanese tokenization (kuromoji/MeCab analyzers) **and** romaji.
4. **Education layer:** contextual explainers for every Japan-specific concept at the point of use (e.g., when a user codes a ¥12,000/person dinner, explain 交際費 consequences in English). This layer is the moat for the foreign-SME segment.
5. **Date/era handling:** statutory forms use 和暦 (Reiwa era); UI uses Gregorian with era auto-conversion. Fiscal-year labels follow Japanese convention (e.g., 第5期 / FY2026/3).

---

# Module 6 — System Architecture & Technology Stack Recommendations

## 6.1 Multi-Tenancy Architecture

### 6.1.1 Tenant model

Two first-class tenant types sharing one platform:

- **Company tenant (SME):** one legal entity = one tenant; holds books, documents, masters, closings.
- **Practice tenant (Zeirishi firm / accounting office):** a workspace that is **granted scoped advisor access into many company tenants** (review, adjust-with-audit-trail, export). This cross-tenant *advisor grant* is the product's collaboration core and must be modeled explicitly (grant scope, period, role: viewer / adjuster / signer; revocable; fully logged).

### 6.1.2 Isolation strategy — recommendation: **shared database, shared schema, `tenant_id` partitioning + PostgreSQL Row-Level Security (RLS)**

| Strategy | Pros | Cons | Verdict |
|---|---|---|---|
| DB-per-tenant | Hard isolation; easy per-tenant restore | Operationally explosive at 10k+ SME tenants; cross-tenant advisor queries painful; migration fan-out | Reserve for rare enterprise/regulated tenants |
| Schema-per-tenant | Mid isolation | Same migration fan-out; PG catalog bloat at scale | No |
| **Shared schema + `tenant_id` + RLS** | One migration path; cheap per-tenant cost (SME ARPU is low — unit economics matter); advisor cross-tenant access via grant table; pooled connections | Requires discipline: RLS policies on every table, `tenant_id` in every index, automated tests that assert isolation | **Recommended** |

Mandatory safeguards: RLS `FORCE`d for the app role (no bypass), `tenant_id` as the leading column of composite indexes/PKs, per-request tenant context set via `SET LOCAL`, CI test-suite that fuzzes cross-tenant access, per-tenant logical export (compliance: tenant data portability & the 7–10-year retention on termination), and per-tenant encryption envelope keys (KMS) for document objects.

### 6.1.3 Domain architecture (services/modules)

A **modular monolith first** (single deployable, strict module boundaries), extracting services only when scale demands:

```
core-ledger        — journal entries (append-only), accounts, periods, locks, audit chain
documents          — Denchōhō vault: ingestion, hashing, versioning, timestamping, search
tax-engine         — pure, versioned, side-effect-free calculators: JCT, depreciation,
                     beppyō reconciliation, local taxes (parameterized by effective-dated law tables)
partners           — counterparty master + NTA registry verification
payroll-bridge     — payroll-register import, journal templates, 預り金 reconciliation
closing            — kessan wizard state machine, working papers, sign-off workflow
reporting          — statements, trial balances, statutory PDFs, XBRL/CSV/xtx exporters
collab             — practice tenants, advisor grants, review threads, e-signature hooks
banking            — feeds/CSV import, matching/auto-journal rules engine
platform           — authn (incl. SSO), authz/RBAC, i18n, billing, notifications, calendar/deadlines
```

**The tax-engine as pure functions over effective-dated parameter tables is the most important design decision in this document** — Japanese tax parameters change every April (and mid-year, e.g. 2026-10-01 invoice transition); calculations must be reproducible exactly as of any past law state for amended returns and audits.

## 6.2 Database: SQL vs NoSQL — the case for each, and the decision

### 6.2.1 The case for SQL (relational, ACID)

1. **Double-entry bookkeeping is relational integrity.** Every journal entry must balance (Σdebits = Σcredits) atomically; subledgers must tie to control accounts; 別表五 carryforwards must roll exactly. These are multi-row invariants → **ACID transactions and constraints are not optional**.
2. **Statutory reporting = heavy ad-hoc joins/aggregations** (trial balances at arbitrary dates, per-counterparty breakdowns, per-tax-rate subtotals, 16 内訳書 schedules). SQL with proper indexing/materialized views is purpose-built for this.
3. **Auditability:** Denchōhō "excellent books" requires correction/deletion history and entry↔ledger traceability — trivially expressible as append-only tables + FK lineage.
4. **The schema is stable and well-known.** Accounting's domain model has been stable for 500 years; schema flexibility (NoSQL's main pitch) is not needed in the core.
5. **RLS-based multi-tenancy** (§6.1.2) is a relational feature.

### 6.2.2 The case for NoSQL (document/key-value/search)

1. **Document vault payloads:** OCR outputs, e-invoice JSON (Peppol/JP PINT), bank-feed raw records, and email metadata are heterogeneous and nested — document-shaped.
2. **Audit/event logs:** high-write append-only streams with no joins benefit from log-structured stores.
3. **Search:** Japanese full-text + faceted document search (date/amount/counterparty per Denchōhō) wants an inverted index, not B-trees.
4. **Horizontal scale & burst absorption:** OCR/import pipelines spike at month-end and in April–May; queue + KV patterns absorb this.
5. **Caching:** session, rate-limit, computed-report caches.

### 6.2.3 Decision: **PostgreSQL-centered polyglot**

| Concern | Store | Rationale |
|---|---|---|
| Ledger, masters, tax state, tenancy | **PostgreSQL (managed: Aurora PostgreSQL / Cloud SQL), Tokyo region** | §6.2.1; `JSONB` columns cover 90% of the "flexible document" need (OCR payloads, form-line maps) without a second database; mature RLS; PITR backups |
| Binary documents (PDF/images) | **S3-compatible object storage with Object Lock (WORM) + versioning** | Denchōhō tamper-prevention (§1.1.1 option (c)) maps directly to immutable versioned objects + SHA-256 hash chain recorded in PG |
| Full-text & faceted search | **OpenSearch/Elasticsearch with kuromoji** (phase 2; PG `pg_trgm`/FTS suffices for MVP) | Japanese tokenization + Denchōhō 3-key/range/AND search at scale |
| Cache/queues | **Redis + a queue (SQS or pg-boss initially)** | Import/OCR pipelines, report rendering jobs |
| Analytics (later) | Columnar replica (e.g., ClickHouse/BigQuery) | Cross-tenant anonymized benchmarking, practice-tenant dashboards |

**Explicitly rejected as system-of-record:** MongoDB/DynamoDB-style primary stores — eventual consistency and weak multi-row transactional guarantees push balancing/integrity into application code, which is precisely the risk a compliance product cannot carry. NoSQL components are adopted *around* the relational core, not instead of it.

**Money representation:** JPY has **no fractional unit** — all amounts are `BIGINT` yen. Tax computations operate on integers with explicit, configurable rounding functions (per §1.2.2 once-per-invoice-per-rate). No floating point anywhere in money paths (enforced by lint rule + branded integer types).

## 6.3 Programming Languages & Frameworks — cases and recommendation

### 6.3.1 Backend candidates

| Option | Case for | Case against |
|---|---|---|
| **TypeScript (Node.js + NestJS)** ✅ recommended | One language across web/mobile/backend → small founding team velocity; strong typing for the tax-engine's enormous enum/parameter surface; first-class JSON for e-Tax CSV/XML/JSON pipelines; huge hiring pool in Japan & globally; NestJS gives Spring-like modular structure fitting §6.1.3 | CPU-bound batch (mass PDF/XBRL rendering) needs worker offloading; discipline required to keep types honest (mitigate: `strict`, no `any` in tax-engine, decimal/int branded types) |
| Kotlin/Java (Spring Boot) | Bulletproof typing, BigDecimal culture, enterprise trust (banks/Zeirishi suites are JVM-heavy); great for the tax engine | Slower iteration for a startup-sized team; splits the stack from the TS frontend; heavier infra |
| Go | Performance, simple deploys; great for banking/feed ingestion services | Weak expressiveness for deep domain modeling (sum types/pattern matching absent); reporting/templating ecosystem thinner |
| Ruby on Rails | Proven in this exact market (freee and Money Forward are Rails shops); fastest CRUD velocity | Dynamic typing vs a correctness-critical tax engine; long-term performance/typing costs |
| Python (Django/FastAPI) | OCR/ML adjacency; fast prototyping | Same typing concern; GIL for compute paths |

**Recommendation:** **TypeScript + NestJS modular monolith**, with the **tax-engine as an isolated, pure, exhaustively-typed package** (own repo/package, 100% property-based + golden-file test coverage against NTA published examples). If/when needed, compute-heavy renderers (PDF/XBRL) become worker services (Node workers first; Go/Rust only if profiling demands).

### 6.3.2 Frontend (web — the priority platform)

- **Next.js (React) + TypeScript**: SSR for fast first paint of heavy ledger tables, mature i18n (`next-intl`), the dominant talent pool.
- UI system: accessible component library (e.g., Radix-based) + **virtualized data grids** (journal/ledger views are the product's living room — keyboard-first entry like 弥生/勘定奉行 power users expect: full IME support, tab-flow optimized for 10-key, account-title incremental search by kana/romaji/code).
- PDF generation server-side (headless Chromium or a typesetting service) for pixel-faithful statutory forms.

### 6.3.3 Mobile (explicitly NOT prioritized — Phase 4)

| Option | Case |
|---|---|
| **React Native (Expo)** ✅ recommended | Reuses TS types/API clients/i18n from the web codebase; mobile scope is narrow (receipt camera capture → vault, approvals, dashboards) — no need for full ledger UX on mobile; OTA updates |
| Flutter | Excellent UI consistency; but introduces Dart as a second language for a team standardized on TS |
| Native (Swift/Kotlin) | Best camera/scan UX; double the cost for a non-priority surface |

Interim mobile answer for MVP: **responsive web + "email-this-receipt" ingestion address + LINE bot for receipt capture** (LINE is the de-facto channel for Japanese SME owners).

### 6.3.4 Infrastructure & cross-cutting

- **Cloud: AWS Tokyo (ap-northeast-1)** primary (data residency expectation of JP customers; Osaka ap-northeast-3 for DR). Managed: Aurora PostgreSQL, S3 (+Object Lock), OpenSearch, SQS, KMS, CloudFront/WAF.
- **Security/compliance program:** ISO 27001 → SOC 2 Type II; JIIMA software certifications (§1.1.2); 個人情報保護法 (APPI) compliance incl. My Number handling rules if payroll data is stored (マイナンバー is special-category — segregated, encrypted, access-logged store with strict need-to-know).
- Observability with per-tenant tracing; infrastructure as code (Terraform); blue/green deploys — **no deploy freezes needed except the April–May filing crunch freeze window** (operational calendar mirrors the tax calendar).
- External integrations roadmap: bank feeds (via aggregators such as Moneytree LINK / 電子決済等代行業者 partnerships — direct 更新系 APIs require registration; read-only via aggregator avoids this), AI-OCR (e.g., Google Document AI / JP-specialized vendors) with human-in-the-loop verification UI, NTA Web-APIs (§1.2.1), e-Tax/eLTAX (§4.5), Peppol Access Point (§1.2.7).

---

# Module 7 — Development Plan: Phases, MVPs & Milestones

> Sequencing principle: **compliance-bearing foundations first** (ledger immutability, document vault, tax dimensions), then the daily-use loop (because year-end quality is a function of daily data quality), then the closing/tax engine, then filing-format automation, then mobile/AI. Each phase ends with a usable product increment and a named milestone with exit criteria.

## Phase 0 — Foundation & Compliance Design (Milestone M0: "Blueprint frozen")

Scope:

- Detailed data model: ledger schema, tenancy + RLS policy set, document vault, effective-dated tax-parameter tables; CoA master with NTA e-Tax taxonomy mapping (§4.5) and ja/en registry.
- Tax-engine specification: JCT category lattice, rounding rules, depreciation algorithms, 別表四/五 dataflow — written as executable specs (golden test files from NTA examples & a partner Zeirishi's anonymized cases).
- JIIMA certification gap analysis; security architecture review; 税理士法 positioning review with counsel (§0.3).
- Recruit 2–3 **design-partner Zeirishi firms** and 5–10 foreign-run SME design partners.

Exit criteria: schema + tax-spec sign-off by partner Zeirishi; threat model approved; CI with isolation fuzz tests green on the skeleton.

## Phase 1 — MVP-1 "Compliant Daily Books" (Milestone M1: first paying tenant runs a full month)

The smallest product that is *legally meaningful*: an SME can keep Blue-Return-grade, Denchōhō-compliant, invoice-system-aware books in English.

- Multi-tenant core: company tenants, users/RBAC, practice tenants with advisor grants (read/comment).
- Journal engine: append-only entries with correction history (優良電子帳簿 semantics), period locks, standard CoA (ja/en), 補助科目, departments (部門) optional.
- Statutory ledger views: 仕訳帳, 総勘定元帳, subsidiary ledgers, trial balance (合計残高試算表) — screen + PDF + CSV.
- JCT dimension end-to-end: tax categories on every line, 8/10%, registered/non-registered counterparty with 80/50% transitional logic **(2026-10-01 switchover ready)**, partner master + NTA Web-API verification.
- Document vault (Denchōhō Pillar 3 + scanner storage): upload/email-in ingestion, mandatory metadata, hash/versioning/WORM, 3-key + range + AND search, journal linkage.
- Bank/credit-card **CSV import** + matching rules engine + auto-journal templates (payroll templates of §2.2.2 included); cash/suspense hygiene dashboards.
- Monthly close checklist & lock (§2.3); bilingual monthly report pack.
- Billing, onboarding (incl. **mid-year migration importer**: opening balances + counterparty + asset registers from freee/MF/弥生 CSV exports).

Exit criteria (M1): 5 design-partner tenants complete a real monthly close; Denchōhō search/immutability demo passes partner-Zeirishi audit simulation; p95 journal-grid latency target met.

## Phase 2 — MVP-2 "Operational Completeness" (Milestone M2: a tenant runs AR-to-cash and owns assets)

- Sales & qualified-invoice issuance: 適格請求書/適格簡易請求書/適格返還請求書 generation with §1.2.2 content & rounding rules, AR subledger, aging,入金 matching.
- AP workflow: received-invoice inbox (vault → proposed journal), payment batch export (全銀フォーマット Zengin file), 振込手数料 handling per §1.2.2.
- **Fixed-asset module:** register, useful-life picker, 定額/定率 engines with 保証率/改定償却率, the 3-tier small-asset wizard with ¥3M cap meter (§3.2.4), monthly provisional depreciation, 償却資産税 data set.
- Payroll bridge: payroll SaaS CSV/API import → §2.2 journals, 預り金 sub-account reconciliation, remittance calendar (10th-of-month, 納期の特例).
- JIIMA certification submissions (①②③ of §1.1.2).
- OpenSearch-backed document/journal search; LINE/email receipt capture.

Exit criteria (M2): tenants issue legally valid qualified invoices from SHIME; asset register reproduces partner-Zeirishi depreciation schedules to the yen; JIIMA filings accepted/in process.

## Phase 3 — MVP-3 "The Two-Month Window" (Milestone M3: a real fiscal year closed & filed through a Zeirishi)

The flagship: the **Kessan Wizard** (Module 3) + reporting/tax output (Module 4).

- Closing wizard state machine: Step-0 gates → inventory (棚卸表) → depreciation true-up → provisions (貸倒引当金 with 法定繰入率/実績率) → cut-off worksheet (短期前払費用 elections) → misc. checklist → JCT settlement → tax provision convergence loop (§3.6).
- Financial statements (会社法計算書類 full set incl. 株主資本等変動計算書, 個別注記表, 製造原価報告書 toggle) — bilingual.
- **Tax schedule engine:** 別表一/二/四/五(一)(二)/七/八/十一/十五/十六 + 適用額明細書; 勘定科目内訳明細書 auto-fill; 法人事業概況説明書; local taxes incl. 均等割 bracket master & multi-municipality apportionment; consumption tax return (本則 with 95%/個別対応 logic, 簡易, 2割特例 trailing support) + next-year election simulator.
- Outputs: statutory PDFs + e-Tax CSV layouts + xtx import files + eLTAX/PCdesk data (§4.5 MVP stance: Zeirishi files with own credentials).
- **Zeirishi review workspace:** working-paper binder with drill-down to journal/document, review threads, adjustment proposals (post-close adjusting entries with full lineage), sign-off & version freeze, engagement letter/fee module.
- Deadline/calendar engine: 2-month clock, extension status, interim payments, Jan-31 cluster.

Exit criteria (M3): ≥ 10 real companies' fiscal years closed in SHIME and filed by partner Zeirishi with **zero re-keying** into their tax software; 別表五(一) 検算式 passes on every tenant; closing time measured ≤ 25% of the firms' previous baseline.

## Phase 4 — Scale, Automation & Mobile (Milestone M4 → M6)

- **M4 "Hands-free input":** bank-feed aggregator integration (Moneytree LINK or equivalent), AI-OCR receipt/invoice extraction with confidence-scored human review, ML account-title suggestions (trained per-tenant + cross-tenant priors), Peppol Access Point (JP PINT) receive/send.
- **M5 "Direct filing & practice scale":** e-Tax API direct submission with 電子署名 flows; eLTAX API; practice-tenant portfolio dashboards (multi-client deadline board for the April–May crunch), bulk operations; 年末調整/法定調書 module decision (build vs partner).
- **M6 "Mobile & intelligence":** React Native app (receipt capture, approvals, KPI dashboard); cash-flow forecasting; tax simulation (役員報酬 optimization within 定期同額 constraints, 簡易課税 elections); anonymized benchmark analytics.

## Cross-phase workstreams

| Workstream | Cadence |
|---|---|
| **Annual tax-reform parameter updates (税制改正対応)** | Every Dec (outline 大綱) → design; Mar (law passage) → ship before Apr 1; mid-year specials (e.g., 2026-10-01 invoice 80→50% switchover) |
| Compliance certifications | JIIMA (Phase 2), ISO 27001 (Phase 2–3), SOC 2 (Phase 4) |
| Partner-Zeirishi council | Monthly review of engine outputs vs real cases — the QA backbone |
| Bilingual content/education layer | Continuous; every new feature ships ja+en with explainers |

---

# Module 8 — Key Risks & Open Questions

| # | Risk / question | Mitigation / decision needed |
|---|---|---|
| 1 | **Zeirishi-law boundary** (§0.3): features like "auto-prepared 別表四" must remain self-preparation tooling | Counsel-reviewed UX copy; Zeirishi-files-it default flow; no per-client tax advice from the operator/AI |
| 2 | Annual statutory churn (rates, sunsets: ¥300k asset special, 少額特例 2029, 2割特例 2026, defense surtax 2026) | Effective-dated parameter tables + the December reform-watch workstream; nothing hardcoded |
| 3 | e-Tax/eLTAX format drift (layouts change yearly) | Exporters as versioned adapters with golden-file tests per form-year |
| 4 | Incumbent competition (freee/MF/弥生) | Differentiate on: English-first UX, Zeirishi-collaboration workflow, year-end automation depth — not on feature breadth |
| 5 | Bank-feed access economics (aggregator fees vs 電代業 registration) | Start CSV-first; negotiate aggregator deal at Phase 4 volume |
| 6 | My Number / APPI exposure via payroll bridge | Keep payroll *computation* out of scope (import registers only); if storing マイナンバー becomes necessary, isolate in a dedicated encrypted service |
| 7 | Trust ceiling for AI suggestions in a compliance product | All automation = *proposals* requiring human confirmation; confidence display; immutable provenance of who/what posted every entry |
| 8 | Single-region disaster vs 7–10y retention duty | Cross-region (Osaka) replication of PG + S3; annual restore drills |

---

# Appendix A — Terminology Registry (excerpt; full registry is a product asset, §5.2)

| Japanese | Romaji | English |
|---|---|---|
| 税理士 | Zeirishi | Certified Public Tax Accountant |
| 決算 / 決算整理 | Kessan / Kessan seiri | Financial closing / year-end adjusting entries |
| 電子帳簿保存法 | Denshi Chōbo Hozon Hō | Electronic Books Preservation Act |
| 適格請求書(等保存方式) | Tekikaku Seikyūsho (-tō Hozon Hōshiki) | Qualified Invoice (System) |
| 青色申告 | Aoiro Shinkoku | Blue Return |
| 仕訳帳 / 総勘定元帳 | Shiwake-chō / Sō-kanjō Moto-chō | Journal / General Ledger |
| 勘定科目 / 補助科目 | Kanjō kamoku / Hojo kamoku | Account title / Sub-account |
| 仮払金 / 仮受金 | Karibarai-kin / Kariuke-kin | Suspense payments / Suspense receipts |
| 福利厚生費 / 法定福利費 / 交際費 / 会議費 | Fukuri kōsei-hi / Hōtei fukuri-hi / Kōsai-hi / Kaigi-hi | Welfare / statutory welfare / entertainment / meeting expenses |
| 源泉徴収 / 住民税 / 社会保険 | Gensen chōshū / Jūminzei / Shakai hoken | Income tax withholding / resident tax / social insurance |
| 預り金 / 標準報酬月額 | Azukari-kin / Hyōjun hōshū getsugaku | Withholdings payable / standard monthly remuneration |
| 棚卸資産 / 棚卸表 / 低価法 / 最終仕入原価法 | Tanaoroshi shisan / -hyō / Teika-hō / Saishū shiire genka-hō | Inventory / inventory list / lower-of-cost-or-market / last-purchase-cost method |
| 減価償却 / 定額法 / 定率法 / 耐用年数 | Genka shōkyaku / Teigaku-hō / Teiritsu-hō / Taiyō nensū | Depreciation / straight-line / declining-balance / statutory useful life |
| 少額減価償却資産 / 一括償却資産 | Shōgaku genka shōkyaku shisan / Ikkatsu shōkyaku shisan | Minor-sum depreciable assets / lump-sum (3-yr) depreciable assets |
| 貸倒引当金 / 法定繰入率 | Kashidaore hikiate-kin / Hōtei kuriire-ritsu | Allowance for doubtful accounts / statutory provision rate |
| 前払費用 / 未払費用 / 前受収益 / 未収収益 | Maebarai hiyō / Mibarai hiyō / Maeuke shūeki / Mishū shūeki | Prepaid / accrued expenses; deferred / accrued revenue |
| 貸借対照表 / 損益計算書 / 製造原価報告書 | Taishaku taishō-hyō / Son'eki keisansho / Seizō genka hōkokusho | Balance sheet / P&L / manufacturing cost report |
| 法人税申告書 / 別表 | Hōjinzei shinkokusho / Beppyō | Corporate tax return / schedules |
| 法人住民税 / 均等割 / 法人事業税 / 特別法人事業税 | Hōjin jūminzei / Kintō-wari / Hōjin jigyōzei / Tokubetsu hōjin jigyōzei | Corporate inhabitant tax / per-capita levy / enterprise tax / special enterprise tax |
| 消費税 / 本則課税 / 簡易課税 / みなし仕入率 | Shōhizei / Honsoku kazei / Kan'i kazei / Minashi shiire-ritsu | Consumption tax / principle method / simplified method / deemed purchase ratio |
| 月次締め / 年次締め | Getsuji shime / Nenji shime | Monthly close / annual close |

---

*End of research deliverable. No project code has been initiated, per instructions. Next action upon approval: Phase 0 kickoff (data-model & tax-engine specification sprints with design-partner Zeirishi).*




