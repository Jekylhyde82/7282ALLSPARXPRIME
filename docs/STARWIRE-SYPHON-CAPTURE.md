# STARWIRE SYPHON source capture

## Implemented capability

The initial SYPHON source-capture module is available at `src/lib/starwire/syphon.ts`.

It provides a bounded, read-only HTTP GET capture for a single explicitly configured source. The caller must provide a source policy that records:

- Stable source ID and canonical HTTPS origin.
- Explicit source enablement.
- Approved terms status.
- Explicit robots/access-policy decision (`allowed` or `not-applicable`).
- Per-source minimum request interval.
- Maximum response bytes and timeout.

Each successful capture returns a schema-versioned record containing a capture ID, source ID and URL, retrieval timestamp, HTTP status, media type, byte length, SHA-256 digest, and captured UTF-8 body. Its status is deliberately `CAPTURED_NOT_VERIFIED`: retrieval and hashing do not establish that a provider's claims are accurate or that an offer is available.

Supported media are plain text, HTML, JSON, XML, RSS, Atom, and structured JSON/XML media types. Response bodies are bounded while streaming; redirects, unsupported media, invalid UTF-8, non-success HTTP responses, and excessive configured limits fail closed.

## Explicit non-capabilities

This first slice does **not**:

- Discover or crawl links automatically.
- Parse provider-specific programme claims.
- Decide whether source terms or robots policies are legally sufficient.
- Verify current eligibility or advertised benefits with official providers.
- Persist captures to a database or object store.
- Schedule or coordinate distributed collection workers.
- Resolve DNS and enforce network-level public-IP egress controls.
- Feed AFI PRIME, request UAIE PRIME approval, or write to the Universal Capability Acquisition Register.
- Execute downloaded content, install software, submit forms, create accounts, accept terms, or spend funds.

The public-hostname check is a guardrail, not a complete SSRF defence. Production deployment requires network-level egress restrictions that block loopback, private, link-local, metadata-service and other non-public destinations after DNS resolution, including DNS-rebinding protections. Source allowlists, reviewed terms, robots-policy evidence, secret management, durable audit storage, and independent security review remain mandatory.



## Sourcey API integration

A read-only Sourcey adapter is available at `src/lib/starwire/sourcey.ts`. It builds requests for the documented API resources:

- `GET /v1/status`, `GET /v1/release`, and `GET /v1/catalog`.
- Entity, Program and Offer reads by stable ID or slug under `/v1/entities`, `/v1/programs`, and `/v1/offers`.
- `GET /v1/search/offers?q=...&limit=...` with bounded query and limit values.
- Provenance, revision-provenance, event and observation reads under `/v1/provenance`, `/v1/revisions/{id}/provenance`, `/v1/events`, and `/v1/observations`.
- `GET /v1/changes?cursor=...` with the opaque cursor passed through unchanged after URL encoding.

Every request must pass through the caller-supplied SYPHON policy for source ID `sourcey-api` and canonical origin `https://api.sourcey.com`. The adapter does not silently enable the source or approve terms. Sourcey documents anonymous read access and publishes its facts under CC BY 4.0; source configuration still requires a recorded terms/access review before production enablement.

The generic SYPHON capture now preserves the Sourcey response headers `x-request-id`, `x-sourcey-release-id`, and `x-sourcey-artifact-sha256`, alongside ETag and Last-Modified. The adapter exposes the release and artifact digest as source revision metadata. `extractSourceyOfferProvenance` handles the live search-result envelope (`data[].offer` plus its outer `canonical_url`), preserves explicit `offer_id`, `revision_digest`, provider access URL, `release_id` and artifact SHA-256, and normalizes Sourcey’s `sha256:`-prefixed artifact digest to 64 lowercase hex characters for the candidate schema. Missing values remain null; no identifiers are invented. Downstream normalization must also retain the original vendor evidence URLs, eligibility unknowns, disputes, vendor attestation and offer-terms assurance. Attribution must identify Sourcey and CC BY 4.0; never collapse Sourcey's registry evidence into an untraceable summary.

Sourcey is a discovery/evidence input only. Its eligibility evaluation is not vendor approval, its offer records are not guaranteed current entitlements, and STARWIRE must not apply for or redeem offers on the user's behalf.


## Free for Open Source registry integration

A read-only adapter is available at `src/lib/starwire/foropensource.ts` for the public `natwar86/foropensource` repository. It pins the current branch to a full commit SHA before reading the `data/offers/` index, then permits individual YAML records to be fetched from the corresponding immutable commit on `raw.githubusercontent.com`. It validates filenames, commit identifiers, repository paths and download hosts rather than following arbitrary URLs from untrusted index data.

The source's offers dataset is published under CC BY 4.0 and must be attributed to **foropensource**. The repository's code is MIT, but the offers data and separate exports have different licences; STARWIRE must not apply the offers-data licence to the exports. The adapter only handles the offers directory, not the separately licensed sponsorship exports.

**Source-count discrepancy to retain as a data-quality flag:** the live directory page currently advertises 170 offers, while its linked repository README reports 164 companies in the data directory and the repository's About text reports 163. These are different measures and may reflect update timing, but they do not reconcile as one count. STARWIRE must capture the exact source, revision and retrieval time for each figure and must not repeat a headline count as a verified total without reconciling the pinned repository tree and live directory.


The API and raw-content hosts require separate SYPHON source policies. The adapter does not enable either source, infer permission from the public repository, or perform repository matching/application actions. `extractForOpenSourceOfferProvenance` maps each validated offer file to its immutable GitHub blob URL, repository commit, file path, CC BY 4.0 attribution and explicitly tagged `git-blob-sha1:` artifact ID. Preserve the Git commit SHA, per-file Git blob SHA, captured bytes and timestamps; never label the Git SHA-1 as SHA-256. The registry's verification dates are source claims; official provider terms still need independent verification.

## Candidate evidence and decision-support contracts

The initial pure policy module is available at `src/lib/starwire/candidate.ts`.

- `validateCandidate` fails closed on malformed nested candidate objects, lifecycle/verification/eligibility states, arrays and source metadata. It enforces candidate schema v2: required capture provenance, canonical timestamps, source-content SHA-256, source licence, stable source record ID, record-level revision digest, immutable repository revision/commit, upstream artifact ID (including Git blob identifiers), upstream release ID and artifact SHA-256 digest (nullable only when the source does not publish them), separate original provider URL, HTTPS evidence URLs, advertised-claim fields, eligibility structure, and mandatory Original Idea Value.
- `evaluateCandidate` computes a reproducible, equally weighted nine-criterion AFI PRIME decision-support score. Each criterion is explicitly bounded from 0 to 5. Missing official verification, unconfirmed eligibility, or unapproved source terms prevent a `PRIORITIZE` recommendation.
- `evaluateUaieGate` fails closed on malformed candidates, rejects contradictory official evidence, holds incomplete candidates, and only returns `ELIGIBLE_FOR_HUMAN_REVIEW` when the evidence and assessment gates pass. It always sets `humanApprovalRequired: true` and `registerWriteAuthorized: false`.

Schema v2 prevents the source directory/API URL from being mistaken for the original provider URL and preserves source-specific identifiers such as Sourcey `offer_id` / `revision_digest`, Free for Open Source commit SHA and Git blob SHA-1, release metadata, licence and artifact SHA-256 digest. Missing upstream metadata remains explicitly null rather than being fabricated; the tests explicitly distinguish a known identifier from a source that does not publish one. The score is a transparent baseline, not an autonomous intelligence verdict. The weights require calibration against real outcomes and independent review. The module does not create durable audit records, authenticate approvers, implement a lifecycle state machine, or write to the acquisition register. No candidate can be approved, acquired, or integrated by these pure functions.

## Tests and CI

Run:

```sh
pnpm test:starwire
pnpm test:syphon
pnpm check
pnpm build
```

The STARWIRE tests use mocked fetch responses. They validate policy gates, URL boundaries, redirect rejection, media-type and UTF-8 checks, streamed response limits, digest/provenance output, and rate limiting. They do not prove live source access or production operation.

The repository baseline workflow now runs the STARWIRE source-capture contract tests alongside the existing SYPHON runtime tests, Astro checks, and production build.

## Status

- SYPHON bounded single-source capture: **IMPLEMENTED** on the feature branch.
- Unit contract tests: **IMPLEMENTED**; CI result pending for this exact commit.
- CI integration: **IMPLEMENTED**; execution result pending.
- Live approved-source configuration: **NOT CONFIGURED**.
- Durable evidence store, scheduler, multi-source orchestration, AFI PRIME hand-off, UAIE PRIME governance and register writer: **NOT IMPLEMENTED**.
- Production approval: **NOT APPROVED**.

Do not promote a capture to verified evidence or an opportunity to approved/acquired status solely because this module returned successfully.
