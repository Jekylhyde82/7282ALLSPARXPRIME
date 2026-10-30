import test from "node:test";
import assert from "node:assert/strict";
import { evaluateEvidenceClaim } from "../src/agents/verification-agent.mjs";

const commit = { source: "github:commit:abc123", kind: "commit", result: "success", trustworthy: true };
const workflow = { source: "github:actions:run-42", kind: "workflow", result: "success", trustworthy: true };
const independent = {
  source: "review:report-7", kind: "independent_review", result: "success",
  trustworthy: true, independent: true, durable: true, safetyPassed: true,
};

test("accepts a planned claim when its intended outcome is explicit", () => {
  assert.equal(evaluateEvidenceClaim({
    status: "PLANNED", intendedOutcome: "Add a verification agent", evidence: [],
  }).status, "PLANNED");
});

test("accepts IMPLEMENTED only with trustworthy implementation evidence", () => {
  assert.equal(evaluateEvidenceClaim({
    status: "IMPLEMENTED", intendedOutcome: "Add a module", evidence: [commit],
  }).status, "IMPLEMENTED");
});

test("rejects IMPLEMENTED when there is no commit or installation evidence", () => {
  const result = evaluateEvidenceClaim({
    status: "IMPLEMENTED", intendedOutcome: "Add a module", evidence: [workflow],
  });
  assert.equal(result.accepted, false);
  assert.equal(result.status, "UNVERIFIED");
});

test("accepts TESTED only with a successful trustworthy test or workflow", () => {
  assert.equal(evaluateEvidenceClaim({
    status: "TESTED", intendedOutcome: "Run the checks", evidence: [workflow],
  }).status, "TESTED");
});

test("does not confuse passing CI with independent VERIFIED status", () => {
  const result = evaluateEvidenceClaim({
    status: "VERIFIED", intendedOutcome: "Prove production readiness",
    evidence: [commit, workflow],
  });
  assert.equal(result.accepted, false);
  assert.equal(result.status, "UNVERIFIED");
  assert.ok(result.reasons.includes("independent_durable_safety_verification_missing"));
});

test("requires independent review, durability, safety and test evidence for VERIFIED", () => {
  const result = evaluateEvidenceClaim({
    status: "VERIFIED", intendedOutcome: "Verify the tested implementation",
    evidence: [commit, workflow, independent],
  });
  assert.equal(result.accepted, true);
  assert.equal(result.status, "VERIFIED");
});

test("rejects untrusted, failed, or source-less evidence", () => {
  const result = evaluateEvidenceClaim({
    status: "TESTED", intendedOutcome: "Test a build",
    evidence: [
      { source: "ci", kind: "workflow", result: "success", trustworthy: false },
      { source: "ci", kind: "workflow", result: "failure", trustworthy: true },
      { kind: "workflow", result: "success", trustworthy: true },
    ],
  });
  assert.equal(result.accepted, false);
  assert.equal(result.status, "UNVERIFIED");
});

test("rejects unknown statuses and missing intended outcomes", () => {
  assert.equal(evaluateEvidenceClaim({ status: "DONE", intendedOutcome: "x", evidence: [commit] }).status, "UNVERIFIED");
  assert.equal(evaluateEvidenceClaim({ status: "IMPLEMENTED", evidence: [commit] }).status, "UNVERIFIED");
});

test("does not mutate supplied evidence", () => {
  const evidence = [commit, workflow, independent];
  const before = structuredClone(evidence);
  evaluateEvidenceClaim({ status: "VERIFIED", intendedOutcome: "Check immutability", evidence });
  assert.deepEqual(evidence, before);
});
