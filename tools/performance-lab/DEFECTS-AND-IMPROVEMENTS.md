# Performance Lab — Defects, Limitations and Improvement Register

**Benchmark:** GENESIS-PERFORMANCE-LAB-001  
**Register reviewed against:** `38101363f86720c920a2d4fe0e4d0cb048773d93`  
**Current-head CI:** NOT VERIFIED. No workflow runs or combined status checks have been returned for the current candidate. Earlier CI results apply only to their exact historical commits.
**Operational status:** NOT OPERATIONAL — authentic trials and independent release evidence remain outstanding.

This register distinguishes defects in the implemented toolchain from deliberate boundaries of the manually operated experimental protocol. A code-level fix does not close an experimental or governance gate.

## Defects and limitations

| ID | Severity | Finding | Status | Required action / closure evidence |
|---|---|---|---|---|
| PL-001 | High | The original subset JSON Schema validator did not provide Draft 2020-12 conformance. | **RESOLVED** | Replaced by Ajv 8.17.1 Draft 2020-12 implementation in `runner.mjs`; direct dependency and lockfile pin are present. Current-head Performance Lab CI run 42836193833 passed all 24 tests, including Draft 2020-12 vocabulary checks. Reopen if validator or schema dialect changes. |
| PL-002 | Medium | The runner records externally collected responses; it does not invoke GPT-6 or another model. | **INTENTIONAL BOUNDARY / DEFERRED** | The registered protocol requires fresh, manually verified Unpersonalized Temporary Chat sessions. A model adapter is not required for this controlled UI protocol and must not be introduced if it compromises isolation or provenance. Reconsider only as a separately approved adapter for an independently controlled environment. |
| PL-003 | High | Assessor identity, independence, blinding and evaluator configuration are represented partly by run-record attestations; these fields do not authenticate real-world identity. | **OPEN** | Obtain independently verifiable reviewer identity and evaluator provenance; retain signed reviewer statements and out-of-band trust records. The independent release reviewer must verify identity-to-key binding and custody. |
| PL-004 | High | No authentic baseline or architecture-assisted model trials have been collected. | **OPEN — RELEASE BLOCKER** | Execute all 30 pre-registered trials under the runbook; preserve every raw response and record failures without substitution. Current matrix remains NOT_RUN. |
| PL-005 | Medium | The run record stores one scorer's dimension scores per response; it does not provide a multi-scorer inter-rater agreement analysis for all experimental outputs. | **OPEN / GOVERNANCE DECISION** | Preserve the registered same-blinded-scorer paired design. Decide whether a second independent scorer is required for every response; if so, extend the schema and report agreement before collecting experimental scores. Human calibration/adjudication requirements remain mandatory. |
| PL-006 | Medium | The signed evidence-manifest verifier checks listed artifact bytes, revision binding, signature and trusted-key fingerprint, but the comparison runner does not itself retrieve evidence references or prove that every run-record reference is included in an independently verified manifest. | **PARTIALLY RESOLVED** | Build and independently verify a complete manifest covering all raw responses, run records, calibration artifacts, evaluator outputs, reviewer statements, execution metadata and reports. Add a cross-check that every record evidence reference maps to a manifest artifact, or document and independently enforce that check in the release procedure. |
| PL-007 | Medium | Run-record and manifest timestamps previously checked only string length/shape. | **RESOLVED IN CURRENT BRANCH — CI REQUIRED** | Added strict RFC 3339 timestamp syntax and calendar/time/offset validation for run-record creation/capture timestamps, matrix capture timestamps, and manifest timestamp schema shape; added negative tests for impossible dates and malformed offsets. |
| PL-008 | Medium | Case-specific adversarial checks are stored as structured reviewer outcomes; the runner checks presence/status but does not independently judge the semantic correctness of reviewer findings. | **OPEN — EXTERNAL REVIEW CONTROL** | Keep the separate blinded adversarial reviewer and human review of critical findings. Define evidence-based acceptance criteria and independently audit reviewer outputs; never equate a PASS field with proof that a response passed. |
| PL-009 | Medium | Repetition summaries report per-case mean/min/max across up to three eligible pairs, but do not estimate uncertainty or assessor agreement. | **OPEN — REPORTING LIMITATION** | After authentic trials, report the small sample size and dispersion transparently. Add inferential statistics only if assumptions and sample size justify them; do not imply that three repetitions establish broad generalisation. |
| PL-010 | Low | GitHub Actions use major-version action tags (for example, `actions/checkout@v4` and `actions/setup-node@v4`) rather than reviewed immutable commit SHAs. Current logs also emit Node.js 20 deprecation warnings for those actions. | **OPEN** | Review action provenance and compatibility, pin actions to verified full commit SHAs, and define a controlled update process. Do not blindly copy unverified hashes. |
| PL-011 | Low | The README evidence-manifest verification example contained duplicated signer ID/role arguments. | **RESOLVED IN CURRENT BRANCH** | Corrected the command to match the runner's six-argument CLI contract. Verify the documentation correction on the resulting branch head and retain the CI result. |
| PL-012 | High | The runbook specified eight 0–5 scoring dimensions but did not define sufficiently anchored, dimension-specific scoring criteria. | **OPEN — APPROVAL GATE** | Added proposed `SCORING-RUBRIC.md`, `CALIBRATION-PLAN-TEMPLATE.md`, and `schema/calibration-plan.schema.json`, with CLI validation for frozen thresholds, separate evaluators, held-out human-adjudicated coverage, and at least two independent signed human approvals. The issue remains an approval gate until qualified reviewers approve and sign the exact rubric hash and numerical calibration thresholds before evaluator calibration or experimental scoring. |
| PL-013 | High | The operator matrix did not contain a dedicated machine-auditable confirmation that Unpersonalized Temporary Chat was selected, nor separate prompt/instruction hashes. | **IMPLEMENTED WITH EXTERNAL ATTESTATION LIMIT — CI REQUIRED** | Protocol 1.5 validates the operator CSV, requires TRUE for every started trial, checks canonical prompt hashes against `cases.json`, checks assisted-instruction hashes against the frozen `ARCHITECTURE-INSTRUCTION.txt`, and binds run records to trial/blind IDs, context metadata and response bytes. Software cannot prove that the operator actually selected the UI state; raw capture evidence and independent review remain mandatory. |
| PL-015 | High | Matrix CSV parsing accepted malformed quote placement, and captured prompt/instruction hashes were only checked for digest shape/pair consistency rather than against the registered source text. | **IMPLEMENTED — CURRENT-HEAD CI REQUIRED** | CSV parsing now rejects quotes in unquoted fields and characters after closing quotes. Captured prompt hashes are checked against the canonical case prompt; assisted instruction hashes are checked against the frozen instruction artifact. Added negative tests for wrong but syntactically valid hashes and malformed CSV quoting. |

## Verified implementation and test evidence

- Ajv 8.17.1 Draft 2020-12 validation is implemented and pinned.
- The current Performance Lab workflow job completed successfully on the reviewed HEAD: 24 tests passed, 0 failed; five unique benchmark case definitions validated.
- The tests cover repetition bounds and pairing, duplicate records, prompt/model drift, fail-closed evidence and assessor/reviewer checks, calibration metadata, per-dimension rationales, signed-manifest revision/key/artifact verification, path traversal and signature tampering.
- The signed evidence-manifest verifier checks Ed25519 signatures, externally supplied trusted-key fingerprints, exact candidate revision binding, path containment and actual artifact SHA-256 values.
- The 30-row operator matrix defines five cases × two conditions × three repetitions. The matrix is a plan, not evidence that any trial was executed.
- Historical CI passes verify only their exact tested revisions. The current candidate has no returned workflow run/check result yet. CI does not verify model outputs, independent assessment, identity authentication or operational readiness.

## Improvement backlog

1. Complete the 30 authentic trials using the registered Unpersonalized Temporary Chat protocol.
2. Obtain independent human approval of the anchored scoring rubric and pre-registered numerical calibration thresholds; establish and preserve the held-out, human-adjudicated calibration reference set for both separate AI evaluators before scoring experimental responses.
3. Independently verify assessor/reviewer identity, blinding, evaluator configuration and signed evidence provenance.
4. Cross-check every run-record evidence reference against the signed manifest and retained artifact bytes.
5. **RESOLVED IN BRANCH — CI REQUIRED:** strict RFC 3339 timestamp validation and semantic negative tests.
6. Decide whether a second independent scorer is required for every response; preserve the same blinded scorer across each pair.
7. Improve adversarial-review auditability without treating machine-readable PASS fields as semantic proof.
8. Report descriptive uncertainty honestly; avoid unjustified inference from three repetitions.
9. Pin GitHub Actions to reviewed immutable SHAs and address Node.js runtime deprecation warnings.
10. Obtain independent release approval against the exact final candidate revision.
11. **IMPLEMENTED IN BRANCH — CI REQUIRED:** machine-enforced protocol 1.5 matrix isolation, canonical source hashes and provenance columns.

| PL-014 | Critical | Operator-matrix isolation and capture provenance were documented but not enforced by the runner; run records did not bind trial IDs/context confirmation to response bytes. | **IMPLEMENTED — CURRENT-HEAD CI REQUIRED** | Added strict 20-column CSV validation for all 30 planned rows, unique trial/blind IDs, exact pair coverage, capture-state metadata, Unpersonalized confirmation, prompt/instruction/response hashes, and assessor separation for assessed rows. Prompt hashes are now checked against `cases.json`, and assisted-instruction hashes against a frozen instruction artifact. CSV malformed quoting is rejected. Run records require trial_execution metadata, strict RFC 3339 timestamps, and recompute the raw-response SHA-256. Independent operator confirmation and identity authentication remain external. |

## Acceptance policy

No item is silently closed. Every code-level resolution requires a commit reference and successful tests on the exact revision. Every experimental/governance resolution requires its own inspectable evidence and independent review. Do not mark an issue resolved solely because documentation says it is resolved.

The Performance Lab remains **NOT OPERATIONAL / RELEASE HOLD** until all 30 authentic trials, all 15 eligible pairs, calibration, independent blinded scoring and adversarial review, evidence authentication, human adjudication where required, current-head CI, and independent release approval are demonstrably complete.

**Governing rule:** PROOF BEFORE CLAIM. EVIDENCE BEFORE CONFIDENCE. VERIFICATION BEFORE COMPLETION.
