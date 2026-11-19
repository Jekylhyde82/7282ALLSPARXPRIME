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
