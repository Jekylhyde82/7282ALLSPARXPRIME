# ALLSPARX PRIME deployment-readiness gate

**Gate status: NO-GO — implementation candidate, not approved for production deployment.**

This checklist is deliberately evidence-based. A successful CI run proves the checks that ran on that commit; it does not prove production configuration, live provider connectivity, independent auditability, recovery, billing accuracy, or security approval.

## Verified in repository automation

- [x] SYPHON runtime contract tests passed on PR head `3b75154ab382e354cfe5d9953e8ff568a42e9604` in GitHub Actions run 206.
- [x] Cloudflare Worker bundle dry-run passed on that same head in run 206; no deployment occurred.
- [x] Astro type/content checks passed on that same head in run 206.
- [x] Production site build passed on that same head in run 206.
- [x] Evidence ledger appends fail closed before provider execution.
- [x] Evidence verification is bounded and paginated (maximum 100 records per page).
- [x] Ledger validates event lifecycle, actor origin, provenance, identifiers, provider and outcome fields.
- [x] Offline export verifier validates record schema, semantics, chain links, hashes and a separately supplied checkpoint.
- [x] Offline Ed25519 checkpoint signing and verification utilities pass signature, tamper, wrong-key, genesis and prior-checkpoint-link regression tests (CI run 203).
- [x] Pre-admission rejection scope and its observability limitation are documented.
- [x] Provider secrets are designed to remain in Worker secrets, not browser configuration.
- [x] Live smoke workflow is manual, bounded, HTTPS-only and does not deploy.

## Blocking requirements before production approval

- [x] Implement a protected, bounded monthly evidence export-generation path with paginated record reads, per-page chain validation, a dedicated bearer secret, and size limits. Regression tests passed in CI run 206 on PR head `3b75154ab382e354cfe5d9953e8ff568a42e9604`; live export invocation remains outstanding.
- [ ] Securely provision and rotate `EVIDENCE_EXPORT_TOKEN`, restrict the route at the Cloudflare edge where supported, and perform a live export against a non-production ledger.
- [x] Implement offline Ed25519 checkpoint signing and verification tools with signature, tamper, key-mismatch, genesis, and previous-checkpoint-chain regression tests.
- [ ] Provision and operate a separately administered signer outside the Cloudflare Worker and Durable Object trust boundary; pin/distribute its public key out of band, establish the genesis trust anchor, and verify key custody, rotation, revocation, and checkpoint hand-off.
- [ ] Establish immutable external retention and verify custody, retention, access control and tamper evidence.
- [ ] Complete backup and restore exercises, including a measured recovery procedure and verification of restored ledger continuity.
- [ ] Decide and implement authenticated end-user/actor identity if production audit requirements need attribution beyond anonymous origin.
- [ ] Implement provider usage extraction, price schedule, actual-cost settlement and reconciliation. Current fixed reservations are admission controls, not invoice-based billing or a guaranteed USD cap.
- [ ] Configure production Cloudflare account resources, Durable Object migrations, secrets, allowed origins, Turnstile hostnames, provider keys and explicit provider model IDs.
- [ ] Run controlled live provider tests using the actual configured models and credentials; verify fallback, timeout, rate limit, budget exhaustion and evidence failure behavior.
- [ ] Run the manual live gateway smoke workflow with a freshly issued single-use Turnstile token, then separately test negative paths and secret non-disclosure.
- [ ] Complete staging deployment, operational monitoring/alerting, rollback and incident-response rehearsal.
- [ ] Obtain independent security review and explicit approval. Existing PR review explicitly says no approval to merge or deploy.
- [ ] Re-run the full CI suite on the final reviewed commit and confirm terminal-success before any release decision.

## Release decision rules

1. Do not merge or deploy while any blocking item is unchecked.
2. Do not treat a dry-run, mocked test, liveness endpoint, or successful build as proof of live readiness.
3. Do not place credentials, Turnstile tokens, HMAC keys, or provider secrets in source control, public build variables, pull-request text, or chat.
4. Keep the PR draft until independent review approves the completed evidence and recovery controls.
5. A production go decision requires evidence for each applicable control, an accountable reviewer, a rollback plan, and explicit authorization.

## Current PR checkpoint

- Repository: `Jekylhyde82/7282ALLSPARXPRIME`
- Pull request: [#15](https://github.com/Jekylhyde82/7282ALLSPARXPRIME/pull/15)
- Branch: `syphon/permanent-evidence-ledger`
- Latest CI-confirmed application/code commit recorded at this checkpoint: `3b75154ab382e354cfe5d9953e8ff568a42e9604` (run 206, run ID `41018455189`). Subsequent documentation commit `5a8436fbf6d76b36cfd6b6a471393dabb6e79491` passed run 207 (run ID `41112613904`), including all nine workflow steps and job teardown.
- Run 206 is terminal-success for code commit `3b75154ab382e354cfe5d9953e8ff568a42e9604`. Run 207 (run ID `41112613904`) is also terminal-success for documentation commit `5a8436fbf6d76b36cfd6b6a471393dabb6e79491`; all nine workflow steps and job teardown completed successfully. Run 207 does not verify live Cloudflare resources, credentials, provider calls, external retention, signer custody or recovery exercise.
- CI verifies repository code and tests only. It does not establish secret provisioning, a live export, operational independent signer custody, immutable external retention or recovery.
- The evolved nine-stage lifecycle pipeline and eight-dimension/256-cell architecture governance specification are documented in `docs/ALLSPARX-9-STAGE-PIPELINE.md`. They are architecture/documentation deliverables, not proof that all stages, dimensions, cells, or controls are operational.
- PR state: open, draft, unmerged.
- Deployment state: not deployed; no production secrets or live endpoint have been verified by this checklist.

Update this document only when the corresponding evidence exists. Never check an item based solely on intention or an attempted action.


## Additional CI security and provenance gates — 2026-10-31

A separate workflow, `.github/workflows/syphon-security-provenance.yml`, has been added to the open PR branch. Its first execution is required before any control below can be marked tested or verified.

- [ ] Zizmor GitHub Actions security-policy analysis completes successfully.
- [ ] Gitleaks scans the checked-out repository history without exposing matched values.
- [ ] Locked dependency audit completes with no high/critical findings.
- [ ] Existing SYPHON regression tests pass, including current tamper-detection, fail-closed evidence-storage and provider-failure/fallback cases.
- [ ] Cloudflare Worker dry-run, Astro checks and production build pass in this security workflow.
- [ ] Commit-bound source bundle and CI evidence manifest are generated with SHA-256 linkage.
- [ ] GitHub build-provenance attestations for the source bundle and evidence manifest are successfully published and independently retrievable.
- [ ] CI evidence artifact is retained and its run/commit association is confirmed.

**Scope limitation:** this CI evidence package is an inspectable, commit-linked CI output. It is not yet a write into the live SYPHON Durable Object ledger, an external immutable archive, or the independently administered Ed25519 checkpoint service. The new workflow's artifact retention is not a substitute for external immutable retention.

**Resilience limitation:** the existing tests exercise selected fault paths and tamper rejection. A dedicated backup/restore exercise, measured recovery objective, and cross-boundary continuity verification remain outstanding.

**Current execution checkpoint:** latest PR head at the time of this update is `8114a0bbd7f4ce03dd809c1f18087a1be57eade5`. GitHub Actions has created run 3 of the security/provenance workflow (run ID `41118495255`) and baseline run 213 (run ID `41118495282`) for this exact commit. Both were pending when last inspected. Do not mark these gates passed until both the job results and generated attestations/artifacts are independently checked.
