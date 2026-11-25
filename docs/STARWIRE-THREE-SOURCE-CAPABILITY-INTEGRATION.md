# STARWIRE BURST: Three-Source Capability Integration

Status: Research integration record — not production deployment
Date: 2026-11-25
Target branch: starwire/three-source-integration
Base: main at 15b7bfcb712cfa9c8b724ca29095d4d98a850c3b

## Governing instruction
Preserve and investigate the full value of every source component. Do not discard a component merely because it is not immediately useful, overlaps another source, is unfinished, or is not suitable for production today. Classify its role and retain provenance. Discovery does not imply permission to copy, execute, deploy, or integrate third-party code.

PROOF BEFORE CLAIM. EVIDENCE BEFORE CONFIDENCE. VERIFICATION BEFORE COMPLETION.

## Scope examined
Complete default-branch repository trees were enumerated:

| Source | Repository | Tree entries reported |
|---|---|---:|
| Free for Open Source | natwar86/foropensource | 211 |
| Sourcey Startup Credits | sourcey/startup-credits | 638 |
| CloudCredits.io | t3-sh/cloudcredits.io | 701 |

These are tree-entry counts from the inspection session, not counts of independently verified offers. Exact immutable source commit SHAs and retrieval timestamps must be recorded in the evidence ledger before ingestion. A moving branch name is not an immutable revision.

## A. Free for Open Source — component inventory
Investigated the offer YAML collection, offer schema, project matching rules, Python matching and validation utilities, site generation, exports, documentation and GitHub workflows.

Preserve these distinct capability candidates:
1. Offer catalogue ingestion: company identity, offer URL, benefits, eligibility, application instructions, status, last-verified date and verification anchors.
2. Project fingerprinting: infer characteristics from dependencies, languages, paths, files, README content and CI workflows.
3. Rule-based matching: map detected characteristics to relevant offers and retain an explanation for each match.
4. Eligibility screening: evaluate public-repository, licence, project-age, activity and commercial restrictions; manual conditions remain unknown until checked.
5. Existing-tool awareness: recognise tools already used and avoid unnecessary replacement recommendations.
6. Sponsorship intelligence: preserve sponsored-project and company-sponsorship exports as a distinct opportunity family, not as cloud-credit offers.
7. Data quality: schema validation, duplicate checks, stale/discontinued status checks.
8. Publication pipeline: site generation, search/index material and machine-readable exports.
9. Contribution and maintenance process: retain contribution conventions and verification workflow as source metadata.
10. Automation/workflows: inspect separately for private engines, credentials and external services; do not import privileged workflow behaviour without security review.

Repository-reported sponsorship export quantities (12,712 projects and 351 companies) are claims to snapshot and validate, not guaranteed current counts. Company counts, offer-file counts and distinct-offer counts must remain separate metrics.

## B. Sourcey Startup Credits — component inventory
Investigated the complete entity-record tree, representative AWS and Anthropic records, README, data licence and workflow/verifier references.

Preserve these distinct capability candidates:
1. Canonical provider/entity identity: stable IDs, aliases, provider domains and categories.
2. Programme and offer hierarchy: never collapse provider, programme and offer into one record.
3. Structured economics: amount, currency, duration, exact/up-to/at-least semantics, benefits and consideration.
4. Eligibility representation: compound predicates, manually evaluated requirements and explicit unknown states.
5. Authority separation: distinguish the party controlling programme terms from the party operating access.
6. Application/access routes: preserve method and URL as source claims, not proof of acceptance.
7. Lifecycle modelling: active, paused, discontinued and other source-defined states.
8. Evidence and revision awareness: source IDs, evidence links, revision identifiers/digests and attestation scope.
9. External validation architecture: the public repository is intentionally a thin data contribution layer; its workflow references a separately maintained, digest-pinned verifier. Do not claim that verifier's implementation is contained here.
10. Data governance/licensing: preserve attribution requirements and third-party trademark ownership.

Example distinction: AWS Activate Portfolio and Founders are separate offers with different conditions. The Anthropic example records a paused programme. Source status is not independent confirmation of present provider availability.

## C. CloudCredits.io — component inventory
Investigated the complete Astro repository tree, content collections/configuration, programme schema, representative provider/programme records, package metadata, AI assistant interface and utility scripts.

Preserve these distinct capability candidates:
1. Provider catalogue: provider identity, domains, category and descriptive metadata.
2. Programme catalogue: distinct programmes and programme tiers.
3. Programme detail model: benefits, eligibility, effort, application steps, FAQs and community notes.
4. Discovery/navigation UI: category browsing, search, cards, provider pages and programme pages.
5. AI assistant interface: retain as an interface/integration pattern only; front-end endpoint configuration does not prove the backend is included or deployed.
6. Static-site/content pipeline: Astro content collections, validation/build and publishing configuration.
7. SEO and machine-readable content: inspect metadata and generated content for potential discovery feeds.
8. Scraping/text extraction utilities: treat as untrusted-input and SSRF-sensitive; require URL allowlisting, DNS/IP egress controls, redirect restrictions, size/time limits and credential isolation before reuse.
9. Logo acquisition utility: validate MIME type, file signature and extension consistency; a PNG saved with an SVG extension is a defect to avoid.
10. Feature flags/runtime configuration: preserve defaults and endpoint configuration; never expose secrets through public build-time variables.

Schema limitation: the inspected programme schema restricts currency to USD and EUR. STARWIRE must support ISO currency codes and non-monetary benefits rather than inherit that restriction.

## Cross-source integration design
CloudCredits.io, Free for Open Source and Sourcey feed source-specific STARWIRE adapters. Adapters feed read-only SYPHON capture, then an immutable source evidence ledger. Parsing, schema validation and quality checks produce canonical provider, programme and offer records. Project fingerprinting and opportunity taxonomy feed explainable matching. AFI PRIME provides decision support; UAIE PRIME governs approvals; authorised outcomes enter the Universal Capability Acquisition Register. External applications, account creation, terms acceptance, spending, redemption and production changes remain human-authorised.

## Canonical record requirements
Keep distinct records and stable IDs for source, source revision, capture, provider/entity, programme, offer, benefit/economic term, eligibility condition, application/access route, evidence item, verification event, project fingerprint, match result, decision, approval and acquisition outcome.

Every ingested field retains its source pointer and observed timestamp. Preserve original raw values alongside normalized values. Never overwrite conflicting provider claims; store both claims, their evidence, timestamps and resolution status.

Minimum offer fields: canonical offer ID and upstream IDs; provider and programme IDs; source ID, immutable source revision and capture ID; original source URL and official provider URL; benefit type, amount, currency, amount qualifier and duration; eligibility expression plus manual/unknown conditions; application method and route; source lifecycle status and last-verified timestamp; licence/attribution obligations; evidence references, revision digest and assurance scope; duplicate/relationship links; ingestion, parser and schema versions.

## Integration rules and gates
1. Read-only first. Initial adapters retrieve public data only under documented source policy and rate limits.
2. No silent source promotion. Catalogue claims are leads until official provider terms are checked.
3. No lossy normalisation. Preserve raw records and source-specific fields; add extensions instead of dropping unusual information.
4. No premature deduplication. Link likely duplicates while retaining separate programmes, tiers, offers and source assertions.
5. No execution of imported code. Third-party scripts, workflows, dependencies and AI prompts require separate review and sandboxing.
6. Licence per asset. Repository code, offer data, sponsorship exports, logos, trademarks and contributed records may have different rights.
7. Secure fetch. Enforce HTTPS, host allowlists, DNS resolution and public-IP checks, rebinding protection, redirect denial or revalidation, response limits, timeouts and isolated credentials.
8. Human approval remains mandatory for applications, account creation, acceptance of terms, spending, redemption, credential use, code installation and production changes.
9. Independent verification. The source adapter cannot certify its own extracted claims. Use independent evidence and reproducible checks.
10. Record all outcomes. Include rejected, stale, paused, discontinued, inaccessible, duplicate, experimental and future-research items with reasons; do not erase them from discovery history.

## Conflicts and gaps to resolve
- CloudCredits AWS summary and Sourcey AWS Portfolio record report different maximum credit values. Compare exact programme, tier, cohort, date and official terms before treating this as a contradiction.
- Free for Open Source company counts, offer-file counts and distinct-offer counts are not interchangeable.
- Currency support must be broader than CloudCredits.io's inspected USD/EUR schema.
- Sourcey delegates verification to an external verifier; its internals are not present in the public data repository.
- CloudCredits.io's AI assistant UI does not establish an available backend.
- Scraping and logo utilities require security and correctness review.
- Existing STARWIRE SYPHON work is a draft implementation, not proof of production capture, durable persistence, scheduled discovery or autonomous acquisition.

## Implementation sequence
### Phase 1 — Preserve and map
- Pin each source to an immutable commit.
- Store complete tree manifests and licences.
- Produce per-file inventory and classify each component as data, code, schema, documentation, workflow, UI, utility, test, dependency or external reference.
- Record all discovered capabilities, including experimental and currently unusable ones.

### Phase 2 — Build lossless adapters
- Extend existing Sourcey and Free for Open Source adapters.
- Design a dedicated CloudCredits adapter.
- Preserve raw payloads and source-specific fields.
- Add per-source schema and licence policies.

### Phase 3 — Verify and compare
- Build representative record fixtures.
- Compare overlapping providers and offers against official provider terms.
- Test stale, paused, discontinued, unknown, conflicting and malformed records.
- Measure coverage, precision, duplicate linkage, freshness and provenance completeness.

### Phase 4 — Match and govern
- Adapt project fingerprinting to Universal Engine's actual repository and capability needs.
- Explain every match and every eligibility uncertainty.
- Feed AFI PRIME only evidence-backed candidates.
- Require UAIE PRIME governance and human approval before external actions.

### Phase 5 — Operationalise only after proof
- Add durable storage, scheduling, monitoring, backup/recovery and authenticated audit trails.
- Run live-source tests separately from mocked unit tests.
- Promote only after independent security, licence, reliability and acceptance checks.

## Current implementation status
This is a research-to-architecture integration artefact. It does not claim that the three external repositories have been copied, installed, merged into main, deployed or made operational. The target branch is isolated from main. Existing STARWIRE/SYPHON drafts and their review gates remain intact.

Next engineering work: create the per-file inventory and immutable source snapshots, then implement lossless adapter extensions and a CloudCredits adapter on this isolated branch. Do not merge or deploy until tests and governance gates pass.