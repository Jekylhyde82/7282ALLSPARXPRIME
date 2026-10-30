# ALLSPARX PRIME — Evolved 9-Stage Continuous Delivery Pipeline

**Document status:** Proposed pipeline specification committed to the SYPHON evidence-ledger branch.  
**Release posture:** NO-GO remains in force until every applicable release gate has evidence and independent approval.  
**Governing rule:** PROOF BEFORE CLAIM. EVIDENCE BEFORE CONFIDENCE. VERIFICATION BEFORE COMPLETION.

This pipeline evolves the repository's nine-step CI workflow into nine lifecycle stages spanning recovery, architecture, implementation, verification, security, resilience, staging, independent approval, and controlled release. It does not imply that all stages are implemented or that production is ready.

## Operating contract

1. Every stage has an entry condition, required work, durable outputs, an exit gate, and a failure path.
2. A stage is complete only when its required outputs exist and the gate's evidence has been reviewed.
3. PLANNED, IMPLEMENTED, INSTALLED, TESTED, and VERIFIED are distinct states. Never promote a status without evidence.
4. A failed or inconclusive gate blocks dependent stages. Do not bypass a gate to preserve a schedule.
5. Preserve existing user-facing functionality, data, history, identity boundaries, and rollback options.
6. Keep credentials in approved secret stores. Never commit secrets or expose them in logs, browser bundles, pull-request text, or evidence exports.
7. Every release candidate is tied to an immutable commit SHA and a traceable evidence bundle.
8. Production deployment requires explicit authorization after independent review; CI success alone is insufficient.

## Stage 1 — Recover and establish the baseline

**Objective:** Know exactly what exists before changing it.

**Work**
- Confirm the authoritative repository, default branch, target branch, current commit SHA, and open change sets.
- Inventory application entry points, services, APIs, data stores, migrations, dependencies, workflows, secrets references, and external integrations.
- Capture current build/test results and known failures; distinguish verified facts from assumptions.
- Identify user-visible behaviour and data that must remain compatible.
- Establish a recoverable baseline: tagged commit or equivalent immutable reference, backup where applicable, and rollback instructions.

**Required evidence**
- Repository/branch/commit inventory.
- Dependency and integration inventory.
- Baseline CI report and known-defect register.
- Compatibility and data-preservation checklist.
- Recovery point and rollback procedure.

**Exit gate:** The target and baseline are unambiguous, the existing system is reproducibly buildable or its failures are documented, and a recovery path exists.

**Failure path:** Stop implementation if the target repository, source of truth, data boundary, or recovery point is uncertain.

## Stage 2 — Architect and synergise

**Objective:** Design a coherent system without destructive consolidation.

**Work**
- Map capabilities, ownership, trust boundaries, data flows, APIs, events, and dependencies.
- Define contracts between the browser, gateway, identity provider, providers, evidence ledger, storage, and operational services.
- Identify duplicate functions and complementary capabilities; merge only where behaviour and ownership remain clear.
- Define least-privilege access, tenant/environment separation, failure isolation, and data-retention boundaries.
- Record architecture decisions, rejected alternatives, migration sequencing, and compatibility constraints.

**Required evidence**
- Versioned architecture and data-flow diagrams.
- Interface/API contracts and schema versions.
- Threat model and trust-boundary map.
- Architecture decision records and migration plan.
- Traceability from requirements to components and tests.

**Exit gate:** Interfaces, ownership, security boundaries, compatibility, and migration strategy are reviewable before implementation proceeds.

**Failure path:** Return ambiguous interfaces or unsafe trust assumptions for design correction; do not paper over them with ad hoc adapters.

## Stage 3 — Build and integrate

**Objective:** Implement the approved design in small, reviewable changes.

**Work**
- Implement application features, service modules, provider adapters, APIs, persistence, migrations, and observability hooks.
- Use explicit provider/model identifiers and validated configuration.
- Keep secrets server-side and isolate them by environment and purpose.
- Add schema validation, bounded inputs/outputs, idempotency where needed, safe error handling, and versioned contracts.
- Preserve existing functionality through compatibility tests and controlled migrations.
- Keep changes scoped, reviewable, and reversible.

**Required evidence**
- Reviewed commits and change summaries.
- Contract/schema tests and migration checks.
- Secret scanning and dependency inventory.
- Compatibility tests for preserved behaviour.
- Updated operational and developer documentation.

**Exit gate:** The implementation conforms to approved contracts, contains no known exposed secrets, and has tests covering critical new and preserved behaviour.

**Failure path:** Revert or isolate unsafe changes; do not continue by disabling validation or weakening access controls.

## Stage 4 — Automated quality verification

**Objective:** Establish reproducible code and artifact quality.

**Work**
- Install from the committed lockfile in a clean environment.
- Run formatting/lint checks, static analysis, type checks, unit tests, integration tests, API/contract tests, and regression tests.
- Validate database migrations and generated artifacts.
- Build production artifacts and perform platform-specific dry-runs.
- Produce machine-readable test results, artifact checksums, and commit-linked CI records.
- Test failure paths, not only happy paths.

**Required evidence**
- Terminal-success CI run for the exact release-candidate SHA.
- Per-job and per-step results, with logs retained under policy.
- Test coverage for critical paths and known defects.
- Artifact/build metadata and checksums.
- Documented exceptions with accountable approval; no silent skips.

**Exit gate:** All mandatory automated checks pass on the exact candidate commit. A dry-run is explicitly labelled as a dry-run, not a deployment.

**Failure path:** Block progression, diagnose, fix, and rerun. Never infer success from a partially completed job or a previous commit's green run.

## Stage 5 — Security and identity assurance

**Objective:** Verify that only intended actors can perform intended actions, and that failures do not disclose or corrupt protected information.

**Work**
- Verify authentication, authorization, session/token handling, key rotation, revocation, and least privilege.
- Validate origin policy, CSRF protections where applicable, challenge verification, rate limits, input bounds, output encoding, and abuse controls.
- Verify server-side secret isolation and ensure public/browser configuration contains no credentials.
- Test fail-closed behaviour for missing evidence, identity, configuration, or policy dependencies.
- Review dependency vulnerabilities, supply-chain provenance, audit scope, privacy, and data minimization.
- Test negative cases: unauthenticated, unauthorized, malformed, replayed, expired, throttled, and misconfigured requests.

**Required evidence**
- Threat model and security review.
- Authentication/authorization test results.
- Secret scan and dependency/security scan results.
- Negative-path test evidence.
- Key custody, rotation, revocation, and incident procedures.
- Explicitly documented audit coverage and gaps.

**Exit gate:** No unresolved critical/high-risk finding without documented, time-bound risk acceptance by an authorized reviewer. Identity and secret controls are verified in the target environment.

**Failure path:** Block release, contain exposure, rotate/revoke affected credentials where necessary, preserve incident evidence, and retest.

## Stage 6 — Resilience, recovery, and cost controls

**Objective:** Prove that the system can fail safely, recover predictably, and enforce operational limits.

**Work**
- Test provider outages, timeouts, retries, fallback, concurrency, queue saturation, rate limits, and partial failures.
- Verify budget reservations, actual usage extraction, pricing, settlement, and reconciliation as separate controls.
- Exercise backup, restore, disaster recovery, and evidence-ledger continuity.
- Verify idempotency, duplicate-event handling, data integrity, and recovery-point/recovery-time objectives.
- Test monitoring, alert delivery, escalation, and incident runbooks.
- Confirm rollback is possible and does not corrupt data or evidence.

**Required evidence**
- Fault-injection and load-test reports.
- Backup/restore exercise with measured results.
- Cost-control and usage-reconciliation evidence.
- Recovery objectives and observed recovery times.
- Monitoring/alert test records.
- Rollback rehearsal and data-integrity checks.

**Exit gate:** Critical failure modes have tested safe outcomes; recovery and rollback are demonstrated; cost claims are supported by reconciled usage, not merely reservations.

**Failure path:** Keep the system out of production traffic until recovery, budget, or failure-containment gaps are corrected.

## Stage 7 — Staging and live-system validation

**Objective:** Verify the assembled system in a production-like environment without exposing production users to an unapproved candidate.

**Work**
- Deploy the exact candidate to isolated staging using production-equivalent configuration and access controls.
- Provision environment resources and secrets through approved channels.
- Run real identity flows, provider/model connectivity tests, evidence export/checkpoint tests, and positive/negative gateway smoke tests.
- Verify observability, alerts, performance, CORS/origin policy, rate limits, budget enforcement, and secret non-disclosure.
- Confirm external dependencies, quotas, billing settings, and service ownership.
- Capture deployment identity and configuration provenance without recording secret values.

**Required evidence**
- Staging deployment record tied to candidate SHA.
- Configuration/resource checklist with secret values omitted.
- Live smoke-test results and negative-path results.
- Provider/model connectivity and usage evidence.
- Monitoring/alert verification.
- Staging sign-off and rollback readiness.

**Exit gate:** The exact candidate operates correctly in staging with real dependencies and no unresolved release-blocking defect.

**Failure path:** Roll back staging, preserve logs/evidence, correct the defect, and repeat the relevant tests.

## Stage 8 — Independent evidence and release approval

**Objective:** Prevent self-attestation from becoming the release decision.

**Work**
- Have a reviewer independent of the implementation inspect the candidate SHA, test evidence, threat model, operational controls, recovery results, and known limitations.
- Verify evidence provenance, completeness, integrity, retention, and independent checkpoint/signature trust where required.
- Confirm every blocker is closed with evidence or explicitly risk-accepted by an authorized decision-maker.
- Review privacy, legal/compliance obligations, service ownership, support coverage, rollback plan, and incident contacts.
- Produce a signed or otherwise attributable release decision.

**Required evidence**
- Independent review report and findings disposition.
- Evidence index tied to immutable commit and artifact checksums.
- Security, operations, recovery, and cost-control sign-offs.
- Explicit GO/NO-GO decision, approver identity, timestamp, and scope.
- Rollback plan and deployment window authorization.

**Exit gate:** An accountable independent approver issues an explicit GO for the exact candidate and deployment scope. Silence, green CI, or developer approval is not authorization.

**Failure path:** NO-GO; return to the responsible stage, remediate, regenerate evidence, and repeat independent review.

## Stage 9 — Controlled deployment and continuous evolution

**Objective:** Release safely, prove the live result, and improve without destabilizing verified behaviour.

**Work**
- Deploy only the approved SHA/artifact using a controlled rollout (canary or staged exposure where supported).
- Run post-deployment health, identity, critical user-flow, provider, evidence, and security smoke tests.
- Monitor errors, latency, saturation, spend, security signals, and user-impact indicators.
- Compare live behaviour against release acceptance criteria; automatically halt or roll back on defined thresholds.
- Preserve deployment records, artifact checksums, configuration provenance, evidence exports, and incident/rollback outcomes.
- Feed verified defects and improvements into Stage 1 for the next cycle.

**Required evidence**
- Deployment record and exact artifact/commit identity.
- Post-deployment verification results.
- Monitoring window and alert outcomes.
- Rollout/rollback decision and any incident records.
- Updated operational baseline and next-cycle improvement register.

**Exit gate:** Live acceptance checks pass, monitoring remains within approved thresholds for the defined observation window, and evidence is retained. Otherwise the release is degraded/unverified and must be rolled back or contained.

**Failure path:** Stop rollout, revert or disable the affected capability, preserve evidence, notify accountable owners, and begin incident response.

## Cross-stage release gates

| Gate | Required before |
|---|---|
| G0 — Source of truth and recovery baseline | Stage 2 |
| G1 — Architecture and trust boundaries approved | Stage 3 |
| G2 — Implementation and compatibility evidence | Stage 4 |
| G3 — Exact-SHA automated checks pass | Stage 5 |
| G4 — Security and identity assurance | Stage 6 |
| G5 — Resilience, recovery, and cost controls | Stage 7 |
| G6 — Staging/live dependency validation | Stage 8 |
| G7 — Independent, attributable GO decision | Stage 9 |
| G8 — Live acceptance and evidence retention | Completion of release |

A failed gate blocks downstream progression. Emergency exceptions must be narrow, time-limited, attributable, and approved by the appropriate authority; they must never silently convert a failed check into a pass.

## Status model

- **PLANNED:** specified, not yet implemented.
- **IMPLEMENTED:** code or process exists; execution is not thereby proven.
- **INSTALLED:** present in the target environment; operation is not thereby proven.
- **TESTED:** a defined test ran and produced a result on a known target.
- **VERIFIED:** the intended outcome was independently or otherwise trustworthily confirmed, with evidence and required durability/safety checks.

A status applies to a specific component, environment, commit, and time. Do not label an entire stage VERIFIED because one subtask passed.

## Mapping from the existing nine-step CI workflow

The current CI workflow's nine steps are individual automation actions, not nine lifecycle stages. They map primarily into Stage 4:

1. Set up job → CI execution environment.
2. Check out source → exact source revision.
3. Set up pnpm → toolchain setup.
4. Set up Node.js → runtime setup.
5. Install locked dependencies → reproducible dependency installation.
6. Run SYPHON runtime contract tests → automated contract/regression verification.
7. Validate Cloudflare Worker bundle (no deployment) → build artifact validation only.
8. Run Astro type and content checks → static/type/content verification.
9. Run production build → artifact compilation, not deployment readiness.

The workflow teardown is execution housekeeping, not a separate release gate. These checks do not by themselves complete Stages 1–3 or 5–9.

## Initial application to the current ALLSPARX PRIME candidate

At the time this specification was authored, PR #15 in `Jekylhyde82/7282ALLSPARXPRIME` remained open, draft, and unmerged. The deployment-readiness checklist remained **NO-GO**. CI run 206 had passed for an earlier code commit; run 207 was being checked for the later documentation commit. No production deployment, live provider connectivity, independently operated signer, immutable external retention, backup/restore exercise, usage settlement, or independent release approval is established by this document.

This specification is **IMPLEMENTED as documentation only** when committed. The nine lifecycle stages are not thereby implemented, installed, tested, or verified as an operational pipeline. Each stage must be adopted incrementally and evidenced.

## Change control

- Keep this document versioned with the code and update it through review.
- Record stage evidence by immutable references (commit SHA, workflow run, deployment ID, test report, reviewer decision).
- Never place secrets or sensitive user data in evidence artifacts.
- Review the pipeline after incidents, material architecture changes, or demonstrated process gaps.
