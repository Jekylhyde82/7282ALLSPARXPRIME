import { createHash } from "node:crypto";
import { validateCapabilityManifest } from "./capability-manifest-validator.mjs";

// Deterministic, deny-by-default policy evaluation. This module never executes capability code.
const BASE_ALLOWED_PERMISSIONS = new Set([
  "read:declared-input",
  "write:declared-output",
  "filesystem:read-package",
]);
const ELEVATED_PERMISSIONS = new Set([
  "filesystem:write-workspace",
  "network:outbound",
  "process:spawn",
  "credentials:read",
  "data:export",
  "deployment:production",
]);
const DIGEST = /^sha256:[a-f0-9]{64}$/;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deny(reason, details = {}) {
  return Object.freeze({ allowed: false, decision: "denied", reason, ...details });
}

function canonicalJson(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Manifest contains a non-finite number.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (!isObject(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError("Manifest must contain only plain JSON values.");
  }
  return "{" + Object.keys(value).sort().map((key) =>
    JSON.stringify(key) + ":" + canonicalJson(value[key])
  ).join(",") + "}";
}

function digestManifest(manifest) {
  return "sha256:" + createHash("sha256").update(canonicalJson(manifest), "utf8").digest("hex");
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Evaluate a declarative manifest against local policy and independently verified evidence.
 *
 * verifyEvidence MUST be supplied by the trusted policy boundary. It must authenticate
 * signatures/attestations, check issuer trust and revocation, and return normalized evidence
 * bound to the request. The imported manifest is never accepted as proof of its own review.
 */
export async function evaluateCapabilityPolicy(manifest, policy = {}, verifyEvidence) {
  if (!isObject(manifest)) return deny("MANIFEST_INVALID", { detail: "Manifest must be an object." });
  if (!isObject(policy)) return deny("POLICY_INVALID", { detail: "Policy must be an object." });

  const manifestValidation = validateCapabilityManifest(manifest);
  if (!manifestValidation.valid) {
    return deny("MANIFEST_SCHEMA_INVALID", { errors: manifestValidation.errors });
  }

  const policyVersion = hasText(policy.version) ? policy.version.trim() : "capability-policy-1.0.0";
  const permissions = manifest.permissions?.capabilities;
  const destinations = manifest.permissions?.network_destinations;
  if (!Array.isArray(permissions) || !Array.isArray(destinations)) {
    return deny("PERMISSIONS_MISSING", { policy_version: policyVersion });
  }
  if (new Set(permissions).size !== permissions.length || new Set(destinations).size !== destinations.length) {
    return deny("DUPLICATE_PERMISSION_OR_DESTINATION", { policy_version: policyVersion });
  }
  if (permissions.some((permission) => typeof permission !== "string")) {
    return deny("PERMISSION_INVALID", { policy_version: policyVersion });
  }

  const allowedPermissions = new Set([
    ...BASE_ALLOWED_PERMISSIONS,
    ...(Array.isArray(policy.allowed_permissions) ? policy.allowed_permissions : []),
  ]);
  const unknownPermissions = permissions.filter((permission) =>
    !BASE_ALLOWED_PERMISSIONS.has(permission) && !ELEVATED_PERMISSIONS.has(permission)
  );
  if (unknownPermissions.length) {
    return deny("UNKNOWN_PERMISSION", { policy_version: policyVersion, permissions: unknownPermissions });
  }

  const deniedPermissions = permissions.filter((permission) => !allowedPermissions.has(permission));
  if (deniedPermissions.length) {
    return deny("PERMISSION_NOT_ALLOWED", { policy_version: policyVersion, permissions: deniedPermissions });
  }

  const allowedDestinations = new Set(Array.isArray(policy.allowed_network_destinations)
    ? policy.allowed_network_destinations
    : []);
  const invalidDestinations = destinations.filter((destination) =>
    typeof destination !== "string" || !destination.startsWith("https://")
  );
  if (invalidDestinations.length) {
    return deny("NETWORK_DESTINATION_INVALID", { policy_version: policyVersion });
  }
  const unapprovedDestinations = destinations.filter((destination) => !allowedDestinations.has(destination));
  if (unapprovedDestinations.length) {
    return deny("NETWORK_DESTINATION_NOT_ALLOWLISTED", {
      policy_version: policyVersion,
      destinations: unapprovedDestinations,
    });
  }

  if (manifest.data_handling?.secret_access !== false) {
    return deny("SECRET_ACCESS_NOT_EXPLICITLY_DISABLED", { policy_version: policyVersion });
  }
  if (!manifest.package || !DIGEST.test(manifest.package.digest ?? "")) {
    return deny("PACKAGE_DIGEST_INVALID", { policy_version: policyVersion });
  }
  if (typeof verifyEvidence !== "function") {
    return deny("TRUSTED_EVIDENCE_VERIFIER_REQUIRED", { policy_version: policyVersion });
  }

  let manifestDigest;
  try {
    manifestDigest = digestManifest(manifest);
  } catch {
    return deny("MANIFEST_CANONICALIZATION_FAILED", { policy_version: policyVersion });
  }

  let evidence;
  try {
    evidence = await verifyEvidence(Object.freeze({
      manifest_digest: manifestDigest,
      package_digest: manifest.package.digest,
      source_repository: manifest.source.repository,
      source_commit: manifest.source.commit,
      capability_id: manifest.capability_id,
      capability_version: manifest.version,
      policy_version: policyVersion,
      requested_permissions: Object.freeze([...permissions]),
      network_destinations: Object.freeze([...destinations]),
      license_expression: manifest.license.spdx_expression,
      verification_suite_id: manifest.verification.suite_id,
    }));
  } catch {
    return deny("TRUSTED_EVIDENCE_VERIFICATION_FAILED", { policy_version: policyVersion });
  }

  if (!isObject(evidence) || evidence.authenticated !== true) {
    return deny("TRUSTED_EVIDENCE_NOT_AUTHENTICATED", { policy_version: policyVersion });
  }
  if (evidence.manifest_digest !== manifestDigest ||
      evidence.package_digest !== manifest.package.digest ||
      evidence.source_commit !== manifest.source.commit ||
      evidence.policy_version !== policyVersion) {
    return deny("TRUSTED_EVIDENCE_BINDING_MISMATCH", { policy_version: policyVersion });
  }
  if (!hasText(evidence.expires_at) || !Number.isFinite(Date.parse(evidence.expires_at)) ||
      Date.parse(evidence.expires_at) <= Date.now() || evidence.revoked === true) {
    return deny("TRUSTED_EVIDENCE_EXPIRED_OR_REVOKED", { policy_version: policyVersion });
  }

  const verification = evidence.verification;
  if (verification?.status !== "passed" ||
      verification.package_digest !== manifest.package.digest ||
      verification.source_commit !== manifest.source.commit ||
      verification.suite_id !== manifest.verification.suite_id ||
      !hasText(verification.evidence_reference)) {
    return deny("VERIFICATION_ATTESTATION_INVALID", { policy_version: policyVersion });
  }

  const licenseReview = evidence.license_review;
  if (licenseReview?.status !== "approved" ||
      licenseReview.spdx_expression !== manifest.license.spdx_expression ||
      licenseReview.source_commit !== manifest.source.commit ||
      !hasText(licenseReview.reviewer_id) ||
      !hasText(licenseReview.approval_reference) ||
      !hasText(licenseReview.reviewed_at) ||
      !Number.isFinite(Date.parse(licenseReview.reviewed_at))) {
    return deny("LICENSE_ATTESTATION_INVALID", { policy_version: policyVersion });
  }

  const securityReview = evidence.security_review;
  if (securityReview?.status !== "approved" ||
      securityReview.manifest_digest !== manifestDigest ||
      !hasText(securityReview.reviewer_id) ||
      !hasText(securityReview.approval_reference) ||
      !hasText(securityReview.reviewed_at) ||
      !Number.isFinite(Date.parse(securityReview.reviewed_at)) ||
      !Array.isArray(securityReview.approved_permissions)) {
    return deny("SECURITY_ATTESTATION_INVALID", { policy_version: policyVersion });
  }

  const elevatedRequested = permissions.filter((permission) => ELEVATED_PERMISSIONS.has(permission));
  const unapprovedElevated = elevatedRequested.filter((permission) =>
    !securityReview.approved_permissions.includes(permission)
  );
  if (unapprovedElevated.length) {
    return deny("ELEVATED_PERMISSION_APPROVAL_NOT_VERIFIED", {
      policy_version: policyVersion,
      permissions: unapprovedElevated,
    });
  }

  return Object.freeze({
    allowed: true,
    decision: "allowed",
    reason: "POLICY_REQUIREMENTS_SATISFIED",
    policy_version: policyVersion,
    manifest_digest: manifestDigest,
    package_digest: manifest.package.digest,
    permissions: Object.freeze([...permissions]),
    network_destinations: Object.freeze([...destinations]),
    requires_human_approval: false,
    human_approval_verified: elevatedRequested.length > 0,
    evidence_expires_at: evidence.expires_at,
  });
}
