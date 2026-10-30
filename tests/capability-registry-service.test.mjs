import test from "node:test";
import assert from "node:assert/strict";
import { appendRegistryEvent, listRegistryEvents } from "../src/lib/allsparxPrime/capability-registry.mjs";

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

function memoryStore(initial = []) {
  const records = structuredClone(initial);
  return {
    records,
    async readAll() { return structuredClone(records); },
    // Models the required atomic compare-and-append contract.
    async appendIfHead({ expectedHeadDigest, record }) {
      const actual = records.at(-1)?.record_digest ?? null;
      if (actual !== expectedHeadDigest) return { appended: false };
      records.push(structuredClone(record));
      return { appended: true };
    },
  };
}

test("appends a genesis event and confirms persisted read-back", async () => {
  const store = memoryStore();
  const result = await appendRegistryEvent({ store, event: base });
  assert.equal(result.record.sequence, 1);
  assert.equal(result.record.previous_record_digest, null);
  assert.equal(result.verification.valid, true);
  assert.equal(store.records.length, 1);
});

test("appends subsequent events against the verified chain head", async () => {
  const store = memoryStore();
  await appendRegistryEvent({ store, event: base });
  const second = await appendRegistryEvent({
    store,
    event: { ...base, record_id: "00000000-0000-4000-8000-000000000002", event_type: "validated" },
  });
  assert.equal(second.record.sequence, 2);
  assert.equal(second.record.previous_record_digest, store.records[0].record_digest);
  assert.equal(second.verification.records_verified, 2);
});

test("rejects a duplicate record identifier", async () => {
  const store = memoryStore();
  await appendRegistryEvent({ store, event: base });
  await assert.rejects(
    appendRegistryEvent({ store, event: base }),
    (error) => error.code === "REGISTRY_DUPLICATE_RECORD",
  );
});

test("fails closed when existing registry history is tampered", async () => {
  const store = memoryStore();
  await appendRegistryEvent({ store, event: base });
  store.records[0].decision.reason_code = "ALTERED";
  await assert.rejects(
    listRegistryEvents(store),
    (error) => error.code === "REGISTRY_INTEGRITY_FAILURE",
  );
  await assert.rejects(
    appendRegistryEvent({
      store,
      event: { ...base, record_id: "00000000-0000-4000-8000-000000000002" },
    }),
    (error) => error.code === "REGISTRY_INTEGRITY_FAILURE",
  );
});

test("rejects a concurrent head change instead of overwriting history", async () => {
  const store = memoryStore();
  store.appendIfHead = async () => ({ appended: false });
  await assert.rejects(
    appendRegistryEvent({ store, event: base }),
    (error) => error.code === "REGISTRY_CONCURRENCY_CONFLICT",
  );
});

test("requires an atomic store adapter contract", async () => {
  await assert.rejects(
    appendRegistryEvent({ store: { readAll: async () => [] }, event: base }),
    /atomic appendIfHead/,
  );
});
