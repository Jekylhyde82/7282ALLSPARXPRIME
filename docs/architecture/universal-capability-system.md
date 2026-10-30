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


### Mandatory post-merge repository snapshot acquisition

**Rule: whenever ALLSPARX PRIME successfully merges or integrates a repository contribution, it must automatically acquire and retain a complete source snapshot of the contributing repository at the exact immutable source commit used for that integration.** This is a required lifecycle action, not an optional recommendation.

The acquisition workflow must:
1. Trigger only from a verified successful merge/integration event. A proposed PR, failed merge, untrusted webhook or unmerged connection must never trigger an acquisition marked as integrated.
2. Resolve the canonical repository identity and exact source commit from the approved repository record. Never download a moving branch name such as `main` or `latest` as the retained source.
3. Fetch the complete repository snapshot at that commit into an isolated, managed source archive/cache. Preserve the original directory structure, licence files, copyright notices and source metadata.
4. Verify the downloaded archive against a locally computed cryptographic digest and, where supplied, the source platform's verified commit identity or signed attestation. Record both the source commit and the downloaded artifact digest.
5. Store the snapshot read-only with repository URL, source commit, merge PR, merge commit, acquisition timestamp, archive digest, licence decision and evidence references. Link the snapshot to every capability extracted from it.
6. Make acquisition idempotent: the same repository ID and commit resolve to one immutable snapshot record. A retry must verify the existing object rather than silently overwrite it.
7. Never execute install scripts, build scripts, binaries or other imported code as part of downloading, unpacking, indexing or verifying the snapshot. Apply archive path-traversal, symlink, file-count, expanded-size and compression-ratio protections before extraction.
8. Keep the downloaded source snapshot separate from installed capability packages and from production runtime files. Downloading is not approval, installation, trust or deployment.
9. Retry transient network failures with bounded backoff. If acquisition or integrity verification fails, mark the integration record `merged_source_snapshot_pending` or `acquisition_failed`, alert the owner and block capability extraction/installation until the exact source snapshot is safely retained and verified.
10. Retain the snapshot for the configured source-retention period and preserve an auditable deletion/retention decision. Never delete or overwrite the last verified snapshot as part of an update.

The acquisition service must use narrowly scoped read-only repository access, avoid persisting access tokens in the snapshot or logs, and enforce storage quotas. The automatic download applies to every repository that actually passes the approved merge/integration process; it does not authorize crawling or downloading arbitrary repositories merely because they are discoverable.

**Acceptance evidence:** a successful merge event produces a verified immutable source snapshot; a repeated event is idempotent; a changed source commit produces a separate snapshot; tampered archives, unsafe paths, oversized archives, missing licence metadata or failed integrity checks are rejected; and no imported code is executed.

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

## Universal automatic integration rule

**Default rule: ALLSPARX PRIME must automatically evaluate and integrate every eligible contribution from every explicitly connected and owner-authorized repository.** The user should not need to request each routine discovery, comparison, compatibility check, test run, or low-risk merge individually.

The automation is comprehensive in coverage, not unconditional in trust:

1. Continuously discover changes from every repository on the explicit connected-source allowlist. Do not silently expand that allowlist or crawl arbitrary repositories.
2. Automatically inventory, classify, deduplicate, map dependencies, assess licence/provenance, compare interfaces, and prepare the smallest coherent integration change.
3. Automatically create an isolated proposal/branch and run the complete required validation pipeline for every eligible change.
4. Automatically merge a change when—and only when—all pre-authorized low-risk merge gates in this specification pass on the exact immutable proposed commit, required branch protections/reviews are satisfied, and a tested rollback path exists.
5. Automatically trigger the mandatory post-merge source snapshot acquisition rule for each verified merge, then link the retained snapshot and evidence to the repository and capability records.
6. Automatically retry bounded transient failures and reconcile duplicate events idempotently. Record each attempt, result and source revision.
7. If any gate fails, is missing, stale, ambiguous or outside the pre-authorized policy, automatically stop that change before merge, preserve the known-good system, record the precise blocker and prepare a review item. Do not silently bypass a gate, downgrade a finding, grant a new permission or treat silence as approval.
8. Automatically monitor integrated sources for upstream changes, vulnerabilities, licence changes, incompatibility and drift; prepare and validate upgrades. Do not replace a working version until the candidate passes and rollback remains available.

“Everything” means every eligible contribution across all explicitly connected and authorized repositories—not every file, dependency, branch, or arbitrary remote repository regardless of safety. Whole-repository merges are not the default: integrate the smallest maintainable capability through defined interfaces, preserve source history and notices, and retain the full immutable source snapshot separately.

High-impact changes—including new repositories, uncertain or incompatible licences, security-boundary changes, elevated permissions, credentials, unrestricted network access, destructive operations, schema/data migrations and production deployment—remain blocked pending explicit authorized review. Automation may perform all safe preparation and verification while that approval is pending.

The initial operating mode remains Observe/Prepare until SYPHON identity, policy enforcement, evidence integrity, isolation and rollback controls are independently verified in the actual deployment architecture. Only then may an authenticated owner enable Auto-integrate. This rule does not claim that automatic merging is currently operational merely because it is specified here.

## Phase 3 implementation: verified source archive acquisition

A first, network-adapter-injected acquisition primitive now exists at `src/lib/allsparxPrime/repository-snapshot-acquirer.mjs`, with contract tests in `tests/repository-snapshot-acquirer.test.mjs`.

Implemented safeguards:
- Requires a closed, successfully merged pull-request event, an immutable source commit, merge commit, approved licence evidence and an injected event-authentication verifier.
- Confirms the exact source commit through the GitHub commit API before requesting the archive.
- Pins the archive request to that commit SHA; it never requests a moving branch or tag.
- Restricts archive requests and redirects to HTTPS GitHub API/codeload hosts and does not forward bearer credentials to codeload.
- Enforces a configurable streamed archive-size limit and computes a SHA-256 digest over the downloaded bytes.
- Uses an injected atomic `putIfAbsent` storage contract and rejects a storage receipt whose digest differs from the downloaded archive.
- Records repository identity, source commit, merge PR/commit, licence expression, digest, byte count and acquisition time.
- Is idempotent for duplicate merge deliveries when the storage adapter returns the existing matching digest.
- Does not extract, install, import or execute downloaded source.

**Remaining integration requirements:** this module is an acquisition primitive, not yet an operational webhook or durable storage deployment. A production caller must supply a verified webhook/event adapter, a durable immutable storage implementation with atomic create-if-absent semantics, quota/retention controls, and independently protected credentials. No storage provider or server runtime is assumed until the actual deployment architecture is verified. The CI contract tests exercise the injected interfaces; they do not prove live GitHub acquisition or production persistence.

## Universal continuous improvement and assimilation rule

**Default operating rule: discover broadly, evaluate continuously, assimilate every proven improvement, and keep the system improving.** ALLSPARX PRIME must automatically assess any capability, tool, model, integration, workflow, code pattern, dataset, security control, documentation, test method, or upstream change it legitimately encounters that could improve system capability, reliability, security, efficiency, maintainability, accessibility, or user outcomes.

This rule applies across all eight architectural dimensions and the 256-cell target architecture. It is an ongoing system behaviour, not a one-time project or a promise that every discovered item is suitable.

### Required automatic improvement cycle

1. **Discover:** identify candidate improvements from connected and owner-authorized repositories, configured providers, approved feeds, local project sources, test findings, runtime telemetry and documented research sources. Record where each candidate came from and the exact version or revision.
2. **Understand:** inspect the candidate's purpose, dependencies, interfaces, licence, provenance, permissions, operational assumptions, maintenance state and known limitations. Do not execute unknown candidate code during inspection.
3. **Evaluate:** compare it against the current system and baseline. State the expected benefit, evidence, costs, risks, duplication, compatibility impact and confidence. Prefer measured improvements over feature counts or unsupported claims.
4. **Select:** automatically reject candidates that are harmful, redundant, unmaintained beyond policy, incompatible, unauthorised, legally unclear or unsupported by evidence. Preserve useful dissent and record why a candidate was rejected or deferred.
5. **Isolate:** prepare the smallest useful change in a disposable, least-privilege environment with no production secrets, restricted network access, resource limits and an auditable test boundary.
6. **Integrate:** adapt only the components that provide the proven benefit. Preserve source attribution, licence notices, provenance, version pins, interface contracts and the original component's identity where required. Do not wholesale-copy or merge an entire project when a smaller integration is sufficient.
7. **Verify:** run relevant unit, integration, security, licence, compatibility, performance, regression and recovery tests. Compare against the pre-change baseline. A candidate must demonstrate net benefit without unacceptable regression.
8. **Assimilate:** when all pre-authorised low-risk gates pass, automatically merge or activate the validated change through the approved pipeline. Keep the original version and a tested rollback route. Apply staged or shadow rollout where runtime behaviour could affect users.
9. **Learn and monitor:** record the result, evidence, source revision, decisions, tests, operational effects and rollback status. Monitor for drift, vulnerabilities, upstream changes and loss of the original benefit; automatically prepare a safe update or rollback when policy permits.

### Autonomy and trust boundary

- Discovery and evaluation are broad and proactive. Execution, installation, permission grants and production activation are separately controlled.
- Only explicitly connected, owner-authorized sources may be automatically fetched. A public discovery result is not permission to clone, execute, install, or merge its contents.
- Automatic assimilation is permitted only for changes within a pre-authorized risk envelope, with verified provenance and licence compatibility, least-privilege permissions, passing independent checks, and a tested rollback.
- New repositories, new external providers, unclear or incompatible licences, credentials, elevated permissions, security-boundary changes, unrestricted network access, destructive operations, data/schema migrations, financial actions and production deployment require explicit authorized approval.
- Unknown code is never executed as part of discovery. Downloaded source remains inert and isolated until separately reviewed and approved for testing.
- If evidence is missing, tests fail, a security concern is unresolved, or the expected benefit cannot be demonstrated, the system must hold the candidate, preserve the known-good state, explain the blocker and retain an auditable decision record.
- The system must not weaken security, privacy, reliability, legal compliance, user control or evidence standards merely to increase capability or integration counts.
- Do not claim an improvement has been assimilated until the change is implemented, tested, independently verified where required, and its operational state is known.

The target is a continuously improving, self-evaluating and safely self-upgrading ALLSPARX PRIME—not uncontrolled self-modifying software. Automatic assimilation becomes operational only after the real deployment architecture supplies verified identity, policy enforcement, isolated execution, durable evidence, monitoring and rollback controls.

### Phase 4 implementation: evidence-based improvement assessment

A deterministic assessment gate now exists at `src/lib/allsparxPrime/improvement-assessment.mjs`, with automated tests in `tests/improvement-assessment.test.mjs` and a dedicated CI step.

The gate returns one of three outcomes:
- **assimilate** only when the source is authorized, provenance and licence are verified, baseline and candidate digests exist, compatibility/tests/independent review pass, measured benefit is positive, regression and duplication stay within policy, the change is low-risk, rollback is tested, and an authenticated caller's policy explicitly enables automatic integration;
- **hold** when evidence, trust, review, rollback, or authorization is missing, or the change requires human review;
- **reject** when the candidate is invalid, demonstrates no measured benefit, or exceeds regression/duplication limits.

The evaluator is a pure decision function: it does not fetch, execute, install, merge or deploy candidate code. Its boolean trust and evidence fields are assertions supplied by its caller, not cryptographic proof. A production integration must populate those fields only from authenticated source records, verified CI attestations, trusted licence/security review records and a protected policy service. The current implementation therefore makes the decision logic testable but does not yet enable autonomous production assimilation.

### Phase 5 implementation: continuous-improvement pipeline coordinator

A fail-closed coordinator now exists at `src/lib/allsparxPrime/continuous-improvement-pipeline.mjs`. It connects the improvement assessment decision to explicit discovery, inspection, isolated preparation, evidence verification, merge and post-merge snapshot adapters.

The coordinator:
- Requires an explicit non-empty source allowlist and all required adapters.
- Processes discovered candidates independently and records a result for each.
- Requires an isolated preparation result with no production secrets before evidence verification.
- Requires a separate evidence-verification adapter before passing the normalized candidate to the improvement assessment gate.
- Calls the merge adapter only when the assessment returns `assimilate`.
- Requires a confirmed merge result containing exact source and merge commit SHAs and a pull-request number before snapshot acquisition.
- Triggers snapshot acquisition only after a confirmed merge and checks that the retained snapshot metadata names the exact source commit and includes a SHA-256 digest.
- Distinguishes a confirmed merge followed by snapshot failure from an uncertain merge response. An uncertain merge is recorded as unknown and is not reported as a success or failure.
- Exposes an outcome sink for durable audit recording.

Ten orchestration tests cover the successful path, isolation/evidence failures, policy denial, ambiguous merge responses, post-merge snapshot failure, digest validation and missing adapters. The tests use injected fake adapters; they prove coordinator behaviour, not live repository merging, isolation, authenticated evidence, webhook handling or durable storage.

### Verified deployment constraint

The current repository's `wrangler.toml` configures only static assets from `./dist`. It has no Worker `main` entrypoint, R2 bucket binding, D1 database binding, queue, durable object, webhook route or server-side secret binding. The current baseline GitHub workflow runs on pull requests and has read-only `contents: read` permission. Therefore there is no verified deployed server boundary or durable snapshot store to connect the coordinator to yet.

Do not enable automatic production merging or claim a live post-merge downloader until the deployment architecture is implemented and verified. The next required work is to design and implement an authenticated server-side event boundary, a durable immutable storage adapter, protected policy/evidence records, isolated test execution, audit persistence, and rollback/reconciliation. The coordinator deliberately uses injected adapters so those controls can be implemented against the actual approved runtime rather than guessed.

CI concurrency has also been changed to queue successive PR verification runs instead of cancelling an in-flight run on every push. This prevents rapid, sequential implementation commits from repeatedly interrupting the evidence pipeline; the newest head must still receive its own completed run before it is called verified.
