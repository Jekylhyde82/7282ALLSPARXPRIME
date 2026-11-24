# Universal Engine / Engineer — Universal Capability Acquisition Register

**Architecture focus:** NINEFOLD INTRINSIC  
**Register type:** Candidate discovery and acquisition intelligence  
**Status:** Initial candidate baseline — proposed, not approved for integration  
**Branch:** `feat/universal-capability-acquisition-register`

> Build for capability today. Design for possibilities tomorrow. Engineer for evolution indefinitely.
>
> **PROOF BEFORE CLAIM. EVIDENCE BEFORE CONFIDENCE. VERIFICATION BEFORE COMPLETION.**

## 1. Purpose and governing rule

This register records open-source projects, free tools, research implementations, infrastructure, standards, datasets, programmes and other resources that may strengthen the Universal Engine / Engineer.

**Adding a candidate to this register does not authorise installation, execution, integration, data collection, spending, account creation, or production use.** Discovery is not approval. Every candidate must pass the lifecycle and evidence gates below.

The register is deliberately technology-neutral. The Engine must not become dependent on one framework, model provider, vector database, agent, or vendor. Capabilities and interfaces are architectural assets; external projects are replaceable implementations.

## 2. Lifecycle

Every candidate must move through this lifecycle:

1. **Discovered** — source identified; provenance recorded.
2. **Proposed** — plausible capability and use case documented.
3. **Under Evaluation** — source, licence, maintenance, security, compatibility, performance and value assessed.
4. **Approved** — explicit decision, scope, owner, controls and acceptance criteria recorded.
5. **Integrated** — implementation completed behind a governed interface and independently verified.
6. **Rejected** — reason and evidence recorded.
7. **Retired** — replacement, migration and residual-risk plan recorded.

No candidate may skip stages. A discovery score cannot auto-approve integration.

## 3. Ninefold evaluation requirements

Score each dimension from 0–5, with evidence and confidence recorded separately. A missing score is **Unknown**, not zero and not a favourable assumption.

| Dimension | Evaluation questions |
|---|---|
| 1. Capability | Does it deliver a real, needed capability? What measurable gap does it close? |
| 2. Intelligence | Does it improve reasoning, context, planning, learning, retrieval or decision quality? |
| 3. Performance | What are latency, throughput, memory, compute, storage and operating costs under representative workloads? |
| 4. Reliability | Is it maintained, tested, observable, recoverable and suitable for the required workload? |
| 5. Security | What are its threat model, permissions, isolation, supply-chain risks, data handling and vulnerability history? |
| 6. Interoperability | Does it expose stable APIs, standards, adapters and portable data formats? |
| 7. Autonomy | Can it safely perform useful work with bounded permissions, checkpoints and human escalation? |
| 8. Evolution | Is it extensible, modular, replaceable, actively maintained and compatible with future architectures? |
| 9. Value | What capability gained per unit of engineering effort, compute, money and operational burden? |

### Mandatory evidence fields

For every candidate, capture:

- Canonical project name and official source/repository.
- Discovery date and last-checked date.
- Maintainer/organisation and project status.
- Licence and any commercial, attribution, data or model-weight restrictions.
- Release activity, maintenance signals, issue/PR health and support expectations.
- Security advisories, dependency/supply-chain risks and required privileges.
- Supported platforms, architectures, runtimes and hardware.
- Installation footprint, RAM/VRAM, CPU/GPU, storage and network requirements.
- APIs, protocols, data formats and integration surfaces.
- Dependencies, conflicts, duplication and replacement candidates.
- Benchmarks and test methodology, including hardware and workload.
- Privacy, retention, telemetry and data residency implications.
- Cost, free-tier limits, quotas, eligibility and expiry where relevant.
- Evaluation scores, confidence, evidence links and unresolved questions.
- Decision, rationale, owner, review date and rollback/migration plan.

## 4. Candidate inventory

All entries below begin at **Discovered / Proposed** unless a later assessment is explicitly recorded. Inclusion is not an endorsement, licence verification or current-maintenance guarantee. Confirm facts against each project's official source before promotion.

### A. Agent orchestration and intelligence

| Candidate | Potential role | Initial evaluation focus |
|---|---|---|
| LangGraph | Stateful, graph-based agent orchestration | Durable state, control flow, observability, complexity and deployment model |
| Agno | Agent and multi-agent application framework | Tool execution, memory, teams, model portability and maturity |
| Microsoft Agent Framework | Agent orchestration and workflow framework | API stability, enterprise dependencies and interoperability |
| Dapr Agents | Distributed agent workflows | Resilience, eventing, state management and operational overhead |
| CrewAI | Role/task-oriented multi-agent orchestration | Coordination overhead, determinism and governance |
| AutoGen | Multi-agent conversation and orchestration research/framework | Project evolution, successor path and production suitability |
| PydanticAI | Typed, validated agent development | Structured outputs, provider portability and validation |
| smolagents | Lightweight tool-using agents | Simplicity, execution safety and extensibility |
| Google ADK | Agent development kit | Portability, provider coupling and deployment requirements |
| Semantic Kernel | AI orchestration and integration SDK | Plugin model, language support and overlap |
| DSPy | Programmatic optimisation of LM pipelines | Evaluation-driven optimisation and reproducibility |

### B. Autonomous software engineering

| Candidate | Potential role | Initial evaluation focus |
|---|---|---|
| OpenHands | Autonomous software engineering agent platform | Sandbox boundaries, task success, cost and auditability |
| SWE-agent | Repository issue resolution agent | Benchmark validity, patch quality and safe execution |
| mini-SWE-agent | Minimal software engineering agent baseline | Small footprint, reproducibility and extensibility |
| Goose | Extensible local/remote coding agent | Permission model, provider adapters and tool controls |
| Aider | AI pair-programming in existing repositories | Git workflow, test discipline and model flexibility |
| Continue | Open-source AI code assistant | IDE integration, local model support and data handling |
| OpenCode | Terminal-based coding agent | Execution controls, provider portability and maintainability |
| Pi | Minimal coding-agent toolkit | Extensibility, tool boundary and operational maturity |
| Cline | IDE-based coding agent | Approval controls, secrets exposure and workspace permissions |
| Roo Code | Configurable coding-agent environment | Modes, permission boundaries and dependency footprint |

### C. Memory, retrieval and knowledge systems

| Candidate | Potential role | Initial evaluation focus |
|---|---|---|
| Graphiti | Temporal knowledge graph and evolving context | Temporal correctness, provenance, graph backend and model requirements |
| Qdrant | Vector and hybrid retrieval database | Filtering, backups, security configuration, scaling and quantisation |
| LlamaIndex | Data ingestion and retrieval orchestration | Connector quality, indexing strategy and evaluation |
| Haystack | Modular search and RAG pipelines | Pipeline observability, components and deployment complexity |
| RAGFlow | Document-centric RAG and context engine | Document quality, maintenance, resource footprint and issue health |
| Letta | Stateful agent memory architecture | Memory semantics, persistence and portability |
| Mem0 | Agent memory layer | Memory quality, privacy, retrieval accuracy and lock-in risk |

### D. Model inference, routing and compute

| Candidate | Potential role | Initial evaluation focus |
|---|---|---|
| llama.cpp | Efficient local model inference | Quantisation, supported backends and target-device feasibility |
| LocalAI | Multi-backend local inference API | Backend support, API compatibility and operational footprint |
| Ollama | Local model packaging and serving | Model lifecycle, API compatibility and resource use |
| vLLM | High-throughput model serving | Accelerator requirements, batching and production scaling |
| SGLang | Structured/high-performance model serving | Supported models, performance evidence and operational maturity |
| LiteLLM | Model/provider gateway and routing | Secret handling, routing policy, spend controls and provider compatibility |
| Ray | Distributed execution and compute orchestration | Cluster complexity, fault tolerance and resource scheduling |
| MLX | Apple Silicon machine-learning framework | Hardware specificity and whether it belongs in a portable runtime layer |

### E. Security, isolation, identity and policy

| Candidate | Potential role | Initial evaluation focus |
|---|---|---|
| Open Policy Agent (OPA) | Policy-as-code and authorisation decisions | Policy testing, enforcement points and failure modes |
| gVisor | Sandboxed workload isolation | Kernel compatibility, performance and threat-model fit |
| Kata Containers | VM-backed container isolation | Runtime overhead, platform support and operational complexity |
| Firecracker | Lightweight microVM isolation | Host requirements, lifecycle and network/storage controls |
| SPIFFE / SPIRE | Workload identity and attestation | Trust domains, rotation and deployment complexity |
| OpenBao | Secrets management | Compatibility, security posture, backup and key lifecycle |
| Trivy | Vulnerability and misconfiguration scanning | Coverage, false positives and CI integration |
| Semgrep | Static analysis and security rules | Rule quality, language coverage and triage burden |
| Sigstore | Artifact signing and software supply-chain verification | Identity model, transparency log and offline requirements |

### F. Evaluation, testing and observability

| Candidate | Potential role | Initial evaluation focus |
|---|---|---|
| Promptfoo | Prompt/model/application evaluation and red teaming | Test coverage, repeatability and CI integration |
| DeepEval | LLM evaluation framework | Metric validity, evaluator bias and reproducibility |
| Garak | LLM vulnerability scanning | Threat coverage, false negatives and safe test design |
| OpenTelemetry | Traces, metrics and logs instrumentation | Semantic conventions, overhead and data minimisation |
| SWE-ABS | Software-engineering agent benchmark research | Benchmark availability, reproducibility and applicability |
| Mutation testing tools | Test-suite strength measurement | Language support, runtime cost and mutation score interpretation |
| Formal verification toolchains | Prove selected invariants and properties | Specification effort, proof scope and soundness assumptions |

### G. Browser, desktop and perception

| Candidate / capability | Potential role | Initial evaluation focus |
|---|---|---|
| Playwright | Browser automation and end-to-end testing | Browser isolation, deterministic tests and permissions |
| Browser Use | Browser-operating agents | Page grounding, action validation and prompt-injection resistance |
| OCR toolchains | Text extraction from images and screens | Accuracy, language support and privacy |
| Speech recognition | Audio-to-text perception | Offline models, accuracy and latency |
| Speech synthesis | Text-to-audio output | Offline options, licensing and voice-data handling |
| Multimodal vision models | Image/screen understanding | Grounding, hallucination rate and sensitive-data controls |
| Computer-use systems | Governed desktop interaction | User consent, action preview, rollback and least privilege |

### H. Data acquisition, extraction and document processing

| Candidate | Potential role | Initial evaluation focus |
|---|---|---|
| Scrapy | Structured web crawling and extraction | Source terms, rate limits, politeness and provenance |
| Crawlee | Crawling and browser/data extraction | Runtime support, anti-abuse boundaries and scaling |
| Crawl4AI | Web content extraction for AI workflows | Extraction accuracy, site terms and change resilience |
| Unstructured | Document partitioning and extraction | Format coverage, quality and processing cost |
| Apache Tika | Document and metadata extraction | Parser coverage, security and deployment footprint |
| Docling | Document conversion and structured extraction | Table/layout fidelity, model requirements and licences |

### I. Data intelligence, catalogues and lineage

| Candidate / capability | Potential role | Initial evaluation focus |
|---|---|---|
| OpenMetadata | Metadata catalogue, governance and lineage | Connector maturity, deployment cost and metadata completeness |
| Data lineage systems | Trace source-to-output transformations | Granularity, interoperability and provenance integrity |
| Data quality frameworks | Validate freshness, completeness and consistency | Rule coverage, alert quality and ownership |
| Knowledge graph systems | Connect entities, capabilities and evidence | Schema evolution, temporal facts and query performance |
| Provenance standards/tooling | Preserve source and transformation history | Interchange formats, tamper evidence and retention |

### J. Durable workflows, messaging and automation

| Candidate | Potential role | Initial evaluation focus |
|---|---|---|
| Temporal | Durable workflow orchestration | Replay semantics, operational burden and workflow versioning |
| NATS | Messaging and event distribution | Delivery guarantees, security and topology |
| Apache Airflow | Scheduled data/workflow orchestration | Batch-vs-agent fit, scheduler overhead and reliability |
| Event-driven workflow patterns | Decouple components and support recovery | Idempotency, ordering, retries and observability |

### K. Interoperability and agent protocols

| Candidate / standard | Potential role | Initial evaluation focus |
|---|---|---|
| Model Context Protocol (MCP) | Standardised tool/context connections | Server trust, permission scope, schema validation and versioning |
| Agent2Agent (A2A) | Agent-to-agent interoperability | Authentication, task lifecycle, trust and protocol maturity |
| OpenAPI | Machine-readable service contracts | Schema validation, compatibility and generated client safety |
| JSON Schema | Structured input/output validation | Strictness, versioning and validation coverage |

### L. Resource discovery and acquisition

| Resource class | Potential role | Initial evaluation focus |
|---|---|---|
| Cloud credits | Reduce infrastructure cost | Eligibility, expiry, usage restrictions and renewal |
| GPU/accelerator credits | Access training/inference compute | Quotas, hardware, region, runtime limits and egress |
| Free hosting and compute tiers | Prototype and lightweight services | Sleep limits, bandwidth, persistence and acceptable-use terms |
| Open-source developer programmes | Obtain legitimate software benefits | Eligibility, duration, renewal and licence restrictions |
| Grants and research programmes | Fund capability development | Eligibility, milestones, reporting and IP terms |
| Public datasets and benchmarks | Train/evaluate systems | Licence, consent, provenance, bias and redistribution rules |
| Educational resources | Build engineering capability | Quality, recency, prerequisites and practical exercises |
| Open-source repositories | Reusable components and learning material | Licence, maintenance, security and integration cost |

## 5. Cross-cutting architecture requirements

Every shortlisted capability must fit the following architecture principles:

- **Replaceable implementations:** stable internal interfaces; adapters around external projects.
- **No single point of intellectual dependency:** maintain alternatives for critical capabilities.
- **Local-first where practical:** offline-capable operation where the workload and hardware permit it.
- **Cloud as an optional extension:** remote compute must not silently become a hard dependency.
- **Least privilege:** tools receive only the permissions needed for the task.
- **Sandbox untrusted execution:** code, browser actions, parsers and downloaded artefacts run in constrained environments.
- **Human approval gates:** external side effects, account creation, spending, publishing and destructive operations require explicit authorisation.
- **Evidence and provenance:** source, licence, version, configuration, inputs, outputs and test results are traceable.
- **Independent verification:** the component under test cannot be the sole judge of its own correctness.
- **Graceful degradation:** loss of a provider or service must not collapse unrelated capabilities.
- **Data minimisation:** collect only permitted, necessary data and retain it only as long as justified.
- **No hidden network behaviour:** disclose telemetry, remote calls, model downloads and external dependencies.

## 6. STARWIRE and SYPHON acquisition controls

STARWIRE is the opportunity-discovery and acquisition-intelligence capability. It may discover and rank legitimate opportunities across the wider internet, including repositories, tools, credits, grants, datasets and research resources.

SYPHON is the governed acquisition and extraction capability. It must preserve:

- Canonical source URL and source owner.
- Collection timestamp and retrieval timestamp.
- Terms/licence and permitted-use status.
- Robots/access restrictions and rate-limit policy where applicable.
- Content hash and version where appropriate.
- Extraction method, parser version and transformations.
- Provenance links from extracted facts to source passages.
- Privacy classification, retention and deletion requirements.
- Confidence, verification state and reviewer decision.

STARWIRE discovers; SYPHON collects only where permitted; neither independently approves integration or spending. Do not bypass authentication, access controls, paywalls, robots restrictions, licensing, or provider limits. Do not acquire or operationalise stolen credentials or private data.

## 7. Initial evaluation order (not an integration decision)

The following sequence is a proposed evaluation order based on architectural leverage, not a declaration that these projects are the best or already approved:

1. **Core orchestration and durable workflows:** compare LangGraph, Temporal, PydanticAI, Agno and Dapr Agents against representative workflows.
2. **Local inference and model routing:** compare llama.cpp, Ollama, LocalAI and LiteLLM on actual target hardware and a separate execution host.
3. **Memory and retrieval:** compare Qdrant, Graphiti, LlamaIndex, Haystack and alternatives using the same retrieval/evidence benchmark.
4. **Independent evaluation:** establish Promptfoo, DeepEval, Garak and OpenTelemetry evaluation/telemetry baselines.
5. **Safe autonomous engineering:** evaluate OpenHands, SWE-agent, Goose and Aider in disposable sandboxes against a fixed repository task set.
6. **Security foundation:** test OPA policy enforcement, workload identity, secret management and sandbox isolation before enabling autonomous actions.
7. **Data acquisition and provenance:** evaluate Scrapy/Crawlee/Crawl4AI plus document parsers under explicit source-permission rules.
8. **Perception and computer use:** test browser, screen, OCR, audio and vision systems with consent and action-confirmation controls.
9. **Resource intelligence:** build a continuously refreshed inventory of legitimate credits, grants, free tiers, datasets and developer programmes.

## 8. Hardware and deployment qualification

The user's Android phone is a control terminal, not the assumed execution host. The known target constraint is an OPPO A6 4G with 4 GB RAM and 128 GB storage. Therefore:

- Do not assume desktop/server frameworks can run locally on the phone.
- Separate control-plane/mobile interface from execution-plane compute.
- Prioritise a small mobile client, offline notes/queue and synchronisation when connectivity returns.
- Qualify CPU-only and low-memory modes separately from cloud/GPU modes.
- Record exact device, OS, RAM, model quantisation, context length, tokens/sec, latency, thermal behaviour and battery impact for any on-device inference claim.
- Treat cloud compute as optional and cost-governed.

## 9. Candidate decision record template

Copy this record for every candidate:

```yaml
candidate_id: UE-CAP-0000
name:
category:
official_url:
repository_url:
discovered_at:
last_checked_at:
lifecycle_state: Discovered
maintainer:
license:
license_verified: false
latest_release:
maintenance_assessment: Unknown
security_assessment: Unknown
supported_platforms: []
hardware_requirements: Unknown
dependencies: []
interfaces: []
data_handling: Unknown
telemetry: Unknown
cost_model: Unknown
free_tier_terms: Unknown
ninefold_scores:
  capability: Unknown
  intelligence: Unknown
  performance: Unknown
  reliability: Unknown
  security: Unknown
  interoperability: Unknown
  autonomy: Unknown
  evolution: Unknown
  value: Unknown
evidence_links: []
known_risks: []
open_questions: []
alternatives: []
proposed_use:
decision: Pending
decision_owner:
review_date:
verification_plan: []
rollback_or_exit_plan:
```

## 10. Immediate next work

1. Convert this baseline into a machine-readable catalogue with stable candidate IDs and deduplication.
2. Verify canonical repositories, licences, release dates, maintenance, security advisories and platform support from primary sources.
3. Expand discovery beyond this initial list; this baseline is not an exhaustive internet census.
4. Run capability-overlap and dependency analysis to identify complementary combinations and unnecessary duplication.
5. Build reproducible evaluation harnesses and representative workloads.
6. Produce a ranked shortlist with evidence, uncertainty, integration cost and expected value.
7. Promote only candidates that pass explicit review and acceptance tests.

## 11. Completion criteria

This register is complete as an **initial inventory baseline** only. It is not complete as a verified acquisition programme until:

- Candidate sources and licences are verified.
- Duplicate projects and overlapping capabilities are mapped.
- Security and maintenance checks are current.
- Performance tests are reproducible.
- Hardware and deployment compatibility are demonstrated.
- Integration and exit plans exist.
- Independent verification evidence is attached.

**The goal is not to install everything. The goal is to discover everything useful, understand it, prove its value, and integrate only what makes the Universal Engine stronger.**


## 12. Expanded discovery — 24 November 2026

The machine-readable catalogue at `docs/architecture/capability-candidates.json` is the identity source of record. It now contains 43 immutable candidate IDs. The following 13 additions were registered as **Discovered**, not approved:

| Candidate ID | Candidate | Potential contribution | Initial caution |
|---|---|---|---|
| UE-CAP-000031 | [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | VISION: OCR, document layout and structured visual-text extraction | Benchmark mobile/server model tiers, languages, layout fidelity and model licences separately. |
| UE-CAP-000032 | [OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) | Isolated execution environments for agents, browsers and desktops | Validate backend isolation, Kubernetes/Docker requirements and operational overhead. |
| UE-CAP-000033 | [NVIDIA OpenShell](https://github.com/NVIDIA/OpenShell) | Policy-governed sandbox lifecycle, filesystem and egress controls | Independently test fail-closed behaviour, policy bypass resistance and host compatibility. |
| UE-CAP-000034 | [AgentScope](https://github.com/agentscope-ai/agentscope) | Event-driven agent orchestration and human-in-the-loop workflows | Compare state, recovery, tracing and deployment overhead with LangGraph and alternatives. |
| UE-CAP-000035 | [Mastra](https://github.com/mastra-ai/mastra) | TypeScript-first agents, workflows, memory and evaluation | Assess enterprise-licensed subdirectories, runtime dependencies and persistence model. |
| UE-CAP-000036 | [Strands Agents](https://github.com/strands-agents/sdk-python) | Model-driven agent loop and tool orchestration | Check provider coupling, approval semantics, trace export and SDK parity. |
| UE-CAP-000037 | [OpenViking](https://github.com/volcengine/OpenViking) | Context database for memory, knowledge and reusable skills | Validate maturity, data model, provenance, retrieval quality and migration path. |
| UE-CAP-000038 | [Archestra](https://github.com/archestra-ai/archestra) | Agent/MCP gateway, registry and governance | Inspect trust boundaries, identity, policy enforcement and deployment footprint. |
| UE-CAP-000039 | [E2B](https://github.com/e2b-dev/E2B) | Agent-facing cloud sandbox and code-execution infrastructure | Distinguish open-source components from hosted service, self-hosting burden and cost. |
| UE-CAP-000040 | [microsandbox](https://github.com/zerocore-ai/microsandbox) | Local-first embeddable microVM isolation | Verify supported host hypervisors, architecture coverage and security model. |
| UE-CAP-000041 | [Kubernetes Agent Sandbox](https://github.com/kubernetes-sigs/agent-sandbox) | Kubernetes-native lifecycle primitives for agent sandboxes | Kubernetes-centric; likely execution-plane infrastructure, not phone-side software. |
| UE-CAP-000042 | [NVX](https://github.com/microsoft/nvx) | Lightweight microVM isolation research candidate | Research/pre-release maturity and host limitations must be treated as significant uncertainty. |
| UE-CAP-000043 | [DeerFlow](https://github.com/bytedance/deer-flow) | Long-horizon agent harness with subagents, memory, sandboxes and skills | Evaluate as an integrated harness, not automatically as a replacement for modular core services. |

### Discovery evidence and interpretation

- The [Backblaze agent-infrastructure index](https://github.com/backblaze-labs/awesome-agent-infrastructure) is a discovery map across agent frameworks, memory, sandboxes, protocols, observability and evaluation; it is not a quality certification.
- The [OpenHands Agent Canvas README](https://github.com/OpenHands/OpenHands/blob/main/README.md) describes a self-hosted control centre that can connect to multiple local, remote and cloud agent backends. This makes it a candidate control-plane integration to assess, not proof that all agents are safe or interchangeable.
- The [PaddleOCR repository](https://github.com/PaddlePaddle/PaddleOCR) reports Apache-2.0 for the repository and describes OCR/document extraction across 100+ languages. Model weights, datasets, third-party components and deployment-specific terms still require their own licence review. Its model-size tiers make it particularly worth testing for VISION, but mobile feasibility is not yet established.
- The [OpenSandbox project](https://github.com/opensandbox-group/OpenSandbox) describes isolated environments for code, commands, files, browsers and desktops, with Docker and Kubernetes deployment paths. Its own performance figures are project-reported and must be independently reproduced.
- The [NVIDIA OpenShell project](https://github.com/NVIDIA/OpenShell) describes policy-enforced filesystem and network controls and credential brokering. These are claims to threat-model and test, not assumed security guarantees.
- The [agent-sandbox landscape](https://github.com/arach/awesome-agent-sandboxes) flags an important maintenance trap: the legacy Daytona core repository is reported as no longer maintained since June 2026. Do not score the old repository as a current maintained self-hosted runtime without identifying the current product/source boundary.
- The [2026 agent-framework comparison](https://vdf.ai/blog/best-ai-agent-frameworks/) is useful for candidate discovery and feature comparison, but its licence/release claims must be confirmed directly in each upstream repository and release history.

### Provisional high-value evaluation lanes

These are evaluation priorities, not winners or integration approvals:

1. **VISION:** PaddleOCR alongside general multimodal vision, OCR, screen grounding, object detection and temporal video perception. Separate text extraction from scene understanding and spatial reasoning.
2. **Governed execution:** OpenSandbox, OpenShell, gVisor, Firecracker/Kata and microsandbox. Compare threat models and isolation boundaries; do not stack runtimes without a reason.
3. **Orchestration:** LangGraph, AgentScope, Mastra, Strands and the existing PydanticAI/Agno candidates. Compare identical workflows, failure recovery, approvals and observability.
4. **Long-horizon work:** DeerFlow, OpenHands and durable workflow engines such as Temporal/Restate. Distinguish an agent harness from a durable execution substrate.
5. **Context and memory:** OpenViking, Graphiti, Qdrant, Letta and LlamaIndex. Compare provenance, temporal updates, contradiction handling, retrieval accuracy and exportability.
6. **Control and governance:** Archestra and OpenShell alongside OPA, MCP gateways, workload identity and OpenTelemetry.

### Candidate identity and maintenance safeguards

- IDs UE-CAP-000001 through UE-CAP-000043 are permanent register identities; IDs are never recycled.
- A project rename does not change its ID. A fork receives a new ID and lineage reference. A successor or replacement receives a new ID; the predecessor remains recorded.
- Repository identity, package identity, model-weight licence and service terms are separate evidence fields.
- Community-maintained indexes are discovery accelerators only. They cannot establish licence compliance, security, current maintenance, or suitability.
- Candidate scores remain null until supported by evidence. Popularity, star counts and vendor claims are not substitutes for repeatable tests.


### VISION-specific discovery additions

Two additional candidates have been assigned permanent identities in the machine-readable catalogue:

| Candidate ID | Candidate | VISION contribution | Important distinction |
|---|---|---|---|
| UE-CAP-000044 | [Microsoft OmniParser](https://github.com/microsoft/OmniParser) | Converts screen images into structured UI elements, identifies interactable regions and supports visual action grounding. | This is screen/UI perception, not general-purpose understanding of the physical world. Its repository describes mixed licensing across model components; each weight and detector lineage needs separate review. |
| UE-CAP-000045 | [Meta Segment Anything 2 (SAM 2)](https://github.com/facebookresearch/sam2) | Promptable object segmentation in images and video, with object tracking across frames. | Segmentation and tracking are not object identity, semantic reasoning or scene understanding. The upstream README reports benchmark speeds on A100 hardware; these are not mobile performance claims. |

Primary discovery sources: [OmniParser repository](https://github.com/microsoft/OmniParser), [OmniParser project page](https://microsoft.github.io/OmniParser/), [SAM 2 repository](https://github.com/facebookresearch/sam2), and [Meta SAM 2 project page](https://ai.meta.com/research/sam2/).

The VISION capability must therefore be evaluated as a pipeline of distinct but composable skills: image/video input; screen parsing; OCR; object detection and segmentation; tracking across time; spatial and scene understanding; multimodal reasoning; confidence and uncertainty estimation; and temporal memory. No single model is assumed to provide all of these.


## 13. Second-pass discovery — visual intelligence and durable agent infrastructure

The following candidates were added as **UE-CAP-000046–UE-CAP-000054**. These are discovery records, not endorsements or integration approvals. Model weights, datasets, third-party dependencies and hosted services require separate licence and terms review.

| ID | Candidate | Potential contribution | Critical qualification |
|---|---|---|---|
| UE-CAP-000046 | Qwen3-VL | Broad vision-language reasoning, video, OCR, spatial grounding and GUI/mobile-agent perception | Model size and hardware demands vary substantially; verify exact checkpoint licence and deployment feasibility. |
| UE-CAP-000047 | Perception Models (PE / PLM) | Dedicated image, video and audio perception encoders, spatial features and VLM decoding | PE and PLM expose separate model licence files; evaluate each checkpoint and dataset independently. |
| UE-CAP-000048 | GLEE | General object perception across detection, grounding, segmentation and video tracking | MIT code is indicated upstream; verify checkpoint terms and note incomplete evaluation tooling may affect reproducibility. |
| UE-CAP-000049 | WeVisOne-VL | Unified object-level and pixel-level perception, including detection, OCR, pointing, segmentation and matting | Tencent-authored code states Apache-2.0; third-party components and weights need separate review. Very recent project; independently reproduce claims. |
| UE-CAP-000050 | Conductor OSS | Durable, inspectable workflows for long-running agent tasks, approvals, retries and recovery | Apache-2.0 is stated upstream; compare runtime and operational burden with Temporal, Restate and LangGraph. |
| UE-CAP-000051 | Dapr Agents | Distributed agent execution using workflow durability, identity, state and messaging | Assess Dapr's sidecar/control-plane footprint, API maturity and exact release/licence. |
| UE-CAP-000052 | Google AX | Declarative orchestration and sandbox scheduling for large agent fleets on Kubernetes | Upstream explicitly warns of heavy development and possible breaking changes; experimental, not a production default. |
| UE-CAP-000053 | Agent Substrate | Isolated stateful agent runtime with identity, network mediation and suspend/resume | Threat model, security guarantees, density claims, licence and maturity require independent verification. |
| UE-CAP-000054 | LibreYOLO | Common computer-vision interface across detection, OCR, depth, open-vocabulary models and export backends | Code is stated as MIT; each model's weights have their own licence. Broad model-adapter claims need task-by-task validation. |

### 13.1 VISION architecture implications

Do not select a single “vision model” and declare VISION complete. The new candidates point to complementary layers:

1. **General multimodal reasoning:** Qwen3-VL or PE/PLM can be evaluated for image/video/audio interpretation and grounded reasoning.
2. **Object-centric perception:** GLEE and WeVisOne-VL offer detection, referring/localisation and segmentation capabilities.
3. **Specialised perception primitives:** OCR, screen parsing, depth, segmentation and tracking remain independently testable components; LibreYOLO may provide a common inference surface, not a substitute for validating each model.
4. **Temporal and spatial continuity:** evaluate whether perception outputs can be tracked across frames, anchored to stable coordinates, timestamped, and reconciled with memory.
5. **Action grounding:** visual recognition must be separated from permission to act. A model's GUI-agent capability is not an authorisation mechanism.

A VISION benchmark must independently score text extraction, object localisation, absent-object rejection, segmentation quality, tracking identity continuity, spatial relations, temporal event ordering, uncertainty calibration, and screen-element grounding. Include difficult lighting, occlusion, blur, small text, dynamic layouts and adversarial UI content.

### 13.2 Durable execution and agent infrastructure implications

Conductor, Dapr Agents, Google AX and Agent Substrate are not interchangeable:

- **Workflow durability:** persist task state and recover after failures.
- **Agent framework:** define reasoning loops, tools and multi-agent collaboration.
- **Cluster orchestration:** schedule and manage many isolated agent workloads.
- **Execution substrate:** enforce isolation, identity, storage and network boundaries.

The architecture should test these as separate responsibilities before considering a combination. A durable workflow engine does not itself make untrusted code safe; a sandbox does not itself provide correct planning or reliable task completion.

### 13.3 Discovery decision

No new candidate has been scored or approved. The next evaluation tranche should prioritise (a) Qwen3-VL versus PE/PLM versus WeVisOne-VL on a common VISION workload, (b) GLEE versus SAM 2 for object/video tasks, and (c) Conductor versus Temporal versus Restate for durable workflow semantics. Keep all candidates replaceable behind capability interfaces.
