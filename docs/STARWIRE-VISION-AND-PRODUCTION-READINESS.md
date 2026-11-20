# STARWIRE — Vision, Architecture, and Production-Readiness Contract

**Document status:** Engineering baseline — implementation and independent review required  
**System:** STARWIRE within the U.N.I.V.E.R.S.A.L. E.N.G.I.N.E. / E.N.G.I.N.E.E.R.  
**Primary responsibility:** Autonomous, governed opportunity discovery and acquisition intelligence

## 1. Mission

STARWIRE continuously discovers legitimate opportunities that can expand the Universal Engine / Engineer's capabilities, reduce operating costs, accelerate development, and create useful strategic options.

It must search beyond curated directories. Curated repositories and directories are seed sources and cross-checking inputs, not the boundary of discovery and never authorities that can certify their own listings.

Opportunity classes include:
- Open-source projects, repositories, reusable components, models, datasets, and technical capabilities.
- Cloud, compute, storage, networking, AI, GPU, and infrastructure credits.
- Startup programmes, grants, research programmes, developer benefits, and incubator/accelerator offers.
- Software, developer tools, APIs, SaaS discounts, free tiers, and legitimate subsidised services.
- Emerging technologies, useful standards, new infrastructure options, and capability gaps that can be addressed by external resources.

STARWIRE is a discovery and acquisition-intelligence capability. It is not a credit issuer, provider, purchasing agent, autonomous account creator, or unrestricted installer.

## 2. Architectural ownership and boundaries

The following responsibilities remain separate and must not be collapsed:

| Component | Owns | Must not do |
|---|---|---|
| STARWIRE | Discovery strategy, source registry, permitted collection, candidate normalization, provenance, freshness monitoring, deduplication, and hand-off | Self-approve, self-certify provider claims, spend money, accept terms, or install resources |
| SYPHON | Intrinsic permitted source access, bounded retrieval, extraction, and source-evidence capture | Bypass authentication, access controls, paywalls, robots policies, rate limits, licensing, or source restrictions |
| AFI PRIME | Independent technical, strategic, operational, and economic evaluation | Treat a listing's headline value or STARWIRE confidence as proof |
| UAIE PRIME | Governance, eligibility and terms review, approval authority, verification, lifecycle control, and acquisition-register stewardship | Delegate approval to a source or to the same evaluator that proposed the opportunity |
| Universal Capability Acquisition Register | Governed record of opportunities, decisions, value, risks, evidence, and outcomes; intrinsic to UAIE PRIME | Become a competing standalone engine or accept unapproved writes |

Canonical flow:

`STARWIRE → SYPHON → Candidate & Evidence Package → AFI PRIME → UAIE PRIME → Universal Capability Acquisition Register`

Discovery is not approval. Evaluation is not acquisition. Approval is not successful integration. Each transition requires its own evidence.

## 3. Discovery-source network

Initial integrated sources:

| Source | Role | Current treatment |
|---|---|---|
| CloudCredits.io | Curated startup/cloud/software credit catalogue | Discovery input; every offer requires current official-provider verification |
| Free for Open Source | Open-source benefits and resource discovery | Discovery input; provider terms and eligibility must be independently checked |
| Sourcey | Startup credits, perks, discounts, infrastructure and developer resources | Discovery input; verify original provider terms, eligibility, restrictions, expiry and economic value |
| `Surya-saka/startup-credits` | Curated public GitHub catalogue | Proposed source under evaluation; not an authority |
| Wider internet | Provider announcements, official programme pages, public repositories, documentation, research, changelogs and other permitted sources | Required long-term discovery surface; not limited to the listed directories |

The source registry must distinguish:
- configured and reachable;
- discovered but not configured;
- temporarily unavailable;
- disallowed or retired;
- under source-quality review.

Do not invent canonical URLs, credentials, API contracts, licences, or access permissions. A source cannot be promoted to configured until its canonical endpoint and terms have been verified.

## 4. Intrinsic SYPHON collection contract

SYPHON is an intrinsic STARWIRE capability, not a bolt-on product or a separate acquisition authority.

Every collection operation must:
1. Use an explicitly configured source and permitted access method.
2. Require HTTPS for remote sources.
3. Respect source terms, robots policies where applicable, authentication boundaries, rate limits, quotas, and licensing.
4. Apply bounded request timeouts, response-size limits, content-type validation, and safe parsing.
5. Reject redirects unless the destination has been separately checked and approved.
6. Avoid collecting credentials, private personal data, or unrelated sensitive information.
7. Preserve source URL, retrieval time (UTC), source revision/commit when available, content type, retrieval outcome, content digest, and extraction version.
8. Preserve the original captured evidence separately from normalized candidate fields.
9. Record partial, failed, stale, and contradictory retrievals without silently treating them as successful.
10. Never execute downloaded code, install packages, submit forms, create accounts, accept terms, or spend funds as a side effect of discovery.

## 5. Candidate evidence model

Every candidate must retain, at minimum:

- Stable candidate ID and schema version (current candidate evidence contract: schema v2).
- Source ID, source type, canonical URL, exact source location, source-published licence, stable upstream record ID, immutable source revision/commit, release ID, upstream artifact digest, and the original provider URL as a separate field. Fields unavailable from a source remain explicitly unknown/null.
- Retrieved-at timestamp, source-updated timestamp where available, and last official-provider verification timestamp.
- Provider and programme names as published.
- Original provider URL and the relationship between source URL and provider URL.
- Advertised benefit, unit, currency, benefit type, and original wording.
- Eligibility requirements, geography, entity/funding-stage restrictions, partner requirements, account-history requirements, and unknown fields.
- Start date, application window, expiry, duration, renewal, stacking, usage and post-credit pricing terms.
- Evidence references, content digests, extraction method/version, and source provenance.
- Duplicate/canonical candidate links without destroying separate programme identities.
- Confidence, freshness, contradiction, and verification states.
- AFI PRIME evaluation record and rationale.
- UAIE PRIME decision, approver, decision evidence, and audit reference.
- Acquisition-register record ID when—and only when—UAIE PRIME authorizes the write.
- Original Idea Value wherever the opportunity is linked to an original portfolio idea.

Never infer missing terms. Preserve unknown as unknown. Keep advertised value separate from attainable economic value.

## 6. AFI PRIME evaluation contract

AFI PRIME evaluates each candidate using evidence-backed criteria:

- Capability relevance to current and planned Universal Engine / Engineer work.
- Practical usefulness and quality.
- Eligibility based on verified facts; unknown does not mean eligible.
- Realistically attainable economic value after restrictions, likely utilization, expiry, and opportunity cost.
- Strategic value, including cost avoidance and capability acceleration.
- Integration effort, dependencies, maintenance burden, and operational complexity.
- Security, privacy, data residency, compliance, licensing, and vendor lock-in.
- Expiry pressure and time-to-benefit.
- Evidence quality, freshness, source independence, and confidence.

The evaluation must retain assumptions, score rationale, uncertainty, and rejection reasons. Prioritize usable value rather than impressive headline figures. A smaller unrestricted benefit may be worth more than a large credit that cannot be accessed or consumed economically.

## 7. UAIE PRIME governance and register contract

UAIE PRIME controls the lifecycle:

`Discovered → Proposed → Under Evaluation → Approved / Rejected / Retired → Integrated (only after authorised implementation)`

Required controls:
- Separate evaluation from governance approval.
- Require official-provider evidence for current-offer claims.
- Require explicit human authorization before account creation, application submission, acceptance of terms, purchase, subscription, or any paid commitment.
- Require explicit authorization before privileged integration, code execution, installation, or changes to production systems.
- Keep immutable or tamper-evident decision history and preserve prior states.
- Permit rejection, expiry, withdrawal, and retirement without deleting provenance.
- Require an independent verification path; a component must not certify its own work.
- Write to the Universal Capability Acquisition Register only through UAIE PRIME's governed interface.

The register must include advertised value, realistic attainable value, potential market value, cost/revenue model, development/integration timeline, risk assessment, eligibility, restrictions, expiry/review dates, evidence and verification status, decision rationale, provenance, outcome, and mandatory Original Idea Value.

## 8. Freshness, deduplication, and source quality

- Treat catalogues as discovery feeds, not live availability APIs.
- Track source revisions and changed files where available.
- Re-check official provider pages before surfacing an offer as current.
- Maintain historical snapshots and change records.
- Deduplicate across catalogues and independent discovery while retaining distinct programme records.
- Flag stale, contradictory, anomalous, unsupported, and suspicious values.
- Do not silently repair source data; preserve the original claim and record the correction with evidence.
- Use source diversity to reduce single-source bias.
- Apply source-specific polling intervals and backoff; do not repeatedly fetch sources without need or permission.

Known source-quality examples from the current startup-credits evaluation include an advertised programme count that does not reconcile with the category totals and an anomalous “149% off” listing. Such claims must remain flagged until official evidence resolves them.

## 9. Security, privacy, and resilience

Production implementation must include:
- Least-privilege source credentials, stored only in server-side secret management.
- No secrets in browser bundles, source records, logs, prompts, or committed files.
- Explicit source allowlists and policy-based access.
- Request and response limits, timeouts, concurrency limits, retries with bounded backoff, and circuit breakers.
- Safe handling of untrusted HTML, Markdown, JSON, archives, and repository content.
- No execution of source-provided code during discovery.
- Audit events for configuration changes, retrieval, extraction, evaluation hand-off, governance decisions, and register writes.
- Data minimization, retention rules, deletion handling, and privacy review.
- Backup, restore, disaster-recovery, and incident-response procedures.
- Cost and quota monitoring for STARWIRE's own discovery infrastructure.

## 10. Production acceptance gates

STARWIRE is not production-ready until all applicable gates are evidenced on the exact release candidate:

1. **Architecture:** ownership, contracts, lifecycle, threat model, data model, and failure modes independently reviewed.
2. **Source configuration:** each enabled source has a verified canonical endpoint, access method, licence/terms assessment, and refresh policy.
3. **Collection:** permitted retrieval and extraction work end-to-end with provenance and bounded resource use.
4. **Quality:** parsing, normalization, deduplication, stale-data handling, contradiction detection, and official-provider verification work.
5. **Evaluation:** AFI PRIME receives complete evidence packages and returns reproducible, reasoned evaluations.
6. **Governance:** UAIE PRIME enforces independent approval, authorization boundaries, and controlled register writes.
7. **Security:** threat modelling, dependency review, secret handling, authorization, abuse controls, and adversarial tests pass.
8. **Reliability:** retry, timeout, rate-limit, source outage, partial-response, recovery, backup, and restore scenarios pass.
9. **Operations:** monitoring, alerting, audit access, runbooks, rollback, ownership, and cost controls are operational.
10. **Release:** CI, integration tests, staging rehearsal, live source checks, independent security review, and explicit release approval pass.

A passing unit test, mock provider, static build, or architecture document does not prove live operation. Status vocabulary must remain exact: **PLANNED / IMPLEMENTED / CONFIGURED / TESTED / VERIFIED / PRODUCTION-APPROVED**.

## 11. Initial implementation sequence

1. Freeze and review the source registry and data contracts.
2. Implement read-only SYPHON connectors for explicitly approved sources.
3. Implement candidate evidence capture, normalization, and deduplication.
4. Implement freshness monitoring and official-provider verification queues.
5. Implement AFI PRIME evaluation contracts and reproducible scoring records.
6. Implement UAIE PRIME governance and the acquisition-register interface with approval gates.
7. Add integration, security, adversarial, resilience, and recovery tests.
8. Deploy to an isolated staging environment with non-production credentials and source quotas.
9. Conduct live verification, independent review, and rollback rehearsal.
10. Promote only after all release gates are evidenced and explicitly approved.

## 12. Current implementation status and blockers

This document is an engineering contract, not proof that STARWIRE is operational.

At the time of this document:
- The source-specific startup-credits assessment exists as a separate proposed documentation change.
- Existing SYPHON / ALLSPARX PRIME runtime and gateway work is tracked in separate pull requests and must be reconciled without discarding their history.
- The repository's current default-branch Ask AI adapter is not evidence of an autonomous STARWIRE discovery service.
- The candidate evidence policy is implemented as a pure schema-v2 validation/evaluation module, including source licence, record ID, revision, release, artifact digest and separate provider URL fields. This is not a durable database, operational AFI PRIME service, or register writer.
- No live STARWIRE scheduler, multi-source collector, candidate database, operational AFI PRIME evaluator, UAIE PRIME approval service, or production acquisition-register write path is claimed by this document.
- No provider credentials, cloud account settings, external write permissions, or production endpoint may be guessed or fabricated.

**Release posture: NOT PRODUCTION READY until the acceptance gates above are implemented, tested, independently verified, configured in the target environment, and approved.**

## 13. Governing principle

**Discover broadly. Collect lawfully. Evaluate critically. Govern independently. Verify everything. Acquire only with authority.**

Build for capability today. Design for possibilities tomorrow. Engineer for evolution indefinitely.
