## 1. Preserve unique content

- [x] 1.1 Copy `aidlc-docs/construction/build-and-test/visual-uat-checklist.md` to `docs/visual-uat-checklist.md`
- [x] 1.2 Confirm `Explaination.md` covers vehicle/service cost domain (no additional migration needed)

## 2. Remove legacy AI-DLC artifacts

- [x] 2.1 Delete entire `.aidlc-rule-details/` directory
- [x] 2.2 Delete entire `aidlc-docs/` directory
- [x] 2.3 Stage deletion of `.cursor/rules/ai-dlc-workflow.mdc` (already removed from disk)

## 3. Update references

- [x] 3.1 Update `README.md` monorepo structure: remove `aidlc-docs/` line, add `openspec/` and note `.planning/` as transitional requirements
- [x] 3.2 Update `openspec/config.yaml` context: remove `aidlc-docs/` legacy note; clarify `.planning/` is transitional until specs migrate

## 4. Verify and commit

- [x] 4.1 Run `rg 'aidlc-docs|\.aidlc-rule-details|ai-dlc-workflow'` — confirm only historical references remain in `.planning/intel/` (acceptable)
- [x] 4.2 Run `pnpm build` (sanity check; no app code changed)
- [x] 4.3 Commit all changes with message describing legacy planning cleanup
