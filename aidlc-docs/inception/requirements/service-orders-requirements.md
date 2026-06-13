# Service Orders — Functional Requirements

**Phase:** Inception → Construction  
**Depends on:** [vehicle-and-service-costs.md](./vehicle-and-service-costs.md)

---

## Functional requirements

| ID | Requirement |
|----|-------------|
| FR-SVO-01 | New document type **Service Order** with supplier, line items, tax totals, post/void/cancel, payment tracking, attachments — parity with Purchase Order bill model |
| FR-SVO-02 | Required header field `serviceCategory`: `TRANSPORT` \| `INSPECTION` \| `SHIPPING` \| `VANNING` \| `OTHER` |
| FR-SVO-03 | Numbering: `SVO-YYYY-NNNN` (distinct from Sales Order `SO-`) |
| FR-SVO-04 | Ledger: posted SVO shows type **Service**; amounts included in **Purchase** column footer |
| FR-SVO-05 | JCT input tax aggregates include posted SVO (with PO and Expense) |
| FR-SVO-06 | Migrate listed legacy POs to SVO (see migration list below) |

### Migration list (PO → SVO)

| Legacy PO | New SVO |
|-----------|---------|
| PO-2026-0015 | SVO-2026-0015 |
| PO-2026-0010 | SVO-2026-0010 |
| PO-2026-0009 | SVO-2026-0009 |
| PO-2026-0008 | SVO-2026-0008 |
| PO-2026-0007 | SVO-2026-0007 |
| PO-2026-0004 | SVO-2026-0004 |
| PO-2026-0002 | SVO-2026-0002 |
| PO-2025-0002 | SVO-2025-0002 |

Append to notes: `Migrated from PO-…`.

---

## Out of scope

- Vehicle master / VIN linking
- Landed-cost capitalization rules (Method A vs B)
- Vehicle cost sheet report
- Bilingual PDF for service orders

---

## Acceptance criteria

1. User can create draft SVO with category + supplier + lines
2. User can post SVO → appears on ledger as type Service
3. Purchase column totals include SVO amounts
4. Eight listed POs no longer exist in PurchaseOrder table; eight SVOs exist with matching totals/payments/attachments
5. `pnpm build` passes
