import { createHash } from "node:crypto";

// Server-side integrity helper only. This hash chain is not authenticated storage,
// independent tamper protection, a signature system, or a persistence layer.

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/;
const RECORD_KEYS = new Set(["record_version", "record_id", "sequence", "capability_id", "capability_version", "package_digest", "event_type", "occurred_at", "actor", "decision", "policy_version", "previous_record_digest", "record_digest", "external_checkpoint"]);
const INPUT_KEYS = new Set(["record_id", "capability_id", "capability_version", "package_digest", "event_type", "occurred_at", "actor", "decision", "policy_version", "external_checkpoint"]);
const EVENT_TYPES = new Set([
  "discovered", "provenance-recorded", "license-reviewed", "extracted",
  "packaged", "validated", "approved", "rejected", "published", "installed",
  "disabled", "upgraded", "rolled-back", "revoked", "retired",
]);

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
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new TypeError("A registry record must be an object.");
  if (Object.keys(record).some((key) => !RECORD_KEYS.has(key))) throw new TypeError("Registry record contains an unknown field.");
  if (record.record_version !== "1.0.0") throw new TypeError("Unsupported registry record version.");
  if (typeof record.record_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.record_id)) throw new TypeError("Registry record_id must be a UUID v4.");
  if (!Number.isSafeInteger(record.sequence) || record.sequence < 1) throw new TypeError("Registry sequence must be a positive safe integer.");
  if (typeof record.capability_id !== "string" || record.capability_id.length < 3 || record.capability_id.length > 160) throw new TypeError("Invalid capability_id.");
  if (typeof record.capability_version !== "string" || !/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?$/.test(record.capability_version)) throw new TypeError("Invalid capability semantic version.");
  if (!DIGEST_PATTERN.test(record.package_digest)) throw new TypeError("Invalid package digest.");
  if (!EVENT_TYPES.has(record.event_type)) throw new TypeError("Unsupported registry event type.");
  if (typeof record.occurred_at !== "string" || !Number.isFinite(Date.parse(record.occurred_at))) throw new TypeError("Invalid registry event timestamp.");
  if (!record.actor || !["human", "service", "system"].includes(record.actor.type) || typeof record.actor.id !== "string" || !record.actor.id.trim()) throw new TypeError("Invalid registry actor.");
  if (!record.decision || !["accepted", "denied", "recorded", "failed", "pending"].includes(record.decision.outcome) || typeof record.decision.reason_code !== "string" || !/^[A-Z0-9_]{2,80}$/.test(record.decision.reason_code)) throw new TypeError("Invalid registry decision.");
  if (typeof record.policy_version !== "string" || !record.policy_version.trim()) throw new TypeError("A policy version is required.");
  if (record.previous_record_digest !== null && !DIGEST_PATTERN.test(record.previous_record_digest)) throw new TypeError("Invalid previous record digest.");
  if (!DIGEST_PATTERN.test(record.record_digest)) throw new TypeError("Invalid record digest.");
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
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    try { assertRecordShape(record); }
    catch (error) { return { valid: false, index, reason: error.message }; }
    const expectedSequence = index + 1;
    if (record.sequence !== expectedSequence) return { valid: false, index, reason: "Registry sequence is missing, duplicated or reordered." };
    const expectedPrevious = previous ? previous.record_digest : null;
    if (record.previous_record_digest !== expectedPrevious) return { valid: false, index, reason: "Previous-record digest does not match the preceding record." };
    if (record.record_digest !== digestRecord(record)) return { valid: false, index, reason: "Record content digest mismatch." };
    previous = record;
  }
  return { valid: true, records_verified: records.length, head_digest: previous?.record_digest ?? null };
}
