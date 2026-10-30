# SYPHON Cloudflare Gateway — Deployment and Security Contract

## Deployment shape

The application is an Astro static site deployed through Cloudflare Workers Static Assets. The SYPHON gateway is implemented as a Worker entry point at `src/worker.mjs`; requests under `/api/*` are routed through the Worker first and all other requests continue to the existing static asset binding. This preserves the existing site rather than replacing it with a separate API host.

Gateway route: `POST /api/allsparx/v1/ask`.

## Implemented controls

- Supabase Auth access-token verification against the project's JWKS endpoint using Web Crypto.
- Fail-closed JWT policy: RS256 or ES256 only; exact issuer, authenticated audience, subject, role, expiry, and optional not-before checks.
- Exact origin allowlist for browser-origin requests; CORS is not treated as authentication.
- Cloudflare Workers Rate Limiting binding keyed by verified Supabase user ID (12 requests per 60 seconds).
- Bounded request body (48 KiB), prompt (500 characters), model output (800 tokens), and response fields.
- Program recommendations are restricted to exact titles from the existing public catalog supplied by the browser; invented titles are filtered out.
- Provider credentials are read only from server-side Worker environment bindings.
- Automatic provider order is OpenAI, Anthropic, Google, Ollama; only configured providers are eligible. Explicit provider selection is strict.
- Automatic fallback is attempted only for network errors, HTTP 429, or HTTP 5xx. Explicit provider selection never falls back.
- Generic upstream errors; provider response bodies and credentials are not returned to callers.
- Static assets continue through the pre-existing Cloudflare asset binding.

## Important limits and remaining gates

Cloudflare's built-in Rate Limiting binding is approximate and local to each Cloudflare location; it is not a strict global quota or a provider spend cap. The 800-token output ceiling bounds an individual completion but does not establish a monthly spend limit. A strict cross-region budget requires a durable shared counter or provider-side billing limits and alerting.

Supabase JWT verification requires an asymmetric signing key published in the project's JWKS endpoint. The Worker caches JWKS for 10 minutes, so key revocation/rotation is not instantaneous at this gateway; allow for cache expiry during planned rotation and treat urgent key compromise as an incident requiring a cache-bypass/redeploy strategy. Legacy HS256 projects with no JWKS keys fail closed and must be migrated to RS256 or ES256 before the gateway can authenticate users.

The assistant now includes email/password sign-in and account creation using Supabase Auth, stores the session in sessionStorage, refreshes access tokens, and sends the bearer token to the Worker. The gateway is end-to-end code-complete but remains deployment-blocked until an active Supabase project, asymmetric signing keys, allowed origin, and provider configuration are supplied and live-tested.

## Required deployment configuration

Frontend build-time public configuration:
- `PUBLIC_SUPABASE_URL`: Supabase project URL.
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key for browser sign-in.
- `PUBLIC_ALLSPARX_GATEWAY_URL`: complete HTTPS Worker endpoint, including `/api/allsparx/v1/ask`.
- `PUBLIC_ALLSPARX_PROVIDER`: optional `auto`, `openai`, `anthropic`, `google`, or `ollama`.

Worker non-secret environment configuration:
- `SUPABASE_URL`: same Supabase project URL, used to discover JWKS.
- `ALLOWED_ORIGINS`: comma-separated exact HTTPS origins allowed to call the gateway.

Provider configuration:
- At least one configured pair: `OPENAI_API_KEY` + `OPENAI_MODEL`; `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL`; `GOOGLE_API_KEY` + `GOOGLE_MODEL`; or `OLLAMA_BASE_URL` + `OLLAMA_MODEL`.
- API keys must be added with Cloudflare Worker secrets, never `PUBLIC_*` build variables or repository files. Model names and approved Ollama base URL are non-secret Worker variables.

Use the Cloudflare dashboard or Wrangler to configure Worker variables and secrets. Do not commit real values. Do not expose the endpoint until the matching Supabase project is active, asymmetric JWT signing is enabled, the exact production origin is allowlisted, and at least one provider is deliberately configured.

## Verification

The repository workflow `.github/workflows/syphon-ci.yml` runs on pull requests targeting `main` or the SYPHON foundation branch and executes the contract/security tests, Astro type check, and production build with the locked pnpm toolchain.

Run:
```sh
pnpm test:syphon
pnpm check
pnpm build
```

Then deploy to a non-production preview, verify static routes and authenticated API behavior, test invalid/expired JWTs, origin rejection, rate limiting, provider timeout and fallback, and run the manual live gateway workflow. The manual workflow requires GitHub Actions secrets `ALLSPARX_GATEWAY_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_TEST_EMAIL`, and `SUPABASE_TEST_PASSWORD`; use a dedicated confirmed test account, never a personal account. Preserve workflow URL, commit SHA, timestamp, and outcome. Do not claim production readiness from mocked tests.
