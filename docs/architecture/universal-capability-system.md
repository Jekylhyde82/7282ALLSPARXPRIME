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


## Automatic synergy and controlled merge policy

The default operating mode is continuous, automatic coordination across every explicitly connected and approved source. "Automatic" means the system performs repeatable discovery, comparison, preparation, validation and lifecycle maintenance without requiring the user to micromanage each safe step. It does not mean blindly copying or merging unknown code.

### Always-automatic, read-only or reversible work

- Discover newly connected repositories, releases, tools and declared integrations from approved source lists.
- Inventory repository structure, manifests, package metadata, interfaces, dependencies, licences and declared capabilities without executing imported code.
- Compare candidates against the existing catalogue; detect duplicates, overlapping functions, incompatible versions and shared dependencies.
- Map complementary capabilities and propose the smallest coherent fusion plan.
- Generate provenance records, dependency graphs, compatibility reports and proposed change sets.
- Open isolated branches or pull requests for eligible changes, run the required test and security pipeline, and report precise outcomes.
- Detect upstream changes, advisories, deprecations and drift; prepare upgrade or rollback proposals.
- Keep the catalogue and evidence ledger synchronized with verified repository events.

### Conditional automation

A change may be configured for automatic merge only when every gate is satisfied:
1. The source repository is on an explicit owner-controlled allowlist and its identity is verified.
2. Source commit and licence are immutable, known and compatible; attribution and notices are preserved.
3. The change is minimal, scoped to an approved capability boundary and does not alter unrelated application behavior.
4. Static analysis, secret scanning, dependency and vulnerability checks, licence checks, unit, integration and regression tests all pass on the exact proposed commit.
5. The change requests only pre-approved low-risk permissions and does not add credential access, unrestricted network access, process spawning, data export, production deployment or destructive behavior.
6. Branch protection, required reviews and CI policies are satisfied; the merge mechanism is explicitly enabled by the repository owner.
7. A known-good revision and tested rollback path exist, and the resulting merge is recorded with commit and workflow evidence.

If any gate is absent, ambiguous, stale or failed, the system must stop before merge, preserve the current working version, and produce a review request explaining the blocker. Human approval remains mandatory for new sources, licence uncertainty, security-boundary changes, elevated permissions, schema migrations, data changes, production deployment and destructive operations.

### Fusion rules

- Prefer adapters and narrow interfaces over copying entire repositories.
- Reuse a capability only when its function, provenance, licence, version, runtime and security posture are understood.
- Combine complementary capabilities; deduplicate equivalent ones; preserve distinct implementations when they provide meaningful resilience or independent verification.
- Do not collapse dissenting security findings or competing implementations into one unreviewed "winner".
- Preserve original project identity, history, authorship, licence notices and a reversible mapping to the source.
- Keep integration status separate from capability status. A repository can be connected without being merged; a capability can be catalogued without being installed.
- Every automatic action must be idempotent, bounded, auditable and safe to retry. Failed work must not corrupt a known-good state.

### Operational modes

- **Observe:** discover and catalogue only.
- **Prepare:** create proposed extraction plans and pull requests; no merge.
- **Auto-integrate:** perform only pre-authorized low-risk merges after all gates pass.
- **Restricted:** freeze merges and upgrades while continuing read-only monitoring and evidence collection.

The initial deployment must start in Observe mode. Auto-integrate cannot be enabled until SYPHON's identity, policy enforcement, evidence integrity, isolation and rollback controls are independently verified in the actual deployment architecture. Mode changes require an authenticated, auditable owner decision.

## Non-goals and safeguards

- This system does not blindly merge entire repositories into ALLSPARX PRIME.
- It does not bypass licences, copyright, source attribution or third-party terms.
- It does not automatically trust an AI-generated assessment or imported README.
- It does not grant imported code access to credentials or production data by default.
- It does not claim that a capability is installed, tested or operational merely because it is catalogued.
- It does not replace SYPHON or create a parallel security gateway.


## System-wide integration inventory

The registry must maintain an evidence-backed inventory of repositories that contribute to, depend on, fork, or are referenced by ALLSPARX PRIME projects. A repository's presence in this inventory does not imply that its code has been imported or merged.

Each repository record must capture:
- Canonical repository URL and stable internal repository ID.
- Relationship type: upstream, fork, integrated component, dependency, reference-only or downstream.
- Immutable source commit and optional source path or release.
- Target repository, branch, pull request and merge commit where applicable.
- Capability IDs associated with the contribution.
- Evidence references for commits, pull requests, CI runs, reviews, licence/security decisions and deployments.
- Explicit integration status: discovered, assessed, approved, imported, merged, rejected, retired or unknown.

A record marked merged is invalid unless it includes both the pull-request reference and the immutable merge commit. Never infer a merged relationship from a repository name, a dependency declaration or a conversational claim.


## Phase 2 implementation: bounded read-only discovery

The first discovery implementation is a local, read-only scanner. Callers must supply explicit root directories. It inventories package metadata and the supported declarative manifest filenames `allsparx.capability.json` and `capability.manifest.json`.

Safety properties:
- Never imports or executes discovered package code, scripts, lifecycle hooks or binaries.
- Never modifies scanned source files.
- Does not follow symbolic links.
- Skips common generated/dependency directories such as `.git`, `node_modules`, `dist` and `build`.
- Applies caller-configurable bounds for recursion depth, files scanned and manifest size.
- Validates capability manifests against the canonical schema and labels valid manifests as unverified, not trusted or installed.
- Treats package metadata without a valid capability manifest as a candidate requiring further assessment.
- Returns diagnostics for malformed or inaccessible content instead of silently treating it as trusted.

This scanner is a local discovery primitive, not yet a GitHub crawler, remote repository fetcher, sandbox, installer or runtime agent. Remote discovery must be added behind an explicit source allowlist, authenticated read-only access and the same provenance, licence and security gates.

## Agent and capability catalogue

The system-wide catalogue should describe agents, tools, services and reusable capabilities through stable IDs and links to capability manifests. Each entry must separate:
- declared purpose and supported functions;
- source repository and version provenance;
- permissions and trust boundary;
- lifecycle state (planned, available, integrated, installed, tested, verified, disabled or retired);
- evidence references and known limitations.

An agent name or role description is not proof of an autonomous process. Record whether an agent is a documented collaboration role, a configured integration, or a separately deployed executable service. Never report a capability as operational without runtime and end-to-end evidence.

## Current status and dependencies

This document records the intended architecture only. No registry, extractor, installer, sandbox runner or runtime capability-management service is claimed to exist yet.

PR #15 (SYPHON evidence ledger and fail-closed gateway audit trail) remains a separate security workstream and must complete its own code review, CI verification and security findings before production use. The capability system may proceed through design and read-only discovery, but privileged execution and production installation depend on a verified security boundary.

## Required status vocabulary

Use PLANNED, ATTEMPTED, IMPLEMENTED, INSTALLED, TESTED and VERIFIED precisely. Completion requires evidence of the intended outcome, independent verification where appropriate, and durability and safety checks.