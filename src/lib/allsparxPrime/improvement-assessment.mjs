const DIGEST = /^sha256:[a-f0-9]{64}$/;
const ALLOWED_RISK = new Set(["low", "medium", "high", "critical"]);

function hold(reason, details = {}) {
  return Object.freeze({ decision: "hold", assimilate: false, reason, ...details });
}

function reject(reason, details = {}) {
  return Object.freeze({ decision: "reject", assimilate: false, reason, ...details });
}

function isDigest(value) { return typeof value === "string" && DIGEST.test(value); }

/** Deterministic evidence gate. It assesses improvement claims; it never executes candidate code. */
export function assessImprovementCandidate(candidate, policy = {}) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return reject("CANDIDATE_INVALID");
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) return reject("POLICY_INVALID");
  const source = candidate.source ?? {};
  if (source.authorized !== true) return hold("SOURCE_NOT_AUTHORIZED");
  if (source.provenance_verified !== true) return hold("PROVENANCE_NOT_VERIFIED");
  if (source.license_status !== "approved" || typeof source.license_expression !== "string" || !source.license_expression.trim()) return hold("LICENSE_NOT_APPROVED");
  const evidence = candidate.evidence ?? {};
  if (typeof evidence.baseline_id !== "string" || !evidence.baseline_id.trim() || !isDigest(evidence.baseline_digest) || !isDigest(evidence.candidate_digest)) return hold("BASELINE_OR_CANDIDATE_DIGEST_MISSING");
  if (evidence.compatibility !== "passed") return hold("COMPATIBILITY_NOT_PASSED");
  if (evidence.tests !== "passed") return hold("TESTS_NOT_PASSED");
  if (evidence.independent_review !== "passed") return hold("INDEPENDENT_REVIEW_NOT_PASSED");
  if (!Number.isFinite(evidence.measured_benefit_percent) || !Number.isFinite(evidence.regression_percent) || !Number.isFinite(evidence.duplication_score)) return hold("MEASUREMENT_EVIDENCE_INCOMPLETE");
  if (evidence.measured_benefit_percent <= 0) return reject("NO_MEASURED_BENEFIT");
  if (evidence.regression_percent > (policy.max_regression_percent ?? 0)) return reject("REGRESSION_EXCEEDS_POLICY");
  if (evidence.duplication_score > (policy.max_duplication_score ?? 0.1)) return reject("DUPLICATION_EXCEEDS_POLICY");
  const change = candidate.change ?? {};
  const risk = change.risk_tier;
  if (!ALLOWED_RISK.has(risk)) return hold("RISK_TIER_UNKNOWN");
  if (change.security_boundary_change === true || change.permission_elevation === true || change.destructive === true || change.data_migration === true || change.production_deployment === true || risk !== "low") return hold("HUMAN_REVIEW_REQUIRED", { risk_tier: risk });
  if (change.rollback_tested !== true) return hold("ROLLBACK_NOT_VERIFIED");
  if (policy.auto_integrate_enabled !== true) return hold("AUTO_INTEGRATION_NOT_ENABLED");
  if (policy.approved_policy_digest && !isDigest(policy.approved_policy_digest)) return hold("POLICY_DIGEST_INVALID");
  return Object.freeze({
    decision: "assimilate",
    assimilate: true,
    reason: "MEASURED_IMPROVEMENT_PASSED_ALL_GATES",
    measured_benefit_percent: evidence.measured_benefit_percent,
    regression_percent: evidence.regression_percent,
    baseline_digest: evidence.baseline_digest,
    candidate_digest: evidence.candidate_digest,
    license_expression: source.license_expression,
    policy_digest: policy.approved_policy_digest ?? null,
  });
}

