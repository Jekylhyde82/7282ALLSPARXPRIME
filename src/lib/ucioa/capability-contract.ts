export const CAPABILITY_LIFECYCLE_STATES = [
  "discovered", "proposed", "under_evaluation", "approved", "integrated",
  "maintained", "deprecated", "retired", "rejected", "deferred",
] as const;
export const PROVIDER_STATES = [
  "discovered", "evaluated", "approved", "connected", "suspended", "retired",
] as const;
export const RISK_TIERS = ["low", "moderate", "high", "critical"] as const;
export const DATA_CLASSIFICATIONS = [
  "public", "internal", "confidential", "restricted",
] as const;
export const IDEMPOTENCY_MODES = ["required", "optional", "unsupported"] as const;

export type CapabilityLifecycleState = typeof CAPABILITY_LIFECYCLE_STATES[number];
export type ProviderState = typeof PROVIDER_STATES[number];
export type RiskTier = typeof RISK_TIERS[number];
export type DataClassification = typeof DATA_CLASSIFICATIONS[number];
export type IdempotencyMode = typeof IDEMPOTENCY_MODES[number];

export interface ProviderRecord {
  providerId: string;
  displayName: string;
  state: ProviderState;
  contractVersion: string;
  capabilityIds: string[];
}

export interface CapabilityOperation {
  operationId: string;
  riskTier: RiskTier;
  requiredScopes: string[];
  approvalRequired: boolean;
  timeoutMs: number;
  maxRetries: number;
  idempotency: IdempotencyMode;
  inputSchemaRef: string;
  outputSchemaRef: string;
  dataClassification: DataClassification;
}

export interface CapabilityRecord {
  capabilityId: string;
  providerId: string;
  version: string;
  lifecycleState: CapabilityLifecycleState;
  operations: CapabilityOperation[];
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ValidationResult<T> =
  | { valid: true; value: T; issues: [] }
  | { valid: false; issues: ValidationIssue[] };

const ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const MAX_OPERATIONS = 64;
const MAX_SCOPES = 32;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function exactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) issues.push({ path: `${path}.${key}`, message: "Unknown field." });
  }
}
function stringField(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  options: { pattern?: RegExp; maxLength?: number } = {},
): value is string {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value ||
      (options.maxLength !== undefined && value.length > options.maxLength) ||
      (options.pattern !== undefined && !options.pattern.test(value))) {
    issues.push({ path, message: "Expected a non-empty, trimmed string with the required format." });
    return false;
  }
  return true;
}
function enumField<T extends string>(
  value: unknown,
  choices: readonly T[],
  path: string,
  issues: ValidationIssue[],
): value is T {
  if (typeof value !== "string" || !choices.includes(value as T)) {
    issues.push({ path, message: `Expected one of: ${choices.join(", ")}.` });
    return false;
  }
  return true;
}
function stringArray(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  maxItems: number,
): value is string[] {
  if (!Array.isArray(value) || value.length > maxItems) {
    issues.push({ path, message: `Expected an array with at most ${maxItems} entries.` });
    return false;
  }
  let valid = true;
  value.forEach((item, index) => {
    if (!stringField(item, `${path}[${index}]`, issues, { pattern: ID_PATTERN, maxLength: 64 })) valid = false;
  });
  if (new Set(value).size !== value.length) {
    issues.push({ path, message: "Duplicate entries are not allowed." });
    valid = false;
  }
  return valid;
}

export function validateProviderRecord(input: unknown): ValidationResult<ProviderRecord> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) return { valid: false, issues: [{ path: "$", message: "Expected an object." }] };
  exactKeys(input, ["providerId", "displayName", "state", "contractVersion", "capabilityIds"], "$", issues);
  stringField(input.providerId, "$.providerId", issues, { pattern: ID_PATTERN, maxLength: 64 });
  stringField(input.displayName, "$.displayName", issues, { maxLength: 120 });
  enumField(input.state, PROVIDER_STATES, "$.state", issues);
  stringField(input.contractVersion, "$.contractVersion", issues, { pattern: VERSION_PATTERN, maxLength: 64 });
  stringArray(input.capabilityIds, "$.capabilityIds", issues, 256);
  if (issues.length) return { valid: false, issues };
  return { valid: true, value: input as unknown as ProviderRecord, issues: [] };
}

function validateOperation(input: unknown, path: string, issues: ValidationIssue[]): input is CapabilityOperation {
  if (!isRecord(input)) {
    issues.push({ path, message: "Expected an object." });
    return false;
  }
  exactKeys(input, [
    "operationId", "riskTier", "requiredScopes", "approvalRequired", "timeoutMs",
    "maxRetries", "idempotency", "inputSchemaRef", "outputSchemaRef", "dataClassification",
  ], path, issues);
  stringField(input.operationId, `${path}.operationId`, issues, { pattern: ID_PATTERN, maxLength: 64 });
  enumField(input.riskTier, RISK_TIERS, `${path}.riskTier`, issues);
  stringArray(input.requiredScopes, `${path}.requiredScopes`, issues, MAX_SCOPES);
  if (typeof input.approvalRequired !== "boolean")
    issues.push({ path: `${path}.approvalRequired`, message: "Expected a boolean." });
  if (!Number.isInteger(input.timeoutMs) || (input.timeoutMs as number) < 100 || (input.timeoutMs as number) > 120_000)
    issues.push({ path: `${path}.timeoutMs`, message: "Expected an integer from 100 to 120000." });
  if (!Number.isInteger(input.maxRetries) || (input.maxRetries as number) < 0 || (input.maxRetries as number) > 5)
    issues.push({ path: `${path}.maxRetries`, message: "Expected an integer from 0 to 5." });
  enumField(input.idempotency, IDEMPOTENCY_MODES, `${path}.idempotency`, issues);
  stringField(input.inputSchemaRef, `${path}.inputSchemaRef`, issues, { pattern: ID_PATTERN, maxLength: 96 });
  stringField(input.outputSchemaRef, `${path}.outputSchemaRef`, issues, { pattern: ID_PATTERN, maxLength: 96 });
  enumField(input.dataClassification, DATA_CLASSIFICATIONS, `${path}.dataClassification`, issues);
  if (input.riskTier === "critical" && input.approvalRequired !== true)
    issues.push({ path: `${path}.approvalRequired`, message: "Critical-risk operations must require approval." });
  if (input.riskTier === "high" && input.approvalRequired !== true)
    issues.push({ path: `${path}.approvalRequired`, message: "High-risk operations must require approval." });
  if (input.idempotency === "unsupported" && input.maxRetries !== 0)
    issues.push({ path: `${path}.maxRetries`, message: "Retries must be zero when idempotency is unsupported." });
  return true;
}

export function validateCapabilityRecord(input: unknown): ValidationResult<CapabilityRecord> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) return { valid: false, issues: [{ path: "$", message: "Expected an object." }] };
  exactKeys(input, ["capabilityId", "providerId", "version", "lifecycleState", "operations"], "$", issues);
  stringField(input.capabilityId, "$.capabilityId", issues, { pattern: ID_PATTERN, maxLength: 64 });
  stringField(input.providerId, "$.providerId", issues, { pattern: ID_PATTERN, maxLength: 64 });
  stringField(input.version, "$.version", issues, { pattern: VERSION_PATTERN, maxLength: 64 });
  enumField(input.lifecycleState, CAPABILITY_LIFECYCLE_STATES, "$.lifecycleState", issues);
  if (!Array.isArray(input.operations) || input.operations.length === 0 || input.operations.length > MAX_OPERATIONS) {
    issues.push({ path: "$.operations", message: `Expected 1 to ${MAX_OPERATIONS} operations.` });
  } else {
    const ids = new Set<string>();
    input.operations.forEach((operation, index) => {
      validateOperation(operation, `$.operations[${index}]`, issues);
      if (isRecord(operation) && typeof operation.operationId === "string") {
        if (ids.has(operation.operationId))
          issues.push({ path: `$.operations[${index}].operationId`, message: "Operation IDs must be unique." });
        ids.add(operation.operationId);
      }
    });
  }
  if (issues.length) return { valid: false, issues };
  return { valid: true, value: input as unknown as CapabilityRecord, issues: [] };
}
