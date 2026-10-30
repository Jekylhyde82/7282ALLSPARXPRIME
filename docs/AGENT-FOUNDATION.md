# ALLSPARX PRIME agent foundation

## Scope and status

This branch is stacked on `syphon/server-gateway-security` (PR #17), which itself is stacked on PR #13. It does not modify either existing pull request.

| Capability | Status | Evidence boundary |
|---|---|---|
| Promptfoo deterministic evaluation fixture | IMPLEMENTED in this branch | Echo-provider assertions only; no model/API calls |
| Promptfoo CI workflow | IMPLEMENTED in this branch | Must pass on GitHub Actions before this slice is TESTED |
| Cloudflare Agents SDK adoption | PLANNED | No SDK dependency or runtime agent is installed by this slice |
| Durable multi-step orchestration with Workflows | PLANNED | Requires a separate implementation and recovery tests |
| Live agent quality / red-team evaluation | BLOCKED pending approved model endpoint and explicit spend approval | No provider secrets are required or configured here |

## Why this is deliberately staged

The existing application is Astro + a Cloudflare Worker gateway proposal, with a pnpm lockfile. The gateway branch currently defines a rate-limiter Durable Object. The first change adds a zero-cost, deterministic Promptfoo baseline without changing the dependency graph or adding provider credentials.

The Promptfoo Echo provider returns the rendered prompt unchanged. This validates the evaluation configuration, variable substitution, assertion execution, and CI wiring. It does **not** measure model quality, prove gateway behavior, or perform a red-team scan against a live model. Those must be separate, explicitly configured tests.

## Cloudflare agent runtime decision

Preferred future runtime: Cloudflare Agents SDK (`agents`) on Durable Objects, with Cloudflare Workflows for independently retryable multi-step pipelines.

Before adding the SDK dependency:

1. Resolve the PR #17 stack and preserve its existing `UserRateLimiter` Durable Object and migration history.
2. Add the SDK in a dedicated commit and regenerate `pnpm-lock.yaml` with the repository's pinned pnpm version (10.8.1); never hand-edit the lockfile.
3. Confirm the SDK and its transitive dependencies bundle for the repository's Cloudflare Workers compatibility date and Node 22/24 CI.
4. Add a distinct agent Durable Object class and migration. Do not repurpose the rate limiter as an agent.
5. Start with one least-privilege Verification Agent. It receives bounded task/evidence envelopes and may read test outputs; it cannot merge PRs, deploy, rotate keys, or access provider secrets.
6. Use Workflows for long-running tasks requiring checkpoints, retries, idempotency, and human approval. Keep interactive agent state separate from workflow execution state.
7. Add restart/eviction recovery, duplicate-delivery, permission-denial, and audit-provenance tests before enabling additional agents.

## Security and cost boundaries

- No provider API key, Supabase secret, signing key, or user credential belongs in this branch.
- The deterministic Promptfoo job requires no model provider secret and makes no inference calls.
- A real model-backed evaluation or red-team scan is not enabled. It requires an approved endpoint and explicit approval for any provider charges.
- Agent tools must use explicit allowlists, least privilege, bounded inputs/outputs, timeouts, and audit events.
- Treat model output and MCP/tool results as untrusted data, never as authority to change policy.
- Destructive actions, merges, deployments, credential rotation, and permission changes require human approval.
- Completion follows PROOF BEFORE CLAIM: PLANNED is not IMPLEMENTED; IMPLEMENTED is not TESTED; TESTED is not VERIFIED.

## Acceptance criteria for this branch

- [ ] Promptfoo configuration passes on the pinned version with the Echo provider.
- [ ] GitHub Actions workflow runs successfully and preserves its result artifact.
- [ ] Existing SYPHON CI and gateway tests remain green on the stacked PR chain.
- [ ] Cloudflare Agents SDK compatibility and dependency tree are reviewed before installation.
- [ ] A separate implementation PR adds the runtime agent, workflow bindings, migrations, and recovery/security tests.
