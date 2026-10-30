import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { verifyEvidenceExport } from "../scripts/verify-evidence-export.mjs";

function record(sequence, previousHash) {
  const payload = {
    sequence,
    operationId: `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
    correlationId: `offline-check-${sequence}`,
    eventType: "ATTEMPTED",
    status: "ATTEMPTED",
    timestamp: "2026-10-30T02:00:00.000Z",
    provenance: { system: "ALLSPARX PRIME", producer: "gateway", environment: "test", deploymentId: "build-1" },
    actor: { type: "anonymous-origin", origin: "https://cloudcredits.io" },
    objective: "startup-deal-recommendation",
    promptHmacSha256: "a".repeat(64),
    provider: null,
    outcomeCode: "REQUEST_ACCEPTED",
    previousHash,
  };
  const eventHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  return { ...payload, eventHash };
}

function fixture() {
  const first = record(1, "0".repeat(64));
  const second = record(2, first.eventHash);
  return {
    bundle: { format: "allsparx-evidence-export-v1", ledgerMonth: "2026-10", records: [first, second] },
    checkpoint: { sequence: 2, hash: second.eventHash },
  };
}

test("offline verifier accepts a complete export anchored to an external checkpoint", () => {
  const { bundle, checkpoint } = fixture();
  assert.deepEqual(verifyEvidenceExport(bundle, checkpoint), {
    valid: true, verifiedRecords: 2, sequence: 2, hash: checkpoint.hash,
  });
});

test("offline verifier rejects a changed record", () => {
  const { bundle, checkpoint } = fixture();
  bundle.records[0].outcomeCode = "ALTERED";
  assert.throws(() => verifyEvidenceExport(bundle, checkpoint), /RECORD_HASH_MISMATCH/);
});

test("offline verifier rejects a missing or reordered record", () => {
  const { bundle, checkpoint } = fixture();
  bundle.records.reverse();
  assert.throws(() => verifyEvidenceExport(bundle, checkpoint), /SEQUENCE_GAP/);
});

test("offline verifier rejects a checkpoint not matching the external anchor", () => {
  const { bundle } = fixture();
  assert.throws(() => verifyEvidenceExport(bundle, { sequence: 2, hash: "b".repeat(64) }), /CHECKPOINT_HASH_MISMATCH/);
});

test("offline verifier ignores any checkpoint copied into the export bundle", () => {
  const { bundle, checkpoint } = fixture();
  bundle.checkpoint = { sequence: 0, hash: "0".repeat(64) };
  assert.equal(verifyEvidenceExport(bundle, checkpoint).valid, true);
});

test("offline verifier rejects unexpected record fields", () => {
  const { bundle, checkpoint } = fixture();
  bundle.records[0].untrusted = true;
  assert.throws(() => verifyEvidenceExport(bundle, checkpoint), /INVALID_RECORD_SCHEMA/);
});
