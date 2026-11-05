import { createRegistryRecord, verifyRegistryChain } from "./capability-registry-chain.mjs";

/**
 * Append-only registry service.
 *
 * Persistence is deliberately injected. The adapter MUST implement appendIfHead
 * as one atomic compare-and-append operation (transaction/CAS); this module does
 * not pretend an in-memory check provides cross-request concurrency control.
 */
function assertStore(store) {
  if (!store || typeof store.readAll !== "function" || typeof store.appendIfHead !== "function") {
    throw new TypeError("Registry store must implement readAll() and atomic appendIfHead().");
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function listRegistryEvents(store) {
  assertStore(store);
  const records = await store.readAll();
  const verification = verifyRegistryChain(records);
  if (!verification.valid) {
    const error = new Error("Registry integrity verification failed.");
    error.code = "REGISTRY_INTEGRITY_FAILURE";
    error.verification = verification;
    throw error;
  }
  return Object.freeze({
    records: Object.freeze(records.map((record) => Object.freeze(cloneJson(record)))),
    verification,
  });
}

export async function appendRegistryEvent({ store, event }) {
  assertStore(store);
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    throw new TypeError("Registry event must be an object.");
  }

  const current = await listRegistryEvents(store);
  const previous = current.records.at(-1) ?? null;
  if (current.records.some((record) => record.record_id === event.record_id)) {
    const error = new Error("Registry record_id already exists.");
    error.code = "REGISTRY_DUPLICATE_RECORD";
    throw error;
  }

  const record = createRegistryRecord(event, previous);
  const result = await store.appendIfHead({
    expectedHeadDigest: previous?.record_digest ?? null,
    record,
  });

  if (!result || result.appended !== true) {
    const error = new Error("Registry head changed before append; retry from a fresh read.");
    error.code = "REGISTRY_CONCURRENCY_CONFLICT";
    throw error;
  }

  // Read-after-write confirms the adapter persisted this exact immutable record.
  const persisted = await listRegistryEvents(store);
  const match = persisted.records.find((candidate) =>
    candidate.record_id === record.record_id &&
    candidate.sequence === record.sequence &&
    candidate.record_digest === record.record_digest
  );
  if (!match) {
    const error = new Error("Registry adapter did not return the appended record on read-back.");
    error.code = "REGISTRY_PERSISTENCE_UNCONFIRMED";
    throw error;
  }

  return Object.freeze({
    record: match,
    verification: persisted.verification,
  });
}
