import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCapabilityPolicy } from "../src/lib/allsparxPrime/capability-policy.mjs";

const validManifest = {
  permissions: { capabilities: ["read:declared-input", "write:declared-output"], network_destinations: [] },
  verification: { status: "passed" },
  license: { review_status: "approved" },
  security_review: { status: "approved", risk_tier: "low" },
  data_handling: { secret_access: false },
  package: { digest: "sha256:" + "a".repeat(64) },
};

test("allows a verified, reviewed least-privilege manifest", () => {
  const result = evaluateCapabilityPolicy(validManifest);
  assert.equal(result.allowed, true);
  assert.equal(result.decision, "allowed");
  assert.equal(result.reason, "POLICY_REQUIREMENTS_SATISFIED");
});

test("denies missing manifests and missing review evidence", () => {
  assert.equal(evaluateCapabilityPolicy(null).reason, "MANIFEST_INVALID");
  assert.equal(evaluateCapabilityPolicy({ ...validManifest, verification: { status: "not-run" } }).reason, "VERIFICATION_NOT_PASSED");
  assert.equal(evaluateCapabilityPolicy({ ...validManifest, license: {} }).reason, "LICENSE_NOT_APPROVED");
  assert.equal(evaluateCapabilityPolicy({ ...validManifest, security_review: { status: "pending" } }).reason, "SECURITY_REVIEW_NOT_APPROVED");
});

test("denies elevated permissions unless explicitly allowlisted", () => {
  const manifest = {
    ...validManifest,
    permissions: { capabilities: ["read:declared-input", "credentials:read"], network_destinations: [] },
  };
  assert.equal(evaluateCapabilityPolicy(manifest).reason, "PERMISSION_NOT_ALLOWED");
});

test("requires reviewer, approval reference and timestamp for elevated permissions", () => {
  const manifest = {
    ...validManifest,
    permissions: { capabilities: ["read:declared-input", "network:outbound"], network_destinations: ["https://api.example.test"] },
    security_review: { status: "approved", risk_tier: "high" },
  };
  const policy = {
    allowed_permissions: ["network:outbound"],
    allowed_network_destinations: ["https://api.example.test"],
  };
  assert.equal(evaluateCapabilityPolicy(manifest, policy).reason, "ELEVATED_PERMISSION_APPROVAL_EVIDENCE_MISSING");
  manifest.security_review = {
    status: "approved",
    risk_tier: "high",
    reviewer: "security-reviewer",
    approval_reference: "SEC-123",
    reviewed_at: "2026-10-30T03:00:00.000Z",
  };
  assert.equal(evaluateCapabilityPolicy(manifest, policy).allowed, true);
});

test("denies network destinations not on the exact HTTPS allowlist", () => {
  const manifest = {
    ...validManifest,
    permissions: { capabilities: ["read:declared-input"], network_destinations: ["https://untrusted.example.test"] },
  };
  assert.equal(evaluateCapabilityPolicy(manifest).reason, "NETWORK_DESTINATION_NOT_ALLOWLISTED");
});

test("denies wildcard, unknown permissions, duplicate grants and secret access", () => {
  const wildcard = { ...validManifest, permissions: { capabilities: ["*"], network_destinations: [] } };
  assert.equal(evaluateCapabilityPolicy(wildcard).reason, "UNKNOWN_PERMISSION");
  const duplicate = { ...validManifest, permissions: { capabilities: ["read:declared-input", "read:declared-input"], network_destinations: [] } };
  assert.equal(evaluateCapabilityPolicy(duplicate).reason, "DUPLICATE_PERMISSION_OR_DESTINATION");
  assert.equal(evaluateCapabilityPolicy({ ...validManifest, data_handling: { secret_access: true } }).reason, "SECRET_ACCESS_NOT_EXPLICITLY_DISABLED");
});

test("rejects invalid package integrity metadata", () => {
  assert.equal(evaluateCapabilityPolicy({ ...validManifest, package: { digest: "sha256:bad" } }).reason, "PACKAGE_DIGEST_INVALID");
});
