const IDENTITY_DEFINITIONS = [
  ["EB9 PRIME", "Contextual memory, continuity, decision history, knowledge lineage and recovery of working state."],
  ["OMNI GENIUS", "Reasoning, synthesis, problem-solving and specialist coordination."],
  ["OMNI BRAINSTORM", "Divergent exploration, creative ideation, alternatives and scenario generation."],
  ["OMNI CRITIC", "Independent challenge, adversarial analysis, contradiction and evidence appraisal."],
  ["OMNI ENGINEER", "Requirements, architecture, design, construction, integration, testing and repair."],
  ["OMNIVELOCITY PRIME", "Responsiveness, prioritisation, throughput, efficiency and resource-aware optimisation."],
  ["OMNIGENESIS PRIME", "Creation, identity continuity, provenance and controlled capability formation."],
  ["OMNIEVOLUTION PRIME", "Discovery, adaptation, improvement and governed capability evolution."],
  ["AFI PRIME", "Adaptive intelligence fusion, compatibility evaluation and preservation of provenance and dissent."],
];

export const AFI_OM_CONTRACT_VERSION = "1.0.0";
export const OMNI_IDENTITIES = Object.freeze(
  IDENTITY_DEFINITIONS.map(([identity, responsibility]) =>
    Object.freeze({ identity, responsibility }),
  ),
);

const IDENTITY_SET = new Set(OMNI_IDENTITIES.map(({ identity }) => identity));
const PACKET_KEYS = new Set(["task_id", "objective", "contributions", "required_identities"]);
const CONTRIBUTION_KEYS = new Set([
  "contribution_id", "identity", "source_ref", "summary", "confidence", "claims",
]);
const CLAIM_KEYS = new Set(["claim_id", "topic", "position", "statement", "evidence_refs"]);
const SYNTHESIS_KEYS = new Set([
  "summary", "conclusions", "unresolved_disagreements", "decision",
]);
const CONCLUSION_KEYS = new Set(["statement", "supporting_contribution_ids", "evidence_refs"]);

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError(label + " must be a plain object.");
  }
}

function assertOnlyKeys(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new TypeError(label + " contains unsupported fields: " + unknown.join(", "));
}

function requireText(value, label, max = 4000) {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new TypeError(label + " must be a non-empty string within its length limit.");
  }
  return value.trim();
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function normalizeClaim(claim, index) {
  assertPlainObject(claim, "Claim " + index);
  assertOnlyKeys(claim, CLAIM_KEYS, "Claim " + index);
  const evidenceRefs = claim.evidence_refs ?? [];
  if (!Array.isArray(evidenceRefs) || evidenceRefs.length > 100 ||
      evidenceRefs.some((ref) => typeof ref !== "string" || !ref.trim())) {
    throw new TypeError("Claim evidence_refs must be an array of non-empty references.");
  }
  return {
    claim_id: requireText(claim.claim_id, "claim_id", 160),
    topic: requireText(claim.topic, "claim topic", 240).toLowerCase(),
    position: requireText(claim.position, "claim position", 240).toLowerCase(),
    statement: requireText(claim.statement, "claim statement", 4000),
    evidence_refs: [...new Set(evidenceRefs.map((ref) => ref.trim()))],
  };
}

function normalizeContribution(contribution, index) {
  assertPlainObject(contribution, "Contribution " + index);
  assertOnlyKeys(contribution, CONTRIBUTION_KEYS, "Contribution " + index);
  if (!IDENTITY_SET.has(contribution.identity)) {
    throw new TypeError("Contribution identity is not one of the nine canonical 9 FOLD OMNI identities.");
  }
  if (typeof contribution.confidence !== "number" ||
      !Number.isFinite(contribution.confidence) ||
      contribution.confidence < 0 || contribution.confidence > 1) {
    throw new TypeError("Contribution confidence must be a finite number between 0 and 1.");
  }
  const claims = contribution.claims ?? [];
  if (!Array.isArray(claims) || claims.length > 100) {
    throw new TypeError("Contribution claims must be an array containing at most 100 claims.");
  }
  return {
    contribution_id: requireText(contribution.contribution_id, "contribution_id", 160),
    identity: contribution.identity,
    source_ref: requireText(contribution.source_ref, "source_ref", 1000),
    summary: requireText(contribution.summary, "contribution summary", 8000),
    confidence: contribution.confidence,
    claims: claims.map(normalizeClaim),
  };
}

function findDisagreements(contributions) {
  const topics = new Map();
  for (const contribution of contributions) {
    for (const claim of contribution.claims) {
      if (!topics.has(claim.topic)) topics.set(claim.topic, new Map());
      const positions = topics.get(claim.topic);
      if (!positions.has(claim.position)) positions.set(claim.position, []);
      positions.get(claim.position).push({
        contribution_id: contribution.contribution_id,
        identity: contribution.identity,
        statement: claim.statement,
        evidence_refs: [...claim.evidence_refs],
      });
    }
  }

  return [...topics.entries()]
    .filter(([, positions]) => positions.size > 1)
    .map(([topic, positions]) => ({
      topic,
      positions: [...positions.entries()].map(([position, entries]) => ({
        position,
        contributions: entries,
      })),
    }));
}

export function buildAfiOmFusionPacket(input) {
  assertPlainObject(input, "AFI OM input");
  assertOnlyKeys(input, PACKET_KEYS, "AFI OM input");

  const taskId = requireText(input.task_id, "task_id", 200);
  const objective = requireText(input.objective, "objective", 4000);
  if (!Array.isArray(input.contributions) ||
      input.contributions.length < 1 || input.contributions.length > 81) {
    throw new TypeError("contributions must contain between 1 and 81 specialist contributions.");
  }

  const contributions = input.contributions.map(normalizeContribution);
  const contributionIds = contributions.map(({ contribution_id }) => contribution_id);
  if (new Set(contributionIds).size !== contributionIds.length) {
    throw new TypeError("contribution_id values must be unique within a fusion packet.");
  }

  const requiredIdentities = input.required_identities ?? OMNI_IDENTITIES.map(({ identity }) => identity);
  if (!Array.isArray(requiredIdentities) || requiredIdentities.length > 9 ||
      requiredIdentities.some((identity) => !IDENTITY_SET.has(identity)) ||
      new Set(requiredIdentities).size !== requiredIdentities.length) {
    throw new TypeError("required_identities must contain unique canonical identities.");
  }

  const presentIdentities = [...new Set(contributions.map(({ identity }) => identity))];
  const missingIdentities = requiredIdentities.filter((identity) => !presentIdentities.includes(identity));

  return deepFreeze({
    contract: "afi-om-fusion-packet",
    contract_version: AFI_OM_CONTRACT_VERSION,
    task_id: taskId,
    objective,
    contributions,
    coverage: {
      required_identities: [...requiredIdentities],
      present_identities: presentIdentities,
      missing_identities: missingIdentities,
      complete: missingIdentities.length === 0,
    },
    disagreements: findDisagreements(contributions),
    authority: "ADVISORY_ONLY",
    execution_authorized: false,
    approval_authorized: false,
    verification_state: "NOT_VERIFIED",
    status: "READY_FOR_SYNTHESIS",
  });
}

export function recordAfiOmSynthesis({ packet, synthesis }) {
  assertPlainObject(packet, "Fusion packet");
  if (packet.contract !== "afi-om-fusion-packet" ||
      packet.contract_version !== AFI_OM_CONTRACT_VERSION ||
      !Array.isArray(packet.contributions)) {
    throw new TypeError("Unsupported or malformed AFI OM fusion packet.");
  }

  assertPlainObject(synthesis, "Synthesis");
  assertOnlyKeys(synthesis, SYNTHESIS_KEYS, "Synthesis");
  const summary = requireText(synthesis.summary, "synthesis summary", 8000);
  if (!["recommendation_only", "requires_review", "no_recommendation"].includes(synthesis.decision)) {
    throw new TypeError("Synthesis decision must remain advisory.");
  }

  const knownContributionIds = new Set(packet.contributions.map(({ contribution_id }) => contribution_id));
  const knownEvidenceRefs = new Set();
  for (const contribution of packet.contributions) {
    for (const claim of contribution.claims ?? []) {
      for (const ref of claim.evidence_refs ?? []) knownEvidenceRefs.add(ref);
    }
  }

  const conclusions = synthesis.conclusions ?? [];
  if (!Array.isArray(conclusions) || conclusions.length > 100) {
    throw new TypeError("Synthesis conclusions must be an array containing at most 100 items.");
  }
  const normalizedConclusions = conclusions.map((conclusion, index) => {
    assertPlainObject(conclusion, "Conclusion " + index);
    assertOnlyKeys(conclusion, CONCLUSION_KEYS, "Conclusion " + index);
    const supportingIds = conclusion.supporting_contribution_ids;
    const evidenceRefs = conclusion.evidence_refs ?? [];
    if (!Array.isArray(supportingIds) || supportingIds.length < 1 ||
        supportingIds.some((id) => !knownContributionIds.has(id))) {
      throw new TypeError("Every conclusion must reference known supporting contributions.");
    }
    if (!Array.isArray(evidenceRefs) ||
        evidenceRefs.some((ref) => typeof ref !== "string" || !knownEvidenceRefs.has(ref))) {
      throw new TypeError("Conclusion evidence_refs must reference evidence present in the fusion packet.");
    }
    return {
      statement: requireText(conclusion.statement, "conclusion statement", 4000),
      supporting_contribution_ids: [...new Set(supportingIds)],
      evidence_refs: [...new Set(evidenceRefs)],
    };
  });

  const disagreementTopics = new Set((packet.disagreements ?? []).map(({ topic }) => topic));
  const unresolved = synthesis.unresolved_disagreements ?? [];
  if (!Array.isArray(unresolved) ||
      unresolved.some((topic) => typeof topic !== "string" || !disagreementTopics.has(topic))) {
    throw new TypeError("Unresolved disagreements must reference topics surfaced by the fusion packet.");
  }

  return deepFreeze({
    contract: "afi-om-synthesis-record",
    contract_version: AFI_OM_CONTRACT_VERSION,
    task_id: packet.task_id,
    summary,
    conclusions: normalizedConclusions,
    unresolved_disagreements: [...new Set(unresolved)],
    decision: synthesis.decision,
    authority: "ADVISORY_ONLY",
    execution_authorized: false,
    approval_authorized: false,
    verification_state: "NOT_VERIFIED",
    status: "SYNTHESIS_RECORDED",
  });
}
