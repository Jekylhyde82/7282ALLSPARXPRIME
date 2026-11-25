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

## 10. Sourcey whole-repository audit — first batch findings

**Pinned upstream snapshot:** `sourcey/startup-credits`, branch `main`, commit `bd6a4fda0b5c35dd23069c86a7568ea91fe1c3e9`. The recursive tree was complete (`truncated=false)): 638 files, comprising 623 Entity YAML records in 193 two-character shard directories and 15 repository-control/documentation files.

**Important boundary correction:** this repository is a thin public YAML catalogue and contribution/governance repository. It does not contain the hosted Sourcey REST API, MCP server, public JSON datasets, signed change-feed service, or product backend. Those are separately linked product surfaces and require independent contract, privacy, security, availability and revision-semantics audits. Do not describe them as code installed from this Git repository.

### 10.1 Complete tree inventory

The 15 non-Entity files comprise:
- `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `LICENSE`, `DATA-LICENSE.md`;
- `.github/workflows/validate.yml` and `.github/pull_request_template.md`;
- two structured issue templates for missing records and company icons;
- catalog-verifier `package.json`, lockfile and `.gitignore`;
- verifier SHA-256 pin;
- root-set JSON and root-set digest.

The `AGENTS.md` repository boundary explicitly defines this as a public YAML contribution repository and prohibits adding executable application code, packages, scripts, tests, fixtures, schemas, generated snapshots and internal evidence/trust operations. Therefore, the absence of an in-repository runtime is an intentional architectural boundary, not a missing feature to fill by blindly importing code.

### 10.2 Capabilities extracted from repository materials

| Material | Confirmed capability/pattern | STARWIRE disposition |
|---|---|---|
| 623 Entity YAML records | Structured provider catalogue, domains, profile, source references, programmes, offers, benefits, eligibility, lifecycle, roles and access | Lossless data ingestion |
| README | Data-model example, public interface pointers, attribution and source-grounding principles | Adapter contract documentation |
| AGENTS | Explicit repository scope and content restrictions | Enforced source boundary |
| CONTRIBUTING | Stable ID/path rules, source identity, canonical-source policy, offer separation, field constraints, DCO and validation/admission distinctions | Identity, quality and governance patterns |
| DATA-LICENSE | CC BY 4.0 catalogue-facts licence | Data attribution control |
| LICENSE | MIT for repository documentation/metadata | Separate licence treatment |
| GitHub validation workflow | PR validation delegates to an exact commit-pinned external workflow | CI supply-chain pattern; not a runtime component |
| Verifier package/lockfile and SHA-256 pin | Minimal pinned verifier dependency declaration and artifact-integrity reference | External verifier dependency audit |
| Root-set JSON/digest | Explicit trust-root input and digest | Trust-root provenance pattern; semantics require separate review |
| Missing-record issue template | Structured intake, canonical first-party source requirement, duplicate awareness | Discovery intake workflow |
| Company-icon issue template | Asset request, rights declaration, moderation/publication boundary | Rights-aware asset pipeline |
| PR template | Contribution review checklist | Human review workflow |

### 10.3 Data-model patterns confirmed by record inspection

- Stable opaque Entity, Programme and Offer IDs; slug aliases; identity-derived file paths; no ID reuse.
- Source identity is a distinct opaque ID linked to a public URL; it is not merely a URL hash.
- Factual claims require public evidence from the party controlling the fact; aggregator listings are not treated as authoritative provider terms.
- Programmes and offers are distinct. Standalone offers can exist without a programme; materially different economics, eligibility, duration, access or terms require distinct Offer records.
- Benefits support monetary and non-monetary values, currency minor units, exact/up-to qualifiers and durations.
- Eligibility supports nested `all`, `any`, `not`, typed predicates and manual criteria.
- Terms authority and access operator are explicit roles; access method, availability and application URL are separate.
- Lifecycle status/effective time are distinct from retrieval time and source revision.
- Community-submitted evidence is not automatically vendor-signed. Company authority and exact-record approval are separate processes.
- Validation, evidence admission, vendor authority, human verification and publication/merge are separate gates.
- Correction and lifecycle history are retained; stale records are corrected or ended rather than silently erased.
- Catalogue facts, documentation, third-party marks and icons have separate rights considerations.

### 10.4 Representative records inspected

- Anthropic: paused cohort; one-time USD 1,000 API credit; one year of Team service with seat and new-customer conditions; partner-stack value qualified as dependent on redeemed offers; manual startup eligibility. Useful test fixture for paused status, conditional value and manual criteria.
- Aiven: distinct programme and offer; up-to USD 100,000 credit with 12-month duration; multiple non-cash benefits; nested all/not/any eligibility predicates; external-verification manual criterion. Useful fixture for compound eligibility and mixed benefits.
- Youverify: standalone offer without a programme; up-to monetary credit, free service and non-cash support; vendor-discretion manual eligibility.
- Z.ai: explicit programme-to-offer link, alias, non-monetary token-quantity benefit and manual vendor review.
- Zoom: programme/offer linkage, one-year service benefit, referral availability and mixed predicate/manual eligibility.

These are representative examples only. They do not establish that all 623 records are current or independently verified.

### 10.5 New STARWIRE capabilities required

1. **Immutable repository inventory:** commit/tree IDs, completeness flag, per-file path/blob SHA/size/type and audit coverage.
2. **Lossless YAML ingestion:** retain raw bytes, source blob SHA, unknown fields/extensions, parse errors and normalized projection.
3. **Entity identity resolution:** canonical IDs, aliases, domains and path identity without collapsing distinct entities.
4. **Offer relationship graph:** Entity → Programme → Offer → Benefit and Offer → Source/Evidence, while supporting standalone offers.
5. **Typed eligibility engine:** nested all/any/not and typed predicates with true/false/unknown outcomes; manual checks remain unknown until evidence is supplied.
6. **Evidence authority classification:** first-party canonical source, channel operator, aggregator, community assertion and unsupported source.
7. **Revision-scoped approval ledger:** bind observation, admission, provider authority and independent verification to exact record revisions.
8. **Contribution/admission workflow:** separate submission, structural validation, evidence admission, authority, human review, merge and publication.
9. **Rights-aware asset pipeline:** byte-level asset capture, origin, rights declaration, review and publication approval.
10. **Lifecycle/correction monitor:** detect changed, paused, stale, expired, withdrawn and corrected records without erasing historical assertions.
11. **Verifier supply-chain monitor:** track external workflow commit, package/lockfile, verifier digest and trust-root digest.
12. **Coverage monitor:** distinguish tree inventory coverage from semantic per-record audit coverage.

### 10.6 Provisional register mapping

| Capability | Existing responsibility boundary | Register action |
|---|---|---|
| Snapshot inventory, adapters, ingestion | STARWIRE discovery/source acquisition | Cross-reference existing STARWIRE systems when authoritative registers are located |
| Evidence capture and source authority | SYPHON | Cross-reference evidence responsibilities |
| Entity identity and offer graph | Knowledge/identity architecture | Map to canonical knowledge and identity responsibilities |
| Typed eligibility and matching | Intelligence/evaluation | Map to matching and evaluation responsibilities |
| Revision-scoped approvals and rights policy | UAIE PRIME / governance / security | Preserve independent authority |
| Candidate decisions and lifecycle outcomes | Universal Capability Acquisition Register | Record provenance, approvals and realised outcomes |

These are responsibility mappings, not fabricated register IDs. The canonical nine-division/90-system/184-architecture files are not present in the inspected repository tree.

### 10.7 Audit coverage and next batch

The recursive tree inventory is complete. The 15 repository-control/documentation files have been identified; the core boundary, licence, contribution, workflow and representative record materials have been inspected. Five representative Entity records were read at field level. The other 618 Entity YAML records are inventoried by path/blob identity but have not yet each received semantic field-level review. Hosted API, MCP, JSON datasets, change feed and external verifier implementation remain separate audit targets.

Next Sourcey batch: process Entity YAML records in bounded parallel chunks to extract schema variants, field coverage, eligibility operators, benefit types, lifecycle states, source-domain patterns, anomalies and duplicate candidates. Record exact per-file coverage and preserve every blob SHA. Do not claim full semantic audit until all 623 records have been processed.


## 11. Intrinsic local-model execution integration — LM Studio

**Architecture decision:** integrate LM Studio as a local model-execution provider available to STARWIRE's intelligence workflows. It is a supporting execution capability inside the existing STARWIRE architecture, not a new system, division, discovery source, governance authority or parallel AI architecture.

### 11.1 Placement and responsibilities

- **STARWIRE orchestration:** selects an approved model-execution route for a task and records the task, provider, model identity, configuration and outcome.
- **Local model provider adapter:** uses the official `@lmstudio/sdk` package to communicate with a running LM Studio service where the host environment supports it.
- **AFI PRIME:** evaluates model suitability, capability, latency, resource cost, quality and task-specific evidence. Provider selection remains explainable and replaceable.
- **UAIE PRIME:** governs model permissions, data classification, network access, tool permissions, policy compliance and approval gates.
- **SYPHON:** remains responsible for bounded external-source acquisition and evidence capture; LM Studio does not bypass those controls.
- **Universal Capability Acquisition Register:** records the SDK/provider candidate, version, approval, integration state, tests, measured outcomes and any replacement decision.

### 11.2 Provider-independent execution contract

STARWIRE must call a provider-neutral internal interface rather than importing LM Studio throughout business logic. The interface should cover, where supported and verified:

1. model discovery and availability;
2. model loading and unloading;
3. chat/inference requests;
4. structured output and streaming;
5. embeddings for retrieval workflows;
6. tool/function calling where supported by the selected model and runtime;
7. cancellation, timeout and resource/error reporting;
8. health checks and capability reporting.

The LM Studio adapter implements only the capabilities actually supported by the installed SDK version, server version and selected model. Unsupported capabilities must be reported explicitly, not simulated or silently assumed.

### 11.3 Local-first routing and resilience

- Prefer an approved local model when it meets the task's quality, latency, privacy and hardware requirements.
- Permit separately approved remote providers as alternatives or fallbacks; do not hard-code LM Studio as the only provider.
- Make fallback explicit, policy-checked and auditable. Never send private or restricted data to a remote provider merely because local inference fails.
- Record model identifier, runtime/SDK versions, inference settings, timestamps, latency, token/resource usage when available, errors and evaluation outcome.
- Treat model output as untrusted data. Tool execution, repository writes, external requests and consequential actions remain behind authorization and validation boundaries.
- Keep credentials and local service endpoints out of public client bundles, logs and committed configuration.

### 11.4 Dependency placement — do not install into the wrong package

The inspected `package.json` on this branch identifies the package as `cloudcredits.io`, an Astro website. It is not evidence of a STARWIRE backend or model-orchestration runtime. Therefore, do **not** add `@lmstudio/sdk` to that website package merely to claim integration.

Install `@lmstudio/sdk` in the actual STARWIRE server/worker package that owns model execution, after its runtime location and package manager are identified. Pin and lock the dependency using that package's existing package manager. If no such runtime package exists yet, create the provider adapter in the approved STARWIRE runtime workspace rather than coupling it to the public website.

### 11.5 Verification gates

Before declaring the integration operational:

1. confirm the target runtime and supported Node.js version;
2. pin the SDK version and retain the lockfile;
3. test connection and health-check behavior against the intended LM Studio server;
4. test model listing, loading, inference, streaming and unload behavior as applicable;
5. test timeouts, unavailable server, unavailable model, malformed output and cancellation;
6. verify data-boundary enforcement and that no prohibited remote fallback occurs;
7. run model/provider compatibility tests and record hardware/resource limits;
8. pass security review and UAIE approval;
9. record reproducible test evidence and measured outcomes.

**Current disposition:** architecture integrated; package installation, adapter implementation, runtime tests and deployment are not claimed complete. This preserves the distinction between an approved architecture decision and a verified working integration.
