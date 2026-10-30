import test from "node:test";
import assert from "node:assert/strict";
import { createRegistryRecord, verifyRegistryChain } from "../src/lib/allsparxPrime/capability-registry-chain.mjs";

const base = {
  record_id: "00000000-0000-4000-8000-000000000001",
  capability_id: "allsparx.example.text-normalizer",
  capability_version: "0.1.0",
  package_digest: "sha256:" + "b".repeat(64),
  event_type: "discovered",
  occurred_at: "2026-10-30T03:00:00.000Z",
  actor: { type: "system", id: "capability-intake" },
  decision: { outcome: "recorded", reason_code: "DISCOVERY_RECORDED" },
  policy_version: "capability-policy-1.0.0",
};

test("creates a deterministic genesis registry record", () => {
  const first = createRegistryRecord(base);
  const reordered = createRegistryRecord({ ...base, actor: { id: "capability-intake", type: "system" } });
  assert.equal(first.record_digest, reordered.record_digest);
  assert.equal(first.sequence, 1);
  assert.equal(first.previous_record_digest, null);
  assert.match(first.record_digest, /^sha256:[a-f0-9]{64}$/);
});

test("links records by sequence and previous digest", () => {
  const first = createRegistryRecord(base);
  const second = createRegistryRecord({ ...base, record_id: "00000000-0000-4000-8000-000000000002", event_type: "validated" }, first);
  assert.equal(second.sequence, 2);
  assert.equal(second.previous_record_digest, first.record_digest);
  assert.deepEqual(verifyRegistryChain([first, second]), {
    valid: true, records_verified: 2, head_digest: second.record_digest,
  });
});

test("detects content tampering", () => {
  const first = createRegistryRecord(base);
  const tampered = { ...first, decision: { outcome: "accepted", reason_code: "APPROVED" } };
  assert.equal(verifyRegistryChain([tampered]).reason, "Record content digest mismatch.");
});

test("detects reordered, missing and broken-link records", () => {
  const first = createRegistryRecord(base);
  const second = createRegistryRecord({ ...base, record_id: "00000000-0000-4000-8000-000000000002", event_type: "validated" }, first);
  assert.equal(verifyRegistryChain([second, first]).valid, false);
  assert.equal(verifyRegistryChain([first, { ...second, sequence: 3 }]).valid, false);
  assert.equal(verifyRegistryChain([first, { ...second, previous_record_digest: "sha256:" + "c".repeat(64) }]).valid, false);
});

test("rejects unsupported event types and malformed records", () => {
  assert.throws(() => createRegistryRecord({ ...base, event_type: "execute-arbitrary-code" }), /Unsupported registry event type/);
  assert.throws(() => createRegistryRecord({ ...base, capability_version: "latest" }), /semantic version/);
  assert.throws(() => createRegistryRecord({ ...base, sequence: 99 }), /reserved or unknown field/);
  const malformed = verifyRegistryChain([{ ...createRegistryRecord(base), injected: true }]);
  assert.equal(malformed.valid, false);
  assert.equal(malformed.reason, "Registry record contains an unknown field.");
});

test("rejects unknown nested actor and decision fields", () => {
  assert.throws(() => createRegistryRecord({
    ...base, actor: { ...base.actor, is_admin: true },
  }), /Registry actor contains an unknown field/);
  assert.throws(() => createRegistryRecord({
    ...base, decision: { ...base.decision, bypass: true },
  }), /Registry decision contains an unknown field/);
});

test("validates optional external checkpoint structure", () => {
  assert.throws(() => createRegistryRecord({
    ...base, external_checkpoint: { provider: "vault", reference: "checkpoint-1" },
  }), /Invalid external checkpoint/);
  assert.doesNotThrow(() => createRegistryRecord({
    ...base,
    external_checkpoint: {
      provider: "independent-audit-store",
      reference: "checkpoint-1",
      signature: "signed-checkpoint",
    },
  }));
});

test("rejects duplicate record identifiers within a chain", () => {
  const first = createRegistryRecord(base);
  const second = createRegistryRecord({
    ...base, event_type: "validated",
  }, first);
  const duplicateId = {
    ...second,
    record_id: first.record_id,
  };
  // Recalculate through the public creator so the digest is valid.
  const duplicate = createRegistryRecord({
    ...base, event_type: "validated",
  }, first);
  const repeated = { ...duplicate, record_id: first.record_id };
  assert.equal(verifyRegistryChain([first, repeated]).reason, "Registry record_id is duplicated.");
});
