# Three Deep-Dive Research Results — Universal Engine / Engineer

**Research date:** 2026-11-25  
**Workstreams:** 3 deep dives, followed by targeted upstream verification  
**Scope:** capability registry/discovery; identity/authority/policy; durable execution; model routing/serving; memory/knowledge; VISION/perception; isolated execution; independent evaluation; continuous capability evolution.

## Executive result

The research surfaced 16 additional candidates and several architectural patterns that materially strengthen the current architecture. The machine-readable candidate register now contains 70 unique permanent IDs, with the next available ID set to `UE-CAP-000071`.

This is a discovery and architecture update—not an implementation approval. Scores remain null, benchmarks are not run, and installation/execution/integration/spending remain unapproved.

## Deep dive 1 — Capability registry, identity, policy and durable execution

### Strong candidates

| Candidate | Licence evidence | Best contribution | Critical caveat |
|---|---|---|---|
| [Apicurio Registry](https://github.com/Apicurio/apicurio-registry) — UE-CAP-000055 | Apache-2.0 | Versioned API/schema registry; emerging A2A agent-card, MCP tool/server, prompt and model-schema registry; compatibility rules and discovery | AI registry and MCP features are experimental/disabled by default in some releases; demo stack is unauthenticated |
| [OpenFGA](https://github.com/openfga/openfga) — UE-CAP-000056 | Apache-2.0 | Fine-grained relationship-based authorization; model principal → agent → tool → resource and delegated relationships | Not an identity provider or policy distribution system; production storage and consistency must be configured/tested |
| [SPIRE](https://github.com/spiffe/spire) — UE-CAP-000057 | Apache-2.0 | Attested workload identity and short-lived SPIFFE SVIDs for mTLS/JWT trust | Attestation roots, selectors, trust domains and node agents are high-trust infrastructure |
| [Cedar](https://github.com/cedar-policy/cedar) — UE-CAP-000058 | Apache-2.0 | Typed policy language, authorization evaluator, schema validation and policy analysis | Not an end-to-end identity or enforcement platform; policy enforcement points remain necessary |
| [Cadence](https://github.com/cadence-workflow/cadence) — UE-CAP-000059 | Apache-2.0 | Mature alternative durable workflow engine | Overlaps Temporal/Restate; do not adopt alongside another workflow authority without measured justification |
| [Kestra](https://github.com/kestra-io/kestra) — UE-CAP-000060 | Apache-2.0 | Declarative event/schedule orchestration, language-neutral tasks, Git versioning and plugin ecosystem | Broad platform and operational footprint; advertised scale is not independent proof of fit |

### Architectural conclusions

1. **Registry is not just a list of plugins.** It should be the governed source of truth for capability manifests, versions, input/output schemas, permissions, trust state, dependencies, compatibility and lifecycle.
2. **Separate identity from authorization.** SPIRE can provide cryptographic workload identity; OpenFGA can answer relationship questions; OPA or Cedar can evaluate contextual policy; runtime enforcement points actually block or permit the action.
3. **Avoid policy fragmentation.** Choose one canonical policy decision model for each deployment profile. Evaluate Cedar and OPA rather than running inconsistent parallel authorities.
4. **Durable orchestration is a replaceable implementation role.** Compare Temporal, Restate, Cadence, Conductor and Kestra using identical recovery workloads. One primary engine owns each workflow's state.
5. **Typed capabilities should be validated before transport.** Plasm is a promising emerging typed capability graph, but is very early and has a BUSL-1.1 trace-sink exception. Treat as research, not a foundational dependency.

## Deep dive 2 — Model gateway, memory, VISION and perception

### Strong candidates

| Candidate | Licence evidence | Best contribution | Critical caveat |
|---|---|---|---|
| [Cognee](https://github.com/topoteretes/cognee) — UE-CAP-000061 | Apache-2.0 | Graph + vector + code knowledge memory; remember, recall, improve and forget workflows | Published BEAM results use differing data/models/configurations; bundled local GLiNER path is described as a demo, not a production-grade extractor |
| [OpenVLHarness](https://github.com/uclanlp/OpenVLHarness) — UE-CAP-000062 | MIT | Composable visual tool-use pipeline combining grounding, OCR, depth, camera trajectory, zoom, multimodal memory and code-based spatial calculations | Very new; reported gains are project-reported and need reproduction; some default tools need separate GPU services and Serper credentials |
| [vLLM Semantic Router](https://github.com/vllm-project/semantic-router) — UE-CAP-000063 | Apache-2.0 | Policy-driven semantic selection/fusion of models across local, private and cloud compute | Routing quality and privacy constraints must be independently calibrated |
| [SGLang](https://github.com/sgl-project/sglang) — UE-CAP-000064 | Apache-2.0 | High-performance serving for language, vision-language and diffusion models; agentic workloads | GPU/hardware and workload-dependent; compare with vLLM, not against different hardware |
| [GroundingPI](https://github.com/groundingpi/GroundingPI) — research reference only | MIT code, but third-party components and model/data terms vary; weights/data not distributed by project | Physical-intelligence-oriented grounding, spatial primitives and GUI/robotics perception | Do not treat code licence as permission to use all weights/data; not added as a deployable free-model candidate |

### Architectural conclusions

1. **Keep provider gateway and semantic router separate.** LiteLLM-style compatibility, credentials, budgets and provider failover are one concern; vLLM Semantic Router's model/compute choice is a higher-level decision concern.
2. **Inference engines are backends, not the architecture.** vLLM, SGLang, llama.cpp and edge runtimes must be exposed behind stable model-serving contracts.
3. **Memory is not one database.** Combine typed memory semantics, source provenance, temporal validity, conflict resolution and deletion guarantees with replaceable graph/vector stores.
4. **VISION is a tool-using perception system.** It should preserve raw frames, crops, OCR, bounding boxes, masks, depth maps, tracks, coordinate transforms and source evidence as addressable objects across multiple reasoning steps.
5. **OpenVLHarness is particularly valuable as an integration pattern.** Its central lesson is that visual reasoning improves when the model can call specialist perception tools and retain their structured outputs, rather than forcing one VLM to do everything in one pass.
6. **Do not treat project-reported aggregate benchmark improvements as proof.** Reproduce on fixed workloads, with multiple trials, independent scoring and published raw results.

## Deep dive 3 — Isolation, independent verification and continuous evolution

### Strong candidates

| Candidate | Licence evidence | Best contribution | Critical caveat |
|---|---|---|---|
| [Inspect AI](https://github.com/UKGovernmentBEIS/inspect_ai) — UE-CAP-000065 | MIT | Extensible evaluation framework for agentic, coding, reasoning, multimodal and safety evaluations; broad prebuilt eval ecosystem | Model-graded scorers are not independent ground truth; use deterministic verifiers and separate reviewers |
| [Harbor](https://github.com/harbor-framework/harbor) — UE-CAP-000066 | Apache-2.0 | Reproducible environments and parallel benchmark harness for arbitrary agents; official Terminal-Bench harness | Current metadata requires Python 3.12+; provider/environment dependencies can introduce cost and reproducibility issues |
| [Tracekit Box](https://github.com/Cygnux-Labs/Tracekit-box) — UE-CAP-000067 | MIT | Firecracker microVM with host-mediated command/network/secret/patch gates and offline-verifiable signed run evidence | v0; no Firecracker jailer, remote signer, snapshots/restore or GPU support; host trust and egress relay limitations |
| [Tarit](https://github.com/instavm/tarit) — UE-CAP-000068 | AGPL-3.0-or-later | KVM microVM execution with checkpoint/restore/fork, warm pools, placement and audit records | Requires x86_64 Linux/KVM; ARM64 guests not yet implemented in inspected documentation; AGPL obligations |
| [Octelium](https://github.com/octelium/octelium) — UE-CAP-000069 | Cluster AGPLv3; client/SDK Apache-2.0 | Identity-aware zero-trust access, secretless L7 credentials, ABAC, MCP/API/AI gateway and OTel audit | Split licence, Kubernetes-based operational footprint and v1 maturity need review |
| [Plasm](https://github.com/PlasmTools/plasm-core) — UE-CAP-000070 | Core dual MIT/Apache-2.0; trace sink BUSL-1.1 | Typed capability graph, wire mappings, validated API calls and capability DAGs | Very early project, tiny contributor footprint, and mixed component licences |

### Additional infrastructure references

- [Firecracker](https://github.com/firecracker-microvm/firecracker) remains an Apache-2.0 low-level microVM foundation, not a complete agent policy or evidence system.
- [kosa8 research report](https://www.kosa8.com/research/kosa8-research-paper) presents a useful threat-model and evidence framework for microVM agent isolation. Its performance and comparative claims are vendor-authored and require independent reproduction.
- The [Awesome Agent Infrastructure index](https://github.com/shenli/awesome-agent-infra) and [Backblaze Agent Infrastructure catalogue](https://github.com/backblaze-labs/awesome-agent-infrastructure) are discovery maps, not certification sources.

### Architectural conclusions

1. **Separate containment, mediation and proof.** A VM or sandbox contains; host-side identity/policy gates mediate; signed evidence records what crossed each boundary. None alone is sufficient.
2. **Keep credentials outside untrusted workloads.** Use workload identity and host-side secret brokering; inject narrowly scoped credentials only at approved egress points.
3. **Default deny network egress.** Resolve and validate destinations outside the sandbox, block private/link-local/cloud metadata paths, prevent DNS rebinding, and test relay/proxy abuse.
4. **Use offline-verifiable execution evidence.** Bind task ID, workload identity, policy version, approvals, commands, network decisions, secret-use events, artifacts and final patch hashes into a signed evidence bundle.
5. **Use Inspect and Harbor as complementary evaluators.** Inspect provides extensible evaluation/scoring; Harbor provides benchmark environments and agent execution at scale. Independent deterministic verifiers must validate critical outcomes.
6. **Continuous evolution is a governed pipeline.** Discover → provenance/licence → SBOM/security → compatibility → isolated test → benchmark → independent approval → staged rollout → rollback-ready monitoring. Never auto-upgrade the production Engine solely because a newer release exists.

## Cross-cutting architecture upgrade

The strongest combined design emerging from these searches is:

- **Capability Registry:** Apicurio-style versioned artifacts plus the Engine's own capability ontology, lifecycle, dependencies, policy declarations and evidence links.
- **Identity:** SPIFFE/SPIRE workload identity, with distinct human principals and agent/workload identities.
- **Authorization:** OpenFGA relationship model plus one canonical policy evaluator (OPA or Cedar), enforced at each tool, data, network, file and deployment boundary.
- **Workflow:** one durable workflow authority, selected by reproducible comparison of Temporal, Restate, Cadence, Conductor and Kestra.
- **Model gateway:** provider compatibility and secrets/budgets in one layer; semantic routing and inference serving in separate replaceable layers.
- **Memory:** typed memory lifecycle plus graph/vector/temporal retrieval, with Cognee as a candidate implementation.
- **VISION:** specialist visual tool chain and persistent multimodal evidence, with OpenVLHarness as a candidate integration pattern.
- **Execution:** microVM/container/WASM backends under a common isolation contract; Tracekit Box and Tarit are candidates for evaluation, not trusted defaults.
- **Verification:** Inspect AI + Harbor + deterministic task-specific oracles + independent security review.
- **Evolution:** registry-driven discovery, provenance, supply-chain checks, compatibility tests, regression benchmarks and reversible rollout.

## Important exclusions and maturity decisions

- Plasm: keep in discovery/research due to early maturity and a BUSL component.
- Tracekit Box: promising evidence architecture, but v0 limitations prevent treating it as a production security boundary.
- Tarit: promising KVM execution option, but AGPL and platform limits need explicit review.
- Octelium: technically broad but mixed licence and deployment complexity must be assessed.
- GroundingPI: code is MIT, but model weights/data are not freely bundled and retain separate terms; therefore not a clean free-model recommendation.
- OpenVLHarness: high-value architecture pattern, but project-reported benchmarks and third-party tool/model terms must be independently checked.

## Acceptance tests required before implementation selection

- Registry: schema compatibility, signed provenance, duplicate detection, revocation, discovery poisoning, malicious manifest and dependency-cycle tests.
- Identity/authorization: spoofed workload, expired identity, confused deputy, privilege escalation, delegation attenuation, policy conflict and revocation latency tests.
- Workflow: process crash, network partition, duplicate event, retry, replay, cancellation, compensation, schema migration and approval-resume tests.
- Model routing: quality/latency/cost Pareto, privacy/location constraints, provider outage, malicious model metadata and fallback loops.
- Memory: temporal correctness, contradictory facts, source traceability, deletion propagation, stale recall and poisoned memory tests.
- VISION: OCR, grounding, false-positive rejection, masks, object identity continuity, depth uncertainty, coordinate transforms, temporal ordering, screen prompt injection and camera consent.
- Isolation: filesystem/process escape, egress bypass, metadata access, DNS rebinding, secret exfiltration, signer tampering, resource exhaustion and teardown residue.
- Evaluation: benchmark leakage, judge bias, test tampering, reproducibility, independent scoring and adversarial robustness.
- Evolution: malicious update, compromised maintainer, dependency takeover, licence change, API break, regression, canary failure and rollback.

## Research evidence and source quality

Primary-source material reviewed includes official repositories, licences, project documentation and research papers. Particularly useful source links:

- [Apicurio AI registry](https://www.apicur.io/registry/ai/)
- [OpenFGA](https://github.com/openfga/openfga)
- [SPIRE](https://github.com/spiffe/spire)
- [Cedar](https://github.com/cedar-policy/cedar)
- [Cadence](https://github.com/cadence-workflow/cadence)
- [Kestra](https://github.com/kestra-io/kestra)
- [Cognee](https://github.com/topoteretes/cognee)
- [OpenVLHarness](https://github.com/uclanlp/OpenVLHarness)
- [vLLM Semantic Router](https://github.com/vllm-project/semantic-router)
- [SGLang](https://github.com/sgl-project/sglang)
- [Inspect AI](https://github.com/UKGovernmentBEIS/inspect_ai)
- [Harbor](https://github.com/harbor-framework/harbor)
- [Tracekit Box paper](https://arxiv.org/abs/2610.38458v1)
- [Tarit](https://github.com/instavm/tarit)
- [Octelium](https://github.com/octelium/octelium)
- [Plasm](https://github.com/PlasmTools/plasm-core)

Search indexes and curated catalogues were used for discovery only; project README claims, benchmark scores, stars and vendor-authored comparisons are not treated as independent verification.

## Decision

Sixteen additional candidates have been added to the catalogue as Discovered. All evaluation scores remain null, all benchmark statuses remain Not run, and every approval flag remains false. The next step is not to install everything: it is to build the common acceptance harness and run a controlled comparison against the existing 54 candidates and the 16 new candidates.
