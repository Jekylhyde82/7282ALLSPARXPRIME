# SYPHON Runtime Verification

## Purpose

This document defines evidence gates for the ALLSPARX PRIME runtime adapter. A valid provider response is not proof that provider claims are correct, downstream actions succeeded, or a live production integration is operational.

## Runtime contract

The adapter at \`src/lib/allsparxPrime/runtime.ts\`:
- accepts trimmed prompts from 1 to 500 characters;
- requires HTTPS except for localhost development;
- rejects URL credentials and fragments;
- sends a JSON POST and rejects redirects;
- enforces a 30-second timeout;
- requires a JSON media type, valid UTF-8/JSON, and the expected response schema;
- caps response bodies at 64 KiB, including streamed responses;
- marks provider evidence as \`PROVIDER_RESPONSE_VALIDATED\` with \`verified: false\`.

Provider error details are not returned to the client. Never put credentials in endpoint URLs or logs.

## Automated verification

The baseline workflow runs:

\`\`\`sh
pnpm install --frozen-lockfile
pnpm test:syphon
pnpm check
pnpm build
\`\`\`

The 13 runtime contract tests mock \`fetch\`; they do not contact a live provider. Earlier GitHub Actions run #35 recorded 13 passing tests and successful Astro checks/build. That evidence applies only to the tested commit; this reconciliation branch must pass its own checks.

## Live endpoint verification

The manual workflow \`.github/workflows/syphon-live-endpoint-verification.yml\` sends one bounded contract prompt and validates the returned JSON shape.

1. Merge the workflow into the repository default branch before running it there.
2. In repository Settings → Secrets and variables → Actions, add the approved HTTPS endpoint as repository secret \`AI_CHAT_ENDPOINT\`. Never commit it or paste it into chat, logs, or issue comments.
3. Run **SYPHON live endpoint verification** manually from GitHub Actions.
4. Record the workflow run URL, commit SHA, time, and outcome without recording the secret or response content.

If the secret is absent, the workflow must fail closed. Do not guess an endpoint. The workflow currently tests an unauthenticated JSON POST; confirm the provider accepts that contract before running it. If authentication is required, update the workflow to use a separately stored secret header before live execution.

A passing live check proves only that the endpoint responded to the bounded request with the expected shape at that time. It does not prove recommendation accuracy, downstream action success, or production deployment health.

## Evidence statuses

- **PLANNED** — scoped, not implemented.
- **IMPLEMENTED** — code or workflow exists.
- **INSTALLED** — dependencies/configuration are present in the target environment.
- **TESTED** — a named test ran and its result is recorded.
- **VERIFIED** — the intended outcome was independently checked with trustworthy evidence.

Merge, deployment, live connectivity, and outcome verification are separate gates. A build pass is not a live endpoint pass.

## Current position

- Runtime adapter hardening: implemented on the reconciliation branch.
- Runtime contract tests: 13 test cases included; branch CI pending.
- Live endpoint workflow: implemented; not yet executed against a configured provider.
- Live provider connection and production deployment: **NOT VERIFIED**.
