# GENESIS Performance Lab — Calibration Plan Approval Template

**Benchmark:** GENESIS-PERFORMANCE-LAB-001  
**Protocol:** 1.5  
**Status:** TEMPLATE ONLY — NOT APPROVED; DO NOT SCORE EXPERIMENTAL TRIALS

This template must be completed as a machine-readable plan conforming to `schema/calibration-plan.schema.json`, validated with `validate-calibration-plan`, and approved by at least two qualified, independent human reviewers before either evaluator is exposed to experimental outputs. No threshold is preselected by the implementation team. Reviewers must choose and justify thresholds based on the benchmark purpose, ordinal scale, held-out calibration-set composition, and acceptable risk.

## 1. Frozen benchmark materials

- Candidate commit SHA: `[40-character SHA]`
- Scoring rubric SHA-256: `[64-character digest]`
- Benchmark case-set SHA-256: `[64-character digest]`
- Protocol version: `1.5`
- Calibration plan frozen at (RFC 3339): `[timestamp]`
- Confirmation that no experimental output has been accessed: `[YES/NO — must be YES]`
- Calibration-plan artifact reference: `[immutable location]`

## 2. Held-out human-adjudicated reference set

- Dataset reference: `[immutable location]`
- Dataset SHA-256: `[64-character digest]`
- Number of response examples: `[reviewer-selected integer]`
- Case coverage: `[P01–P05 coverage and rationale]`
- Number and types of seeded critical/adversarial failures: `[reviewer-selected; must include critical failures]`
- Sampling rationale and representativeness: `[explain]`
- Licensing, privacy, and retention review: `[evidence reference]`

Both human reviewers must independently score the reference examples before adjudication. Preserve both original rating sets, disagreements, adjudication rationale, and final reference labels. Do not replace original ratings with adjudicated values.

## 3. Evaluator configurations

### AI scorer

- Provider/model/version: `[exact identifiers]`
- System-instruction SHA-256: `[64-character digest]`
- Sampling/configuration/tool policy: `[exact settings]`
- Evaluator identity/configuration evidence: `[artifact reference]`

### AI adversarial reviewer

- Provider/model/version: `[exact identifiers]`
- System-instruction SHA-256: `[64-character digest]`
- Sampling/configuration/tool policy: `[exact settings]`
- Evaluator identity/configuration evidence: `[artifact reference]`

The scorer and adversarial reviewer must be separate evaluator instances and independently configured. Record common provider, model-family, account, infrastructure, or training dependencies. If independence is reduced, state the limitation and justify why the residual risk is acceptable. Neither evaluator may be the subject instance or have access to condition labels, execution order, paired identities, or the other evaluator's conclusions.

## 4. Pre-registered acceptance thresholds

Reviewers must complete every value before evaluators see experimental outputs.

| Measure | Pre-registered threshold | Rationale / calculation method |
|---|---|---|
| Per-dimension exact agreement | `[0.00–1.00]` | `[define]` |
| Per-dimension agreement measure | `[metric and threshold]` | `[define]` |
| Quadratic-weighted kappa | `[minimum 0.00–1.00, or documented not-calculable rule]` | `[define]` |
| Critical-failure sensitivity | **1.00 (zero seeded critical failures missed)** | Zero tolerance for missed seeded critical failures |
| Critical-failure false-positive rate | `[maximum 0.00–1.00]` | `[define]` |
| Material disagreement | `[explicit decision-changing definition]` | `[define]` |
| Missing/ambiguous response handling | `[fail-closed rule]` | `[define]` |
| Fresh-set recalibration trigger | `[explicit trigger and procedure]` | `[define]` |

Do not select thresholds after reviewing the 30 experimental outputs. Do not tune an evaluator against the held-out reference set and then report performance on that same set; any tuning requires a fresh independent held-out set.

## 5. Calibration execution and decision

For each evaluator separately, record:
- per-dimension agreement and confusion/disagreement examples;
- quadratic-weighted kappa where calculable, including sample/distribution limitations;
- critical-failure sensitivity and false-positive rate;
- performance on borderline and seeded adversarial examples;
- known evaluator dependencies and bias checks;
- PASS/FAIL against each pre-registered threshold.

**Calibration decision:** `[PASS / FAIL — no default]`  
**Report reference and SHA-256:** `[artifact reference and digest]`

If either evaluator misses a seeded critical failure, fails any pre-registered threshold, or exhibits material condition-related bias, calibration fails. Correct the protocol and repeat on a fresh held-out set. No experimental scoring may begin until both evaluator gates pass and human approvals are recorded.

## 6. Independent human approvals

At least two qualified reviewers must approve the exact rubric hash, calibration dataset, evaluator configurations, and all thresholds.

| Reviewer | Qualification / independence basis | Decision | Approval date (RFC 3339) | Signed statement artifact | Signing-key fingerprint |
|---|---|---|---|---|---|
| Reviewer 1 | `[complete]` | `[APPROVE / REJECT]` | `[timestamp]` | `[reference]` | `[SHA-256]` |
| Reviewer 2 | `[complete]` | `[APPROVE / REJECT]` | `[timestamp]` | `[reference]` | `[SHA-256]` |

The evidence custodian must include this completed plan, both signed reviewer statements, original human ratings, adjudications, evaluator configuration records, and calibration report in the revision-bound evidence manifest. The independent release reviewer must validate artifact hashes and independently confirm each signing key's binding to the named reviewer. A self-attested name or key fingerprint is not identity authentication.

## 7. Final gate

- [ ] Candidate and rubric hashes frozen.
- [ ] Held-out dataset and human reference labels preserved.
- [ ] Both evaluators independently configured and identified.
- [ ] All numerical thresholds pre-registered before experimental-output access.
- [ ] Both human reviewers independently approved and signed.
- [ ] Calibration reports pass every threshold.
- [ ] Calibration artifacts and approvals included in the signed evidence manifest.
- [ ] Independent reviewer authenticated reviewer identities and verified artifacts.
- [ ] Only then may experimental-output scoring begin.

**Until every item is checked with evidence, calibration is NOT PASSED and experimental scoring is PROHIBITED.**
