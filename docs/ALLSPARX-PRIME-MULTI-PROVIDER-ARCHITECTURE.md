# ALLSPARX PRIME Multi-Provider Architecture

## Decision

Use a vendor-neutral, gateway-mediated architecture. ALLSPARX PRIME owns task policy and orchestration; providers are replaceable execution backends. OpenAI is the default first-choice provider for the initial deal-recommendation task, with Anthropic, Google Gemini, and Ollama available as ordered specialist/fallback candidates.

This is a routing policy, not a claim that all providers are configured, connected, or available.

## Components

- **ALLSPARX PRIME** — owns task definitions, routing intent, provider policy, and the public application contract.
- **SYPHON** — validates requests, tracks request identifiers, enforces bounded I/O, and records evidence status.
- **Provider gateway (server-side)** — the only component allowed to hold provider credentials or call vendor APIs. It must implement the provider-specific adapters, configured-provider filtering, fallback policy, timeouts, budget limits, rate limits, and audit-safe telemetry.
- **Providers** — OpenAI, Anthropic, Google Gemini, and optionally Ollama/local models.
- **Independent verification** — checks provider identity, response schema, task outcome, and deployment state separately.

## Routing policy

For `startup-deal-recommendation`, automatic preference order is:

1. OpenAI
2. Anthropic
3. Google Gemini
4. Ollama

The gateway must skip providers that are not configured. A specific provider preference is strict: do not silently substitute another vendor. If the requested provider is unavailable, return a safe, generic unavailable error.

The order is a starting policy, not a measured quality ranking. Revisit it only with cost, latency, quality, safety, and reliability evidence.

## Browser/server trust boundary

The browser sends only:
- prompt (1–500 characters),
- task identifier,
- provider preference (`auto` or one supported provider),
- contract version,
- request ID header.

The browser must never receive or contain provider API keys. `PUBLIC_ALLSPARX_GATEWAY_URL` is an endpoint URL, not a credential. Do not set provider secrets in `PUBLIC_*` variables or commit secrets.

Before exposing a gateway to public traffic, require an appropriate abuse-control and identity strategy (for example, Cloudflare Turnstile plus server-side verification, authenticated application sessions, or an equivalent protected edge policy), origin allowlisting, rate limits, per-provider spend limits, and secret rotation. CORS alone is not authentication and is not sufficient abuse protection.

## Response contract (version 1)

Success JSON:
```json
{
  "summary": "A concise answer",
  "programs": [{ "title": "A catalog title" }],
  "provider": "openai"
}
```

`programs` and `provider` are optional. When present, provider must be one of `openai`, `anthropic`, `google`, or `ollama`. The gateway should return the actual provider used, not merely the requested preference.

## Current implementation boundary

Implemented in this repository:
- typed provider identifiers and automatic/explicit routing policy;
- browser client contract that calls a vendor-neutral gateway;
- request ID, task ID, provider preference, and contract version;
- validation of returned provider identity;
- tests for route order, strict provider selection, and response handling;
- live verification workflow aligned to contract version 1.

Not yet implemented or verified:
- deployed server-side gateway and vendor-specific API adapters;
- provider credentials and model selections;
- authentication/abuse controls in the deployed gateway;
- live connectivity, fallback behavior, provider cost controls, or production deployment.

## Evidence rule

A passing mocked contract test proves only local contract behavior. A passing live smoke test proves the configured gateway returned the expected bounded response at that time. Neither proves recommendation accuracy or production readiness. Mark each provider PLANNED / IMPLEMENTED / INSTALLED / TESTED / VERIFIED separately.
