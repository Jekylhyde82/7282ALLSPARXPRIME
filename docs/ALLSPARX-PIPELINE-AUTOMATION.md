# ALLSPARX PRIME 9-stage pipeline automation

**Implementation status:** Workflow and evidence-manifest verifier added on a dedicated integration branch. Operational status remains unverified until GitHub Actions completes on the exact commit.

## Workflow

`.github/workflows/allsparx-prime-9-stage.yml` implements nine sequential lifecycle stages. Each stage emits a commit-bound evidence manifest. A separate, read-only verification job follows every stage and validates the manifest's schema, stage identity, source SHA, workflow run, attempt, result, and SHA-256 digest.

The workflow is deliberately additive. It does not replace `.github/workflows/syphon-baseline.yml`, change application runtime behaviour, modify provider routing, migrate Durable Objects, configure secrets, or deploy infrastructure.

## Stage mapping

| Stage | Automated scope | Independent gate |
|---|---|---|
| 1. Recover and establish baseline | Exact checkout SHA, locked dependency install, baseline files | Verify source-bound manifest |
| 2. Architecture and trust boundaries | Required architecture, gateway, runtime and evidence files | Verify architecture manifest |
| 3. Build and integrate | SYPHON contracts, gateway tests, Worker dry-run | Verify integration manifest |
| 4. Automated quality | Astro check and production build | Verify quality manifest |
| 5. Security and identity assurance | Production dependency audit and repository hygiene checks | Verify security manifest |
| 6. Resilience, recovery and cost controls | Full automated test suite and evidence-tool syntax checks | Verify resilience manifest |
| 7. Staging and live-system readiness | Confirm staging controls and manual smoke workflow exist; no live deployment | Verify staging-readiness manifest |
| 8. Independent evidence review | Re-read and verify all Stage 1–7 manifests from the same workflow run | Verify cross-stage evidence manifest |
| 9. Controlled release authorization | Preserve explicit NO-GO until external blockers close | Verify HOLD manifest |

## Evidence ledger integration

The workflow emits a bounded evidence manifest per stage as a GitHub Actions artifact. Each manifest is bound to:
- repository source commit SHA;
- workflow run ID and attempt;
- stage identifier and outcome;
- enumerated checks;
- SHA-256 digest of the canonical manifest payload.

The workflow's evidence artifacts are CI provenance records, not application-level user-operation events. They do not bypass or weaken the SYPHON Durable Object ledger's append-before-provider-execution rule. Offline signed checkpoint and export-verification tooling remains the trust mechanism for exported runtime-ledger evidence.

## Independent gate boundary

Each verification gate runs in a separate GitHub Actions job with read-only repository and Actions permissions. It checks the stage artifact independently and requires the corresponding stage job to have succeeded. Stage 8 repeats the manifest checks across Stages 1–7. This is independent CI evidence validation, not a substitute for an independently administered signer, external immutable retention, or human security approval.

## Explicit release boundary

Stage 7 verifies that staging controls are defined; it does not claim a staging deployment or live provider test. Stage 9 records **HOLD**, not PASS, while production credentials, external retention, independent signer custody, backup/restore, usage settlement, staging rehearsal, and independent security approval remain outstanding.

A successful workflow run means the automated repository gates passed and the release hold was preserved. It does **not** mean production deployment is ready or authorized. Do not merge or deploy solely because this workflow is green.
