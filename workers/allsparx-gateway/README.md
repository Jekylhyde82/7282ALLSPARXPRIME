# ALLSPARX PRIME Cloudflare Gateway

This directory contains the isolated Cloudflare Worker API boundary for the browser-based ALLSPARX PRIME assistant. It does not replace the Astro static-site deployment.

## Request path

- Browser: HTTPS POST to `/v1/ask`, with a one-time Cloudflare Turnstile token and request ID.
- Worker: exact origin allowlist, bounded JSON input, Turnstile Siteverify hostname validation, per-IP Durable Object rate limit, provider allowlist, monthly admission reservation, bounded provider output, and normalized JSON response.
- Provider credentials: Worker secrets only. Never place provider secrets in Astro `PUBLIC_*` variables or browser bundles.

## Required configuration

Worker vars are declared in `wrangler.toml`. Before deployment, configure:

- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile secret.
- At least one of `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GOOGLE_API_KEY`.

Set secrets using the Cloudflare account that owns the Worker:

```sh
npx wrangler@4 login
npx wrangler@4 secret put TURNSTILE_SECRET_KEY --config workers/allsparx-gateway/wrangler.toml
npx wrangler@4 secret put OPENAI_API_KEY --config workers/allsparx-gateway/wrangler.toml
# Optional additional providers:
npx wrangler@4 secret put ANTHROPIC_API_KEY --config workers/allsparx-gateway/wrangler.toml
npx wrangler@4 secret put GOOGLE_API_KEY --config workers/allsparx-gateway/wrangler.toml
```

Create a Turnstile widget restricted to the production site hostnames. Configure the Astro build environment with:

- `PUBLIC_ALLSPARX_GATEWAY_URL=https://allsparx-prime-gateway.<account-subdomain>.workers.dev/v1/ask`
- `PUBLIC_ALLSPARX_TURNSTILE_SITE_KEY=<Turnstile site key>`
- `PUBLIC_ALLSPARX_PROVIDER=auto` (or an explicitly configured provider)

The site key and gateway URL are public. The Turnstile secret and provider keys are not.

## Deploy and verify

```sh
npx wrangler@4 deploy --dry-run --config workers/allsparx-gateway/wrangler.toml
npx wrangler@4 deploy --config workers/allsparx-gateway/wrangler.toml
```

The `GET /healthz` endpoint is a liveness check only; it does not prove provider credentials, Durable Objects, Turnstile, or provider connectivity are ready. Live verification must separately test approved and rejected origins, challenge failure, invalid input, rate limiting, budget exhaustion, a real provider response, response headers, and absence of secret leakage.

## Admission-budget limitation

`MAX_REQUEST_COST_MICROS` and `MONTHLY_SPEND_LIMIT_MICROS` currently implement fixed per-request admission reservations in integer units. They are **not** provider invoice metering, actual token-cost settlement, or a guaranteed USD hard cap. Reservations are intentionally not refunded. Before treating this as a production financial spend control, implement provider usage extraction, a reviewed price schedule, actual-cost settlement, and reconciliation against provider billing.

## Local checks

```sh
pnpm test:syphon
pnpm check
pnpm build
npx --yes wrangler@4 deploy --dry-run --config workers/allsparx-gateway/wrangler.toml
```
