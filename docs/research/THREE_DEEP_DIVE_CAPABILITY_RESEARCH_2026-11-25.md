# Three Deep-Dive Capability Research — 2026-11-25

**Scope:** three independent research workstreams spanning all nine Universal Engine / Engineer capability priorities. Official repositories, project documentation, licences, release notes and papers were prioritised. Search indexes were used for discovery only.

## Executive result

Sixteen new candidates have been recorded as Discovered (UE-CAP-000055–UE-CAP-000070). The catalogue now has 70 unique IDs; next ID UE-CAP-000071. All scores remain null, benchmarks are not run, and all installation/execution/integration/spending approval flags remain false.

## Deep dive 1 — capability registry, identity, policy and durable execution

| Candidate | Licence | What it adds | Caution |
|---|---|---|---|
| [Apicurio Registry](https://github.com/Apicurio/apicurio-registry) — 055 | Apache-2.0 | Versioned schemas, A2A agent cards, MCP tool/server definitions, prompt/model schemas, compatibility rules and discovery | AI registry/MCP features are experimental or disabled by default in some releases; demo stack is unauthenticated |
| [OpenFGA](https://github.com/openfga/openfga) — 056 | Apache-2.0 | Fine-grained relationship-based authorization for principals, agents, tools, resources and delegation | Not an identity provider; production storage and consistency require design |
| [SPIRE](https://github.com/spiffe/spire) — 057 | Apache-2.0 | Workload attestation and cryptographic SPIFFE IDs/SVIDs for mTLS/JWT trust | Trust domains, attestation selectors and node agents become critical infrastructure |
| [Cedar](https://github.com/cedar-policy/cedar) — 058 | Apache-2.0 | Typed authorization language/evaluator, schema validation and policy analysis | Not an identity or policy distribution system; enforcement points remain necessary |
| [Cadence](https://github.com/cadence-workflow/cadence) — 059 | Apache-2.0 | Mature alternative durable workflow engine | Compare against Temporal/Restate; do not add another workflow authority by default |
| [Kestra](https://github.com/kestra-io/kestra) — 060 | Apache-2.0 | Declarative event/schedule orchestration, language-neutral tasks, Git versioning and plugins | Broad platform/operational footprint; advertised scale needs reproduction |
| [Plasm](https://github.com/PlasmTools/plasm-core) — 070 | Core MIT OR Apache-2.0; trace sink BUSL-1.1 | Emerging typed capability graph, wire mappings and validated API execution DAGs | Very early project, small contributor base and mixed component licence |

**Architecture conclusions**
- The capability registry must govern manifests, versioned schemas, permissions, dependencies, trust state, compatibility and lifecycle—not merely list plugins.
- Separate identity (SPIRE), relationship authorization (OpenFGA), policy evaluation (OPA or Cedar) and enforcement points. Do not create conflicting policy authorities.
- Compare Temporal, Restate, Cadence, Conductor and Kestra on identical crash/replay/retry/compensation/human-approval workloads. One primary workflow authority owns a workflow's state.
- Plasm is research-only until maturity, licence and security reviews pass.

## Deep dive 2 — model gateway, memory, VISION and perception

| Candidate | Licence | What it adds | Caution |
|---|---|---|---|
| [Cognee](https://github.com/topoteretes/cognee) — 061 | Apache-2.0 | Persistent graph + vector + code knowledge memory; remember/recall/improve/forget lifecycle | Published BEAM results use differing datasets/models/configurations; bundled local GLiNER path is described as demo quality |
| [OpenVLHarness](https://github.com/uclanlp/OpenVLHarness) — 062 | MIT | Composable visual tool-use harness for grounding, OCR, depth, camera trajectory, zoom, multimodal memory and spatial calculations | Very new; benchmark gains are project-reported; separate GPU services and Serper key for some defaults; third-party terms apply |
| [vLLM Semantic Router](https://github.com/vllm-project/semantic-router) — 063 | Apache-2.0 | Semantic model/compute selection and fusion across local, private and cloud backends | Routing quality and privacy/location policies need calibration |
| [SGLang](https://github.com/sgl-project/sglang) — 064 | Apache-2.0 | High-performance serving for LLM, VLM and diffusion models; agentic workload optimisations | Hardware/workload-dependent; compare directly with vLLM |
| [GroundingPI](https://github.com/groundingpi/GroundingPI) — research reference | MIT code; third-party/model/data terms vary | Grounding/spatial primitives for physical intelligence and GUI/robotics perception | Weights and datasets are not bundled under a blanket MIT grant; not a clean free model recommendation |

**Architecture conclusions**
- Separate provider compatibility, secrets/budgets and provider failover from semantic model routing and inference serving.
- Keep vLLM, SGLang, llama.cpp and edge runtimes behind stable model-serving contracts.
- Memory requires typed semantics, provenance, temporal validity, contradiction handling and deletion guarantees—not just a vector database.
- VISION should preserve raw frames, crops, OCR, boxes, masks, depth maps, tracks, coordinate transforms and source evidence as addressable multimodal memory.
- OpenVLHarness is a valuable integration pattern: specialist perception tools plus structured persistent evidence outperform relying on one VLM to perform every perception task in one pass. Reproduce its reported results independently.

## Deep dive 3 — isolation, independent verification and continuous evolution

| Candidate | Licence | What it adds | Caution |
|---|---|---|---|
| [Inspect AI](https://github.com/UKGovernmentBEIS/inspect_ai) — 065 | MIT | Extensible evaluation framework for coding, agentic, reasoning, behavioural, multimodal and safety evaluations | Model-graded scoring is not independent ground truth; add deterministic verifiers |
| [Harbor](https://github.com/harbor-framework/harbor) — 066 | Apache-2.0 | Reproducible agent benchmark environments, arbitrary agent adapters and parallel experiments; official Terminal-Bench harness | Current metadata requires Python 3.12+; external providers/environments can add cost |
| [Tracekit Box](https://github.com/Cygnux-Labs/Tracekit-box) — 067 | MIT | Firecracker microVM with host-mediated command/network/secret/patch gates and offline-verifiable signed evidence | v0: no Firecracker jailer, remote signer, snapshots/restore or GPU; host trust and egress relay limitations |
| [Tarit](https://github.com/instavm/tarit) — 068 | AGPL-3.0-or-later | KVM microVM execution, checkpoint/restore/fork, warm pools, placement and audit | Requires x86_64 Linux/KVM; ARM64 guests not yet implemented in inspected docs; AGPL obligations |
| [Octelium](https://github.com/octelium/octelium) — 069 | Cluster AGPLv3; client/SDK Apache-2.0 | Identity-aware zero-trust access, secretless L7 credentials, ABAC, API/AI/MCP gateway and OTel audit | Split licence, Kubernetes operational footprint and maturity need review |

**Additional references:** [Firecracker](https://github.com/firecracker-microvm/firecracker) is an Apache-2.0 microVM foundation, not a complete agent security system. The [kosa8 threat-model/evaluation report](https://www.kosa8.com/research/kosa8-research-paper) is useful for deriving requirements, but its vendor-authored comparison and performance claims require independent reproduction. [Awesome Agent Infra](https://github.com/shenli/awesome-agent-infra) and [Backblaze Agent Infrastructure](https://github.com/backblaze-labs/awesome-agent-infrastructure) are discovery indexes, not certifications.

**Architecture conclusions**
- Separate containment, mediation and proof. A sandbox contains; host-side identity/policy gates mediate; signed evidence records boundary crossings.
- Keep credentials outside untrusted workloads; use short-lived workload identity and host-side secret brokering.
- Default-deny egress; validate resolved destinations outside the sandbox; block private/link-local/cloud metadata; test DNS rebinding and proxy-relay abuse.
- Bind task ID, workload identity, policy version, approvals, commands, network decisions, secret-use events, artifact hashes and final patch into signed evidence.
- Use Inspect AI and Harbor as complementary evaluation systems; add deterministic task-specific oracles and independent reviewers.
- Evolution must be a governed pipeline: discovery → provenance/licence → SBOM/security → compatibility → isolated test → benchmark → independent approval → staged rollout → rollback-ready monitoring.

## Cross-cutting acceptance tests

- **Registry:** schema compatibility, signed provenance, duplicate detection, revocation, discovery poisoning, malicious manifests and dependency cycles.
- **Identity/policy:** spoofed workload, expired identity, confused deputy, privilege escalation, delegation attenuation, conflicting policy and revocation latency.
- **Workflow:** crash, network partition, duplicate event, replay, retry, cancellation, compensation, schema migration and approval resume.
- **Model routing:** quality/latency/cost Pareto, data-location constraints, provider outage, fallback loops and malicious model metadata.
- **Memory:** temporal correctness, contradictions, provenance, deletion propagation, stale recall and poisoned memory.
- **VISION:** OCR, grounding, absent-object rejection, segmentation, tracking continuity, depth uncertainty, coordinate transforms, temporal ordering and screen prompt injection.
- **Isolation:** filesystem/process escape, egress bypass, metadata access, DNS rebinding, secret exfiltration, signer tampering, resource exhaustion and teardown residue.
- **Evaluation:** benchmark leakage, judge bias, test tampering, reproducibility, independent scoring and adversarial robustness.
- **Evolution:** malicious update, compromised maintainer, dependency takeover, licence change, API break, regression, canary failure and rollback.

## Decision

Sixteen new candidates are recorded as Discovered. The architecture has been strengthened by new registry, workload identity, authorization, model routing, memory, visual tool-use, evaluation and signed sandbox evidence options. None is yet selected as a production winner. All scores remain null; benchmarks are not run; approval flags remain false. The next step is a controlled common evaluation—not installing every project.
