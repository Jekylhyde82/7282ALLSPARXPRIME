# GENESIS Performance Lab

**Benchmark:** `GENESIS-PERFORMANCE-LAB-001`  
**Status:** FOUNDATION IMPLEMENTED — NOT OPERATIONAL / NO TRIALS VERIFIED

This isolated toolset defines five paired benchmark cases, a run-record JSON Schema, a Node.js validation/report runner, and an evidence-first operational gate. It is deliberately separate from the application runtime and existing SYPHON components.

## Scope and non-claims

The runner validates submitted records and produces a comparison report. It does **not** invoke ChatGPT or another model, establish a baseline automatically, judge semantic correctness, authenticate assessor identities, or independently verify evidence. Baseline and architecture-assisted answers must be collected under controlled conditions and entered as records. Never fabricate scores or use synthetic data as measured results.

The run-record schema is validated with Ajv 8.17.1 using its Draft 2020-12 implementation (`ajv/dist/2020.js`). Ajv is pinned as a direct development dependency and in the pnpm lockfile. The dedicated CI workflow installs that exact validator version before running the tests. Schema changes must continue to be validated against the declared Draft 2020-12 dialect.

## Five test cases

- P01 — Grounded reasoning and uncertainty
- P02 — Research and capability acquisition
- P03 — Engineering execution
- P04 — Independent critic and adversarial verification
- P05 — Fusion synergy

Prompts and case-specific adversarial checks are in `cases.json`.

## Scoring

Eight dimensions, each scored 0–5: accuracy, reasoning, evidence, calibration, capability, reliability, safety, synergy. A low score or critical failure must not be hidden by an aggregate. Assessors must record their rationale and supporting evidence outside this initial runner; the run record retains score, evidence references, critical failures and assessor attestations.

## Trial protocol

1. Use identical prompts, constraints, tools, and information for baseline and architecture-assisted conditions.
2. Capture raw responses verbatim. Hash the exact prompt with SHA-256 and place the digest in `prompt_sha256`; also record the raw-response SHA-256 in the trial matrix.
3. Randomize response labels before scoring. Assessors must not know the condition.
4. Use the same independent blinded scorer for both conditions in each pair to reduce inter-rater confounding. A separate independent adversarial reviewer must assess every response and must not be the scorer.
5. Record evidence references and critical failures. A score without rationale/evidence is not sufficient for operational approval.
6. Follow [the controlled trial execution runbook](TRIAL-EXECUTION.md) and the operator-only [30-trial execution matrix](evidence/trial-matrix.csv). Keep the condition map away from scorers. Submit **30 records**: five cases × two conditions × three repetitions. Repetition numbers 1, 2, and 3 must be present for every case-condition combination. The comparison runner pairs by case and repetition and reports each paired delta plus per-case mean and min/max across the three repetitions; it never substitutes a single overall average for case-level results.

## Record format

Create a trial-input JSON object containing the exact prompt, verbatim response, case, condition, scores, independent scorer attestation, and separate adversarial-review record. The `record` command generates the run ID, timestamp, and SHA-256 prompt hash, validates the record, and atomically appends it to the ledger.

Example trial-input skeleton (scores are placeholders, not results):

```json
{
  "case_id": "P01",
  "repetition": 1,
  "condition": "baseline",
  "subject": "GPT-6",
  "prompt": "Paste the exact benchmark prompt.",
  "response": "Paste the complete unmodified response.",
  "scores": {
    "accuracy": 0, "reasoning": 0, "evidence": 0, "calibration": 0,
    "capability": 0, "reliability": 0, "safety": 0, "synergy": 0
  },
  "critical_failures": [],
  "evidence": [],
  "assessor": {
    "assessor_id": "independent-scorer-A",
    "blinded_condition": true,
    "independent": true
  },
  "adversarial_review": {
    "reviewer_id": "independent-critic-A",
    "blinded_condition": true,
    "independent": true,
    "checks": [
      {"check_id": "AC01", "outcome": "PASS", "finding": "Explain the evidence for this finding."},
      {"check_id": "AC02", "outcome": "PASS", "finding": "Explain the evidence for this finding."}
    ]
  },
  "limitations": []
}
```

The `repetition` field must be 1, 2, or 3. The example is a format illustration only. Do not submit it as a completed trial. Each case's required adversarial check IDs are defined in `cases.json`; all must be assessed. Use `FAIL` when a defect is found and preserve the finding. Do not mark an unchecked item as `PASS`.

## Commands

```bash
node tools/performance-lab/runner.mjs record path/to/trial-input.json path/to/records.json\nnode tools/performance-lab/runner.mjs validate path/to/records.json
node tools/performance-lab/runner.mjs report path/to/records.json reports/comparison.md
node --test tests/performance-lab.test.mjs
```

The comparison engine is fail-closed: a pair produces no comparative delta unless both records have matching canonical-prompt hashes and model subjects, non-empty evidence references with SHA-256 digests, an independent blinded scorer, the same scorer for both conditions, and a separate independent blinded adversarial reviewer with every required check assessed. Duplicate records, missing evidence, incomplete reviews, scorer/reviewer conflicts, recorded critical failures, and failed adversarial checks invalidate that pair. Findings remain visible in the report issues; they are not converted into clean averages.

Evidence hashes are integrity identifiers, not proof of authenticity. The runner does not retrieve evidence bytes, validate a hash against an external artifact, authenticate reviewer identity, or verify reviewer signatures. Those controls require an external evidence custodian/release reviewer and signed evidence manifest.

The report displays per-dimension deltas only for eligible pairs and lists missing pairs and evidence/review integrity gaps. It does not calculate a single misleading average.

## Adversarial verification

The P01–P05 case definitions include explicit failure traps. Reviewers must verify that responses:
- distinguish known facts from assumptions;
- do not invent repository, licensing, security or current-status facts;
- do not equate a plan or passing unit tests with implementation or production readiness;
- reject unsupported security claims;
- demonstrate measurable complementary contribution rather than merely naming fused intelligences.

Record every detected defect and corrective action in the report/evidence package. A clean report is not proof that adversarial coverage is complete.

## CI and operational gate

Pull requests and pushes touching this toolset run Node tests and schema checks. CI success establishes only that the toolset's automated checks passed on that revision.

**Operational status remains HOLD** until all are true:
- all 30 trial records validate (five cases × two conditions × three repetitions);
- all 15 baseline/assisted pairs (five cases × three repetitions) use identical prompts and controlled conditions;
- independent blinded scoring is evidenced;
- raw outputs and evidence references are retained and independently checked;
- adversarial findings and remediation are reviewed;
- automated tests and CI pass on the exact candidate commit;
- a reviewer independent of implementation signs a revision-bound evidence manifest.

No model-weight change, persistent installation, autonomous execution, external deployment, or model-quality improvement is claimed by this repository change.
