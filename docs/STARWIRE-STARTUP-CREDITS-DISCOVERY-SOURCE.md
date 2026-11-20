# STARWIRE Discovery Source Integration: startup-credits

**Status:** Proposed source — under evaluation  
**Source class:** Curated public discovery catalogue  
**Source identifier:** `github:Surya-saka/startup-credits`  
**Repository:** https://github.com/Surya-saka/startup-credits  
**LinkedIn discovery:** https://www.linkedin.com/posts/surya-saka-a803b4264_github-surya-sakastartup-credits-activity-7440639483701678081-ktqJ  
**Repository licence:** MIT (as declared by the source repository)  
**Source README last-updated label:** March 2026

## 1. Architectural decision

Incorporate this repository as a **curated discovery source within STARWIRE**. It is not an engine, an evaluator, an authority, a credit issuer, or an acquisition mechanism.

It joins the existing STARWIRE discovery-source network alongside CloudCredits.io and Free for Open Source. STARWIRE must continue to discover opportunities independently across the wider internet; this repository is a seed catalogue and cross-checking input, never a sole source of truth.

The governed flow remains:

1. **STARWIRE** discovers and captures candidate opportunities with source provenance.
2. **AFI PRIME** evaluates usefulness, technical fit, economic value, strategic relevance, feasibility, and risk.
3. **UAIE PRIME** governs the decision, evidence, verification, permissions, and acquisition-register recording.
4. **Universal Capability Acquisition Register** records the governed outcome and preserves the original source and discovery provenance.

Discovery does not imply approval. Evaluation does not imply acquisition. No application, account creation, spending, subscription, or acceptance of provider terms is authorised by this source integration.

## 2. What the source contributes

The README describes a catalogue of startup, developer, and enterprise programmes across these areas:

- Major cloud providers
- Specialised infrastructure
- Databases and data platforms
- AI and machine-learning platforms
- DevOps and developer tooling
- Analytics and monitoring
- Productivity and collaboration
- Marketing and sales
- Web3 and blockchain
- Security and compliance
- Regional programmes

Examples listed include AWS, Microsoft Azure, Google Cloud, Cloudflare, DigitalOcean, MongoDB, Nebius, Deepgram, OpenAI, GitHub, GitLab, PostHog, Grafana Labs, and others.

The catalogue is useful for discovering:
- Cloud, compute, storage, and GPU credits
- AI/API/model credits and developer programmes
- Database, observability, security, and developer-tool offers
- Open-source project benefits
- SaaS discounts and free tiers
- Region-specific programmes and startup support

These are catalogue claims, not verified current entitlements.

## 3. Initial source-quality findings

The source is publicly readable and declares an MIT licence. Its README also explicitly warns that credit amounts, eligibility, and programme terms change and must be checked with providers.

The following quality issues must be retained as evidence, not silently corrected:

- The README claims **180+ programmes**, but the eleven category counts in its Quick Stats table add to **111**. The headline count is therefore not corroborated by that table.
- The README advertises **$5M+** in potential value. This is an aggregate maximum claim, not cash, guaranteed funding, or an amount available to any one applicant.
- Eligibility descriptions are abbreviated and may omit partner, incorporation, funding-stage, geography, age, usage, or account-history conditions.
- Credit amounts, discounts, and offer availability are not independently verified merely because a listing links to a provider.
- At least one listed value is anomalous: Instabug is shown as “149% off”. Treat this as a data-quality warning requiring provider-side confirmation, not a usable discount claim.
- A repository README update date is not proof that every programme was reviewed on that date.

**Initial disposition:** Accept as a discovery lead source only. Do not mark its individual offers as verified or approved.

## 4. Required ingestion and provenance

For each imported candidate, preserve at minimum:

- Stable internal candidate ID
- Source identifier and source repository URL
- Exact source file/path and source record or section
- Source commit SHA and retrieval timestamp (UTC)
- Provider name and programme name as stated by source
- Original application/programme URL
- Advertised benefit and original currency/unit
- Eligibility text verbatim or faithfully captured
- Geographic and organisational restrictions, where stated
- Expiry, duration, application window, and renewal terms, where stated
- Source freshness and last provider-side verification timestamp
- Duplicate/canonical-provider relationship
- Confidence and evidence status
- AFI PRIME evaluation outcome and rationale
- UAIE PRIME governance outcome and approver/evidence trail
- Universal Capability Acquisition Register record reference, when created

Do not collapse separate programmes from the same provider into one opportunity. Do not convert discounts into cash-equivalent value without a transparent calculation and assumptions. Preserve the advertised value separately from independently estimated economic value.

## 5. Verification gates

Before a candidate can be represented as a current opportunity:

1. Resolve the original provider URL and confirm it is an official provider-controlled domain or an explicitly authorised programme partner.
2. Confirm the programme still exists and applications are open.
3. Verify benefit amount, currency, credit type, eligible services, and whether the benefit is a credit, discount, free tier, grant, or reimbursement.
4. Verify eligibility, geography, entity type, funding stage, partner affiliation, age, revenue, employee, and account-history requirements.
5. Verify expiry, duration, usage restrictions, stacking rules, renewal conditions, and post-credit pricing.
6. Check whether the offer requires a paid plan, payment method, minimum spend, data sharing, exclusivity, or other material obligations.
7. Capture dated evidence from the official provider source.
8. Record unresolved details as unknown; never fill gaps with assumptions.

A dead link, vague eligibility, inconsistent advertised value, or unsupported claim must lower confidence and may result in rejection or a request for further evidence.

## 6. AFI PRIME evaluation

AFI PRIME should score each opportunity against:

- Capability relevance to current and planned Universal Engine / Engineer work
- Practical usefulness and quality of the resource
- Eligibility likelihood based on verified facts (unknown is not eligible)
- Realistic economic value after restrictions and likely utilisation
- Strategic value, including reduced infrastructure costs or accelerated capability acquisition
- Integration and operational effort
- Security, privacy, data residency, compliance, and vendor lock-in
- Expiry pressure and opportunity cost
- Evidence quality and confidence

Prioritise usable value, not headline dollar amounts. A smaller unrestricted benefit can be more valuable than a large credit that cannot be accessed or consumed economically.

## 7. UAIE PRIME governance and register requirements

UAIE PRIME independently reviews evidence and controls the lifecycle:

**Discovered → Proposed → Under Evaluation → Approved / Rejected / Retired → Integrated (where approved).**

The Universal Capability Acquisition Register should preserve the source record and include:
- Potential market value and realistic attainable value
- Revenue or cost-avoidance model, where relevant
- Development/integration timeline
- Risk assessment
- Evidence and verification status
- Eligibility and restrictions
- Expiry and review dates
- Original Idea Value (mandatory portfolio-wide field)
- Decision rationale, provenance, and audit history

No source may self-certify its own accuracy. STARWIRE, AFI PRIME, and UAIE PRIME retain distinct responsibilities.

## 8. Refresh and monitoring policy

- Treat the repository as a periodically refreshed catalogue, not a live availability API.
- Detect changes by comparing repository commits and changed files.
- Re-verify individual offers against official provider pages before surfacing them as current.
- Mark stale or unverified records visibly; do not silently carry forward old terms.
- Retain historical snapshots so changed or removed offers remain auditable.
- Discover the same opportunities independently from provider announcements and other sources to reduce single-source dependence.

## 9. Acceptance criteria for operational integration

This source is operationally integrated only when all of the following are demonstrated:

- STARWIRE can ingest the repository as a source without making it a privileged authority.
- Every candidate retains source and commit provenance.
- Duplicate detection works across CloudCredits.io, Free for Open Source, this repository, and independent web discoveries.
- Official-provider verification is required before a current-offer claim.
- AFI PRIME evaluation and UAIE PRIME governance are separate, traceable stages.
- The acquisition register records both advertised and realistically attainable value, eligibility, expiry, risk, evidence, and Original Idea Value.
- Stale, contradictory, and anomalous data is flagged rather than promoted.
- Tests demonstrate that importing a source cannot trigger applications, purchases, account creation, or automatic approval.

## 10. Reference

- Source repository: https://github.com/Surya-saka/startup-credits
- Source README: https://github.com/Surya-saka/startup-credits/blob/main/README.md
- LinkedIn discovery post: https://www.linkedin.com/posts/surya-saka-a803b4264_github-surya-sakastartup-credits-activity-7440639483701678081-ktqJ

**Implementation boundary:** This document records the approved architectural treatment and verification requirements. It does not claim that a STARWIRE crawler, importer, scheduler, AFI PRIME evaluator, UAIE PRIME workflow, or acquisition-register write path has been implemented or tested in this repository.
