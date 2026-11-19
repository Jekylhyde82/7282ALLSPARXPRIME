# Universal Capability Integration & Orchestration Architecture (UCIOA)
## Universal Engineer — Production-readiness specification
**Version:** 0.1.0-draft  
**Status:** Proposed specification; implementation and verification pending  
**Parent:** NINEFOLD INTRINSIC → Universal Engineer → Universal Capability Acquisition System  
**Working branch:** `engineer/ucioa-spec-clean-v0.1`

> PROOF BEFORE CLAIM. EVIDENCE BEFORE CONFIDENCE. VERIFICATION BEFORE COMPLETION.

## 1. Purpose and scope

UCIOA defines how Universal Engineer discovers, evaluates, integrates, orchestrates, monitors, replaces and retires external providers and internal capabilities. Engineer owns the capability contract and operational policy; providers are replaceable implementations, never the source of Engineer's authority or identity.

In scope:
- provider and capability discovery, registration and provenance;
- capability contracts, adapters and version compatibility;
- policy-enforced orchestration and bounded execution;
- credential isolation, least privilege and approval gates;
- observability, audit evidence, cost controls and recovery;
- conformance testing, staged release, rollback and retirement.

Out of scope:
- treating provider availability as guaranteed;
- granting autonomous agents unrestricted credentials, network access or deployment rights;
- automatically installing or executing discovered code;
- claiming production readiness from a successful connection or single happy-path test;
- replacing the canonical ninefold registers or creating a competing governance hierarchy.

## 2. Ownership and placement

NINEFOLD INTRINSIC is the governing foundation. Universal Engineer owns design, acquisition, integration, lifecycle and evolution. Universal Engine consumes approved capabilities through versioned, policy-controlled interfaces.

UCIOA is an intrinsic architecture within the Universal Capability Acquisition System. It is not a separate Master Core. The Universal Capability Acquisition Register records candidates, decisions, provenance and lifecycle evidence. The Universal Capability Evaluation Engine assesses value, fit, security, reliability, performance and cost. SYPHON coordinates workflow transitions but cannot grant itself authority or bypass policy.

## 3. Functional architecture

1. **Capability Registry:** canonical capability IDs, provider records, versions, contracts, lifecycle state and evidence links.
2. **Discovery Intake:** read-only discovery from approved catalogues, repositories and research sources; all findings are untrusted.
3. **Evaluation Engine:** utility, security, privacy, licence, compatibility, reliability, performance, cost and exit-risk assessment.
4. **Universal Adapter Framework:** provider-specific adapters behind stable, provider-neutral contracts.
5. **Policy Enforcement Point:** deny-by-default authorization for every operation, data scope and destination.
6. **SYPHON Orchestrator:** schedules and coordinates approved workflows; enforces state transitions, idempotency, budgets and timeouts.
7. **Execution Boundary:** isolated, least-privilege workers with explicit filesystem, network, CPU, memory and time limits.
8. **Evidence and Observability:** structured audit events, metrics, traces, test reports, provenance and decision records.
9. **Fallback and Portability Manager:** health checks, approved alternate providers, circuit breakers, export and migration plans.
10. **Release Controller:** staged rollout, health gates, rollback and retirement controls.

## 4. Provider integration catalogue

Initial candidates (not assertions of live connection or completed integration):

| Provider | Candidate capability | Required boundary |
|---|---|---|
| Superpowers | Engineering skills/workflows | Review skill instructions; no implicit execution authority |
| Supabase | Database, authentication, storage and backend services | Tenant isolation, RLS, scoped keys, migration and backup controls |
| Canva | Visual design and content production | Explicit asset permissions and ownership/licensing checks |
| Exa | Research and search | Treat retrieved content as untrusted; retain source provenance |
| Gmail | Email search and communication | Read/send scopes separated; explicit approval before sending |
| Lovable | Application generation | Generated code isolated, reviewed and tested before adoption |
| Shopify | Commerce and storefront operations | Store-scoped permissions; financial/customer data protection |
| Vercel | Hosting and deployment | Preview before production; protected secrets and rollback |
| Figma | Interface design and prototyping | File/team scopes and source-to-implementation traceability |
| GitHub | Source control, review and CI/CD | Branch protection, reviewed diffs, scoped tokens and signed provenance where available |
| Floot | Full-stack application development | Generated application and data flows reviewed before deployment |

Provider status must be one of: discovered, evaluated, approved, connected, adapter implemented, conformance tested, staged, production approved, suspended or retired. These states are not interchangeable.

## 5. Capability contract

Every adapter MUST publish a machine-readable, versioned contract containing:
- stable capability and provider IDs;
- operation name, purpose and risk tier;
- typed inputs, outputs and data classification;
- authentication method and minimum scopes;
- authorization policy and approval requirement;
- idempotency and retry semantics;
- timeout, rate limit, quota and cost model;
- error taxonomy and recovery behaviour;
- data residency, retention and deletion behaviour where applicable;
- provenance, licence and version constraints;
- health, observability and evidence endpoints;
- compatibility and deprecation policy.

Unknown fields, unbounded inputs and undocumented side effects fail conformance.

## 6. Authority and safety model

- V.I.S.I.O.N. is assigned observation, perception and evidence collection. It may report what it observes; it does not authorize actions or infer permission.
- DESIGNATED DRIVER (DD) is assigned execution of explicitly authorized operations. It does not create its own authority, expand a permission scope or treat a conversational activation phrase as proof of software access.
- AFI PRIME supports analysis and evaluation; it does not issue permissions.
- CRITIC challenges assumptions, reasoning and evidence.
- RED TEAM performs authorized adversarial testing in approved environments.
- EB9PRIME preserves decisions, provenance and verified learning; remembered information is never automatically treated as verified.
- SPEED FORCE PRIME optimizes latency and throughput only within the same security, quality, budget and verification constraints.
- Independent verification is separate from the component and team that implement the change.

Required separation: observation ≠ reasoning ≠ authorization ≠ execution ≠ verification.

## 7. Security and privacy controls

Mandatory controls:
1. Deny-by-default permissions and least privilege.
2. Secrets stored in an approved secret manager; never in prompts, logs, source files or memory records.
3. Per-provider credentials, scoped to the smallest practical resource and operation.
4. Separate read, write, send, financial, administrative and deployment scopes.
5. Human approval for external communication, financial actions, production deployment, destructive changes, permission escalation and sensitive-data export.
6. Imported code and tool outputs treated as untrusted; no execution during discovery.
7. Dependency pinning, integrity verification, vulnerability and licence scanning.
8. Data minimization, retention limits and deletion workflows.
9. Network egress allowlists and isolated execution environments.
10. Immutable or tamper-evident audit records with access controls.
11. Credential rotation, revocation and incident response procedures.
12. Threat modelling for confused-deputy, prompt injection, SSRF, data exfiltration, replay, privilege escalation and supply-chain compromise.

## 8. Orchestration lifecycle

**Discover → Register → Establish Provenance/Rights → Evaluate → Propose → Authorize → Connect or Acquire → Adapt → Validate → Stage → Independently Verify → Release → Monitor → Improve or Retire.**

A denied, failed or deferred gate stops the affected transition. It must not be silently retried through another provider to evade the decision. Fallback is allowed only where the alternate provider and operation are already approved for the same data and risk scope.

## 9. Reliability and recovery

- Timeouts and bounded retries with exponential backoff and jitter.
- Idempotency keys for operations that may be retried.
- Circuit breakers and provider health monitoring.
- Durable queues for recoverable asynchronous work.
- Dead-letter handling with diagnosis and controlled replay.
- Rate and concurrency limits per provider and tenant.
- Last-known-good configuration and versioned migrations.
- Backup, restore and disaster-recovery exercises.
- Provider outage must not corrupt canonical records or block unrelated local capabilities.
- Offline-capable functions must continue without assuming internet availability; remote integrations queue work safely until connectivity returns.

## 10. Production-readiness gates

A capability cannot be labelled production-ready until all applicable gates have recorded evidence and an independent reviewer has accepted it:

| Gate | Minimum acceptance evidence |
|---|---|
| Functional | Contract tests, positive and negative cases, expected outputs |
| Security | Threat model, secret scan, dependency scan, access-control tests |
| Privacy | Data-flow map, minimization, retention and deletion tests |
| Authorization | Denied-by-default and scope-boundary tests; approval workflow evidence |
| Reliability | Timeout, retry, outage, rate-limit and recovery tests |
| Integrity | Idempotency, duplicate, replay and consistency tests |
| Performance | Measured latency, throughput and resource use against declared budgets |
| Cost | Quota, spend ceiling, alert and runaway-loop tests |
| Portability | Provider substitution or documented, accepted exit strategy |
| Operations | Monitoring, alerting, runbook, backup and rollback evidence |
| Independent review | Reviewer not responsible for implementation; signed decision and linked evidence |

Release states: draft → candidate → staged → production-approved. A failed gate returns the candidate to remediation; it does not get waived by speed or by the component being tested.

## 11. Acceptance-test scenarios

1. Unregistered provider cannot be invoked.
2. Read-only credential cannot perform a write operation.
3. A prompt-injection string in retrieved content cannot change policy or grant permissions.
4. Missing approval blocks send, purchase, deployment and destructive operations.
5. Expired or revoked credentials fail closed and produce an audit event.
6. Repeated idempotent request does not duplicate a side effect.
7. Provider timeout triggers bounded recovery without an infinite retry loop.
8. Provider outage does not corrupt records or cause unauthorized fallback.
9. Alternate provider receives only data and scopes approved for it.
10. Adapter contract/version mismatch blocks release.
11. Secrets do not appear in logs, traces, prompts or generated artifacts.
12. Rollback restores the last known-good adapter/configuration.
13. Data deletion request propagates to controlled provider workflows and records outcome.
14. Offline queue preserves ordering/idempotency and synchronizes only after policy revalidation.
15. Independent reviewer can reproduce the evidence and reach the same release decision.

## 12. Initial implementation sequence

**Phase 0 — Baseline and reconciliation**
- Inventory existing repository architecture, protected branches, PRs, policies and current register schemas.
- Map this specification to existing artifacts; preserve existing work and resolve conflicts explicitly.
- Record gaps, owners and acceptance criteria.

**Phase 1 — Contract and registry foundation**
- Define capability/provider schemas and lifecycle state machine.
- Add schema validation, provenance and cross-register references.
- Add policy decision interface and audit event schema.

**Phase 2 — Safe adapter foundation**
- Implement one low-risk, read-only adapter first.
- Add isolated execution, secret handling, rate limits and contract tests.
- Do not begin with email sending, financial operations or production deployment.

**Phase 3 — Orchestration and recovery**
- Implement SYPHON workflow state transitions, queues, idempotency, timeouts, circuit breakers and bounded fallback.
- Test offline and provider-outage behaviour.

**Phase 4 — Specialist integration**
- Integrate V.I.S.I.O.N. observation, DD authorized execution, EB9PRIME provenance/continuity, CRITIC review and RED TEAM test harness through explicit contracts.
- Keep permissions and responsibilities separate.

**Phase 5 — Staging and independent verification**
- Run full acceptance suite, security review, cost/performance tests and rollback exercise.
- Promote only after independent sign-off.

## 13. Required operational records

Every operation records: correlation ID, actor/service identity, capability and adapter version, policy decision, approval reference if required, input/output classification (not secret values), timestamps, outcome, retries, provider request ID where safe, cost/quota metadata, evidence references and rollback/recovery action.

Audit records must not contain passwords, access tokens, private keys or unnecessary sensitive payloads.

## 14. Risks and unresolved decisions

- Canonical register schemas and current IDs must be reconciled from the approved repository baseline before implementation.
- Provider-specific data residency, retention, API limits and contractual terms require current verification.
- The exact policy engine, secrets manager, queue and sandbox technology are implementation decisions; select only after platform and threat-model assessment.
- The named platforms are candidate providers, not mandatory dependencies. Capability parity and exit paths must be evaluated individually.
- No evidence in this document proves any adapter is connected, deployed or production-ready.

## 15. Evidence vocabulary

Use only these distinct states:
- **Proposed:** design suggested; no implementation implied.
- **Approved:** authorized design/change decision recorded.
- **Implemented:** code/configuration exists at a traceable revision.
- **Tested:** specified tests executed with recorded results.
- **Independently verified:** separate reviewer reproduced and accepted evidence.
- **Production approved:** all release gates passed and authorized release decision recorded.
- **Deployed:** production environment confirms the identified revision is running.

A claim must link to commit, test run, reviewer and environment evidence as applicable.

## 16. Immediate next actions

1. Reconcile the existing master blueprint and protected PRs before merging or replacing anything.
2. Confirm the canonical provider and capability registry schemas.
3. Create the threat model and data-flow diagrams.
4. Implement schema validation and policy interfaces before provider adapters.
5. Select one read-only pilot adapter and define its conformance suite.
6. Keep this specification in draft until review and acceptance evidence exist.

## 17. Baseline repository audit — verified against `main`

This is a limited source inspection of the current default branch, not a complete security audit.

### 17.1 Existing SYPHON-related implementation

The current `main` branch contains:
- `src/lib/allsparxPrime/runtime.ts`: a narrow ALLSPARX PRIME / SYPHON adapter for the CloudCredits.io Ask AI startup-deal recommendation workflow;
- `tests/syphon-runtime.test.mjs`: Node tests covering endpoint protocol restrictions, URL credential/fragment rejection, redirect rejection, bounded JSON response size, UTF-8 and response-shape validation, prompt limits, localhost development, and sanitized provider errors;
- `package.json`: a `test:syphon` script invoking that runtime test file;
- `.github/workflows/syphon-baseline.yml`: a pull-request workflow that installs locked dependencies, runs SYPHON runtime tests, runs Astro checks and attempts a production build.

The runtime applies a 30-second request timeout, HTTPS except localhost development, rejects redirects, caps provider responses at 64 KiB, validates a bounded response shape and explicitly returns `verified: false`. These are useful existing controls and must be preserved.

### 17.2 Gaps before UCIOA production use

The inspected baseline does **not** establish the full UCIOA capability:
- the current adapter is task-specific, not a general provider-neutral capability adapter framework;
- no canonical provider/capability registry or UCIOA lifecycle state machine was identified in the inspected files;
- no generic policy-enforcement point or approval workflow was identified in the inspected runtime;
- the browser-facing configuration described in README uses `PUBLIC_AI_CHAT_ENDPOINT`; public build variables must never contain secrets, and authenticated provider access should move behind a server-side boundary;
- the existing evidence object is request-level response-validation metadata, not a durable, tamper-evident audit ledger;
- the current test workflow does not yet run UCIOA schema, policy, adapter-conformance, threat-model or recovery acceptance suites.

These are findings from the files inspected, not proof that no related work exists elsewhere in every branch or external system. Reconcile the full repository and protected pull requests before declaring any gap globally absent.

### 17.3 Immediate implementation decision

Do not replace the existing SYPHON runtime or change its provider contract as part of this documentation PR. Preserve its current safety tests. The first UCIOA code increment should add schemas and validation for capability/provider records plus lifecycle transitions, with tests, before introducing new provider adapters. Separately design a server-side authenticated proxy for any provider requiring credentials; do not expose credentials through `PUBLIC_*` variables or browser code.
