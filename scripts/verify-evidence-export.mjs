import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const ZERO_HASH = "0".repeat(64);
const RECORD_KEYS = [
  "sequence", "operationId", "correlationId", "eventType", "status", "timestamp",
  "provenance", "actor", "objective", "promptHmacSha256", "provider",
  "outcomeCode", "previousHash", "eventHash",
];
const HASH = /^[a-f0-9]{64}$/;

function fail(message) {
  throw new Error(message);
}

function isCanonicalTimestamp(value) {
  if (typeof value !== "string") return false;
  try { return new Date(value).toISOString() === value; } catch { return false; }
}

/**
 * Verify a complete month export against a checkpoint obtained through a
 * separate trusted channel. The checkpoint embedded in the export is ignored.
 */
export function verifyEvidenceExport(bundle, trustedCheckpoint) {
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle) ||
      bundle.format !== "allsparx-evidence-export-v1" ||
      typeof bundle.ledgerMonth !== "string" ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(bundle.ledgerMonth) ||
      !Array.isArray(bundle.records)) fail("INVALID_EXPORT");
  if (!trustedCheckpoint || !Number.isSafeInteger(trustedCheckpoint.sequence) ||
      trustedCheckpoint.sequence < 0 || !HASH.test(trustedCheckpoint.hash || "")) {
    fail("INVALID_TRUSTED_CHECKPOINT");
  }
  if (trustedCheckpoint.sequence !== bundle.records.length) fail("CHECKPOINT_SEQUENCE_MISMATCH");
  if (trustedCheckpoint.sequence === 0) {
    if (trustedCheckpoint.hash !== ZERO_HASH) fail("CHECKPOINT_HASH_MISMATCH");
    return { valid: true, verifiedRecords: 0, sequence: 0, hash: ZERO_HASH };
  }

  let previousHash = ZERO_HASH;
  for (let index = 0; index < bundle.records.length; index += 1) {
    const record = bundle.records[index];
    if (!record || typeof record !== "object" || Array.isArray(record) ||
        Object.keys(record).length !== RECORD_KEYS.length ||
        RECORD_KEYS.some((key) => !Object.hasOwn(record, key))) fail("INVALID_RECORD_SCHEMA");
    const sequence = index + 1;
    if (record.sequence !== sequence) fail("SEQUENCE_GAP");
    if (!isCanonicalTimestamp(record.timestamp) || record.timestamp.slice(0, 7) !== bundle.ledgerMonth) fail("LEDGER_MONTH_MISMATCH");
    if (!hasCanonicalSemantics(record)) fail("INVALID_RECORD_CONTENT");
    if (record.previousHash !== previousHash || !HASH.test(record.eventHash || "")) fail("CHAIN_LINK_MISMATCH");
    const { eventHash, ...payload } = record;
    const calculated = createHash("sha256").update(JSON.stringify(payload), "utf8").digest("hex");
    if (calculated !== eventHash) fail("RECORD_HASH_MISMATCH");
    previousHash = eventHash;
  }
  if (previousHash !== trustedCheckpoint.hash) fail("CHECKPOINT_HASH_MISMATCH");
  return {
    valid: true,
    verifiedRecords: bundle.records.length,
    sequence: trustedCheckpoint.sequence,
    hash: previousHash,
  };
}


const EVENT_TYPES = new Set(["ATTEMPTED", "SUCCEEDED", "FAILED", "VERIFIED", "CONTRADICTED"]);
const MAX_SEQUENCE = 10_000_000;

function exactKeys(value, expected) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key));
}

function boundedString(value, max) {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function hasCanonicalSemantics(record) {
  const lifecycleIsCanonical =
    (record.eventType === "ATTEMPTED" && record.status === "ATTEMPTED") ||
    (record.eventType === "SUCCEEDED" && record.status === "PROVIDER_RESPONSE_RETURNED") ||
    (record.eventType === "FAILED" && ["FAILED", "PROVIDER_ATTEMPT_FAILED"].includes(record.status)) ||
    (record.eventType === "VERIFIED" && record.status === "VERIFIED") ||
    (record.eventType === "CONTRADICTED" && record.status === "CONTRADICTED");

  let originIsCanonical = false;
  try {
    const parsed = new URL(record.actor?.origin);
    originIsCanonical = parsed.origin === record.actor.origin &&
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      parsed.hostname.length > 0 && !parsed.username && !parsed.password;
  } catch {}

  const actorIsCanonical = exactKeys(record.actor, ["type", "origin"]) &&
    record.actor.type === "anonymous-origin" && originIsCanonical;
  const provenance = record.provenance;
  const provenanceIsCanonical =
    exactKeys(provenance, ["system", "producer", "environment", "deploymentId"]) &&
    provenance.system === "ALLSPARX PRIME" &&
    boundedString(provenance.producer, 96) && /^[a-z][a-z0-9-]*$/.test(provenance.producer) &&
    boundedString(provenance.environment, 32) && /^[a-z][a-z0-9-]*$/.test(provenance.environment) &&
    boundedString(provenance.deploymentId, 128) && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(provenance.deploymentId);

  return record.sequence <= MAX_SEQUENCE &&
    typeof record.operationId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(record.operationId) &&
    boundedString(record.correlationId, 128) && /^[a-zA-Z0-9._:-]+$/.test(record.correlationId) &&
    EVENT_TYPES.has(record.eventType) && boundedString(record.status, 64) && lifecycleIsCanonical &&
    actorIsCanonical && provenanceIsCanonical &&
    boundedString(record.objective, 128) && /^[a-z][a-z0-9-]*$/.test(record.objective) &&
    typeof record.promptHmacSha256 === "string" && HASH.test(record.promptHmacSha256) &&
    (record.provider === null || (boundedString(record.provider, 32) &&
      ["openai", "anthropic", "google"].includes(record.provider))) &&
    boundedString(record.outcomeCode, 64) && /^[A-Z][A-Z0-9_]*$/.test(record.outcomeCode);
}

async function main() {
  const [file, sequenceText, hash] = process.argv.slice(2);
  if (!file || !/^(0|[1-9]\d*)$/.test(sequenceText || "") || !HASH.test(hash || "")) {
    fail("USAGE: node scripts/verify-evidence-export.mjs <export.json> <trusted-sequence> <trusted-sha256>");
  }
  const bundle = JSON.parse(await readFile(file, "utf8"));
  const result = verifyEvidenceExport(bundle, { sequence: Number(sequenceText), hash });
  process.stdout.write(JSON.stringify(result) + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  });
}
