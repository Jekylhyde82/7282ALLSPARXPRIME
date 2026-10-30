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

/**
 * Evaluate a declarative capability manifest against an explicit local policy.
 * Missing evidence, unknown permissions, and undeclared destinations fail closed.
 */
export function evaluateCapabilityPolicy(manifest, policy = {}) {
  if (!isObject(manifest)) return deny("MANIFEST_INVALID", { detail: "Manifest must be an object." });
  if (!isObject(policy)) return deny("POLICY_INVALID", { detail: "Policy must be an object." });

  const policyVersion = typeof policy.version === "string" && policy.version.trim()
    ? policy.version.trim()
    : "capability-policy-1.0.0";
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

  if (manifest.verification?.status !== "passed") {
    return deny("VERIFICATION_NOT_PASSED", { policy_version: policyVersion });
  }
  if (manifest.license?.review_status !== "approved") {
    return deny("LICENSE_NOT_APPROVED", { policy_version: policyVersion });
  }

  const review = manifest.security_review;
  if (review?.status !== "approved") {
    return deny("SECURITY_REVIEW_NOT_APPROVED", { policy_version: policyVersion });
  }

  const elevatedRequested = permissions.some((permission) => ELEVATED_PERMISSIONS.has(permission));
  if (elevatedRequested) {
    const approvalReference = typeof review.approval_reference === "string" && review.approval_reference.trim();
    const reviewer = typeof review.reviewer === "string" && review.reviewer.trim();
    const reviewedAt = typeof review.reviewed_at === "string" && Number.isFinite(Date.parse(review.reviewed_at));
    if (!approvalReference || !reviewer || !reviewedAt) {
      return deny("ELEVATED_PERMISSION_APPROVAL_EVIDENCE_MISSING", { policy_version: policyVersion });
    }
  }

  if (manifest.data_handling?.secret_access !== false) {
    return deny("SECRET_ACCESS_NOT_EXPLICITLY_DISABLED", { policy_version: policyVersion });
  }
  if (!manifest.package || !DIGEST.test(manifest.package.digest ?? "")) {
    return deny("PACKAGE_DIGEST_INVALID", { policy_version: policyVersion });
  }

  return Object.freeze({
    allowed: true,
    decision: "allowed",
    reason: "POLICY_REQUIREMENTS_SATISFIED",
    policy_version: policyVersion,
    permissions: Object.freeze([...permissions]),
    network_destinations: Object.freeze([...destinations]),
    requires_human_approval: elevatedRequested,
  });
}
