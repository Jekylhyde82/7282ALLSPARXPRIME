# Universal Capability Acquisition System — Production Readiness Register

**Owning architecture:** Universal Engineer  
**Register identity:** UCA-REG-001  
**Implementation repository:** `Jekylhyde82/7282ALLSPARXPRIME`  
**Working branch:** `allsparx/universal-capability-system`  
**Review state:** OPEN DRAFT — NOT APPROVED FOR PRODUCTION  
**Assessment date:** 2026-11-19

## 1. Executive decision

**NO-GO for production. GO for continued isolated engineering and staging preparation.**

The current draft contains meaningful implementation work. The exact PR head `2335f562c3c7c80769770274d6af770609b75b03` had a successful GitHub Actions run (run ID `44319647834`). That run completed the SYPHON runtime tests, capability manifest and schema tests, read-only discovery tests, Worker webhook/snapshot tests, improvement-assessment tests, repository snapshot tests, registry and policy tests, Astro checks, and production asset build.

That is useful evidence for the tested commit. It is not evidence of live Cloudflare deployment, authenticated production webhook delivery, durable registry persistence, immutable snapshot retention, isolated code execution, installation, rollback, backup/restore, or independent production verification. Any subsequent commit requires its own completed checks.

## 2. Verified current implementation scope

The draft branch contains:

- Declarative capability-manifest schema and validator.
- Read-only local capability discovery; discovered manifests are explicitly unverified.
- Capability permission-policy evaluation.
- Append-only registry event construction and chain-integrity helpers.
- An injected registry service that requires an atomic `appendIfHead` storage adapter.
- Deterministic improvement assessment and a continuous-improvement coordinator using injected adapters.
- A GitHub merge-event webhook boundary and Cloudflare Durable Object/R2 snapshot prototype.
- Contract tests for the above and a CI workflow that runs those tests plus application checks/build.

These are implementation components and prototypes. They do not collectively establish a deployed end-to-end acquisition service.

## 3. Production blockers — ordered by severity

### P0 — Trust evidence is self-asserted by the manifest

**Finding:** `capability-policy.mjs` currently reads verification status, licence review status and security-review status/reviewer/approval fields directly from the capability manifest. The manifest is imported declarative data and is therefore untrusted. A candidate can claim that it passed tests or received approval. For elevated permissions, the current evaluator checks that reviewer/reference/timestamp fields exist, but does not authenticate those claims against an independent approval/evidence authority. It can return `allowed: true` while also setting `requires_human_approval: true`.

**Required correction:** separate candidate manifest data from trusted evidence. Require an authenticated evidence context supplied by a trusted verifier/policy service; bind its attestations to the exact manifest digest, package digest, source commit, policy version, reviewer identity and expiry/revocation state. An elevated permission must remain denied or pending until a separately authenticated approval is verified. The evaluator must never treat a manifest's own approval fields as proof.

**Acceptance evidence:** negative tests prove that forged manifest-only verification, licence and approval claims cannot grant permission; stale, revoked, mismatched-digest and wrong-policy attestations are denied; valid independently authenticated evidence passes only within its exact scope.

### P0 — Snapshot writes are not yet demonstrably immutable

**Finding:** the Worker checks R2 for an existing object and then calls an unconditional `SNAPSHOTS.put`. The check-then-write sequence is not an atomic create-if-absent guarantee. The Durable Object lease expires after a fixed interval and is not renewed while the archive is downloaded. A delayed operation or retry after lease expiry can create competing writers. On the existing-object path, the code checks custom metadata and digest syntax but does not recompute the digest from the stored object bytes.

**Required correction:** use a storage operation with a verified conditional create-only precondition (or an equivalent atomic immutable-object contract); define lease renewal/ownership and bounded operation timeouts; on conflict, read back and verify the stored bytes against the recorded digest. Protect the object against overwrite through storage permissions and retention controls. Treat metadata as claims until the underlying bytes or a trusted storage checksum/attestation is verified.

**Acceptance evidence:** concurrency tests force overlapping/expired leases; only one immutable object wins; a conflicting writer cannot overwrite it; corrupted bytes and mismatched metadata are detected; retries are idempotent and verify content integrity.

### P0 — Registry persistence and independent tamper evidence are not deployed

**Finding:** the registry service injects a store interface and correctly requires atomic `appendIfHead`, but no production durable adapter is established by the current architecture. A hash chain alone does not prevent an administrator or compromised store from rewriting the entire chain. External checkpoint fields are not, by themselves, proof that an independent signature has been verified.

**Required correction:** select and implement the actual durable store; prove atomic compare-and-append under concurrent writers; authenticate actor identity and policy decisions; sign checkpoints with a separately controlled key or publish them to an independently administered immutable record; implement backup, restore and integrity-reconciliation procedures.

**Acceptance evidence:** concurrent append tests, tamper/rewrite detection, key rotation/revocation tests, restore-from-backup exercise and independently verified checkpoint validation.

### P0 — No production deployment or live integration has been verified

**Finding:** `wrangler.toml` declares Worker, R2 and Durable Object bindings, but configuration declarations do not create the bucket, set secrets, configure the GitHub webhook, deploy the Worker or prove that the live environment behaves as tested. The architecture document itself records these as operator prerequisites.

**Required correction:** create a non-production Cloudflare environment; configure the bucket, Durable Object migration, webhook secret, explicit repository allowlist, licence policy and least-privilege GitHub token where required; deploy the Worker to staging; deliver a real signed test event; independently inspect the resulting object and metadata; test duplicate, replay, denial and failure paths. Keep production credentials and deployment approval separate.

**Acceptance evidence:** deployment identity and version, configuration inventory without secret values, signed staging delivery, actual R2 object read-back and digest verification, logs/metrics, failure/retry evidence and independent review.

### P1 — Isolation, extraction and installation are not end-to-end capabilities yet

**Finding:** current discovery is read-only and does not execute code. The design describes isolated validation, extraction, packaging and installation, but a complete production sandbox/installer and its runtime boundary are not established by the evidence inspected.

**Required correction:** implement disposable least-privilege execution with network/filesystem/process restrictions, resource limits, secret-free test environments, archive traversal and symlink defenses, deterministic dependency resolution, package signing, installation staging and rollback. Discovery and archive acquisition must remain inert.

**Acceptance evidence:** malicious fixture tests, resource-exhaustion tests, network-egress denial, filesystem boundary tests, tampered package rejection, deterministic rebuild checks and safe install/disable/rollback exercises.

### P1 — Operational resilience and observability are incomplete

**Required correction:** define alerting, structured non-secret logs, metrics, queue/back-pressure limits, retry budgets, dead-letter/reconciliation handling, retention and quota policies, disaster recovery, backup/restore, incident response and owner escalation.

**Acceptance evidence:** fault-injection exercises, recovery-time and recovery-point objectives, backup restoration, storage exhaustion handling, webhook outage/replay reconciliation and documented operational runbooks.

### P1 — Repository authority must be resolved

**Finding:** the implementation repository currently identifies its application and package as `cloudcredits.io` and is a CloudCredits.io fork. This is not evidence that it is the canonical repository for the full Universal Engine / Engineer architecture.

**Required correction:** confirm the intended canonical repository and ownership boundary before production deployment or reuse across the Universal Engine. If this remains a prototype host, explicitly retain that status and plan a controlled port to the authoritative Engineer repository.

## 4. Release gates

Production approval requires all gates below. A green unit/CI run alone cannot waive them.

1. **Architecture and ownership:** Universal Engineer owns acquisition; UCA-REG-001 is the logical authoritative register; Universal Engine is a governed consumer.
2. **Identity and authorisation:** authenticated actors, source allowlists, scoped approvals, expiry/revocation and deny-by-default enforcement.
3. **Provenance and licensing:** immutable source revision, verified repository identity, SPDX/licence review, attribution and complete provenance.
4. **Evidence integrity:** trusted attestations bound to exact artifacts and policies; independently anchored registry checkpoints.
5. **Isolation and supply chain:** inert discovery, safe archive handling, isolated testing, dependency and secret scanning, deterministic packaging.
6. **Registry and storage:** atomic durable writes, immutable snapshots, integrity verification, retention and access controls.
7. **Execution and rollback:** staged installation, least privilege, health checks, reversible deployment and tested rollback.
8. **Operations and recovery:** monitoring, alerting, backup/restore, incident response, quotas and reconciliation.
9. **Independent verification:** a reviewer/process independent of the implementation confirms every release criterion against the actual staging/production deployment.

## 5. Required status vocabulary

- **PLANNED:** specified but no implementation evidence.
- **ATTEMPTED:** an action was initiated; outcome not yet confirmed.
- **IMPLEMENTED:** code exists at a named commit.
- **TESTED:** identified tests passed on the exact named commit/environment.
- **DEPLOYED:** a named build is running in a named environment.
- **VERIFIED:** independent evidence confirms the intended behaviour and required safety properties.
- **PRODUCTION-APPROVED:** all release gates passed and an authorised owner approved release.

Never promote a status based on documentation wording alone.

## 6. Immediate engineering sequence

1. Resolve the canonical repository/ownership boundary.
2. Correct the P0 trusted-evidence flaw in capability policy and add adversarial tests.
3. Make R2 snapshot creation and read-back integrity genuinely immutable under concurrency.
4. Implement and test durable registry persistence plus independently verifiable checkpoints.
5. Deploy only to staging and perform real webhook/storage tests.
6. Complete isolated validation, packaging, installation, rollback and operational recovery.
7. Commission independent verification; only then consider production approval.

**Current disposition:** continue on the existing draft branch in isolated development. Do not enable auto-integration, production installation, production webhook acquisition or production deployment yet.
