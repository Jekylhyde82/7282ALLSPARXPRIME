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
- Latest CI-confirmed code commit at this checkpoint: `3b75154ab382e354cfe5d9953e8ff568a42e9604` (run 206, run ID `41018455189`); all nine workflow steps completed successfully, including dependency installation, SYPHON tests, Wrangler dry-run, Astro checks, production build, and job teardown.
- Run 206 is terminal-success for the exact PR head above. It does not verify this subsequent documentation-only update or any live Cloudflare resources, credentials, provider calls, external retention, signer custody or recovery exercise.
- CI verifies repository code and tests only. It does not establish secret provisioning, a live export, operational independent signer custody, immutable external retention or recovery.
- PR state: open, draft, unmerged.
- Deployment state: not deployed; no production secrets or live endpoint have been verified by this checklist.

Update this document only when the corresponding evidence exists. Never check an item based solely on intention or an attempted action.
