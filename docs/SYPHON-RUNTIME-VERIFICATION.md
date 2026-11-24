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
