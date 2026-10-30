# ALLSPARX PRIME Cloudflare Gateway

This directory contains the isolated Cloudflare Worker API boundary for the browser-based ALLSPARX PRIME assistant. It does not replace the Astro static-site deployment.

## Provider models

The Worker requires explicit model IDs in the server-side `OPENAI_MODEL`, `ANTHROPIC_MODEL`, and `GOOGLE_MODEL` variables. No model-name defaults are embedded in code: select IDs supported by the corresponding provider account/API, then validate them with the live smoke test before enabling traffic. Ollama remains in the shared provider preference vocabulary but is intentionally unavailable through this public Cloudflare Worker; a local Ollama process is not a trusted remote provider endpoint. An explicit Ollama request fails closed as unavailable.

## Request path

- Browser: HTTPS POST to `/v1/ask`, with a one-time Cloudflare Turnstile token and request ID.
- Worker: exact origin allowlist, bounded JSON input, Turnstile Siteverify hostname validation, per-IP Durable Object rate limit, provider allowlist, monthly admission reservation, bounded provider output, durable evidence append, and normalized JSON response.
- Evidence: a separate monthly Durable Object ledger stores request IDs, lifecycle events, anonymous origin, deployment provenance, task identifier, provider outcome, and an HMAC-SHA-256 fingerprint of the prompt using the separate `EVIDENCE_HMAC_KEY` secret. Raw prompts and provider credentials are never written to the ledger. Each event links to the prior event hash; the internal verification endpoint recomputes the chain.
- Provider credentials: Worker secrets only. Never place provider secrets in Astro `PUBLIC_*` variables or browser bundles.

## Required configuration

Worker vars are declared in `wrangler.toml`. Before deployment, configure:

- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile secret.
- `EVIDENCE_HMAC_KEY` — high-entropy secret used to HMAC prompt fingerprints; do not reuse a provider key.
- At least one complete provider pair: `OPENAI_API_KEY` + `OPENAI_MODEL`, `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL`, or `GOOGLE_API_KEY` + `GOOGLE_MODEL`. Model IDs are server-side Worker variables, not secrets; API keys remain Worker secrets. A provider missing either value is treated as unconfigured.

Set secrets using the Cloudflare account that owns the Worker:

```sh
npx wrangler@4 login
npx wrangler@4 secret put TURNSTILE_SECRET_KEY --config workers/allsparx-gateway/wrangler.toml
npx wrangler@4 secret put EVIDENCE_HMAC_KEY --config workers/allsparx-gateway/wrangler.toml
npx wrangler@4 secret put OPENAI_API_KEY --config workers/allsparx-gateway/wrangler.toml
npx wrangler@4 secret put ANTHROPIC_API_KEY --config workers/allsparx-gateway/wrangler.toml
npx wrangler@4 secret put GOOGLE_API_KEY --config workers/allsparx-gateway/wrangler.toml
# Optional additional providers:
npx wrangler@4 secret put ANTHROPIC_API_KEY --config workers/allsparx-gateway/wrangler.toml
npx wrangler@4 secret put GOOGLE_API_KEY --config workers/allsparx-gateway/wrangler.toml
```

Set the model IDs as Worker variables using `wrangler.toml` or the Cloudflare dashboard (for example, `OPENAI_MODEL`, `ANTHROPIC_MODEL`, `GOOGLE_MODEL`). Keep API keys in Worker secrets. Create a Turnstile widget restricted to the production site hostnames. Configure the Astro build environment with:

- `PUBLIC_ALLSPARX_GATEWAY_URL=https://allsparx-prime-gateway.<account-subdomain>.workers.dev/v1/ask`
- `PUBLIC_ALLSPARX_TURNSTILE_SITE_KEY=<Turnstile site key>`
- `PUBLIC_ALLSPARX_PROVIDER=auto` (or an explicitly configured provider)

The site key and gateway URL are public. The Turnstile secret and provider keys are not. The evidence Durable Object is created by the v2 Wrangler migration and is required for request execution; if evidence storage is unavailable, the gateway fails closed.

## Deploy and verify

```sh
npx wrangler@4 deploy --dry-run --config workers/allsparx-gateway/wrangler.toml
npx wrangler@4 deploy --config workers/allsparx-gateway/wrangler.toml
```

The internal evidence Durable Object supports `POST /append` and `GET /verify`; it is not exposed as a public Worker route. Verification is paginated (maximum 100 records per request); continuation cursors are checked against the actual preceding stored record before a page is accepted. Hash chaining detects accidental or partial record alteration, but it is not a substitute for an independently controlled external checkpoint, WORM retention, or signed audit export. The `GET /healthz` endpoint is a liveness check only; it does not prove provider credentials, Durable Objects, Turnstile, or provider connectivity are ready. Live verification must separately test approved and rejected origins, challenge failure, invalid input, rate limiting, budget exhaustion, a real provider response, response headers, and absence of secret leakage.

## Evidence admission scope

The evidence ledger records requests only after they pass origin admission, rate limiting, Turnstile verification, bounded JSON parsing, request-contract validation, request-ID validation, and provider-configuration checks. Rejections before that admission boundary (including disallowed origins, rate limits, challenge failures, malformed or oversized input, invalid request identifiers, and unavailable provider configuration) are deliberately not represented as ledger events in this version. A missing ledger event therefore does **not** prove that no request or rejection occurred. Use Cloudflare edge/security logs and platform observability for pre-admission rejection evidence until a separately reviewed, privacy-minimizing rejection-event pipeline is implemented. Do not treat this ledger as a complete security-event or intrusion-detection log.

## Evidence ledger limitations

The ledger is durable within Cloudflare Durable Object storage and records append-only hash-linked events. It does not yet provide cross-account immutable retention, external timestamping, signed exports, retention/backup policy, or an independent verifier outside the same Cloudflare trust boundary. Request identity is anonymous origin context, not authenticated end-user identity. The prompt is represented by a keyed HMAC-SHA-256 fingerprint; raw prompt content is deliberately excluded.

## Admission-budget limitation

`MAX_REQUEST_COST_MICROS` and `MONTHLY_SPEND_LIMIT_MICROS` currently implement fixed per-request admission reservations in integer units. They are **not** provider invoice metering, actual token-cost settlement, or a guaranteed USD hard cap. Reservations are intentionally not refunded. Before treating this as a production financial spend control, implement provider usage extraction, a reviewed price schedule, actual-cost settlement, and reconciliation against provider billing.

## Local checks

```sh
pnpm test:syphon
pnpm check
pnpm build
npx --yes wrangler@4 deploy --dry-run --config workers/allsparx-gateway/wrangler.toml
```
