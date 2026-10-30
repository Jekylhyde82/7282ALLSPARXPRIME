const ZERO_HASH = "0".repeat(64);
const EVENT_TYPES = new Set(["ATTEMPTED", "SUCCEEDED", "FAILED", "VERIFIED", "CONTRADICTED"]);
const MAX_BODY_BYTES = 4096;

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
function validEvent(event) {
  return event && typeof event === "object" &&
    typeof event.operationId === "string" && /^[a-zA-Z0-9._:-]{1,128}$/.test(event.operationId) &&
    EVENT_TYPES.has(event.eventType) &&
    typeof event.status === "string" && event.status.length <= 64 &&
    typeof event.timestamp === "string" && !Number.isNaN(Date.parse(event.timestamp)) &&
    event.actor && event.actor.type === "anonymous-origin" && typeof event.actor.origin === "string" &&
    event.provenance && typeof event.provenance.system === "string" &&
    typeof event.provenance.producer === "string" &&
    typeof event.provenance.environment === "string" &&
    typeof event.objective === "string" && event.objective.length <= 128 &&
    typeof event.promptSha256 === "string" && /^[a-f0-9]{64}$/.test(event.promptSha256) &&
    (event.provider === null || typeof event.provider === "string") &&
    typeof event.outcomeCode === "string" && event.outcomeCode.length <= 64;
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
        const sequence = head.sequence + 1;
        const record = {
          sequence,
          operationId: event.operationId,
          eventType: event.eventType,
          status: event.status,
          timestamp: event.timestamp,
          provenance: event.provenance,
          actor: event.actor,
          objective: event.objective,
          promptSha256: event.promptSha256,
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
      let previousHash = ZERO_HASH;
      for (let sequence = 1; sequence <= head.sequence; sequence += 1) {
        const record = await this.state.storage.get(`event:${String(sequence).padStart(12, "0")}`);
        if (!record || record.sequence !== sequence || record.previousHash !== previousHash) {
          return json({ valid: false, verifiedEvents: sequence - 1, expectedSequence: sequence }, 409);
        }
        const { eventHash, ...payload } = record;
        const calculated = await sha256(canonical(payload));
        if (calculated !== eventHash) {
          return json({ valid: false, verifiedEvents: sequence - 1, invalidSequence: sequence }, 409);
        }
        previousHash = eventHash;
      }
      if (previousHash !== head.hash) return json({ valid: false, verifiedEvents: head.sequence, invalidHead: true }, 409);
      return json({ valid: true, verifiedEvents: head.sequence, headHash: head.hash });
    }

    return json({ error: "NOT_FOUND" }, 404);
  }
}
