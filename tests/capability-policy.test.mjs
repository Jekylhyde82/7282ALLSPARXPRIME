import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluateCapabilityPolicy } from "../src/lib/allsparxPrime/capability-policy.mjs";

const example = JSON.parse(await readFile("schemas/examples/capability-manifest.example.json", "utf8"));
function approvedManifest() {
  return {
    ...structuredClone(example),
    license: { ...example.license, review_status: "approved" },
    verification: {
      ...example.verification,
      status: "passed",
      evidence: [{ kind: "unit", reference: "ci://capability-example/unit-tests", result_digest: "sha256:" + "c".repeat(64) }],
    },
    security_review: { status: "approved", risk_tier: "low" },
  };
}

test("allows a schema-valid, verified, reviewed least-privilege manifest", () => {
  const result = evaluateCapabilityPolicy(approvedManifest());
  assert.equal(result.allowed, true);
  assert.equal(result.decision, "allowed");
  assert.equal(result.reason, "POLICY_REQUIREMENTS_SATISFIED");
});

test("denies missing manifests and schema-invalid manifest objects", () => {
  assert.equal(evaluateCapabilityPolicy(null).reason, "MANIFEST_INVALID");
  assert.equal(evaluateCapabilityPolicy({ permissions: {} }).reason, "MANIFEST_SCHEMA_INVALID");
});

test("denies missing verification, licence and security approval", () => {
  const noVerification = approvedManifest();
  noVerification.verification.status = "not-run";
  assert.equal(evaluateCapabilityPolicy(noVerification).reason, "VERIFICATION_NOT_PASSED");
  const noLicense = approvedManifest();
  noLicense.license.review_status = "unknown";
  assert.equal(evaluateCapabilityPolicy(noLicense).reason, "LICENSE_NOT_APPROVED");
  const noSecurity = approvedManifest();
  noSecurity.security_review.status = "pending";
  assert.equal(evaluateCapabilityPolicy(noSecurity).reason, "SECURITY_REVIEW_NOT_APPROVED");
});

test("denies elevated permissions unless explicitly allowlisted", () => {
  const manifest = approvedManifest();
  manifest.permissions.capabilities.push("credentials:read");
  assert.equal(evaluateCapabilityPolicy(manifest).reason, "PERMISSION_NOT_ALLOWED");
});

test("requires reviewer, approval reference and timestamp for elevated permissions", () => {
  const manifest = approvedManifest();
  manifest.permissions.capabilities.push("network:outbound");
  manifest.permissions.network_destinations.push("https://api.example.test");
  const policy = { allowed_permissions: ["network:outbound"], allowed_network_destinations: ["https://api.example.test"] };
  assert.equal(evaluateCapabilityPolicy(manifest, policy).reason, "ELEVATED_PERMISSION_APPROVAL_EVIDENCE_MISSING");
  manifest.security_review = {
    status: "approved", risk_tier: "high", reviewer: "security-reviewer",
    approval_reference: "SEC-123", reviewed_at: "2026-10-30T03:00:00.000Z",
  };
  assert.equal(evaluateCapabilityPolicy(manifest, policy).allowed, true);
});

test("denies network destinations not on the exact HTTPS allowlist", () => {
  const manifest = approvedManifest();
  manifest.permissions.network_destinations.push("https://untrusted.example.test");
  assert.equal(evaluateCapabilityPolicy(manifest).reason, "NETWORK_DESTINATION_NOT_ALLOWLISTED");
});

test("denies wildcard, duplicate grants and secret access through schema validation", () => {
  const wildcard = approvedManifest();
  wildcard.permissions.capabilities = ["*"];
  assert.equal(evaluateCapabilityPolicy(wildcard).reason, "MANIFEST_SCHEMA_INVALID");
  const duplicate = approvedManifest();
  duplicate.permissions.capabilities.push("read:declared-input");
  assert.equal(evaluateCapabilityPolicy(duplicate).reason, "MANIFEST_SCHEMA_INVALID");
  const secret = approvedManifest();
  secret.data_handling.secret_access = true;
  assert.equal(evaluateCapabilityPolicy(secret).reason, "MANIFEST_SCHEMA_INVALID");
});

test("rejects invalid package integrity metadata", () => {
  const manifest = approvedManifest();
  manifest.package.digest = "sha256:bad";
  assert.equal(evaluateCapabilityPolicy(manifest).reason, "MANIFEST_SCHEMA_INVALID");
});
