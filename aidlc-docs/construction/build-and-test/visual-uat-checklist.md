# Visual UAT Checklist — UI Shell & Theme

## Prerequisites

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Login: `admin@shime.local` / `admin1234`

## Shell and navigation

- [ ] Sidebar shows **SHIME** and subtitle when expanded
- [ ] Collapse sidebar (desktop) shows **SM** mark only
- [ ] Mobile drawer opens/closes via hamburger; overlay dismisses
- [ ] All nav links reach correct routes; active link highlighted
- [ ] Topbar breadcrumb shows `SHIME / {page}`

## Theme

- [ ] Toggle dark mode — UI switches immediately
- [ ] Refresh page — theme persists (`shime_theme` cookie)
- [ ] Login page theme toggle works outside authenticated shell
- [ ] Readable contrast in both light and dark on dashboard and a list page

## Semantic UI

- [ ] Primary buttons on create actions (customers, transactions, etc.)
- [ ] Success/warning/danger badges on payment and PO status
- [ ] Alert banners for created/error flash messages
- [ ] Cards and tables consistent across list pages

## Locale

- [ ] Language toggle switches EN/JA; nav labels update

## Consumption tax (MVP-2)

- [ ] Admin: `/settings/tax` — switch 免税 / 課税; save persists
- [ ] Exempt mode: transaction form has no tax fields; dashboard has no JCT card
- [ ] Taxable + tax-exclusive: ¥1,000 ex-tax at 10% → tax ¥100, total ¥1,100
- [ ] Taxable + tax-inclusive: enter ¥1,100 → splits to ¥1,000 + ¥100
- [ ] Invoice: two lines at 10%, rounding 切捨て — tax once per rate bucket on header
- [ ] Dashboard JCT card shows output tax, input tax, net (draft disclaimer visible)
- [ ] Issued invoice PDF shows T+13 (if set), tax buckets, 税込 total
- [ ] `pnpm db:migrate` applies `0002_jct_mvp2` on existing DB

## Document model (PO / SO / Expenses / Ledger)

- [ ] Sidebar: Ledger, Purchase Orders, Sales Orders, Expenses — **no Transactions**
- [ ] `/transactions` redirects to `/ledger`
- [ ] `/invoices` redirects to `/sales-orders`
- [ ] New PO/SO/Expense forms start with **one** line row; **Add line item** appends more
- [ ] Per-line tax: 10% / 8% / 0% (non-taxable)
- [ ] **Raize PO:** supplier アイオーク, 4 lines (車輛代, 自動車税相当分, 落札料 @ 10%; リサイクル料 @ 0%) → Post → total ¥2,105,610, tax ¥190,620
- [ ] Ledger shows supplier code column for posted PO
- [ ] Issue sales order → PDF; appears on ledger with customer code
- [ ] Post expense (optional supplier) → ledger + dashboard 仕入税額
- [ ] Payment recording on posted PO, issued SO, posted expense
- [ ] `pnpm db:migrate` applies `0004_document_model` on existing DB

## Build

```bash
pnpm build
```

- [ ] Production build completes without errors
