# Experimental Trial Execution Runbook

**Benchmark:** GENESIS-PERFORMANCE-LAB-001  
**Protocol version:** 1.1  
**Required trials:** 30 (5 cases × 2 conditions × 3 repetitions)  
**Status:** PRE-REGISTERED — ALL TRIALS NOT RUN

## Purpose

Compare the same GPT-6 subject under two conditions:

- **Baseline:** ordinary ChatGPT response to the canonical case prompt, with no U.N.I.V.E.R.S.A.L. E.N.G.I.N.E. / E.N.G.I.N.E.E.R. framework instruction.
- **Architecture-assisted:** same model and task prompt, with the standardized architecture operating instruction below applied first.

This is a prompt/context intervention benchmark. It does not test model-weight changes, native model capability changes, persistent installation, or production deployment.

## Experimental controls

1. Use the same GPT-6 model selection for all trials. Record the exact model label shown in the UI and any available settings.
2. Use a fresh Temporary Chat for every trial. Do not reuse a conversation across trials.
3. For baseline trials, use a Temporary Chat without architecture-specific memory or instructions. Send only the canonical case prompt as the first message.
4. For assisted trials, use a separate fresh Temporary Chat. Send the architecture instruction below as the first message, then send the exact canonical case prompt as the second message.
5. Keep tools disabled or unused for both conditions. The five canonical prompts are designed to be answerable without external research. If a tool is used in one condition, the paired trial is invalid unless the same tool and information are made available to both.
6. Do not change model, available settings, output constraints, or task prompt between paired trials.
7. Capture the full response verbatim. Do not edit, summarize, or remove mistakes.
8. Record the trial ID, blind label, case, repetition, condition, exact model label, context type, a non-sensitive context reference, capture timestamp, available settings, tools used, and SHA-256 of the raw response in the matrix. If the UI exposes no context ID, use a unique operator-generated context reference; never place account secrets in the matrix.
9. Keep the execution map private from scorers and adversarial reviewers. Give assessors only blind labels and raw responses.
10. Complete three repetitions for every case-condition combination. Do not replace failed or poor outputs; record failures and repeat only under a documented protocol.

## Architecture-assisted condition instruction

Paste this as the first message in each architecture-assisted Temporary Chat:

> Operate using the U.N.I.V.E.R.S.A.L. E.N.G.I.N.E. / E.N.G.I.N.E.E.R. as your reasoning and engineering framework. Apply GENESIS, Genius Brainstorm, Genius Critic, and Genius Engineer as complementary roles. Treat the architecture as nine Unified Master Intelligence Cores (UMICs), each composed of a Master Core, Artificial Fusion Intelligence (AFI), and Fusion Synergy; preserve distinct specialist identities and the nine-engine AFI structure. Apply GENESIS to applicable components and retain the NINEFOLD INTRINSIC / universal-everything invariant. Apply EAI (automatic Extraction, Assimilation & Integration) and UAIPM (Universal Automatic Instantaneous Personalised Mastery) where relevant. Use fusion only where it creates demonstrable synergy. Enforce: PROOF BEFORE CLAIM. EVIDENCE BEFORE CONFIDENCE. VERIFICATION BEFORE COMPLETION. Distinguish known facts, assumptions, unknowns, planned work, implemented work, tested work and independently verified work. Challenge weak reasoning, identify failure modes, and do not invent sources, test results, implementation status, or performance gains. Do not claim model-weight changes, persistent installation, autonomous execution, or external deployment.

Then send the exact canonical prompt for the assigned case from `cases.json`.

## Baseline condition

Open a new Temporary Chat and send only the exact canonical prompt for the assigned case. Do not include architecture labels, role instructions, project names, saved architecture context, or any other preamble. If the Temporary Chat still applies architecture-specific instructions or memory, mark the baseline context contaminated and do not count it.

## Randomized execution order

The operator-only execution order is recorded in `evidence/trial-matrix.csv`. The matrix uses deterministic shuffle seed `20261110`. Keep this file away from scorers. The `blind_label` is the only identifier shown to scorers.

## Independent scoring and adversarial review

- A scorer who did not design or execute the architecture intervention must score all blind-labelled responses without seeing condition labels.
- Use the same blinded scorer for paired responses to reduce inter-rater confounding.
- A separate adversarial reviewer must assess both required case-specific adversarial checks for every response.
- The reviewer must not be the scorer and must not see condition labels.
- Record rationale for every dimension and each adversarial check. A numeric score without rationale is insufficient.
- Assessor identity, blinding, and evidence provenance must be independently checked; self-attestation alone is not authentication.

## Scoring

Score each response from 0–5 on accuracy, reasoning, evidence, calibration, capability, reliability, safety, and synergy. Retain per-dimension scores and critical failures. Do not hide weak dimensions behind an aggregate.

## Completion gate

The experiment remains NOT VERIFIED until all 30 raw outputs are captured, all 15 pairs are complete, independent blinded scoring and separate adversarial review are complete, evidence references and response hashes are checked, and an independent reviewer signs a revision-bound evidence manifest.

**Current result:** no model trials have been executed and no performance improvement or regression is claimed.
