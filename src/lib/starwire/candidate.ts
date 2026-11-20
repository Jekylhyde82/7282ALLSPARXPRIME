/**
 * STARWIRE candidate evidence, AFI PRIME evaluation and UAIE PRIME gate.
 *
 * Pure policy functions only: no persistence, network access, human approval,
 * acquisition, or register writes occur in this module.
 */

export type CandidateState = "DISCOVERED" | "PROPOSED" | "UNDER_EVALUATION" | "APPROVED" | "REJECTED" | "RETIRED" | "INTEGRATED";
export type VerificationState = "UNVERIFIED" | "VERIFIED" | "CONTRADICTED";
export type EligibilityState = "UNKNOWN" | "CONFIRMED" | "INELIGIBLE";

export interface CandidateEvidence {
  id: string;
  schemaVersion: 2;
  state: CandidateState;
  source: {
    sourceId: string;
    sourceUrl: string;
    retrievedAt: string;
    contentSha256: string;
    termsApproved: boolean;
    /** SPDX identifier or source-published licence label; null means not yet established. */
    sourceLicense: string | null;
    /** Stable ID of the source's own record (e.g. Sourcey offer_id). */
    sourceRecordId: string | null;
    /** Immutable source revision, commit, or version identifier when available. */
    sourceRevision: string | null;
    /** Source release identifier when the upstream publishes releases. */
    sourceReleaseId: string | null;
    /** SHA-256 of the upstream release/artifact when independently supplied. */
    sourceArtifactSha256: string | null;
  };
  /** Original provider/programme URL, distinct from the directory/API record URL. */
  providerUrl: string | null;
  providerName: string;
  programmeName: string;
  advertisedBenefit: {
    claim: string;
    value: number | null;
    unit: string;
    currency: string | null;
  };
  eligibility: {
    status: EligibilityState;
    requirements: string[];
    unknowns: string[];
  };
  restrictions: string[];
  expiryAt: string | null;
  officialVerification: {
    status: VerificationState;
    verifiedAt: string | null;
    evidenceUrls: string[];
  };
  originalIdeaValue: {
    value: string;
    linkedIdeaId: string | null;
  };
}

export interface AfiAssessment {
  candidateId: string;
  assessedAt: string;
  criteria: {
    capabilityRelevance: number;
    practicalUsefulness: number;
    eligibilityConfidence: number;
    attainableEconomicValue: number;
    strategicValue: number;
    integrationEase: number;
    operationalReliability: number;
    evidenceQuality: number;
    freshness: number;
  };
  score: number;
  assumptions: string[];
  risks: string[];
  recommendation: "PRIORITIZE" | "INVESTIGATE" | "DEPRIORITIZE";
  caveat: "DECISION_SUPPORT_ONLY";
}

export interface UaieGateResult {
  candidateId: string;
  decision: "REJECT" | "HOLD" | "ELIGIBLE_FOR_HUMAN_REVIEW";
  reasons: string[];
  humanApprovalRequired: true;
  registerWriteAuthorized: false;
}

const requiredText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const validTimestamp = (value: string): boolean =>
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const validDigest = (value: string): boolean => /^[a-f0-9]{64}$/.test(value);

export function validateCandidate(candidate: CandidateEvidence): string[] {
  const errors: string[] = [];
  if (candidate.schemaVersion !== 2) errors.push("Unsupported candidate schema version.");
  if (!requiredText(candidate.id)) errors.push("Candidate ID is required.");
  if (!requiredText(candidate.source.sourceId)) errors.push("Source ID is required.");
  let sourceUrl: URL | null = null;
  try { sourceUrl = new URL(candidate.source.sourceUrl); } catch { /* validated below */ }
  if (!sourceUrl || sourceUrl.protocol !== "https:" || sourceUrl.username || sourceUrl.password || sourceUrl.hash)
    errors.push("Source URL must be HTTPS and contain no credentials or fragment.");
  if (!validTimestamp(candidate.source.retrievedAt)) errors.push("Source retrieval timestamp must be canonical ISO-8601 UTC.");
  if (!validDigest(candidate.source.contentSha256)) errors.push("Source content SHA-256 digest is invalid.");
  for (const [label, value] of [
    ["Source licence", candidate.source.sourceLicense],
    ["Source record ID", candidate.source.sourceRecordId],
    ["Source revision", candidate.source.sourceRevision],
    ["Source release ID", candidate.source.sourceReleaseId],
  ] as const) {
    if (value !== null && !requiredText(value)) errors.push(`${label} must be non-empty text or null.`);
  }
  if (candidate.source.sourceArtifactSha256 !== null &&
      !validDigest(candidate.source.sourceArtifactSha256))
    errors.push("Source artifact SHA-256 must be null or a valid lowercase SHA-256 digest.");
  if (candidate.providerUrl !== null) {
    try {
      const providerUrl = new URL(candidate.providerUrl);
      if (providerUrl.protocol !== "https:" || providerUrl.username || providerUrl.password || providerUrl.hash)
        errors.push("Provider URL must be HTTPS and contain no credentials or fragment.");
    } catch { errors.push("Provider URL is invalid."); }
  }
  if (!requiredText(candidate.providerName)) errors.push("Provider name is required.");
  if (!requiredText(candidate.programmeName)) errors.push("Programme name is required.");
  if (!requiredText(candidate.advertisedBenefit.claim) || !requiredText(candidate.advertisedBenefit.unit))
    errors.push("Original advertised claim and benefit unit are required.");
  if (candidate.advertisedBenefit.value !== null &&
      (!Number.isFinite(candidate.advertisedBenefit.value) || candidate.advertisedBenefit.value < 0))
    errors.push("Advertised benefit value must be null or a non-negative finite number.");
  if (!Array.isArray(candidate.eligibility.requirements) || !Array.isArray(candidate.eligibility.unknowns))
    errors.push("Eligibility requirements and unknowns must be arrays.");
  if (!Array.isArray(candidate.restrictions)) errors.push("Restrictions must be an array.");
  if (candidate.expiryAt !== null && !validTimestamp(candidate.expiryAt))
    errors.push("Expiry must be null or a canonical ISO-8601 UTC timestamp.");
  if (candidate.officialVerification.verifiedAt !== null && !validTimestamp(candidate.officialVerification.verifiedAt))
    errors.push("Official verification timestamp must be null or a canonical ISO-8601 UTC timestamp.");
  if (!Array.isArray(candidate.officialVerification.evidenceUrls))
    errors.push("Official verification evidence URLs must be an array.");
  for (const evidenceUrl of candidate.officialVerification.evidenceUrls) {
    try {
      const parsed = new URL(evidenceUrl);
      if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hash)
        errors.push("Official evidence URLs must be HTTPS and contain no credentials or fragment.");
    } catch { errors.push("An official evidence URL is invalid."); }
  }
  if (!requiredText(candidate.originalIdeaValue.value))
    errors.push("Original Idea Value is mandatory and must be preserved.");
  return errors;
}

const criterionKeys = [
  "capabilityRelevance", "practicalUsefulness", "eligibilityConfidence",
  "attainableEconomicValue", "strategicValue", "integrationEase",
  "operationalReliability", "evidenceQuality", "freshness",
] as const;

export function evaluateCandidate(
  candidate: CandidateEvidence,
  criteria: AfiAssessment["criteria"],
  assessedAt: string,
  assumptions: string[] = [],
  risks: string[] = [],
): AfiAssessment {
  const errors = validateCandidate(candidate);
  if (errors.length) throw new Error(`Invalid candidate: ${errors.join(" ")}`);
  if (!validTimestamp(assessedAt)) throw new Error("Assessment timestamp must be canonical ISO-8601 UTC.");
  for (const key of criterionKeys) {
    const score = criteria[key];
    if (!Number.isInteger(score) || score < 0 || score > 5)
      throw new Error(`AFI PRIME criterion ${key} must be an integer from 0 to 5.`);
  }
  const score = Number((criterionKeys.reduce((sum, key) => sum + criteria[key], 0) / criterionKeys.length).toFixed(2));
  const blockers = candidate.officialVerification.status !== "VERIFIED" ||
    candidate.eligibility.status !== "CONFIRMED" || !candidate.source.termsApproved;
  const recommendation = blockers ? "INVESTIGATE" :
    score >= 3.8 ? "PRIORITIZE" : score >= 2.5 ? "INVESTIGATE" : "DEPRIORITIZE";
  return {
    candidateId: candidate.id, assessedAt, criteria: { ...criteria }, score,
    assumptions: [...assumptions], risks: [...risks], recommendation,
    caveat: "DECISION_SUPPORT_ONLY",
  };
}

/** UAIE PRIME gate: never approves or authorizes a register write automatically. */
export function evaluateUaieGate(
  candidate: CandidateEvidence,
  assessment: AfiAssessment | null,
): UaieGateResult {
  const reasons = validateCandidate(candidate);
  if (candidate.officialVerification.status === "CONTRADICTED")
    return { candidateId: candidate.id, decision: "REJECT", reasons: [...reasons, "Official-provider evidence contradicts the advertised opportunity."], humanApprovalRequired: true, registerWriteAuthorized: false };
  if (!candidate.source.termsApproved) reasons.push("Source terms/access approval is absent.");
  if (candidate.eligibility.status === "INELIGIBLE") reasons.push("Candidate is explicitly ineligible.");
  if (candidate.officialVerification.status !== "VERIFIED") reasons.push("Official-provider verification is incomplete.");
  if (candidate.eligibility.status !== "CONFIRMED") reasons.push("Eligibility is not confirmed.");
  if (candidate.officialVerification.evidenceUrls.length === 0) reasons.push("Official-provider evidence references are missing.");
  if (!assessment || assessment.candidateId !== candidate.id) reasons.push("A matching AFI PRIME assessment is missing.");
  if (assessment && assessment.recommendation === "DEPRIORITIZE") reasons.push("AFI PRIME recommends deprioritization.");
  if (reasons.length) return {
    candidateId: candidate.id, decision: "HOLD", reasons,
    humanApprovalRequired: true, registerWriteAuthorized: false,
  };
  return {
    candidateId: candidate.id, decision: "ELIGIBLE_FOR_HUMAN_REVIEW",
    reasons: ["Evidence and evaluation gates passed; this is not an approval or acquisition authorization."],
    humanApprovalRequired: true, registerWriteAuthorized: false,
  };
}
