const ZERO_HASH = "0".repeat(64);
const EVENT_TYPES = new Set(["ATTEMPTED", "SUCCEEDED", "FAILED", "VERIFIED", "CONTRADICTED"]);
const MAX_BODY_BYTES = 4096;
const MAX_VERIFY_PAGE = 100;
const MAX_SEQUENCE = 10_000_000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
function canonical(value) {
  return JSON.stringify(value);
}
async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function readBoundedJson(request) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) throw new Error("BODY_TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("EMPTY_BODY");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new Error("BODY_TOO_LARGE"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
function boundedString(value, max) {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}
function exactKeys(value, expected) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key));
}
function validHead(head) {
  return exactKeys(head, ["sequence", "hash"]) &&
    Number.isSafeInteger(head.sequence) && head.sequence >= 0 &&
    head.sequence <= MAX_SEQUENCE && typeof head.hash === "string" &&
    /^[a-f0-9]{64}$/.test(head.hash) && (head.sequence !== 0 || head.hash === ZERO_HASH);
}
function validEvent(event) {
  const eventKeys = [
    "operationId", "correlationId", "eventType", "status", "timestamp",
    "actor", "provenance", "objective", "promptHmacSha256", "provider", "outcomeCode",
  ];
  const lifecycleIsCanonical = event && (
    (event.eventType === "ATTEMPTED" && event.status === "ATTEMPTED") ||
    (event.eventType === "SUCCEEDED" && event.status === "PROVIDER_RESPONSE_RETURNED") ||
    (event.eventType === "FAILED" && ["FAILED", "PROVIDER_ATTEMPT_FAILED"].includes(event.status)) ||
    (event.eventType === "VERIFIED" && event.status === "VERIFIED") ||
    (event.eventType === "CONTRADICTED" && event.status === "CONTRADICTED")
  );
  let originIsCanonical = false;
  let timestampIsCanonical = false;
  try {
    const parsed = new URL(event?.actor?.origin);
    originIsCanonical = parsed.origin === event.actor.origin &&
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      parsed.hostname.length > 0 && !parsed.username && !parsed.password;
  } catch {}
  try { timestampIsCanonical = new Date(event?.timestamp).toISOString() === event.timestamp; } catch {}
  const actorIsCanonical = exactKeys(event?.actor, ["type", "origin"]) &&
    event.actor.type === "anonymous-origin" && originIsCanonical;
  const provenance = event?.provenance;
  const provenanceIsCanonical = exactKeys(provenance, ["system", "producer", "environment", "deploymentId"]) &&
    provenance.system === "ALLSPARX PRIME" &&
    boundedString(provenance.producer, 96) && /^[a-z][a-z0-9-]*$/.test(provenance.producer) &&
    boundedString(provenance.environment, 32) && /^[a-z][a-z0-9-]*$/.test(provenance.environment) &&
    boundedString(provenance.deploymentId, 128) && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(provenance.deploymentId);
  return exactKeys(event, eventKeys) &&
    typeof event.operationId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(event.operationId) &&
    boundedString(event.correlationId, 128) && /^[a-zA-Z0-9._:-]+$/.test(event.correlationId) &&
    EVENT_TYPES.has(event.eventType) && boundedString(event.status, 64) && lifecycleIsCanonical &&
    timestampIsCanonical && actorIsCanonical && provenanceIsCanonical &&
    boundedString(event.objective, 128) && /^[a-z][a-z0-9-]*$/.test(event.objective) &&
    typeof event.promptHmacSha256 === "string" && /^[a-f0-9]{64}$/.test(event.promptHmacSha256) &&
    (event.provider === null || (boundedString(event.provider, 32) && ["openai", "anthropic", "google"].includes(event.provider))) &&
    boundedString(event.outcomeCode, 64) && /^[A-Z][A-Z0-9_]*$/.test(event.outcomeCode);
}

export class EvidenceLedger {
  constructor(state) { this.state = state; }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/append" && request.method === "POST") {
      let event;
      try { event = await readBoundedJson(request); }
      catch (error) {
        return json({ error: error.message === "BODY_TOO_LARGE" ? "BODY_TOO_LARGE" : "INVALID_JSON" }, 400);
      }
      if (!validEvent(event)) return json({ error: "INVALID_EVIDENCE_EVENT" }, 400);

      const stored = await this.state.storage.transaction(async (txn) => {
        const head = await txn.get("head") || { sequence: 0, hash: ZERO_HASH };
        if (!validHead(head) || head.sequence >= MAX_SEQUENCE) throw new Error("INVALID_LEDGER_HEAD");
        const sequence = head.sequence + 1;
        const record = {
          sequence,
          operationId: event.operationId,
          correlationId: event.correlationId,
          eventType: event.eventType,
          status: event.status,
          timestamp: event.timestamp,
          provenance: event.provenance,
          actor: event.actor,
          objective: event.objective,
          promptHmacSha256: event.promptHmacSha256,
          provider: event.provider,
          outcomeCode: event.outcomeCode,
          previousHash: head.hash,
        };
        const eventHash = await sha256(canonical(record));
        const complete = { ...record, eventHash };
        await txn.put(`event:${String(sequence).padStart(12, "0")}`, complete);
        await txn.put("head", { sequence, hash: eventHash });
        return complete;
      });
      return json({ stored: true, sequence: stored.sequence, eventHash: stored.eventHash }, 201);
    }

    if (url.pathname === "/verify" && request.method === "GET") {
      const head = await this.state.storage.get("head") || { sequence: 0, hash: ZERO_HASH };
      if (!validHead(head)) return json({ valid: false, invalidHead: true }, 409);
      const from = Number(url.searchParams.get("from") || "1");
      const limit = Number(url.searchParams.get("limit") || String(MAX_VERIFY_PAGE));
      const suppliedAnchor = from === 1 ? ZERO_HASH : url.searchParams.get("previousHash");
      if (!Number.isSafeInteger(from) || from < 1 || from > head.sequence + 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_VERIFY_PAGE || typeof suppliedAnchor !== "string" || !/^[a-f0-9]{64}$/.test(suppliedAnchor) || (from === 1 && suppliedAnchor !== ZERO_HASH)) return json({ error: "INVALID_VERIFY_CURSOR", maxPageSize: MAX_VERIFY_PAGE }, 400);
      let previousHash = ZERO_HASH;
      if (from > 1) {
        const priorKey = "event:" + String(from - 1).padStart(12, "0");
        const priorRecord = await this.state.storage.get(priorKey);
        if (!priorRecord || priorRecord.sequence !== from - 1 || priorRecord.eventHash !== suppliedAnchor) return json({ error: "INVALID_VERIFY_CURSOR" }, 400);
        previousHash = priorRecord.eventHash;
      }
      const end = Math.min(head.sequence, from + limit - 1);
      let verifiedEvents = 0;
      for (let sequence = from; sequence <= end; sequence += 1) {
        const key = "event:" + String(sequence).padStart(12, "0");
        const record = await this.state.storage.get(key);
        if (!record || record.sequence !== sequence || record.previousHash !== previousHash) return json({ valid: false, verifiedEvents, expectedSequence: sequence }, 409);
        const { eventHash, ...payload } = record;
        const calculated = await sha256(canonical(payload));
        if (calculated !== eventHash) return json({ valid: false, verifiedEvents, invalidSequence: sequence }, 409);
        previousHash = eventHash;
        verifiedEvents += 1;
      }
      const complete = end === head.sequence;
      if (complete && previousHash !== head.hash) return json({ valid: false, verifiedEvents, invalidHead: true }, 409);
      return json({ valid: true, verifiedEvents, verifiedFrom: from, verifiedThrough: end, complete, headSequence: head.sequence, headHash: complete ? head.hash : undefined, next: complete ? null : { from: end + 1, previousHash } });
    }

    if (url.pathname === "/export" && request.method === "GET") {
      const head = await this.state.storage.get("head") || { sequence: 0, hash: ZERO_HASH };
      if (!validHead(head)) return json({ valid: false, invalidHead: true }, 409);
      const from = Number(url.searchParams.get("from") || "1");
      const limit = Number(url.searchParams.get("limit") || String(MAX_VERIFY_PAGE));
      const suppliedAnchor = from === 1 ? ZERO_HASH : url.searchParams.get("previousHash");
      if (!Number.isSafeInteger(from) || from < 1 || from > head.sequence + 1 ||
          !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_VERIFY_PAGE ||
          typeof suppliedAnchor !== "string" || !/^[a-f0-9]{64}$/.test(suppliedAnchor) ||
          (from === 1 && suppliedAnchor !== ZERO_HASH)) {
        return json({ error: "INVALID_EXPORT_CURSOR", maxPageSize: MAX_VERIFY_PAGE }, 400);
      }
      let previousHash = ZERO_HASH;
      if (from > 1) {
        const priorRecord = await this.state.storage.get("event:" + String(from - 1).padStart(12, "0"));
        if (!priorRecord || priorRecord.sequence !== from - 1 || priorRecord.eventHash !== suppliedAnchor) {
          return json({ error: "INVALID_EXPORT_CURSOR" }, 400);
        }
        previousHash = priorRecord.eventHash;
      }
      const end = Math.min(head.sequence, from + limit - 1);
      const records = [];
      for (let sequence = from; sequence <= end; sequence += 1) {
        const record = await this.state.storage.get("event:" + String(sequence).padStart(12, "0"));
        if (!record || record.sequence !== sequence || record.previousHash !== previousHash) {
          return json({ valid: false, verifiedEvents: records.length, expectedSequence: sequence }, 409);
        }
        const { sequence: storedSequence, previousHash: storedPreviousHash, eventHash, ...eventPayload } = record;
        const hashPayload = { ...record };
        delete hashPayload.eventHash;
        if (storedSequence !== sequence || storedPreviousHash !== previousHash || !validEvent(eventPayload) ||
            !/^[a-f0-9]{64}$/.test(eventHash || "") || await sha256(canonical(hashPayload)) !== eventHash) {
          return json({ valid: false, verifiedEvents: records.length, invalidSequence: sequence }, 409);
        }
        records.push(record);
        previousHash = eventHash;
      }
      const complete = end === head.sequence;
      if (complete && previousHash !== head.hash) return json({ valid: false, verifiedEvents: records.length, invalidHead: true }, 409);
      return json({
        valid: true, records, verifiedFrom: from, verifiedThrough: end, complete,
        headSequence: head.sequence, headHash: complete ? head.hash : undefined,
        next: complete ? null : { from: end + 1, previousHash },
      });
    }

    return json({ error: "NOT_FOUND" }, 404);
  }
}
