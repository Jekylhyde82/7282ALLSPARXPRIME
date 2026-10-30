# SYPHON Runtime Verification

## Purpose

This document defines the evidence gates for the ALLSPARX PRIME runtime adapter in this repository. A valid provider response is not proof that the provider's claims are correct, that a downstream action succeeded, or that a live production integration is operational.

## Current runtime contract

The adapter at `src/lib/allsparxPrime/runtime.ts`:

- accepts prompts from 1 to 500 trimmed characters;
- requires HTTPS for non-local endpoints; HTTP is allowed only for localhost development;
- rejects endpoint URL credentials and fragments;
- sends one JSON POST and rejects redirects;
- enforces a 30-second request timeout;
- requires a JSON media type, valid UTF-8/JSON, and the expected response schema;
- caps response bodies at 64 KiB, including streamed responses without a trustworthy `Content-Length`;
- marks provider evidence as `PROVIDER_RESPONSE_VALIDATED` with `verified: false`.

Provider error details are not returned to the client. Never put credentials in endpoint URLs or logs.

## Automated verification

The repository baseline workflow runs:

```sh
pnpm install --frozen-lockfile
pnpm test:syphon
pnpm check
pnpm build
```

The 13 runtime contract tests mock `fetch`; they do not contact a live provider. GitHub Actions run #35 recorded 13 passing tests, zero failures, successful Astro checks, and a successful production build. This evidence applies to the tested commit only.

## Live endpoint verification

The manual workflow is `.github/workflows/syphon-live-endpoint-verification.yml`. It sends one fixed, bounded contract prompt and validates the returned JSON shape. It does not log the endpoint URL or response text.

1. Review and merge the workflow into the repository's default branch before attempting to run it there.
2. In repository Settings → Secrets and variables → Actions, add the approved HTTPS endpoint as the repository secret `AI_CHAT_ENDPOINT`. Never commit it or paste it into chat, logs, or issue comments.
3. Run **SYPHON live endpoint verification** manually from GitHub Actions.
4. Record the workflow run URL, commit SHA, time, and pass/fail outcome without recording the secret or response content.

If the secret is absent, the workflow must fail closed. Do not substitute a guessed endpoint.

A passing live check proves only that the endpoint responded to this bounded request and returned the expected response shape at that time. It does not prove recommendation accuracy, downstream action success, or production deployment health.

## Evidence statuses

- **PLANNED** — scoped, not implemented.
- **IMPLEMENTED** — code or workflow exists.
- **INSTALLED** — dependencies or configuration are present in the target environment.
- **TESTED** — a named automated or manual test ran and its result is recorded.
- **VERIFIED** — the intended outcome was independently checked with trustworthy evidence.

A build pass is not a live endpoint pass. A provider schema pass is not independent verification of its claims. Merge, deployment, live connectivity, and outcome verification are separate gates.

## Current integration position

- Runtime adapter and security hardening: present on `syphon/allsparx-prime-integration-plan`; runtime and test file contents were independently compared against the hardening branch and found identical.
- Contract tests: 13 passed, 0 failed in the recorded CI run.
- Live endpoint workflow: proposed separately for review; not yet executed against a configured provider.
- Live provider connection and production deployment: **NOT VERIFIED**.
