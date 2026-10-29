# SYPHON Runtime Verification

## Purpose

This document records the verification gates for the ALLSPARX PRIME runtime adapter in this repository. A valid provider response is not proof that the provider's claims are correct, that a downstream action succeeded, or that a live production integration is operational.

## Current runtime contract

The adapter in `src/lib/allsparxPrime/runtime.ts`:

- accepts prompts from 1 to 500 trimmed characters;
- requires HTTPS for non-local endpoints; HTTP is allowed only for localhost development;
- rejects endpoint URL credentials and fragments;
- sends a single JSON POST with a `prompt` field and rejects redirects;
- times out the request after 30 seconds;
- requires a JSON content type, valid UTF-8/JSON, and the documented response shape;
- caps response bodies at 64 KiB, including streamed responses without a trustworthy `Content-Length`;
- marks evidence as `PROVIDER_RESPONSE_VALIDATED` and `verified: false` so callers do not mistake schema validation for independent verification.

Provider error details are not returned to the client. Do not put credentials in the endpoint URL or log secret values.

## Local verification

Install the repository's locked dependencies, then run:

```sh
pnpm install --frozen-lockfile
pnpm test:syphon
pnpm check
pnpm build
```

The runtime contract suite uses Node's built-in test runner and mocks `fetch`; it does not contact a live provider.

## Live endpoint verification

The manual workflow is `.github/workflows/syphon-live-endpoint-verification.yml`. It sends one bounded, non-sensitive contract prompt and validates the returned JSON shape. It intentionally does not log the endpoint URL or response text.

1. Review the live-verification workflow and approve its change before making it available from the repository's default branch.
2. In repository Settings → Secrets and variables → Actions, add the approved HTTPS endpoint as the repository secret `AI_CHAT_ENDPOINT`. Never commit it or paste it into chat, logs, or issue comments.
3. Run **SYPHON live endpoint verification** from GitHub Actions only after the workflow is available on the default branch and the secret is configured.
4. Review the workflow result. A pass proves only that the endpoint responded to this bounded request and returned the expected response shape at that time.
5. Record the run URL, commit SHA, time, and pass/fail outcome without recording the secret or response content.

If the secret is absent, the workflow must fail closed and report that it is blocked. Do not replace a missing secret with a guessed URL.

## SYPHON evidence ledger

Use these statuses consistently:

- **PLANNED** — scoped, not implemented.
- **IMPLEMENTED** — code or workflow exists.
- **INSTALLED** — dependencies or configuration are present in the target environment.
- **TESTED** — a named automated or manual test ran and its result is recorded.
- **VERIFIED** — the intended outcome was independently checked with trustworthy evidence.

A GitHub Actions build pass is not a live endpoint pass. A provider schema pass is not independent verification of recommendation accuracy or downstream outcomes. Do not mark live verification complete without a successful live workflow run and recorded evidence.

## Current integration gates

- Runtime hardening and contract tests: implemented on the `syphon/runtime-hardening` branch; confirm current PR checks before merging.
- Live endpoint smoke test: defined on `syphon/live-endpoint-smoke-test`; not verified until the approved secret is configured and the manual workflow passes.
- Merge and deployment: separate gates; do not infer either from successful tests.
