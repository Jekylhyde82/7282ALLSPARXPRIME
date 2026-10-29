# SYPHON Integration Plan — ALLSPARX PRIME × CloudCredits.io

## Status

- **PLANNED** — this document records the proposed integration boundary and verification gates.
- **Not implemented or tested:** no runtime integration, automated agent, deployment, or external service connection is claimed by this plan.

## Mission

Use the ELITE UNIFIED EVOLVED UNIVERSAL FUSION SYNERGY ARCHITECTURE / ALLSPARX PRIME as a coordination and verification layer around CloudCredits.io, while preserving the site's existing functionality, maintainers' workflow, and project identity.

## Baseline observed

- This repository's `README.md` identifies the project as CloudCredits.io, an Astro site for startup tools and credits.
- `package.json` identifies the package as `cloudcredits.io`; scripts include `dev`, `build`, `preview`, `check`, and `format`.
- `AGENTS.md` documents a specific provider/program content-update workflow using `scripts/scrape-clean-text.js` and a `BROWSERLESS_API_KEY` environment variable.
- The build script runs Astro, Pagefind, and copies generated Pagefind assets into `public/`.
- A source inspection alone does not establish that checks pass. The first GitHub Actions run installed the locked dependencies successfully, then `pnpm check` failed with **18 errors, 0 warnings, and 64 hints across 87 files**. The production build was initially skipped because the check step failed; the workflow now runs the build independently after a successful install so its result can also be captured.
- Initial diagnostic examples include a status-type mismatch in `src/layouts/components/ProgramCard.tsx`, a conflicting `Logo` import in `src/layouts/components/Logo.astro`, logo-existence checks that TypeScript reports as always true in the card components, a `draft` property mismatch in `src/lib/contentParser.astro`, a motion-style type mismatch in `src/pages/index.astro`, implicit `tool` types in two startup pages, and missing `slug` properties in `src/pages/deals/assistant.astro`. These are baseline findings from files outside this PR's intended integration scope; no unrelated application code has been changed.

## Proposed integration boundary

1. **Read-only discovery first:** inventory entrypoints, content schemas, scripts, workflows, environment-variable names, deployment configuration, and current tests.
2. **Preserve ownership and behavior:** keep CloudCredits.io's existing product, content conventions, licenses, and contributor workflow intact. Do not replace its app architecture with ALLSPARX PRIME.
3. **Add a thin orchestration layer only where justified:** SYPHON may coordinate approved tasks such as change planning, evidence capture, validation, and recovery. It must not silently alter or publish provider data.
4. **Secrets and external services:** never commit API keys or credentials. Use existing environment/secret mechanisms; request explicit authorization before enabling any external write action.
5. **Human review:** provider/program data changes must retain official-source validation and maintainer review. Runtime or deployment changes require a separate scoped proposal.

## SYPHON execution gates

### 1 — Recover and audit
Record default branch, commit SHA, project instructions, dependencies, workflows, tests, deployment targets, and known failures. Preserve the baseline.

### 2 — Synergize and merge
Map ALLSPARX PRIME capabilities to concrete CloudCredits.io needs. Prefer reuse and adapters over duplicated subsystems. Document conflicts and keep unrelated changes out of scope.

### 3 — Secure identities and automation
Define least-privilege access, secret handling, permitted operations, approval boundaries, audit logs, and rollback ownership before enabling automation.

### 4 — Integrate, test, and recover
Implement one small, isolated change at a time on a dedicated branch. Run the repository's documented checks and relevant regression tests. Verify behavior after restart/deployment where applicable.

### 5 — Independently verify and evolve
Record evidence for each result. Use these statuses accurately: **PLANNED / IMPLEMENTED / INSTALLED / TESTED / VERIFIED**. Attempted is not completed; a successful command alone is not proof of the intended outcome.

## Acceptance criteria before any production integration

- Baseline build/check results recorded.
- Integration scope and file-level diff reviewed.
- Existing routes, content rendering, search indexing, and provider/program workflows preserved.
- No secrets, unapproved external writes, or unrelated dependency churn.
- Relevant tests/checks pass and results are recorded.
- Rollback path and responsible operator are identified.
- A human reviews and explicitly approves the pull request before merge/deployment.

## Immediate next action

Continue the source-tree audit and capture the production-build result. Triage the existing Astro/type-check failures as a separate, reviewable baseline-repair scope before implementing runtime integration. Do not claim a functional ALLSPARX PRIME integration until a specific implementation is made and independently verified.
