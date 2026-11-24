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
