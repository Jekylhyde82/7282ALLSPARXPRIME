import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

function canonicalJson(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  return "{" + Object.keys(value).sort().map((key) => JSON.stringify(key) + ":" + canonicalJson(value[key])).join(",") + "}";
}
function manifestDigest(manifest) {
  return "sha256:" + createHash("sha256").update(canonicalJson(manifest), "utf8").digest("hex");
}
function trustedVerifier(manifest, overrides = {}) {
  const digest = manifestDigest(manifest);
  const evidence = {
    authenticated: true,
    manifest_digest: digest,
    package_digest: manifest.package.digest,
    source_commit: manifest.source.commit,
    policy_version: "capability-policy-1.0.0",
    expires_at: "2999-01-01T00:00:00.000Z",
    revoked: false,
    verification: {
      status: "passed",
      package_digest: manifest.package.digest,
      source_commit: manifest.source.commit,
      suite_id: manifest.verification.suite_id,
      evidence_reference: "ci://trusted-attestation/verification",
    },
    license_review: {
      status: "approved",
      spdx_expression: manifest.license.spdx_expression,
      source_commit: manifest.source.commit,
      reviewer_id: "licence-reviewer-01",
      approval_reference: "LIC-123",
      reviewed_at: "2026-11-01T00:00:00.000Z",
    },
    security_review: {
      status: "approved",
      manifest_digest: digest,
      reviewer_id: "security-reviewer-01",
      approval_reference: "SEC-123",
      reviewed_at: "2026-11-01T00:00:00.000Z",
      approved_permissions: [],
    },
    ...overrides,
  };
  return async (request) => {
    assert.equal(request.manifest_digest, digest);
    assert.equal(request.package_digest, manifest.package.digest);
    return evidence;
  };
}

test("denies manifest-only claims when no trusted evidence verifier is supplied", async () => {
  assert.equal((await evaluateCapabilityPolicy(approvedManifest())).reason, "TRUSTED_EVIDENCE_VERIFIER_REQUIRED");
});

test("allows a schema-valid least-privilege manifest only with separately authenticated, bound evidence", async () => {
  const manifest = approvedManifest();
  const result = await evaluateCapabilityPolicy(manifest, {}, trustedVerifier(manifest));
  assert.equal(result.allowed, true);
  assert.equal(result.decision, "allowed");
  assert.equal(result.reason, "POLICY_REQUIREMENTS_SATISFIED");
  assert.equal(result.human_approval_verified, false);
});

test("denies missing manifests and schema-invalid manifest objects", async () => {
  assert.equal((await evaluateCapabilityPolicy(null)).reason, "MANIFEST_INVALID");
  assert.equal((await evaluateCapabilityPolicy({ permissions: {} })).reason, "MANIFEST_SCHEMA_INVALID");
});

test("denies missing verification, licence and security attestations", async () => {
  const manifest = approvedManifest();
  const missingVerification = await evaluateCapabilityPolicy(manifest, {}, trustedVerifier(manifest, {
    verification: { status: "failed" },
  }));
  assert.equal(missingVerification.reason, "VERIFICATION_ATTESTATION_INVALID");
  const missingLicense = await evaluateCapabilityPolicy(manifest, {}, trustedVerifier(manifest, {
    license_review: { status: "pending" },
  }));
  assert.equal(missingLicense.reason, "LICENSE_ATTESTATION_INVALID");
  const missingSecurity = await evaluateCapabilityPolicy(manifest, {}, trustedVerifier(manifest, {
    security_review: { status: "pending" },
  }));
  assert.equal(missingSecurity.reason, "SECURITY_ATTESTATION_INVALID");
});

test("denies forged, stale, revoked and mismatched trusted evidence", async () => {
  const manifest = approvedManifest();
  assert.equal((await evaluateCapabilityPolicy(manifest, {}, async () => ({ authenticated: false }))).reason,
    "TRUSTED_EVIDENCE_NOT_AUTHENTICATED");
  assert.equal((await evaluateCapabilityPolicy(manifest, {}, trustedVerifier(manifest, {
    manifest_digest: "sha256:" + "d".repeat(64),
  }))).reason, "TRUSTED_EVIDENCE_BINDING_MISMATCH");
  assert.equal((await evaluateCapabilityPolicy(manifest, {}, trustedVerifier(manifest, {
    expires_at: "2000-01-01T00:00:00.000Z",
  }))).reason, "TRUSTED_EVIDENCE_EXPIRED_OR_REVOKED");
  assert.equal((await evaluateCapabilityPolicy(manifest, {}, trustedVerifier(manifest, {
    revoked: true,
  }))).reason, "TRUSTED_EVIDENCE_EXPIRED_OR_REVOKED");
});

test("denies elevated permissions unless local policy and trusted approval both allow them", async () => {
  const manifest = approvedManifest();
  manifest.permissions.capabilities.push("credentials:read");
  const policy = { allowed_permissions: ["credentials:read"] };
  assert.equal((await evaluateCapabilityPolicy(manifest, policy, trustedVerifier(manifest))).reason,
    "ELEVATED_PERMISSION_APPROVAL_NOT_VERIFIED");

  const verifier = trustedVerifier(manifest);
  const original = await verifier({ manifest_digest: manifestDigest(manifest), package_digest: manifest.package.digest });
  original.security_review.approved_permissions = ["credentials:read"];
  const result = await evaluateCapabilityPolicy(manifest, policy, async () => original);
  assert.equal(result.allowed, true);
  assert.equal(result.requires_human_approval, false);
  assert.equal(result.human_approval_verified, true);
});

test("denies network destinations not on the exact HTTPS allowlist", async () => {
  const manifest = approvedManifest();
  manifest.permissions.network_destinations.push("https://untrusted.example.test");
  assert.equal((await evaluateCapabilityPolicy(manifest, {}, trustedVerifier(manifest))).reason,
    "NETWORK_DESTINATION_NOT_ALLOWLISTED");
});

test("denies wildcard, duplicate grants and secret access through schema validation", async () => {
  const wildcard = approvedManifest();
  wildcard.permissions.capabilities = ["*"];
  assert.equal((await evaluateCapabilityPolicy(wildcard, {}, trustedVerifier(wildcard))).reason,
    "MANIFEST_SCHEMA_INVALID");
  const duplicate = approvedManifest();
  duplicate.permissions.capabilities.push("read:declared-input");
  assert.equal((await evaluateCapabilityPolicy(duplicate, {}, trustedVerifier(duplicate))).reason,
    "MANIFEST_SCHEMA_INVALID");
  const secret = approvedManifest();
  secret.data_handling.secret_access = true;
  assert.equal((await evaluateCapabilityPolicy(secret, {}, trustedVerifier(secret))).reason,
    "MANIFEST_SCHEMA_INVALID");
});

test("rejects invalid package integrity metadata", async () => {
  const manifest = approvedManifest();
  manifest.package.digest = "sha256:bad";
  assert.equal((await evaluateCapabilityPolicy(manifest, {}, trustedVerifier(manifest))).reason,
    "MANIFEST_SCHEMA_INVALID");
});
