## ADDED Requirements

### Requirement: Legacy AI-DLC directories removed

The repository SHALL NOT contain `.aidlc-rule-details/` or `aidlc-docs/` directories after this change is applied.

#### Scenario: AI-DLC rule details absent

- **WHEN** a developer lists the repository root
- **THEN** the `.aidlc-rule-details/` directory does not exist

#### Scenario: AI-DLC docs absent

- **WHEN** a developer lists the repository root
- **THEN** the `aidlc-docs/` directory does not exist

### Requirement: AI-DLC Cursor rule removed

The repository SHALL NOT contain `.cursor/rules/ai-dlc-workflow.mdc`.

#### Scenario: No AI-DLC workflow rule

- **WHEN** a developer lists `.cursor/rules/`
- **THEN** `ai-dlc-workflow.mdc` is not present

### Requirement: UAT checklist preserved

The visual UAT checklist content from AI-DLC build-and-test artifacts SHALL be available at `docs/visual-uat-checklist.md`.

#### Scenario: UAT checklist accessible

- **WHEN** a developer opens `docs/visual-uat-checklist.md`
- **THEN** the file exists and contains manual UAT checklist content

### Requirement: Authoritative planning paths documented

The repository README monorepo structure section SHALL document `openspec/` as the active spec-driven workflow directory and SHALL NOT list `aidlc-docs/`.

#### Scenario: README reflects OpenSpec

- **WHEN** a developer reads the monorepo structure in `README.md`
- **THEN** `openspec/` is listed and `aidlc-docs/` is not listed

### Requirement: GSD planning retained

The `.planning/` directory SHALL remain in the repository until requirements are migrated to `openspec/specs/` in a future change.

#### Scenario: Planning requirements still available

- **WHEN** a developer opens `.planning/REQUIREMENTS.md`
- **THEN** the file exists with Milestone requirements content

### Requirement: OpenSpec config updated

The `openspec/config.yaml` context SHALL NOT reference `aidlc-docs/` as an active planning source.

#### Scenario: Config free of legacy paths

- **WHEN** a developer reads `openspec/config.yaml`
- **THEN** the context does not instruct agents to use `aidlc-docs/` for active work
