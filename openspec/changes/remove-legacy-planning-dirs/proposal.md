## Why

The repository currently carries three overlapping planning systems (AI-DLC, GSD `.planning/`, and OpenSpec). AI-DLC artifacts were ingested into `.planning/` on 2026-06-27 and OpenSpec is now the active workflow. Keeping `.aidlc-rule-details/`, `aidlc-docs/`, and the deleted AI-DLC Cursor rule creates confusion about which docs are authoritative and wastes agent context on stale references.

## What Changes

- Remove `.aidlc-rule-details/` (29 AI-DLC workflow rule files; only used by the retired AI-DLC Cursor rule)
- Remove `aidlc-docs/` (20 historical planning docs; content ingested into `.planning/`)
- Commit deletion of `.cursor/rules/ai-dlc-workflow.mdc` (already deleted on disk)
- Preserve unique content before deletion:
  - Copy `aidlc-docs/construction/build-and-test/visual-uat-checklist.md` → `docs/visual-uat-checklist.md`
  - Confirm vehicle/service cost domain knowledge remains in `Explaination.md` (no duplicate needed from `aidlc-docs/inception/requirements/vehicle-and-service-costs.md`)
- Update references that still point at removed paths:
  - `README.md` monorepo tree (remove `aidlc-docs/` entry; add `openspec/`)
  - `openspec/config.yaml` context (remove legacy `aidlc-docs/` note; clarify `.planning/` is transitional)
- **Keep** `.planning/` for now — still holds active requirements (`REQUIREMENTS.md`), roadmap, and locked decisions referenced by OpenSpec config
- **Keep** `openspec/`, `Explaination.md`, and `docs/`

## Capabilities

### New Capabilities

- `repo-documentation`: Repository documentation layout and authoritative planning paths — where requirements, domain knowledge, and workflow artifacts live after legacy cleanup

### Modified Capabilities

<!-- No existing openspec/specs/ capabilities yet — this is the first spec -->

## Impact

- **Documentation only** — no application code, database schema, ledger, JCT, or UI behavior changes
- **Agent workflows** — AI-DLC slash rule no longer applies; OpenSpec `/opsx:*` commands and skills remain
- **Git history** — removed directories remain recoverable from git if needed
- **OpenSpec config** — minor context string update; `.planning/REQUIREMENTS.md` and `.planning/intel/decisions.md` remain referenced until a future change migrates them into `openspec/specs/`

## Non-goals

- Removing `.planning/` (GSD artifacts) — deferred to a separate change after requirements migrate to OpenSpec specs
- Populating `openspec/specs/` with full capability specs — out of scope for this cleanup
- Updating `README.md` feature descriptions to match current MVP (bill-only POs, SVO, ledger) — separate doc refresh
- Archiving `aidlc-docs/audit.md` session history elsewhere — acceptable loss; git history retains it
