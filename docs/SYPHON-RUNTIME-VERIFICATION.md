# SYPHON Runtime Verification

## Purpose

This document defines evidence gates for the ALLSPARX PRIME browser-to-gateway runtime. A valid gateway response is not proof that provider claims are correct, downstream actions succeeded, or a live production integration is operational.

## Runtime contract

The browser adapter at `src/lib/allsparxPrime/runtime.ts`:
- accepts trimmed prompts from 1 to 500 characters;
- requires HTTPS except for localhost development;
- rejects URL credentials and fragments;
- sends a JSON POST with request ID, task ID, provider preference, and contract version;
- rejects redirects and enforces a 30-second timeout;
- requires a JSON media type, valid UTF-8/JSON, and the expected response schema;
- caps response bodies at 64 KiB, including streamed responses;
- validates any returned provider identifier;
- marks provider evidence as `PROVIDER_RESPONSE_VALIDATED` with `verified: false`.

Provider API keys must remain in the server-side gateway. The browser must never call vendor APIs with embedded provider credentials.

## Multi-provider policy

See [ALLSPARX PRIME Multi-Provider Architecture](./ALLSPARX-PRIME-MULTI-PROVIDER-ARCHITECTURE.md).

Automatic route order for startup-deal recommendations: OpenAI → Anthropic → Google Gemini → Ollama. Explicit provider selection is strict and must not silently fall back. The gateway must skip providers that are not configured and report the actual provider used.

## Automated verification

The baseline workflow runs:

```sh
pnpm install --frozen-lockfile
pnpm test:syphon
pnpm check
pnpm build
```

The SYPHON suite includes runtime contract and provider-routing policy tests. These tests mock network calls; they do not contact live providers or verify gateway deployment.

## Live gateway verification

The manual workflow `.github/workflows/syphon-live-endpoint-verification.yml` sends one bounded contract prompt using `provider: "auto"` and validates the version 1 response shape.

1. Configure the secured gateway URL as repository Actions secret `ALLSPARX_GATEWAY_URL`.
2. Run **SYPHON live endpoint verification** manually from GitHub Actions.
3. Record the workflow run URL, commit SHA, time, and outcome without recording secrets or response content.

The frontend uses `PUBLIC_ALLSPARX_GATEWAY_URL` for the gateway URL and optional `PUBLIC_ALLSPARX_PROVIDER` for the preference. These are public configuration values, not secrets. Never put provider API keys in `PUBLIC_*` variables.

Before exposing a gateway publicly, configure authentication/abuse controls, origin allowlisting, rate limits, provider spend limits, and secret rotation. CORS alone is not authentication. The gateway and provider adapters are not yet deployed by this repository change.

A passing live check proves only that the gateway responded to the bounded request with the expected shape at that time. It does not prove recommendation accuracy, provider fallback quality, downstream action success, or production deployment health.


## Evidence ledger scope and verification limits

The gateway ledger is an **accepted-operation and provider-execution ledger**, not a complete perimeter security log. This distinction is intentional and must remain visible in every operational report.

### Events currently recorded

- An accepted, schema-valid request with an allowlisted origin and successful Turnstile validation is recorded as `ATTEMPTED` before any provider call.
- Provider attempts that fail, successful provider responses, and monthly-budget exhaustion after the initial attempt are recorded with lifecycle-consistent status labels.
- The ledger stores a keyed prompt fingerprint, not the raw prompt or provider credentials.
- Evidence append failure blocks provider execution or prevents a successful response from being returned.

### Events not currently recorded in this ledger

- Requests rejected before admission, including disallowed/missing origins, rate-limit rejection, Turnstile failure/unavailability, malformed or oversized request bodies, invalid request contracts/IDs, and requests for providers that are not configured.
- Failures that occur before the gateway can construct a valid evidence event, and failures of the evidence store itself.

Those rejected requests are **outside the current ledger coverage**; their absence must not be interpreted as evidence that no attack, abuse, or rejection occurred. Use Cloudflare edge/security logs and platform observability for perimeter events until a separately designed, privacy-safe rejection-event pipeline is implemented. Do not claim complete security-event audit coverage.

### Ledger verification contract

- Each verification request is bounded to at most 100 records.
- Clients must verify pages sequentially from sequence 1, carrying the returned `next.from` and `next.previousHash` into the next request. A later page is anchored to the immediately preceding stored record; it is not, by itself, proof that earlier pages were valid.
- A complete verification run must reach the current head and confirm the final calculated hash equals the stored head hash.
- The hash chain detects record alteration relative to a trusted head, but does not protect against an actor who can rewrite both the records and the head inside the same Cloudflare trust boundary.

### Independent assurance still outstanding

External immutable retention/checkpoints, signed evidence export, independent verification outside the Cloudflare account/trust boundary, backup and restore testing, authenticated actor identity, usage-based provider-cost settlement, live provider/model validation, and live endpoint verification remain **NOT VERIFIED**. A passing mocked test suite or Worker dry-run does not close these gaps.

## Evidence statuses

- **PLANNED** — scoped, not implemented.
- **IMPLEMENTED** — code or workflow exists.
- **INSTALLED** — dependencies/configuration are present in the target environment.
- **TESTED** — a named test ran and its result is recorded.
- **VERIFIED** — the intended outcome was independently checked with trustworthy evidence.

## Current position

- Vendor-neutral provider policy and browser gateway contract: implemented on this branch.
- Automated contract and routing tests: included; branch CI must pass.
- Live gateway workflow: implemented; not yet executed against a configured gateway.
- Server-side gateway, provider credentials/adapters, authentication controls, live provider connectivity, and production deployment: **NOT VERIFIED**.
