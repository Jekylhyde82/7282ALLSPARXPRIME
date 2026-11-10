# Performance Lab — Defects, Limitations and Improvement Register

**Benchmark:** GENESIS-PERFORMANCE-LAB-001  
**Status:** Open engineering register

## Defects and limitations

| ID | Severity | Finding | Status | Required action |
|---|---|---|---|---|
| PL-001 | High | Current validator implements a documented JSON Schema keyword subset, not full Draft 2020-12 conformance. | OPEN | Replace with a standards-compliant validator pinned in the repository lockfile; add negative/edge-case schema tests. |
| PL-002 | High | Runner records supplied responses but does not invoke GPT-6 or another model. | OPEN | Design a controlled model-adapter interface with explicit model/version, prompt, tool and parameter capture. |
| PL-003 | High | Assessor identity, independence and blinding are self-attested fields, not authenticated evidence. | OPEN | Add reviewer identity/provenance controls and independently signed assessment artifacts. |
| PL-004 | High | No baseline or architecture-assisted trials have been collected. | OPEN | Execute all five controlled pairs; do not fabricate or infer scores. |
| PL-005 | Medium | Current schema stores one assessor score set per run. | OPEN | Extend to multiple independent assessors and report inter-rater agreement, dispersion and adjudication. |
| PL-006 | Medium | Evidence references are strings and optional hashes; evidence bytes and provenance are not retrieved or verified by the runner. | OPEN | Add evidence-manifest validation, content hashing, source capture and retention policy. |
| PL-007 | Medium | Date-time values are checked as strings, not validated against RFC 3339. | OPEN | Add standards-compliant date-time validation. |
| PL-008 | Medium | Adversarial checks are defined per case but not automatically evaluated against response content. | OPEN | Add a blinded critic rubric and structured finding records; retain human independent review. |
| PL-009 | Medium | Comparison report shows per-dimension deltas but does not yet calculate uncertainty intervals or aggregate assessor agreement. | OPEN | Add transparent statistical summaries only after adequate repeated trials. |
| PL-010 | Low | CI workflow uses major-version action tags rather than immutable action SHAs. | OPEN | Pin third-party actions to reviewed full commit SHAs and schedule controlled updates. |

## Corrected during initial CI

| ID | Finding | Resolution evidence |
|---|---|---|
| PL-FIX-001 | Initial comparison test incorrectly expected absent P02–P05 pairs to produce no warnings. | Corrected the test to require missing-pair warnings; subsequent Performance Lab CI passed all 6 tests. |
| PL-FIX-002 | Importing the runner executed CLI usage output; run-record CLI formatting needed correction. | Added an entrypoint guard and repaired the record command; subsequent Performance Lab CI passed. |
| PL-FIX-003 | Paired assessor comparison initially treated same-assessor scoring as a defect, which would introduce inter-rater confounding. | Changed protocol to require the same independent blinded assessor to score both conditions in each pair. |

## Improvement backlog

1. Replace subset validator with pinned Ajv or another standards-compliant JSON Schema implementation.
2. Add a model execution adapter that records exact model identity, settings, prompt, tools, timestamps and response hashes.
3. Add randomized response labels and blinded paired scoring with at least two independent assessors per case.
4. Record scoring rationales, confidence, evidence citations and adjudication.
5. Add tamper-evident, revision-bound evidence manifests and immutable retention.
6. Automate adversarial coverage checks while retaining independent human review.
7. Add repeated trials and statistical uncertainty reporting; do not overinterpret a single run.
8. Add signed release approval and a fail-closed operational status gate.

## Acceptance policy

No item is silently closed. Each resolution requires a commit reference, test result and supporting evidence. The Performance Lab remains **NOT OPERATIONAL** until high-severity blockers and all benchmark evidence gates are independently resolved.
