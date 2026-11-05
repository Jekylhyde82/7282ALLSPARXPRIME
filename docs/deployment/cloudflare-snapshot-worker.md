# ALLSPARX PRIME Cloudflare snapshot Worker deployment

## Current state

The repository contains a Cloudflare Worker entrypoint at `src/worker/index.mjs` and a Wrangler configuration declaring the static asset binding, R2 bucket binding and SQLite-backed Durable Object migration. This is source configuration only. The R2 bucket has not been created here, the Worker has not been deployed, secrets have not been configured, and no live endpoint verification has been performed.

## Prerequisites

- Cloudflare account with permission to create Workers, Durable Objects and R2 buckets.
- GitHub repository administrator access to configure a webhook.
- A high-entropy GitHub webhook secret of at least 32 characters.
- A repository allowlist and approved SPDX licence expression for each source repository.
- For private source repositories only, a GitHub fine-grained token restricted to read-only Contents access on the approved repositories.

## Provision and configure

Run these commands from the repository root after reviewing the Wrangler configuration:

```sh
npx wrangler r2 bucket create allsparx-prime-repository-snapshots
npx wrangler secret put GITHUB_WEBHOOK_SECRET
npx wrangler secret put GITHUB_REPOSITORY_ALLOWLIST
npx wrangler secret put REPOSITORY_LICENSE_POLICY
```

For a private source repository, also configure:

```sh
npx wrangler secret put GITHUB_API_TOKEN
```

When prompted, enter values locally in the Wrangler CLI. Do not paste secrets into source files, GitHub issues, pull requests, or this conversation. The allowlist value can be a JSON array, for example `["owner/repository"]`. The licence policy must be a JSON object mapping each allowlisted repository to its approved SPDX expression, for example `{"owner/repository":"MIT"}`. These are examples only; use the actual reviewed source repositories and licences.

Deploy only after the bucket and all required settings have been configured:

```sh
npx wrangler deploy
```

## Configure the GitHub webhook

In the target repository's Settings → Webhooks, create a webhook with:

- Payload URL: `https://YOUR-WORKER-HOST/api/github/webhook`
- Content type: `application/json`
- Secret: the same value configured as `GITHUB_WEBHOOK_SECRET`
- Events: select individual events and enable **Pull requests** only
- Active: enabled only after the Worker has been deployed and configuration checked

The Worker accepts only successfully merged pull requests targeting the configured target repository and branch. It also requires the source repository to be explicitly allowlisted and to have an approved licence expression. Missing configuration is deny-by-default.

## Staging verification checklist

1. Confirm the Worker deployment and Durable Object migration in Cloudflare.
2. Confirm the R2 bucket exists and is bound to `SNAPSHOTS`.
3. Send a signed staging webhook from an allowlisted repository and confirm a 2xx response.
4. Send an invalid signature and confirm HTTP 401.
5. Send a correctly signed event from a non-allowlisted repository and confirm HTTP 403.
6. Confirm the R2 object key contains the exact source commit SHA.
7. Independently download the object and recompute SHA-256; compare it with the recorded metadata.
8. Replay the same merged-PR event and confirm the existing object is verified rather than overwritten.
9. Confirm that no source files were extracted or executed.
10. Configure and verify R2 lifecycle/retention, access controls, monitoring, alerts and off-account digest anchoring before production use.

## Rollback

Disable the GitHub webhook first to stop new events. If necessary, roll back the Worker deployment using the approved Cloudflare deployment rollback procedure. Preserve R2 snapshots and Durable Object records during incident investigation; do not delete evidence as a cleanup shortcut. Rotate the webhook secret and any GitHub token if exposure is suspected.

## Safety boundary

Do not enable production automatic code merging or execute acquired source through this snapshot Worker. It only authenticates qualifying merge events and stores a pinned source archive. Snapshot acquisition is not code review, trust approval, installation, execution or production deployment.
