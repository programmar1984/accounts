## Context

SHIME has three overlapping documentation layers from successive planning workflows:

```
Before cleanup:
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│ AI-DLC             │  │ GSD (.planning/)   │  │ OpenSpec           │
│ .aidlc-rule-details│  │ REQUIREMENTS.md    │  │ openspec/config    │
│ aidlc-docs/ (20)   │──▶ ingested 2026-06-27│  │ .cursor/skills     │
│ ai-dlc-workflow.mdc│  │ ROADMAP, decisions │  │ /opsx:* commands   │
└────────────────────┘  └────────────────────┘  └────────────────────┘
        REMOVE                 KEEP (for now)           ACTIVE
```

AI-DLC content was ingested into `.planning/intel/` on 2026-06-27 (see `.planning/STATE.md`). OpenSpec is now the active agent workflow. The AI-DLC Cursor rule (`.cursor/rules/ai-dlc-workflow.mdc`) is already deleted on disk but not committed.

## Goals / Non-Goals

**Goals:**

- Remove AI-DLC-only directories and rule files that no longer drive development
- Preserve any unique operational content (UAT checklist) before deletion
- Update repo references so agents and humans know authoritative paths
- Single git commit for the cleanup (documentation-only)

**Non-Goals:**

- Remove `.planning/` — still referenced by `openspec/config.yaml` and holds Milestone 2 requirements
- Migrate requirements into `openspec/specs/` — separate future change
- Refresh README feature descriptions to match current MVP
- Archive `aidlc-docs/audit.md` elsewhere

## Decisions

### 1. Delete `.aidlc-rule-details/` entirely

**Rationale:** 29 rule files consumed only by the retired `ai-dlc-workflow.mdc` Cursor rule. No app code or OpenSpec references them.

**Alternative considered:** Keep as reference — rejected; content is generic AI-DLC workflow, not SHIME-specific.

### 2. Delete `aidlc-docs/` after preserving UAT checklist

**Rationale:** All 20 files were classified and synthesized into `.planning/intel/`. Domain vehicle-cost content overlaps with root `Explaination.md`.

**Preserve:** `aidlc-docs/construction/build-and-test/visual-uat-checklist.md` → `docs/visual-uat-checklist.md`

**Alternative considered:** Move entire `aidlc-docs/` to `docs/archive/aidlc/` — rejected; adds clutter; git history retains deleted files.

### 3. Commit deletion of `ai-dlc-workflow.mdc`

**Rationale:** File is already gone from disk (unstaged deletion). Including in this change completes the AI-DLC retirement.

### 4. Keep `.planning/` unchanged

**Rationale:** `openspec/config.yaml` references `.planning/REQUIREMENTS.md` and `.planning/intel/decisions.md`. Removing `.planning/` would break OpenSpec context until a migration change lands.

### 5. Minimal reference updates only

Update:
- `README.md` — monorepo tree section
- `openspec/config.yaml` — remove stale `aidlc-docs/` note; note `.planning/` is transitional

Do not grep-replace every historical mention in `.planning/intel/` (those files document ingest provenance and remain valid as metadata).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Unique content lost from `aidlc-docs/` | Copy UAT checklist; verify `Explaination.md` covers vehicle costs; git history recoverable |
| Agent still references removed paths | Update README + openspec config; `.planning/` remains for requirements |
| `.planning/intel/classifications/index.md` references `aidlc-docs/` paths | Acceptable — historical provenance, not operational instructions |

## Migration Plan

1. Copy UAT checklist to `docs/`
2. Delete `.aidlc-rule-details/`, `aidlc-docs/`, stage `ai-dlc-workflow.mdc` deletion
3. Update README and `openspec/config.yaml`
4. Verify no remaining operational references via `rg 'aidlc-docs\|\.aidlc-rule-details\|ai-dlc-workflow'`
5. Commit; run `pnpm build` (sanity — no code changes expected)

**Rollback:** `git revert` the commit; all deleted content recoverable from git history.

## Open Questions

None — scope is well-defined from prior explore session.
