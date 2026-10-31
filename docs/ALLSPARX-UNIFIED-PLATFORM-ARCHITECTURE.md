# ALLSPARX PRIME Unified Platform Architecture

**Decision:** Direction C — one unified ALLSPARX PRIME platform with CloudCredits.io retained as an operational subsystem.

**Governance:** PROOF BEFORE CLAIM. EVIDENCE BEFORE CONFIDENCE. VERIFICATION BEFORE COMPLETION.

## 1. Platform identity and responsibilities

- **ALLSPARX PRIME** — master orchestrator, policy coordination and capability routing.
- **Elephant Brain** — continuity and durable knowledge/memory. It is distinct from the execution evidence ledger; a ledger of events is not, by itself, a complete memory system.
- **SYPHON** — recover, audit, integrate, test, verify and evolve execution workflow.
- **ELITE UNIFIED EVOLVED UNIVERSAL FUSION SYNERGY CONTROLLER** — governance, capability coordination, permissions and integration boundaries.
- **CloudCredits.io** — the existing Astro application and startup-credit/provider/program discovery subsystem. Preserve its routes, content collections, search, Pagefind, UI and current visitor experience.

The eight architectural dimensions and 256 coordinated capability cells remain the target architecture. They are not an implementation count and must not be reported as 256 implemented capabilities.

## 2. Canonical runtime topology

Use one browser-to-gateway path and one canonical Cloudflare Worker deployment. Do not deploy competing gateway implementations.

1. CloudCredits.io remains the browser-facing application.
2. The browser calls only the approved HTTPS ALLSPARX gateway URL. It contains no provider credentials, Supabase secret key, signing secret or other server secret.
3. The canonical Worker implementation is the evidence-ledger-capable gateway in `workers/allsparx-gateway/` from the permanent-evidence-ledger work (PR #15). The earlier PR #14 gateway iteration is not a second production service.
4. Incorporate the Supabase JWT verification and authenticated-user rate-limiting controls from PR #17 into that canonical Worker. Preserve the canonical gateway's Turnstile, origin allowlist, rate controls, spend admission controls, provider routing and evidence append path.
5. Provider adapters and model identifiers remain server-side. Automatic fallback is policy-controlled; explicit provider selection must never silently substitute a different provider.
6. Cloudflare Durable Objects provide the operational rate-limit, spend-admission and evidence-ledger boundaries. A fixed reservation is an admission control, not proof of actual provider spend or an invoice-accurate USD cap.
7. Supabase Auth is the identity service. The connected project was observed as ACTIVE_HEALTHY with no security/performance advisor lints; it currently has no public tables, migrations or Edge Functions. Do not invent a database schema or claim database-backed memory. Add database objects only through reviewed migrations when a concrete persistence requirement exists.
8. Elephant Brain's durable knowledge store and the SYPHON evidence ledger remain separate subsystems with separate schemas, access controls, retention and verification.

## 3. Gateway identity and evidence requirements

- Verify Supabase access tokens using the project's published asymmetric JWKS when available; reject invalid issuer, audience, signature, expiry, algorithm and key ID. Fail closed if verification cannot be completed.
- Confirm the project's signing-key mode and JWKS publication during staging. The configuration is not yet independently verified.
- Use authenticated identity for user-scoped quotas and authorization. Never authorize from user-editable metadata.
- For evidence attribution, do not store raw email addresses, access tokens or unnecessary personal data. Use a keyed HMAC pseudonym of the authenticated subject, with a separately managed secret and a documented rotation/version strategy.
- Keep anonymous-origin evidence only for explicitly public/anonymous paths. Authenticated and anonymous actors must have distinct, schema-validated types.
- Evidence append failure must fail closed before provider execution where the workflow requires durable evidence.
- Preserve the existing hash-chain, bounded export, offline verification and Ed25519 checkpoint mechanisms. The independent signer, public-key trust anchor and immutable external retention remain separate controls and are not yet operationally verified.

## 4. Integration order

1. Complete the dependency remediation commit and run the nine-stage pipeline on the exact resulting commit. Stage 5 must independently pass.
2. Reconcile the provider/runtime foundation (PR #13), permanent evidence ledger and canonical gateway (PR #15), Supabase authentication gateway work (PR #17), agent evaluation foundation (PR #18), and nine-stage verification workflow (PR #19).
3. Retain PR #15's Worker as the single gateway; port and test the authentication controls from PR #17. Do not run two public gateways or duplicate rate-limit/budget ledgers.
4. Add pseudonymous authenticated actor attribution to the evidence schema and test both authenticated and anonymous paths, including key rotation and fail-closed behavior.
5. Add an explicit CloudCredits static-asset serving/deployment configuration and validate the built site, Pagefind assets, routes, headers, CORS, CSP and origin policy together.
6. Verify Supabase JWT signing mode, JWKS keys, allowed redirect URLs, email/auth configuration and a real sign-in/token-verification flow in staging.
7. Complete live provider tests, provider usage reconciliation, external evidence retention, independent signer custody, backup/restore, observability, incident response and rollback exercises.
8. Obtain independent security review and explicit release authorization. Merge and deployment remain separate decisions.

## 5. Deployment gates

Production is **NO-GO** until all applicable requirements have evidence:

- zero unresolved high or critical dependency findings on the final commit;
- all nine pipeline stages and independent gates pass, with Stage 5 explicitly passing;
- exact commit SHA, lockfile, build artifact and provenance independently verified;
- SYPHON runtime, provider routing, gateway authentication, origin controls, Turnstile, rate limits and spend admission tested against staging resources;
- provider credentials and Supabase/Cloudflare secrets provisioned through server-side secret stores and rotation procedures;
- actual provider usage/cost reconciliation implemented (reservations alone are not billing proof);
- evidence ledger external retention and independent signer/key custody verified;
- backup/restore and ledger-continuity recovery exercise completed;
- monitoring, alerting, incident response and rollback rehearsed;
- independent security review passed and an accountable release decision recorded.

A successful mocked test, local build, Worker dry-run, valid provider JSON response or healthy Supabase project is not proof of live production readiness.

## 6. Evidence status at this architecture decision

- **IMPLEMENTED / TESTED:** a dependency-remediation commit exists on the PR #19 branch; its originating workflow reports zero high and zero critical findings, SYPHON/gateway contract tests passed, regression tests passed, Astro checks passed, production static build passed, and patch hygiene passed.
- **VERIFICATION PENDING:** the exact remediation commit still requires a fresh, independently completed nine-stage run. The prior successful remediation workflow ran against its source commit and generated the remediation commit; do not transfer that success to the new commit without re-running the pipeline.
- **NOT VERIFIED:** live Supabase JWT/JWKS configuration, authenticated staging flow, live Cloudflare resources/secrets, live provider calls, independent signer custody, external immutable retention, recovery exercise, cost settlement and production deployment.
- **NOT AUTHORIZED:** merge and production deployment.

Update this record only when new evidence exists. Keep PLANNED, IMPLEMENTED, INSTALLED, TESTED and VERIFIED classifications distinct.
