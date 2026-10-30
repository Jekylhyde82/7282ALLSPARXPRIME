const STATUSES = ["PLANNED", "IMPLEMENTED", "INSTALLED", "TESTED", "VERIFIED"];

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Deterministic, read-only evidence gate for ALLSPARX PRIME status claims.
 * This module evaluates supplied evidence; it does not execute tests or
 * independently fetch evidence sources.
 */
export function evaluateEvidenceClaim(claim) {
  const reasons = [];
  if (!isRecord(claim)) {
    return { accepted: false, status: "UNVERIFIED", reasons: ["claim_must_be_an_object"] };
  }

  const requested = typeof claim.status === "string" ? claim.status.toUpperCase() : "";
  if (!STATUSES.includes(requested)) {
    return { accepted: false, status: "UNVERIFIED", reasons: ["unsupported_status"] };
  }
  if (typeof claim.intendedOutcome !== "string" || !claim.intendedOutcome.trim()) {
    reasons.push("intended_outcome_missing");
  }
  if (!Array.isArray(claim.evidence) || claim.evidence.length === 0) {
    reasons.push("evidence_missing");
  }

  const evidence = Array.isArray(claim.evidence) ? claim.evidence : [];
  const validEvidence = evidence.filter((item) =>
    isRecord(item) &&
    typeof item.source === "string" && item.source.trim() &&
    typeof item.kind === "string" && item.kind.trim() &&
    item.result === "success" &&
    item.trustworthy === true
  );

  if (validEvidence.length === 0) reasons.push("no_trustworthy_success_evidence");

  const tested = validEvidence.some((item) =>
    ["test", "workflow", "smoke_test"].includes(item.kind)
  );
  const implemented = validEvidence.some((item) =>
    ["commit", "deployment", "installation"].includes(item.kind)
  );
  const verified = validEvidence.some((item) =>
    item.independent === true &&
    item.durable === true &&
    item.safetyPassed === true &&
    ["independent_review", "live_smoke_test", "verification_report"].includes(item.kind)
  );

  const requirements = {
    PLANNED: true,
    IMPLEMENTED: implemented,
    INSTALLED: validEvidence.some((item) => item.kind === "installation"),
    TESTED: tested,
    VERIFIED: verified && tested && implemented,
  };

  if (!requirements[requested]) {
    reasons.push("evidence_does_not_support_requested_status");
  }
  if (requested === "VERIFIED" && !verified) {
    reasons.push("independent_durable_safety_verification_missing");
  }

  const accepted = reasons.length === 0;
  return {
    accepted,
    status: accepted ? requested : "UNVERIFIED",
    reasons,
    evidenceCount: validEvidence.length,
    checks: { implemented, tested, verified },
  };
}

export const EVIDENCE_STATUSES = Object.freeze([...STATUSES]);
