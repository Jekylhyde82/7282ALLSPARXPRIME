# STARWIRE — Universal Engine Architecture Integration

**Status:** Architecture integration committed for review; implementation and deployment remain separate gates.
**Date:** 2026-11-25
**Branch:** `starwire/three-source-integration`
**Scope:** Integrate the discovered capabilities of CloudCredits.io, Free for Open Source and Sourcey into the STARWIRE architecture and its existing governance boundaries.

## 1. Architectural decision

STARWIRE is the Universal Engine / Engineer's governed, extensible opportunity-discovery and acquisition-intelligence capability. The three repositories are complementary sources and capability references, not competing products and not authorities that can approve their own claims.

All discovered components remain in scope for investigation. Their architectural disposition may be source adapter, data source, reusable algorithm/pattern, user-interface pattern, supporting utility, research candidate, alternative, fallback, experimental capability or rejected component with recorded rationale. Overlap is a relationship to preserve, not a reason to discard.

**This integration adds architecture and traceability. It does not assert that third-party code has been copied, installed, tested, merged to main, or deployed.**

## 2. STARWIRE capability architecture

### 2.1 Source acquisition layer

- **CloudCredits source adapter:** ingest provider and programme catalogue records, programme tiers, benefit summaries, eligibility descriptions, application steps, FAQs, community notes and source update metadata.
- **Free for Open Source source adapter:** ingest offer records, verification anchors, status and dates, sponsorship datasets, categories, eligibility data and source metadata.
- **Sourcey source adapter:** ingest canonical entities, aliases, provider domains, programmes, offers, structured benefits/economics, eligibility expressions, lifecycle states, evidence references, revision metadata and change information.
- **Future-source interface:** permit additional directories, official provider feeds, public repositories, grant catalogues, cloud/AI/GPU programmes, developer tools, startup perks and other legitimate opportunities without changing the canonical core.

Adapters are read-only at discovery time. Each source adapter preserves the original record and source-specific fields and emits a normalized projection plus provenance. A source adapter must not self-certify the truth of the content it retrieves.

### 2.2 SYPHON capture and evidence layer

Use the existing SYPHON boundary for bounded, policy-controlled source retrieval and evidence capture. Retain source ID, canonical URL, retrieval timestamp, HTTP status, media type, byte length, response hash, capture ID and raw captured material where permitted.

Required hardening before production source acquisition includes DNS resolution and public-IP egress enforcement, rebinding protection, redirect revalidation or denial, host allowlists, request/response size limits, timeouts, rate limits, content-type validation, credential isolation and durable evidence retention.

Keep these evidence states distinct:
- Captured: bytes were retrieved under the capture policy.
- Parsed: a parser produced a structured record.
- Structurally valid: the record passed the applicable schema.
- Source-asserted: a directory or repository makes the claim.
- Provider-confirmed: the relevant official provider source supports the claim.
- Independently verified: a separate verification process checked the claim and recorded its scope, time and evidence.

None of these states alone means an application was accepted, a credit was issued or an integration succeeded.

### 2.3 Canonical opportunity knowledge layer

Use a lossless, linked-record model. Do not flatten the hierarchy:

1. **Source** — source identity, terms/licence, access policy, trust profile and adapter version.
2. **Source revision** — immutable commit, release, revision digest or other stable upstream snapshot.
3. **Capture** — one retrieval event and its evidence hash.
4. **Provider/entity** — canonical identity, aliases, domains, category and external IDs.
5. **Programme** — named provider programme and its own lifecycle.
6. **Offer/tier** — distinct offer, cohort or tier with its own conditions and value.
7. **Benefit** — credits, discounts, services, infrastructure, software, sponsorship, support, training, events, compute or other non-cash benefit.
8. **Eligibility condition** — typed predicate, source wording, scope, evidence and manual/unknown status.
9. **Application/access route** — method, official URL, account prerequisites and process steps.
10. **Evidence/verification event** — source excerpt or pointer, official confirmation, verifier, timestamp, revision scope and result.
11. **Project fingerprint** — observed repository characteristics, detected technologies, project maturity and capability needs.
12. **Match result** — candidate relationship, rules/model version, reasons, exclusions, uncertainty and timestamp.
13. **Decision and outcome** — AFI assessment, UAIE governance result, human approval, application state, redemption or acquisition outcome.

Keep raw source values and normalized values side by side. Preserve currency as a general ISO 4217 code where applicable, but do not require a currency for non-monetary benefits. Preserve qualifiers such as exact, up-to, at-least, range, recurring and conditional. Preserve dates with timezone/precision semantics and unknown values explicitly.

Conflicting claims must coexist as separate assertions linked to their sources and revisions. Do not overwrite, average or silently select a winner. Duplicate detection creates candidate links; it must not merge distinct programmes, cohorts, tiers or offers.

### 2.4 Project intelligence and opportunity matching

Adapt the Free for Open Source project-matching concept as a reusable STARWIRE capability:
- Fingerprint a project from permitted repository metadata, manifests, dependency files, languages, paths, workflows, documentation and declared needs.
- Detect technologies, platforms, project maturity, open-source licence, activity indicators and existing tools.
- Match detected characteristics to offers and other opportunity classes using versioned, explainable rules.
- Detect existing equivalent tools and avoid unnecessary replacement or churn.
- Evaluate machine-readable eligibility predicates where evidence exists.
- Return UNKNOWN or NEEDS_HUMAN_CHECK for manual, ambiguous, missing or stale conditions; never convert unknown into eligible.
- Explain why an opportunity matched, which evidence supports the match, what is missing and what could disqualify the project.

Project fingerprinting must be privacy-aware and least-privilege. Do not send private repository content or secrets to third-party services. The initial implementation should work from explicitly selected repository metadata and locally available manifests; deeper access requires separate authorization.

### 2.5 Opportunity taxonomy and discovery breadth

STARWIRE must not be limited to startup cloud credits. Maintain a broad taxonomy including cloud infrastructure, AI/ML and GPU compute, storage/networking, databases, developer tooling, CI/CD, security, observability, testing, design, productivity, education, grants, accelerators, startup perks, sponsorship, open-source support, hardware, datasets, research access and other useful resources.

Keep source discovery, candidate classification, eligibility assessment, provider verification, acquisition and integration as separate lifecycle stages. A newly discovered category can be proposed for architecture evolution without being auto-promoted into the canonical taxonomy.

### 2.6 Evaluation and governance

- **AFI PRIME:** evaluates candidate value, fit, reliability, benefit economics, eligibility, effort, operational cost, risk, freshness and evidence quality. Scores are explainable decision support, not automatic truth.
- **UAIE PRIME:** enforces governance, policy, licence, privacy, security, source permission, evidence sufficiency and approval gates. It must fail closed on missing or contradictory required evidence.
- **Human approval:** required before applications, account creation, acceptance of terms, credential use, purchases, spending, redemption, external writes, code installation, deployment or production configuration changes.
- **Universal Capability Acquisition Register:** records candidates, source provenance, decisions, approvals, acquisition status, integration status, measured outcomes, renewal/expiry and lessons learned.

Rejected, paused, expired, stale, inaccessible, duplicate, experimental, alternative and future-research candidates remain recorded with rationale and provenance. Do not delete potentially useful discoveries merely because they are not immediately actionable.

## 3. Source-to-architecture capability mapping

| Source component | STARWIRE placement | Required treatment |
|---|---|---|
| CloudCredits provider/programme catalogues | Source acquisition | Lossless provider and programme adapter |
| CloudCredits tiers, benefits, eligibility and application steps | Canonical opportunity knowledge | Separate programme, tier, benefit and eligibility records |
| CloudCredits Astro UI/search/cards | Experience and presentation research | Reuse interaction patterns only after product/design review |
| CloudCredits AI assistant UI | Assistant integration research | UI pattern only; backend and endpoint remain independently verified |
| CloudCredits scraping/text extraction | Capture tooling research | Security review and sandbox; do not import blindly |
| CloudCredits logo utility | Asset ingestion research | Validate MIME, file signature, extension and licence |
| Free for Open Source offer catalogue | Source acquisition | Offer adapter with per-record provenance |
| Free for Open Source project fingerprinting | Project intelligence | Reusable local-first project detector |
| Free for Open Source matching rules | Matching engine | Versioned, explainable rules with test fixtures |
| Free for Open Source eligibility logic | Eligibility evaluation | Preserve manual/unknown states and source wording |
| Free for Open Source existing-tool detection | Matching engine | Avoid redundant recommendations and migration churn |
| Free for Open Source sponsorship exports | Opportunity taxonomy | Separate sponsorship opportunity class |
| Free for Open Source schema/duplicate validation | Data quality | Adapt as independent validation checks |
| Free for Open Source site generation/exports | Publication research | Optional downstream presentation/export capability |
| Sourcey entity IDs and aliases | Canonical identity | Stable cross-source identity mapping |
| Sourcey programme/offer hierarchy | Canonical opportunity knowledge | Preserve distinct records and relationships |
| Sourcey economics and benefit qualifiers | Benefit model | Preserve exact/up-to/range/conditional semantics |
| Sourcey eligibility rule AST | Eligibility evaluation | Parse supported predicates; manual conditions remain unknown |
| Sourcey lifecycle states | Lifecycle management | Preserve source lifecycle and observed time |
| Sourcey evidence/revision metadata | Evidence and provenance | Link claims to exact source revision and evidence scope |
| Sourcey external verifier pattern | Independent verification | Treat as external dependency; inspect its own code, digest and policy before relying on it |

## 4. Cross-system responsibilities

| Existing Universal Engine boundary | STARWIRE responsibility | Boundary rule |
|---|---|---|
| STARWIRE | Discover and classify opportunities | Does not grant permissions or execute acquisitions |
| SYPHON | Bounded retrieval, extraction and evidence capture | Read-only source acquisition; no self-verification |
| AFI PRIME | Candidate evaluation and prioritisation | Explainable recommendations; not final governance authority |
| UAIE PRIME | Policy, permission and approval governance | Fail closed; human approval for consequential actions |
| Universal Capability Acquisition Register | Durable decision and outcome record | Record provenance, approvals and lifecycle transitions |

Architecture register IDs, division numbers and system numbers are intentionally not fabricated here. The inspected repository main tree does not contain the canonical nine-division, 90-system or 184-architecture register files. This document is the STARWIRE architecture integration source of truth for this branch until the canonical register repository/path is located and cross-referenced.

## 5. Lifecycle and quality gates

Proposed candidate lifecycle:

DISCOVERED → CAPTURED → PARSED → NORMALIZED → MATCHED → EVALUATED → GOVERNANCE REVIEW → HUMAN APPROVED → ACQUIRED → INTEGRATED → OUTCOME VERIFIED

Alternative transitions include NEEDS EVIDENCE, UNKNOWN ELIGIBILITY, PAUSED, STALE, EXPIRED, DUPLICATE-LINKED, REJECTED, DEFERRED and RETIRED. Every transition records actor/system, timestamp, prior state, new state, reason and evidence references.

Quality measures include source coverage, unique provider/programme/offer counts, duplicate-link precision, freshness, official-source confirmation rate, eligibility-known rate, parser/schema failure rate, provenance completeness, match precision/recall, false-positive rate, acquisition success, realised benefit and maintenance cost. Do not combine unlike counts or report catalogue maximum values as realised value.

## 6. Security, legal and operational controls

- Respect each source's licence, attribution, terms, access policy and rate limits. Code, data, exports, logos and trademarks can have different rights.
- Do not run third-party scripts, workflows, dependencies, agents or prompts merely because they exist in a repository.
- Treat all fetched HTML, YAML, JSON, README content, issue text and model-generated extraction as untrusted input.
- Protect against SSRF, DNS rebinding, redirect abuse, oversized responses, archive/path traversal, malicious YAML, unsafe deserialization and prompt injection.
- Never expose credentials through browser-visible/public build variables, logs, URLs, source records or prompts.
- Keep source retrieval credentials and any provider credentials in isolated secret stores with least privilege.
- Preserve an auditable chain from raw capture through parser, normalized record, evaluation, approval and outcome.
- Use reproducible fixtures and pinned source revisions. Mocked tests and schema validation do not prove live-source correctness.

## 7. Implementation work packages

**WP-1 — Source snapshot and file inventory:** pin immutable revisions; retain complete tree manifests; classify every file as data, code, schema, documentation, workflow, UI, utility, test, dependency or external reference; record licence and operational dependencies.

**WP-2 — Canonical model and migrations:** define typed schemas for provider, programme, offer, benefit, eligibility, application route, evidence, source revision, project fingerprint, match, decision and outcome. Add compatibility tests against existing STARWIRE candidate schema v2; extend rather than discard fields.

**WP-3 — Lossless adapters:** extend Sourcey and Free for Open Source adapters; implement a dedicated CloudCredits adapter; retain raw payloads, source-specific extensions and provenance.

**WP-4 — Matching engine:** adapt project fingerprinting and rule matching; add deterministic explanations, eligibility uncertainty, existing-tool detection and test fixtures.

**WP-5 — Independent verification:** verify representative and conflicting offers against official provider terms; distinguish observed, source-asserted, provider-confirmed and independently verified evidence.

**WP-6 — Governance and register:** route candidate evaluations through AFI PRIME and UAIE PRIME; persist decisions and human approvals in the Universal Capability Acquisition Register.

**WP-7 — Operational readiness:** add durable storage, scheduling, monitoring, backups, recovery, authenticated audit records, live-source tests and rollback procedures.

## 8. Acceptance criteria

1. All three source adapters preserve raw source records and exact source revisions.
2. No source-specific field is silently lost during normalization.
3. Different programmes, tiers and cohorts remain distinct even when provider names overlap.
4. Eligibility unknowns and manual checks remain explicit.
5. Conflicting benefit claims retain both evidence trails pending resolution.
6. Project matches are explainable and reproducible from pinned rules and project fingerprints.
7. Security, licence, terms and data-handling reviews pass.
8. AFI evaluation cannot bypass UAIE governance or human approval.
9. Tests include stale, paused, discontinued, malformed, conflicting, duplicate-linked and unknown-eligibility fixtures.
10. Live-source verification, persistence, scheduler and deployment are separately evidenced; mocked tests do not satisfy these gates.

## 9. Current state and next reconciliation

The three-source capability architecture is now explicitly mapped into STARWIRE's source, capture, knowledge, matching, evaluation, governance and acquisition layers. This is a direct architecture integration, not merely a research summary.

Still outstanding: exhaustive per-file review of all three source repositories; immutable source snapshot records; canonical register cross-references in the separate full Universal Engine architecture; schema implementation; adapter implementation; live verification; and production operation.

The current repository tree does not expose the complete canonical nine-division/90-system/184-architecture register set. Therefore this document must be reconciled into those canonical registers when their authoritative files/repository are available. Until then, do not invent IDs or claim those registers have been updated.

**Governing invariant:** preserve full discovery breadth; promote capabilities only through evidence, security, licence, verification and governance gates.

**Build for capability today. Design for possibilities tomorrow. Engineer for evolution indefinitely.**