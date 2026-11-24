import test from "node:test";
import assert from "node:assert/strict";
import { assessImprovementCandidate } from "../src/lib/allsparxPrime/improvement-assessment.mjs";

const digest = "sha256:" + "a".repeat(64);
function candidate(overrides = {}) {
  return {
    source: { authorized: true, provenance_verified: true, license_status: "approved", license_expression: "MIT" },
    evidence: { baseline_id: "baseline-2026-10-30", baseline_digest: digest, candidate_digest: "sha256:" + "b".repeat(64), compatibility: "passed", tests: "passed", independent_review: "passed", measured_benefit_percent: 12, regression_percent: 0, duplication_score: 0.02 },
    change: { risk_tier: "low", rollback_tested: true },
    ...overrides,
  };
}
const enabled = { auto_integrate_enabled: true, max_regression_percent: 0, max_duplication_score: 0.1, approved_policy_digest: digest };

test("assimilates a measured, low-risk improvement only when every gate passes", () => {
  const result = assessImprovementCandidate(candidate(), enabled);
  assert.equal(result.decision, "assimilate");
  assert.equal(result.assimilate, true);
  assert.equal(result.measured_benefit_percent, 12);
});

test("holds candidates from sources that are not authorized", () => {
  assert.equal(assessImprovementCandidate(candidate({ source: { authorized: false } }), enabled).reason, "SOURCE_NOT_AUTHORIZED");
});

test("holds candidates with unverified provenance or licence", () => {
  assert.equal(assessImprovementCandidate(candidate({ source: { authorized: true, provenance_verified: false } }), enabled).reason, "PROVENANCE_NOT_VERIFIED");
  assert.equal(assessImprovementCandidate(candidate({ source: { authorized: true, provenance_verified: true, license_status: "unknown" } }), enabled).reason, "LICENSE_NOT_APPROVED");
});

test("rejects candidates that show no measured benefit or exceed regression policy", () => {
  assert.equal(assessImprovementCandidate(candidate({ evidence: { ...candidate().evidence, measured_benefit_percent: 0 } }), enabled).reason, "NO_MEASURED_BENEFIT");
  assert.equal(assessImprovementCandidate(candidate({ evidence: { ...candidate().evidence, regression_percent: 1 } }), enabled).reason, "REGRESSION_EXCEEDS_POLICY");
});

test("holds candidates when tests, compatibility, or independent review are incomplete", () => {
  assert.equal(assessImprovementCandidate(candidate({ evidence: { ...candidate().evidence, tests: "failed" } }), enabled).reason, "TESTS_NOT_PASSED");
  assert.equal(assessImprovementCandidate(candidate({ evidence: { ...candidate().evidence, compatibility: "unknown" } }), enabled).reason, "COMPATIBILITY_NOT_PASSED");
  assert.equal(assessImprovementCandidate(candidate({ evidence: { ...candidate().evidence, independent_review: "pending" } }), enabled).reason, "INDEPENDENT_REVIEW_NOT_PASSED");
});

test("holds high-risk, privileged, destructive, or unrollbackable changes for human review", () => {
  assert.equal(assessImprovementCandidate(candidate({ change: { risk_tier: "high", rollback_tested: true } }), enabled).reason, "HUMAN_REVIEW_REQUIRED");
  assert.equal(assessImprovementCandidate(candidate({ change: { risk_tier: "low", permission_elevation: true, rollback_tested: true } }), enabled).reason, "HUMAN_REVIEW_REQUIRED");
  assert.equal(assessImprovementCandidate(candidate({ change: { risk_tier: "low", rollback_tested: false } }), enabled).reason, "ROLLBACK_NOT_VERIFIED");
});

test("does not auto-assimilate until an authorized policy enables it", () => {
  assert.equal(assessImprovementCandidate(candidate(), { ...enabled, auto_integrate_enabled: false }).reason, "AUTO_INTEGRATION_NOT_ENABLED");
});

test("rejects redundant candidates above the duplication threshold", () => {
  assert.equal(assessImprovementCandidate(candidate({ evidence: { ...candidate().evidence, duplication_score: 0.5 } }), enabled).reason, "DUPLICATION_EXCEEDS_POLICY");
});
