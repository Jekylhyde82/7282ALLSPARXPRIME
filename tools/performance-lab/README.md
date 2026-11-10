# GENESIS Performance Lab

**Benchmark:** `GENESIS-PERFORMANCE-LAB-001`  
**Status:** FOUNDATION IMPLEMENTED — NOT OPERATIONAL / NO TRIALS VERIFIED

This isolated toolset defines five paired benchmark cases, a run-record JSON Schema, a Node.js validation/report runner, and an evidence-first operational gate. It is deliberately separate from the application runtime and existing SYPHON components.

## Scope and non-claims

The runner validates submitted records and produces a comparison report. It does **not** invoke ChatGPT or another model, establish a baseline automatically, judge semantic correctness, authenticate assessor identities, or independently verify evidence. Baseline and architecture-assisted answers must be collected under controlled conditions and entered as records. Never fabricate scores or use synthetic data as measured results.

The schema uses a documented, intentionally limited JSON Schema keyword subset in the dependency-free validator: `type`, `required`, `properties`, `additionalProperties`, `items`, `enum`, `const`, `minimum`, `maximum`, `minLength`, and `pattern`. It is **not** a complete Draft 2020-12 implementation. Before production use, replace or independently validate this subset with a standards-compliant validator pinned in the lockfile.

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
2. Capture raw responses verbatim. Hash the exact prompt with SHA-256 and place the digest in `prompt_sha256`.
3. Randomize response labels before scoring. Assessors must not know the condition.
4. Use different independent assessors for baseline and assisted responses, or have multiple assessors score both under a documented blinded protocol. The current report flags identical assessor IDs for paired records.
5. Record evidence references and critical failures. A score without rationale/evidence is not sufficient for operational approval.
6. Submit ten records: five cases × two conditions.

## Record format

Create a JSON array of run records conforming to `schema/run-record.schema.json`. Example skeleton:

```json
{
  "benchmark_id": "GENESIS-PERFORMANCE-LAB-001",
  "run_id": "GPL-20261110-P01-B",
  "case_id": "P01",
  "condition": "baseline",
  "subject": "GPT-6",
  "prompt_sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "response": "Paste the complete unmodified response here.",
  "scores": {
    "accuracy": 0, "reasoning": 0, "evidence": 0, "calibration": 0,
    "capability": 0, "reliability": 0, "safety": 0, "synergy": 0
  },
  "critical_failures": [],
  "evidence": [],
  "assessor": {
    "assessor_id": "reviewer-A",
    "blinded_condition": true,
    "independent": true
  },
  "limitations": [],
  "verification_status": "NOT_VERIFIED",
  "created_at": "2026-11-10T00:00:00.000Z"
}
```

The zero scores above are placeholders, not results. Do not submit the example as a completed trial. Replace the prompt hash with the real SHA-256 digest.

## Commands

```bash
node tools/performance-lab/runner.mjs validate path/to/records.json
node tools/performance-lab/runner.mjs report path/to/records.json reports/comparison.md
node --test tests/performance-lab.test.mjs
```

The report displays per-dimension deltas for each complete pair and lists missing pairs, assessor-independence gaps and critical failures. It does not calculate a single misleading average.

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
- all ten trial records validate;
- five baseline/assisted pairs use identical prompts and controlled conditions;
- independent blinded scoring is evidenced;
- raw outputs and evidence references are retained and independently checked;
- adversarial findings and remediation are reviewed;
- automated tests and CI pass on the exact candidate commit;
- a reviewer independent of implementation signs a revision-bound evidence manifest.

No model-weight change, persistent installation, autonomous execution, external deployment, or model-quality improvement is claimed by this repository change.
