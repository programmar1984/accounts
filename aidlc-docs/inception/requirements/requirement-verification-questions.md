# Requirement Verification Questions

**Context**: Architecture documentation and AI-DLC Inception for SHIME MVP brownfield codebase.
**Note**: Answers below were recorded to continue plan execution. Override any answer by editing `[Answer]:` tags and re-running Requirements Analysis.

---

## Question: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

**Rationale**: Bookkeeping handles financial records and credentials; security baseline applies to future Construction work.

---

## Question: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)
C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

**Rationale**: MVP is CRUD-heavy but has pure functions (`formatYen`, `formatDate`, transaction parsing) suitable for partial PBT.

---

## Question: Primary Near-Term Development Goal
What is the highest-priority work after architecture documentation?

A) Harden MVP for production (auth middleware, tests, CI, cloud storage, remove dev secrets)
B) Begin compliance engine from REQUIREMENTS_RESEARCH.md (Denchōhō, chart of accounts)
C) Multi-tenant SaaS foundation (organizations, tenant isolation)
D) Feature expansion within current MVP scope (pagination, password reset, audit log)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

**Rationale**: MVP is functional but lacks tests, CI, middleware, and production storage; hardening is prerequisite for any SaaS path.

---

## Question: Target Deployment Model (12-month horizon)

A) Single-tenant self-hosted (one business per deployment)
B) Multi-tenant SaaS on managed cloud (Vercel + RDS + S3 or equivalent)
C) Undecided — document both paths
X) Other (please describe after [Answer]: tag below)

[Answer]: B

**Rationale**: README and REQUIREMENTS_RESEARCH.md position SHIME as multi-tenant SaaS; PostgreSQL choice aligns with that target.

---

## Question: Documentation Language for AI-DLC Artifacts

A) English only
B) Japanese only
C) Bilingual where product terms require Japanese glossaries
X) Other (please describe after [Answer]: tag below)

[Answer]: C

**Rationale**: Technical docs in English; Japanese domain terms (売上, 仕入, 経費) preserved in business dictionary.
