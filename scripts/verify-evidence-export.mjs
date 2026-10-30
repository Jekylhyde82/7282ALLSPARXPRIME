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
    if (typeof record.timestamp !== "string" || !/^\d{4}-(0[1-9]|1[0-2])-/.test(record.timestamp) || record.timestamp.slice(0, 7) !== bundle.ledgerMonth || new Date(record.timestamp).toISOString() !== record.timestamp) fail("LEDGER_MONTH_MISMATCH");
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
