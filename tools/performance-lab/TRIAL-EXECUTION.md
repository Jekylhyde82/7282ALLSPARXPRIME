# Experimental Trial Execution Runbook

**Benchmark:** GENESIS-PERFORMANCE-LAB-001  
**Protocol version:** 1.4  
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
3. **Select “Unpersonalized” before sending the first message in every Temporary Chat, for both baseline and architecture-assisted trials.** Do not use “Personalized” for either condition. OpenAI's Temporary Chat guidance states that Unpersonalized chats do not use memory, custom instructions, or plugins; this is necessary to prevent account personalization from contaminating the baseline. The choice cannot be changed after the chat starts. Reference: https://help.openai.com/en/articles/8914046-temporary-chat-in-chatgpt
4. For baseline trials, use a fresh Unpersonalized Temporary Chat and send only the exact canonical case prompt as the first message. Do not include architecture labels, role instructions, project names, saved architecture context, or any other preamble.
5. For assisted trials, use a separate fresh Unpersonalized Temporary Chat. Send the architecture instruction below as the first message, then send the exact canonical case prompt as the second message. The architecture instruction is the sole intended condition difference.
6. If “Unpersonalized” is unavailable, account/workspace restrictions override it, or the operator cannot verify the selected state before the first message, do not count that trial as valid. Record the limitation and resolve the environment before continuing. Never silently substitute a Personalized Temporary Chat.
7. Keep tools disabled or unused for both conditions. The five canonical prompts are designed to be answerable without external research. If a tool is used in one condition, the paired trial is invalid unless the same tool and information are made available to both.
8. Do not change model, available settings, output constraints, or task prompt between paired trials.
9. Capture the full response verbatim. Do not edit, summarize, or remove mistakes.
10. Record the trial ID, blind label, case, repetition, condition, exact model label, context type, explicit `unpersonalized_confirmed=TRUE`, a non-sensitive context reference, capture timestamp, available settings, tools used, canonical prompt SHA-256, architecture-instruction SHA-256 for assisted trials, and raw-response SHA-256 in the matrix. A blank or FALSE isolation confirmation invalidates the trial; do not count it among the 30. Preserve each raw response as an immutable artifact. Add its evidence reference and matching SHA-256 digest to the run record. If the UI exposes no context ID, use a unique operator-generated context reference; never place account secrets in the matrix.
11. Keep the execution map private from scorers and adversarial reviewers. Give assessors only blind labels and raw responses.
12. Complete three repetitions for every case-condition combination. Do not replace failed or poor outputs; record failures and repeat only under a documented protocol.

## Architecture-assisted condition instruction

Paste this as the first message in each architecture-assisted Unpersonalized Temporary Chat:

> Operate using the U.N.I.V.E.R.S.A.L. E.N.G.I.N.E. / E.N.G.I.N.E.E.R. as your reasoning and engineering framework. Apply GENESIS, Genius Brainstorm, Genius Critic, and Genius Engineer as complementary roles. Treat the architecture as nine Unified Master Intelligence Cores (UMICs), each composed of a Master Core, Artificial Fusion Intelligence (AFI), and Fusion Synergy; preserve distinct specialist identities and the nine-engine AFI structure. Apply GENESIS to applicable components and retain the NINEFOLD INTRINSIC / universal-everything invariant. Apply EAI (automatic Extraction, Assimilation & Integration) and UAIPM (Universal Automatic Instantaneous Personalised Mastery) where relevant. Use fusion only where it creates demonstrable synergy. Enforce: PROOF BEFORE CLAIM. EVIDENCE BEFORE CONFIDENCE. VERIFICATION BEFORE COMPLETION. Distinguish known facts, assumptions, unknowns, planned work, implemented work, tested work and independently verified work. Challenge weak reasoning, identify failure modes, and do not invent sources, test results, implementation status, or performance gains. Do not claim model-weight changes, persistent installation, autonomous execution, or external deployment.

Then send the exact canonical prompt for the assigned case from `cases.json`.

## Baseline condition

Open a new Unpersonalized Temporary Chat and send only the exact canonical prompt for the assigned case. Do not include architecture labels, role instructions, project names, saved architecture context, or any other preamble. Confirm Unpersonalized was selected before the first message. If the Temporary Chat still applies account personalization, or its state cannot be confirmed, mark the baseline context contaminated and do not count it.

## Randomized execution order

The operator-only execution order is recorded in `evidence/trial-matrix.csv`. The matrix uses deterministic shuffle seed `20261110`. Keep this file away from scorers. The `blind_label` is the only identifier shown to scorers.

## Independent scoring and adversarial review

### Assessment model

Use a hybrid assessment system. Human assessors are not required to score every response, but human governance is required to establish the calibration set, resolve material disputes, review critical failures, and approve the final evidence package.

- **AI scorer:** A separately operated evaluator scores all blind-labelled responses against the eight-dimension rubric. It must not be the GPT-6 subject instance, the architecture-assisted subject conversation, or an evaluator embedded in the system under test.
- **AI adversarial reviewer:** A second, separately operated evaluator checks both required case-specific adversarial checks for every response. It must not be the scorer and must independently assess critical failures.
- **Human governance reviewers:** At least two qualified human reviewers establish/adjudicate the calibration reference set. A human reviewer examines every critical failure, every material scorer/reviewer disagreement, and the final revision-bound evidence manifest before release approval.
- Prefer different model providers and model families for scorer and adversarial reviewer. If that is unavailable, use distinct model versions and independently configured evaluator environments, document the shared dependencies, and treat independence as reduced rather than assumed.
- Freeze evaluator model/version, system instructions, rubric, sampling settings, tool policy, and scoring schema before unblinding. Record these in the evidence manifest. Evaluators must have no access to the execution map, condition labels, subject conversation history, memory, or one another's conclusions.
- Give both evaluators the same raw response, canonical case definition, and scoring criteria. Do not provide condition labels, trial order, or paired-condition identities. Randomize blind-label presentation order independently for each evaluator.
- The same scorer should score both members of a pair to reduce inter-rater confounding. The separate adversarial reviewer independently reviews both members.
- Record rationale for every dimension and each adversarial check. A numeric score without rationale is insufficient.

### Evaluator calibration and independence gate

Before scoring experimental outputs, calibrate both AI evaluators on a held-out reference set that is separate from the 30 experimental trials.

1. At least two qualified human reviewers independently score the calibration responses and adjudicate disagreements to create the reference labels. Preserve both original ratings and the adjudication record.
2. Include ordinary examples, borderline examples, seeded reasoning/evidence defects, and known critical/adversarial failures. Keep the answer key hidden from the AI evaluators.
3. Pre-register the calibration set, rubric, acceptance thresholds, and evaluator versions before examining experimental results. Do not tune evaluators against the 30 trial outputs.
4. Report per-dimension agreement, quadratic-weighted kappa for ordinal scores where calculable, critical-failure sensitivity, false-positive rate, and disagreement examples. Do not rely on one aggregate agreement number.
5. If either evaluator misses a seeded critical failure, fails the pre-registered agreement threshold, or shows material condition-related scoring bias, calibration fails. Correct the evaluator protocol and repeat calibration on a fresh held-out set before any experimental scoring.
6. The calibration report and its evidence must be independently reviewed and signed. Passing calibration supports use of the evaluator; it does not prove that its judgments are infallible.

### Adjudication and fail-closed rules

- The AI scorer and AI adversarial reviewer must not be the same model instance, agent, provider account, or shared conversation. Record known common dependencies.
- A human adjudicator must review every critical failure, every disagreement that could change a pair's eligibility or comparative conclusion, and any suspected evaluator bias. Preserve the original AI outputs; adjudication supplements rather than overwrites them.
- Assessor identity, blinding, evaluator configuration, and evidence provenance must be independently checked; self-attestation alone is not authentication.
- Every comparison pair is fail-closed for missing evidence references or SHA-256 digests, incomplete scorer/reviewer attestations, scorer/reviewer conflicts, missing or duplicate adversarial checks, any NOT_ASSESSED check, critical/adversarial failures, missing evaluator calibration PASS evidence, missing calibration references/hashes, evaluator identity mismatches, and missing per-dimension rationales. These checks are enforced by the current run-record schema and comparison runner. The runner validates the supplied calibration metadata and digest format; it does not independently validate the referenced calibration artifact bytes or prove evaluator quality.
- A SHA-256 digest establishes a content fingerprint only when checked against the retained artifact. It does not authenticate who captured, scored, or reviewed that artifact. Retain independently signed reviewer statements and an evidence manifest outside the run-record self-attestations.

## Scoring

Use the versioned [SCORING-RUBRIC.md](SCORING-RUBRIC.md) for all eight dimensions. The common ordinal anchors and dimension-specific definitions are mandatory; retain a rationale and supporting response evidence for every score. Record critical failures separately; they cannot be offset by high scores elsewhere. The exact rubric hash must be frozen before calibration and included in the evidence manifest. The rubric is proposed pending approval by at least two qualified human reviewers. Numerical calibration acceptance thresholds must be approved and signed before either evaluator sees experimental outputs; do not invent or tune thresholds after seeing trial results. No experimental scoring may begin until this calibration gate passes.

## Completion gate

The experiment remains NOT VERIFIED until all 30 raw outputs are captured, all 15 pairs are complete, independent blinded scoring and separate adversarial review are complete, evidence references and response hashes are checked, and an independent reviewer verifies the Ed25519-signed, revision-bound evidence manifest against an independently provisioned trusted public key.

**Signed evidence manifest:** every release evidence package must include `evidence-manifest.json`, validated against `schema/evidence-manifest.schema.json`. The manifest binds the package to the exact 40-character candidate commit and lists each retained artifact by relative path, kind, and SHA-256. An authorized custodian signs the canonical manifest payload using Ed25519; the verifier checks the signature, public-key fingerprint, expected revision, path containment, and actual artifact bytes. Use an independently provisioned trusted public key, expected signer ID, and required signer role; never trust a key or identity merely because it is included in the manifest or repository. The public-key-to-human-identity binding and key custody must be confirmed out of band by the independent release reviewer.

Sign with `node tools/performance-lab/runner.mjs sign-manifest payload.json /secure/path/custodian-private-key.pem evidence-manifest.json`. Verify with `node tools/performance-lab/runner.mjs verify-manifest evidence-manifest.json /secure/path/trusted-custodian-public-key.pem evidence/ <candidate-commit-sha> <trusted-signer-id> evidence-custodian`. Keep private keys outside the repository and evidence archive. The verifier checks artifact bytes at paths relative to the evidence root; do not use absolute paths or path traversal. Signature verification proves possession of the corresponding private key, not the real-world identity of its holder.

**Remaining limitation:** the runner verifies manifest structure, signature, revision binding, trusted-key fingerprint, and listed artifact hashes, but it does not establish that a trusted key belongs to a named human. That identity-to-key trust decision remains an external governance control.

**Current result:** no model trials have been executed and no performance improvement or regression is claimed. Protocol 1.4 adds explicit matrix evidence for Unpersonalized isolation, canonical prompt provenance and architecture-instruction provenance. The rubric and calibration plan require independent human approval before scoring.
