import { createHash, sign as cryptoSign, verify as cryptoVerify } from "node:crypto";

const HASH = /^[a-f0-9]{64}$/;
const ZERO_HASH = "0".repeat(64);

function fail(code) { throw new Error(code); }
function canonical(value) { return JSON.stringify(value); }
function digest(value) { return createHash("sha256").update(canonical(value), "utf8").digest("hex"); }

export function signEvidenceCheckpoint({ ledgerMonth, sequence, hash, previousCheckpointSha256 = null, issuedAt, privateKey }) {
  if (typeof ledgerMonth !== "string" || !/^\\d{4}-(0[1-9]|1[0-2])$/.test(ledgerMonth)) fail("INVALID_LEDGER_MONTH");
  if (!Number.isSafeInteger(sequence) || sequence < 0 || sequence > 10_000_000 || !HASH.test(hash || "") || (sequence === 0 && hash !== ZERO_HASH)) fail("INVALID_LEDGER_HEAD");
  if (previousCheckpointSha256 !== null && !HASH.test(previousCheckpointSha256)) fail("INVALID_PREVIOUS_CHECKPOINT");
  if (typeof issuedAt !== "string" || !Number.isFinite(Date.parse(issuedAt)) || new Date(issuedAt).toISOString() !== issuedAt) fail("INVALID_ISSUED_AT");
  if (!privateKey) fail("MISSING_PRIVATE_KEY");
  const payload = { format: "allsparx-signed-evidence-checkpoint-v1", ledgerMonth, sequence, hash, previousCheckpointSha256, issuedAt, algorithm: "Ed25519" };
  const signature = cryptoSign(null, Buffer.from(canonical(payload)), privateKey).toString("base64");
  return { ...payload, signature };
}

export function verifyEvidenceCheckpoint(checkpoint, publicKey, expectedPreviousCheckpointSha256 = null) {
  const keys = ["format", "ledgerMonth", "sequence", "hash", "previousCheckpointSha256", "issuedAt", "algorithm", "signature"];
  if (!checkpoint || typeof checkpoint !== "object" || Array.isArray(checkpoint) ||
      Object.keys(checkpoint).length !== keys.length || keys.some((key) => !Object.hasOwn(checkpoint, key))) fail("INVALID_CHECKPOINT_SCHEMA");
  const { signature, ...payload } = checkpoint;
  if (payload.format !== "allsparx-signed-evidence-checkpoint-v1" || payload.algorithm !== "Ed25519") fail("UNSUPPORTED_CHECKPOINT_FORMAT");
  if (typeof payload.ledgerMonth !== "string" || !/^\\d{4}-(0[1-9]|1[0-2])$/.test(payload.ledgerMonth)) fail("INVALID_LEDGER_MONTH");
  if (!Number.isSafeInteger(payload.sequence) || payload.sequence < 0 || payload.sequence > 10_000_000 || !HASH.test(payload.hash || "") || (payload.sequence === 0 && payload.hash !== ZERO_HASH)) fail("INVALID_LEDGER_HEAD");
  if (payload.previousCheckpointSha256 !== null && !HASH.test(payload.previousCheckpointSha256 || "")) fail("INVALID_PREVIOUS_CHECKPOINT");
  if (payload.previousCheckpointSha256 !== expectedPreviousCheckpointSha256) fail("PREVIOUS_CHECKPOINT_MISMATCH");
  if (typeof payload.issuedAt !== "string" || !Number.isFinite(Date.parse(payload.issuedAt)) || new Date(payload.issuedAt).toISOString() !== payload.issuedAt) fail("INVALID_ISSUED_AT");
  if (typeof signature !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(signature)) fail("INVALID_SIGNATURE_ENCODING");
  if (!publicKey || !cryptoVerify(null, Buffer.from(canonical(payload)), publicKey, Buffer.from(signature, "base64"))) fail("SIGNATURE_VERIFICATION_FAILED");
  return { valid: true, ledgerMonth: payload.ledgerMonth, sequence: payload.sequence, hash: payload.hash, checkpointSha256: digest(checkpoint), previousCheckpointSha256: payload.previousCheckpointSha256 };
}
