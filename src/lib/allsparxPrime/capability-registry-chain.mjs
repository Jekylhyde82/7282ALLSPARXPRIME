import { createHash } from "node:crypto";

// Server-side integrity helper only. This hash chain is not authenticated storage,
// independent tamper protection, a signature system, or a persistence layer.

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/;
const RECORD_KEYS = new Set(["record_version", "record_id", "sequence", "capability_id", "capability_version", "package_digest", "event_type", "occurred_at", "actor", "decision", "policy_version", "previous_record_digest", "record_digest", "external_checkpoint"]);
const INPUT_KEYS = new Set(["record_id", "capability_id", "capability_version", "package_digest", "event_type", "occurred_at", "actor", "decision", "policy_version", "external_checkpoint"]);
const ACTOR_KEYS = new Set(["type", "id", "identity_provider"]);
const DECISION_KEYS = new Set(["outcome", "reason_code", "approval_reference", "details_digest"]);
const CHECKPOINT_KEYS = new Set(["provider", "reference", "signature"]);
const EVENT_TYPES = new Set([
  "discovered", "provenance-recorded", "license-reviewed", "extracted",
  "packaged", "validated", "approved", "rejected", "published", "installed",
  "disabled", "upgraded", "rolled-back", "revoked", "retired",
]);

function assertOnlyKeys(value, allowed, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).some((key) => !allowed.has(key))) {
    throw new TypeError(label + " contains an unknown field or is not an object.");
  }
}

function canonicalize(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Registry records cannot contain non-finite numbers.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError("Registry records must contain only plain JSON objects and values.");
  }
  const keys = Object.keys(value).sort();
  return "{" + keys.map((key) => JSON.stringify(key) + ":" + canonicalize(value[key])).join(",") + "}";
}

function digestRecord(record) {
  const { record_digest: _ignored, ...payload } = record;
  return "sha256:" + createHash("sha256").update(canonicalize(payload), "utf8").digest("hex");
}

function assertRecordShape(record) {
  assertOnlyKeys(record, RECORD_KEYS, "Registry record");
  if (record.record_version !== "1.0.0") throw new TypeError("Unsupported registry record version.");
  if (typeof record.record_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.record_id)) throw new TypeError("Registry record_id must be a UUID v4.");
  if (!Number.isSafeInteger(record.sequence) || record.sequence < 1) throw new TypeError("Registry sequence must be a positive safe integer.");
  if (typeof record.capability_id !== "string" || record.capability_id.length < 3 || record.capability_id.length > 160) throw new TypeError("Invalid capability_id.");
  if (typeof record.capability_version !== "string" || !/^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?$/.test(record.capability_version)) throw new TypeError("Invalid capability semantic version.");
  if (!DIGEST_PATTERN.test(record.package_digest)) throw new TypeError("Invalid package digest.");
  if (!EVENT_TYPES.has(record.event_type)) throw new TypeError("Unsupported registry event type.");
  if (typeof record.occurred_at !== "string" ||
      !/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})$/.test(record.occurred_at) ||
      !Number.isFinite(Date.parse(record.occurred_at))) throw new TypeError("Invalid registry event timestamp.");

  assertOnlyKeys(record.actor, ACTOR_KEYS, "Registry actor");
  if (!["human", "service", "system"].includes(record.actor.type) ||
      typeof record.actor.id !== "string" || !record.actor.id.trim() || record.actor.id.length > 200 ||
      (record.actor.identity_provider !== undefined &&
       (typeof record.actor.identity_provider !== "string" || record.actor.identity_provider.length > 200))) {
    throw new TypeError("Invalid registry actor.");
  }

  assertOnlyKeys(record.decision, DECISION_KEYS, "Registry decision");
  if (!["accepted", "denied", "recorded", "failed", "pending"].includes(record.decision.outcome) ||
      typeof record.decision.reason_code !== "string" || !/^[A-Z0-9_]{2,80}$/.test(record.decision.reason_code) ||
      (record.decision.approval_reference !== undefined &&
       (typeof record.decision.approval_reference !== "string" || record.decision.approval_reference.length > 1000)) ||
      (record.decision.details_digest !== undefined && !DIGEST_PATTERN.test(record.decision.details_digest))) {
    throw new TypeError("Invalid registry decision.");
  }

  if (typeof record.policy_version !== "string" || !record.policy_version.trim() || record.policy_version.length > 80) {
    throw new TypeError("A policy version is required.");
  }
  if (record.previous_record_digest !== null && !DIGEST_PATTERN.test(record.previous_record_digest)) throw new TypeError("Invalid previous record digest.");
  if (!DIGEST_PATTERN.test(record.record_digest)) throw new TypeError("Invalid record digest.");

  if (record.external_checkpoint !== undefined) {
    assertOnlyKeys(record.external_checkpoint, CHECKPOINT_KEYS, "External checkpoint");
    const checkpoint = record.external_checkpoint;
    if (typeof checkpoint.provider !== "string" || !checkpoint.provider.trim() || checkpoint.provider.length > 160 ||
        typeof checkpoint.reference !== "string" || !checkpoint.reference.trim() || checkpoint.reference.length > 1000 ||
        typeof checkpoint.signature !== "string" || !checkpoint.signature.trim() || checkpoint.signature.length > 2048) {
      throw new TypeError("Invalid external checkpoint.");
    }
  }
}

export function createRegistryRecord(input, previousRecord = null) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Registry record input must be an object.");
  if (Object.keys(input).some((key) => !INPUT_KEYS.has(key))) throw new TypeError("Registry record input contains a reserved or unknown field.");
  const expectedSequence = previousRecord ? previousRecord.sequence + 1 : 1;
  const expectedPreviousDigest = previousRecord ? previousRecord.record_digest : null;
  const record = {
    ...input,
    record_version: "1.0.0",
    sequence: expectedSequence,
    previous_record_digest: expectedPreviousDigest,
  };
  delete record.record_digest;
  record.record_digest = digestRecord(record);
  assertRecordShape(record);
  return Object.freeze(record);
}

export function verifyRegistryChain(records) {
  if (!Array.isArray(records)) throw new TypeError("Registry chain must be an array.");
  let previous = null;
  const recordIds = new Set();
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    try { assertRecordShape(record); }
    catch (error) { return { valid: false, index, reason: error.message }; }
    if (recordIds.has(record.record_id)) return { valid: false, index, reason: "Registry record_id is duplicated." };
    recordIds.add(record.record_id);
    const expectedSequence = index + 1;
    if (record.sequence !== expectedSequence) return { valid: false, index, reason: "Registry sequence is missing, duplicated or reordered." };
    const expectedPrevious = previous ? previous.record_digest : null;
    if (record.previous_record_digest !== expectedPrevious) return { valid: false, index, reason: "Previous-record digest does not match the preceding record." };
    if (record.record_digest !== digestRecord(record)) return { valid: false, index, reason: "Record content digest mismatch." };
    previous = record;
  }
  return { valid: true, records_verified: records.length, head_digest: previous?.record_digest ?? null };
}
