# Universal Engine / Engineer — Intrinsic Capability Integration Blueprint

**Architecture focus:** NINEFOLD INTRINSIC  
**Status:** Architecture synthesis proposal — candidate mappings are not deployment approvals  
**Governing principle:** Capabilities are intrinsic architectural responsibilities; projects are replaceable implementations.

> Capability is the foundation. Intelligence is the means. Engineering is the discipline. Verified outcomes are the measure of success.

## 1. Purpose and boundary

This blueprint assimilates the 54 entries in the Universal Capability Acquisition Register into one technology-neutral architecture. It defines how capabilities cooperate, what each boundary owns, and what must be proven before an implementation is adopted.

It does **not** replace the established Universal Engine / Engineer governance, the nine Major Divisions, the 90-system design, the 184 Architecture Registers, or existing invariants. The responsibility groupings below are a logical integration view to be mapped into those existing structures—not a competing division scheme.

No candidate is thereby approved for installation, execution, integration, spending, account creation or production use. The architecture is designed for the full stated vision; operational permissions and evidence gates govern concrete actions, not the ambition.

## 2. Intrinsic architecture: capability fabric

The Engine is one coherent system with explicit responsibility boundaries. The following capability planes are logical concerns that can be distributed across the existing architecture.

| Plane | Intrinsic responsibility | Core contracts and outputs |
|---|---|---|
| 1. Intent and interaction | Receive goals, preserve user intent, resolve ambiguity, classify risk and define success | Task Contract, intent record, acceptance criteria, requester identity |
| 2. Governance and authority | Identity, delegation, policy, autonomy limits, approvals, budgets, stop/rollback authority | Principal, delegated capability token, policy decision, approval record |
| 3. Orchestration and temporal control | Plan, sequence, schedule, coordinate agents and workflows, persist progress, recover and resume | Workflow definition, task state, event, checkpoint, retry/recovery record |
| 4. Intelligence and model services | Reasoning, planning, model selection, routing, structured output, specialist collaboration | Model request/response contract, model registry entry, confidence and provenance |
| 5. Memory and knowledge | Working, episodic, semantic, procedural and temporal memory; retrieval, knowledge graph and provenance | Memory item, source reference, temporal assertion, retrieval result |
| 6. Perception and world understanding | Vision, screen, document, audio and other sensory inputs; recognition, grounding, spatial/temporal continuity | Percept, coordinate frame, timestamp, extracted text, object/event track, uncertainty |
| 7. Capability execution and external interfaces | Tools, code, browser, device, APIs, data acquisition, connectors and delegated specialist skills | Typed tool contract, action proposal, execution result, side-effect record |
| 8. Infrastructure and resource fabric | Local/edge/cloud compute, storage, messaging, sandboxing, networking, secrets and scheduling | Resource lease, workload identity, isolation profile, event envelope |
| 9. Evidence, evaluation and evolution | Verification, testing, observability, provenance, security assurance, learning and controlled capability evolution | Trace, benchmark result, evidence bundle, regression record, lifecycle decision |

These are not nine new Major Divisions. They are cross-cutting responsibility groupings to be mapped into the user's canonical governance structure without renaming or overwriting it.

## 3. Non-negotiable integration invariants

1. **One Engine, many replaceable implementations.** Internal capability contracts remain stable while vendors, models, runtimes and repositories can be replaced.
2. **Authority is explicit and attenuates through delegation.** A sub-agent cannot acquire more authority than its parent or the originating principal delegated.
3. **Every consequential action is mediated.** Tool calls, network egress, file access, device actions, spend and external side effects pass through policy enforcement.
4. **Isolation is layered.** Workflow boundaries, identity, network, filesystem, process, data and resource budgets are enforced independently. A sandbox alone is not a complete security architecture.
5. **State is durable and reconstructable.** Long-running tasks preserve checkpoints, inputs, decisions, approvals, provenance and recovery status.
6. **Memory is governed data.** Every memory has source, time, scope, confidence, retention and correction/deletion semantics.
7. **Perception is not authorisation.** A detected button, person, object or instruction does not grant permission to act on it.
8. **Evidence is independent of the component being evaluated.** No model, agent, test harness or integration certifies itself.
9. **Unknown remains unknown.** Missing licence, security, benchmark or compatibility evidence is never silently converted into a positive score.
10. **Evolution is continuous but governed.** Discovery may propose new capabilities; integration requires lifecycle approval, compatibility proof and rollback.
11. **Local-first where practical; cloud is optional.** Capability contracts support edge, offline and cloud deployments without assuming the phone is the execution host.
12. **Graceful degradation is designed in.** Loss of network, model provider, memory store, tool, sandbox or agent must trigger defined fallback, pause or safe shutdown behaviour.

## 4. Capability composition and candidate mapping

Candidate IDs below are permanent register references. These are **testable combinations**, not selected or approved production stacks.

### 4.1 Intent, orchestration and temporal control

- Stateful agent graph and control flow: LangGraph (001), AgentScope (034), Mastra (035), Strands Agents (036).
- Durable execution and recovery: Temporal (002), Restate (003), Conductor OSS (050).
- Distributed agent/workflow runtime: Dapr Agents (051); cluster-level agent scheduling research: Google AX (052).
- Long-horizon task harness: DeerFlow (043).
- Autonomous engineering specialists: OpenHands (013), SWE-agent (014), Goose (015).

**Integration rule:** select one primary workflow durability mechanism for a deployment profile. Agent frameworks plug into it through adapters; do not run multiple competing workflow authorities for the same task state. Compare replay semantics, idempotency, compensation, pause/resume, human approvals, versioning and failure recovery.

### 4.2 Intelligence, model runtime and routing

- Local inference: llama.cpp (004); edge runtimes: LiteRT-LM (005), ExecuTorch (006).
- Model routing/gateway: LiteLLM (029).
- Specialist multimodal reasoning: Qwen3-VL (046), subject to exact checkpoint and model-card review.

**Integration rule:** model providers are behind a model gateway and versioned model registry. Routing must account for capability, quality, latency, privacy, hardware, availability and cost. Local and remote models are alternatives behind one interface, not separate intelligence silos.

### 4.3 Memory, retrieval and knowledge

- Vector retrieval: Qdrant (007).
- Temporal knowledge graph: Graphiti (008).
- Retrieval/data orchestration: LlamaIndex (009).
- Context/memory database: OpenViking (037).

**Integration rule:** separate memory semantics from storage engines. Define typed memory classes, provenance, timestamps, entity identity, conflict resolution, confidence, retention, deletion and export. Benchmark retrieval quality and temporal correctness before combining graph and vector indexes. Avoid storing duplicate ungoverned copies.

### 4.4 Perception and VISION

- General visual reasoning: Qwen3-VL (046).
- Dedicated perception encoders: PE/PLM (047), with a material licensing split: PE is Apache-2.0; PLM materials are noncommercial research licensed.
- Object-level and pixel-level perception: GLEE (048), WeVisOne-VL (049).
- OCR/document perception: PaddleOCR (031), Docling (026).
- Screen/UI parsing: OmniParser (044).
- Video segmentation/tracking: SAM 2 (045).
- Common vision inference adapter candidate: LibreYOLO (054), noting that weights have per-model terms.

**Integration rule:** VISION is a pipeline, not one model. The pipeline includes input capture and consent; preprocessing; OCR; detection and grounding; segmentation; tracking; scene/spatial relations; temporal reasoning; multimodal interpretation; uncertainty; provenance; and output to memory or a governed action proposal. Keep screen coordinates, physical-world coordinates and model-local image coordinates distinct and transform explicitly.

**VISION output contract:** each observation carries source ID, capture timestamp, frame/image dimensions, coordinate-frame ID, detected entities, regions/masks, extracted text, relations/events, confidence/uncertainty, model/version, processing provenance and sensitivity/retention labels.

### 4.5 Capability execution, browser and data acquisition

- Browser automation: Playwright (023).
- Permitted extraction/crawling: Crawl4AI (024), Scrapy (025).
- Document processing: Docling (026), PaddleOCR (031).
- Long-running research/delegation: orchestration and memory planes.

**Integration rule:** discovery, collection, extraction and action are distinct permissions. STARWIRE discovers opportunities; SYPHON performs only permitted data acquisition with source/terms/provenance preserved. Respect authentication, access controls, licences, site terms, robots restrictions and provider quotas. No credential theft, bypass or private-data harvesting.

### 4.6 Governance, identity, policy and isolation

- Policy decisions: Open Policy Agent (016).
- Secrets: OpenBao (030).
- Agent gateway/governance: Archestra (038), subject to verification.
- Sandboxed execution: gVisor (017), OpenSandbox (032), NVIDIA OpenShell (033), E2B (039), microsandbox (040), Kubernetes Agent Sandbox (041), NVX (042), Agent Substrate (053).
- Supply-chain assurance: OpenSSF Scorecard (018), OSPS Baseline (019), GUAC (020), ScanCode (021), OSS Review Toolkit (022).

**Integration rule:** define a common Execution Isolation Contract and multiple replaceable backends. The policy decision point (OPA or alternative) must be separate from policy enforcement points in gateways, runtimes, sandboxes, filesystem and network. Use short-lived, scoped credentials; explicit egress; resource/time/token limits; immutable task identity; kill switch; and auditable approval. Do not assume products with “sandbox” in their names provide equivalent threat protection.

### 4.7 Messaging, observability and assurance

- Event transport: NATS (028).
- Traces/metrics/logs: OpenTelemetry (027).
- LLM/application evaluation: Promptfoo (010), DeepEval (011).
- Agent benchmark research: AgentCompass (012).
- Supply-chain and licence checks: 018–022.

**Integration rule:** all tasks, agents, model calls, memory retrievals, tool invocations and approvals emit correlated trace context. Store structured audit events separately from mutable application logs. Redact secrets and sensitive data. Evaluation includes end-to-end task success, policy correctness, recovery, cost and safety—not just answer quality.

## 5. Canonical internal contracts

Define and version these interfaces before binding implementation projects:

- **Task Contract:** task ID, requester/principal, goal, constraints, acceptance tests, risk class, deadline/budget, data scope and approval requirements.
- **Capability Manifest:** stable capability ID, version, description, input/output schema, dependencies, trust level, permissions, resource profile, licence/terms and health.
- **Agent Manifest:** agent identity, owner, model/runtime, permitted capabilities, autonomy tier, budget, data scope, parent/delegation chain and revocation state.
- **Tool Contract:** typed schema, read/write classification, side-effect declaration, idempotency key, timeout, retry policy, approval rule and rollback/compensation.
- **Evidence Envelope:** source, timestamp, hash, transformation history, model/tool versions, confidence, reviewer and verification status.
- **Memory Record:** type, subject/entity, content/reference, source, timestamp/validity interval, confidence, scope, sensitivity, retention and correction/deletion state.
- **Perception Record:** input provenance, frame/coordinate metadata, detections, text, regions, tracks, relations, uncertainty and privacy label.
- **Execution Isolation Contract:** identity, filesystem, process, network, secret, resource, duration, egress, persistence and destruction policies.
- **Workflow Checkpoint:** workflow/version, state, completed steps, pending actions, approvals, retries, idempotency, compensation state and recovery metadata.
- **Evaluation Record:** workload/version, dataset, seed, model and prompt versions, hardware, permissions, run count, raw outcomes, verifier, metrics, uncertainty and reproducibility artefacts.

All contracts must be schema-versioned, backward-compatible where possible, testable and exportable without vendor-specific state loss.

## 6. Autonomy and authority model

Autonomy is granted per task and capability, not globally to an agent. The runtime must support at least these operational states:

- **Observe:** read approved sources and produce findings.
- **Recommend:** propose plans/actions without executing side effects.
- **Prepare:** stage changes in isolated workspaces for review.
- **Execute bounded:** perform explicitly authorised, reversible actions within declared limits.
- **Execute consequential:** only after explicit approval and with rollback/compensation where feasible.
- **Emergency stop:** revoke delegated authority, stop execution, isolate workload and preserve evidence.

The authority chain is principal → designated orchestrator → delegated specialist → tool/workload. Every delegation narrows scope, time, budget and data access. A child cannot pass on authority it does not possess. User intent is not inferred as approval for spending, account creation, publication, deletion, deployment or other consequential actions.

## 7. Benchmark and verification programme

Build a reproducible benchmark harness before selecting winners. Use identical datasets/workloads, task definitions, model versions where comparable, prompts, seeds, tool permissions, sandbox profile, network access, hardware/software, resource limits and repetition counts. Use an independent verifier.

### Required suites

1. **Reasoning and planning:** multi-step tasks, ambiguity, constraint satisfaction, correction and adversarial instructions.
2. **Workflow durability:** worker crash, process restart, network partition, duplicate event, timeout, retry, cancellation, compensation and version migration.
3. **Memory:** retrieval precision/recall, temporal validity, contradiction handling, provenance, stale-memory correction and deletion.
4. **VISION:** OCR accuracy, localisation, absent-object rejection, segmentation, tracking identity, spatial relations, temporal ordering, UI grounding, uncertainty calibration and adversarial screen content.
5. **Tool execution:** schema correctness, idempotency, permission enforcement, prompt injection, data exfiltration attempts, rollback and audit completeness.
6. **Sandbox security:** filesystem escape, process isolation, network egress, credential exposure, resource exhaustion and persistence after teardown.
7. **Autonomous engineering:** issue resolution, patch correctness, test coverage, regression rate, repository safety and reproducibility.
8. **Operational value:** latency, throughput, CPU/GPU/RAM, storage, energy, cost per verified outcome, recovery time and operator burden.

Report distributions and failure cases, not only averages. A benchmark score never substitutes for security review or licence review.

## 8. Deployment profiles

The same contracts should support different deployment profiles without changing the architecture:

- **Mobile control terminal:** secure UI, task creation, approvals, status, visual capture only with explicit permissions; avoid assuming 4 GB RAM is sufficient for large models or agent execution.
- **Local/offline node:** compact inference, local memory, encrypted storage, local workflows and queued sync.
- **Home/lab compute:** sandboxed workloads, model serving, vector/graph stores and local observability.
- **Cloud/distributed:** scalable inference and workers, durable workflows, managed storage and remote sandboxes under explicit data and cost policy.
- **Hybrid:** route tasks according to sensitivity, connectivity, capability, latency and cost; preserve continuity during disconnection.

The OPPO A6 4G remains a control terminal unless measured tests prove a particular execution workload is suitable. Cloud use remains optional and governed.

## 9. Integration sequence and acceptance gates

This is a dependency-aware order, not permission to install or deploy.

| Stage | Build/verify | Exit condition |
|---|---|---|
| 0. Architecture baseline | Contract schemas, threat model, capability registry, decision records and trace IDs | Interfaces reviewed; boundaries and owners clear |
| 1. Evidence foundation | Provenance, source/licence records, SBOM, dependency and vulnerability checks | Every candidate has evidence state and unresolved items |
| 2. Governed core | Identity, delegation, policy, secrets, audit and kill switch | Deny-by-default and revocation tests pass |
| 3. Durable task runtime | Workflow state, checkpoints, retries, idempotency, approval gates | Crash/restart/duplicate/rollback tests pass |
| 4. Intelligence and memory | Model gateway, retrieval, graph/vector memory, temporal records | Fixed retrieval/reasoning suite passes |
| 5. Perception/VISION | OCR, screen parsing, visual models, tracking and spatial/temporal records | VISION suite passes with calibrated uncertainty |
| 6. Isolated execution | Sandboxes, browser/code tools, resource and egress policy | Independent isolation and escape tests pass |
| 7. Autonomous engineering | Coding agents, repository workspaces, test and review gates | Patch quality, security and reproducibility thresholds pass |
| 8. Distributed evolution | Event mesh, capability discovery, scheduler, STARWIRE/SYPHON controls | Resilience, provenance, cost and governance tests pass |
| 9. Continuous assurance | Regression, red-team, drift, maintenance and replacement workflows | Release gates and rollback rehearsals pass |

No stage is complete because a package installs or a demo works. Completion requires reproducible acceptance evidence.

## 10. Known gaps to close before calling the architecture complete

- Formal mapping of these responsibility planes and contracts into the existing 9 Major Divisions, 90 systems and 184 Architecture Registers without changing canonical identities.
- A precise, user-approved DD (Designated Driver) responsibility contract and its interfaces; do not assume DD is merely another agent framework or workflow engine.
- Complete candidate-level licence, maintenance, security, dependency and platform verification; the 54-candidate register is still discovery-heavy.
- A versioned capability ontology and machine-readable dependency/compatibility graph.
- A threat model covering physical-world visual inputs, screen prompt injection, camera consent, location/context leakage, model hallucination and action misgrounding.
- Concrete identity and delegated-authority implementation with revocation and tamper-evident audit.
- Data lifecycle policy for memory, source material, personal data, backups, retention and deletion.
- Hardware-backed measurements for mobile, local and cloud profiles.
- Benchmarks, score thresholds, independent reviewers and rollback evidence.
- Operational runbooks for outage, compromise, runaway cost, stuck workflow, corrupted memory and emergency stop.

These are explicit open requirements—not reasons to narrow the vision.

## 11. Decision status

- Architecture synthesis: **Proposed for review**.
- Candidate-to-capability mapping: **Recorded as evaluation guidance**.
- Candidate implementation selection: **Not approved**.
- Installation/execution/integration/spending: **Not authorised**.
- Benchmark winners: **None declared**.
- Architecture completeness: **Not yet demonstrated**.

The next governing action is to validate the logical responsibility mapping against the canonical Universal Engine / Engineer registers, then build the contracts and independent test harness. The architecture remains open to newly discovered dimensions and capabilities through the established lifecycle: Discovered → Proposed → Under Evaluation → Approved → Integrated / Rejected / Retired.
