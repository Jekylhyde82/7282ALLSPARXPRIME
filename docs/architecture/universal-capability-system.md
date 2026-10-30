# ALLSPARX PRIME Universal Capability System

Status: PROPOSED ARCHITECTURE — not implemented or enabled at runtime.
Owner: ALLSPARX PRIME architecture. Security and evidence controls: SYPHON.

## Architectural decision

The Universal Capability System is a fundamental platform function of ALLSPARX PRIME. It provides a controlled way to discover, assess, extract, package, validate, install, update, disable, reuse and roll back capabilities obtained from approved repositories, integrations and tools.

This is a repository-level reuse and supply-chain function. It must not become a second gateway or bypass the existing provider and security boundaries. SYPHON remains the enforcement and evidence layer for security-sensitive operations.

## Goals

- Reuse proven capabilities instead of repeatedly rebuilding equivalent functionality.
- Preserve source attribution, licence obligations, provenance and original project history.
- Keep each capability modular, versioned, testable, independently enableable and removable.
- Promote only capabilities that pass compatibility, security, regression and operational checks.
- Support reuse across approved ALLSPARX PRIME projects without coupling unrelated projects.
- Maintain a complete, inspectable record of every import, review, release, installation, update and rollback.

## Capability lifecycle

1. Discover: identify candidate components, interfaces, dependencies, runtime assumptions and intended function.
2. Establish provenance and rights: record source repository, immutable source commit or release, licence, attribution and permitted-use conditions. Reject unclear or incompatible rights.
3. Isolate and inspect: analyse source and dependencies in a sandbox; scan for secrets, malware indicators, known vulnerabilities, unsafe install scripts and unexpected network or filesystem access.
4. Extract: select the smallest coherent unit that can be maintained independently. Preserve required notices and document modifications.
5. Package: create a manifest containing a unique capability ID, semantic version, description, owner, source provenance, licence, interface contract, dependencies, supported runtimes, permissions, integrity digest and test evidence.
6. Validate: run static analysis, dependency and licence checks, unit tests, integration tests, regression tests, security tests and resource-boundary tests in an isolated environment.
7. Review and approve: require explicit approval for privileged capabilities, external network access, credential access, data export, deployment or destructive operations.
8. Publish: store the reviewed package and immutable release metadata in the capability registry.
9. Install: resolve and lock dependencies, verify package integrity and permissions, then install into an isolated project boundary.
10. Observe and maintain: monitor health, compatibility, vulnerabilities, usage and update availability.
11. Update or roll back: stage upgrades, compare versions, run regression checks and preserve a known-good version for rollback.
12. Retire: disable or remove capabilities cleanly while retaining provenance, audit history and dependency impact records.

## Core components

- Capability registry: searchable catalogue of approved capability manifests and release metadata.
- Source intake: controlled import of repository paths, releases and integration artifacts.
- Provenance and licence evaluator: source traceability, licence compatibility and attribution checks.
- Extraction and packaging pipeline: reproducible, minimal packages with integrity digests.
- Compatibility evaluator: interface, runtime and dependency compatibility checks.
- Isolated validation runner: disposable test environment with restricted permissions and resource limits.
- Policy and approval service: permission grants, risk tiers and human approval gates.
- Installer and dependency resolver: deterministic installation using lockfiles and verified artifacts.
- Lifecycle manager: enable, disable, upgrade, pin, rollback and retire operations.
- Evidence integration: append-only records of decisions, test results, approvals and lifecycle changes.

## Trust and permission model

- Treat all imported code, documentation, manifests and tool output as untrusted input until validated.
- Never execute imported code during discovery or extraction.
- Run tests and first execution in an isolated, least-privilege environment.
- Deny by default. Capabilities receive only declared permissions that are explicitly approved.
- Do not copy secrets into packages, logs, manifests or test artifacts.
- Require stronger review for network access, credential access, filesystem writes, data export, process execution and production deployment.
- Verify package integrity at publication and every installation or update.
- Preserve a human approval gate for high-impact actions; automation may recommend but cannot silently grant itself privileges.
- Record both successful actions and security-relevant denials without storing raw secrets or sensitive payloads.
- A hash chain inside one administrative trust boundary is not independent tamper protection. High-assurance releases require a separately controlled signed checkpoint or immutable external record.

## Capability manifest — minimum fields

- capability_id and display_name
- version and release_channel
- description and declared interfaces
- source_repository, source_commit and source_path
- licence_expression, attribution and modification notices
- package_digest and signing or attestation metadata
- runtime and platform compatibility
- dependencies with pinned versions and integrity references
- declared permissions and network destinations
- data handling and retention classification
- test suite identity, results and verification timestamp
- security review status, reviewer and approval evidence
- changelog, deprecation and rollback compatibility

## Integration with SYPHON

SYPHON provides the security boundary and evidence controls for capability intake, approval, installation, update and rollback. The capability system must call approved SYPHON interfaces; it must not duplicate gateway authentication, provider routing or evidence-ledger responsibilities.

Required evidence events include discovery decision, source and commit identity, licence decision, scan results, extracted file set, package digest, test results, approval identity, permissions granted, installation result, update result and rollback result.

Evidence records must avoid raw secrets, credentials and unnecessary personal or customer data. Independent checkpoints and retention outside the same Worker or Durable Object trust boundary remain required for stronger tamper resistance.

## Initial delivery sequence

Phase 0 — Architecture and baseline: map the existing repository, package conventions, build/test pipeline, deployment targets and security boundaries. Do not modify production behavior.

Phase 1 — Manifest and registry schema: define and validate the capability manifest, provenance model, licence metadata, versioning rules and registry storage contract.

Phase 2 — Read-only discovery: index candidate repository components without executing them. Produce provenance, licence and dependency reports.

Phase 3 — Isolated validation: build a disposable runner with restricted permissions, reproducible dependencies and machine-readable test evidence.

Phase 4 — Package and registry: publish immutable, digest-verified packages only after review and passing checks.

Phase 5 — Controlled installation: install into a non-production project first, with explicit permission grants and rollback support.

Phase 6 — Cross-project reuse: validate compatibility and dependency isolation across approved projects; prevent silent shared-state coupling.

Phase 7 — Operational maturity: add signed releases, independent checkpoints, vulnerability monitoring, retention, backup/restore and disaster-recovery tests.

## Acceptance criteria

- No imported code is executed before isolation and review.
- Every package has verifiable source provenance, licence information, immutable version and integrity digest.
- Dependency resolution is deterministic and recorded.
- Permissions are explicit, least-privilege and independently reviewable.
- Automated tests cover successful install, denied install, incompatible dependency, tampered package, failed upgrade and rollback.
- An upgrade cannot replace the last known-good version until validation succeeds.
- Failure leaves the existing project in a known-good state.
- Audit evidence is sufficient to reconstruct who or what approved and performed each lifecycle operation.
- A capability can be disabled or removed without corrupting unrelated capabilities or the host application.
- The system is not called production-ready until independent verification, backup/restore and live deployment checks pass.

## Non-goals and safeguards

- This system does not blindly merge entire repositories into ALLSPARX PRIME.
- It does not bypass licences, copyright, source attribution or third-party terms.
- It does not automatically trust an AI-generated assessment or imported README.
- It does not grant imported code access to credentials or production data by default.
- It does not claim that a capability is installed, tested or operational merely because it is catalogued.
- It does not replace SYPHON or create a parallel security gateway.

## Current status and dependencies

This document records the intended architecture only. No registry, extractor, installer, sandbox runner or runtime capability-management service is claimed to exist yet.

PR #15 (SYPHON evidence ledger and fail-closed gateway audit trail) remains a separate security workstream and must complete its own code review, CI verification and security findings before production use. The capability system may proceed through design and read-only discovery, but privileged execution and production installation depend on a verified security boundary.

## Required status vocabulary

Use PLANNED, ATTEMPTED, IMPLEMENTED, INSTALLED, TESTED and VERIFIED precisely. Completion requires evidence of the intended outcome, independent verification where appropriate, and durability and safety checks.