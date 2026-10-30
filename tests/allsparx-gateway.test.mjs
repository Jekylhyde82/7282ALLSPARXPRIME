import test from "node:test";
import assert from "node:assert/strict";
import worker, { EvidenceLedger, RateLimiter, SpendBudget } from "../workers/allsparx-gateway/src/index.js";

const originalFetch = globalThis.fetch;
test.beforeEach(() => {
  globalThis.fetch = async (url) => {
    if (String(url).includes("/siteverify")) {
      return Response.json({ success: true, hostname: "cloudcredits.io", action: "allsparx_assistant" });
    }
    throw new Error("Unexpected outbound request in test");
  };
});
test.after(() => { globalThis.fetch = originalFetch; });

const stubNamespace = (fetchFn = async () => new Response("ok")) => ({
  idFromName: () => "test-object",
  get: () => ({ fetch: fetchFn }),
});
function transactionalState(store = new Map()) {
  let tail = Promise.resolve();
  const transact = async (callback) => {
    const previous = tail;
    let release;
    tail = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      return await callback({
        get: async (key) => store.get(key),
        put: async (key, value, options) => store.set(key, value),
      });
    } finally {
      release();
    }
  };
  return {
    storage: {
      get: async (key) => store.get(key),
      put: async (key, value, options) => store.set(key, value),
      transaction: transact,
    },
  };
}
function env(overrides = {}) {
  return {
    ALLOWED_ORIGINS: "https://cloudcredits.io",
    RATE_LIMITER: stubNamespace(),
    SPEND_BUDGET: stubNamespace(),
    EVIDENCE_LEDGER: stubNamespace(async () => Response.json({ stored: true }, { status: 201 })),
    EVIDENCE_HMAC_KEY: "test-evidence-hmac-key",
    OPENAI_MODEL: "test-openai-model",
    ANTHROPIC_MODEL: "test-anthropic-model",
    GOOGLE_MODEL: "test-google-model",
    TURNSTILE_SECRET_KEY: "test-secret",
    ...overrides,
  };
}
const request = (path = "/v1/ask", options = {}) => new Request("https://gateway.example" + path, {
  method: "POST",
  headers: {
    Origin: "https://cloudcredits.io",
    "content-type": "application/json",
    "X-ALLSPARX-Turnstile-Token": "valid-test-token",
    "X-ALLSPARX-Request-ID": "test-request-001",
    ...options.headers,
  },
  body: options.body ?? JSON.stringify({
    prompt: "Find startup credits",
    task: "startup-deal-recommendation",
    provider: "auto",
    contractVersion: 1,
  }),
});

test("health endpoint reports liveness without exposing configuration", async () => {
  const response = await worker.fetch(new Request("https://gateway.example/healthz"), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", service: "allsparx-prime-gateway" });
});
test("rejects an unapproved origin before invoking dependencies", async () => {
  const response = await worker.fetch(new Request("https://gateway.example/v1/ask", {
    method: "POST", headers: { Origin: "https://evil.example" },
  }), env());
  assert.equal(response.status, 403);
});
test("answers preflight only for approved origins and allowed headers", async () => {
  const response = await worker.fetch(new Request("https://gateway.example/v1/ask", {
    method: "OPTIONS", headers: { Origin: "https://cloudcredits.io" },
  }), env());
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://cloudcredits.io");
  assert.match(response.headers.get("access-control-allow-headers"), /x-allsparx-turnstile-token/);
  assert.match(response.headers.get("access-control-expose-headers"), /x-allsparx-request-id/);
});
test("rejects unknown API paths", async () => {
  const response = await worker.fetch(request("/v1/unknown"), env());
  assert.equal(response.status, 404);
});
test("rejects methods other than POST and OPTIONS", async () => {
  const response = await worker.fetch(new Request("https://gateway.example/v1/ask", {
    method: "GET", headers: { Origin: "https://cloudcredits.io" },
  }), env());
  assert.equal(response.status, 405);
});
test("fails closed when Turnstile is not configured", async () => {
  const response = await worker.fetch(request(), env({ TURNSTILE_SECRET_KEY: undefined }));
  assert.equal(response.status, 503);
});
test("rejects malformed and non-object Turnstile verification responses", async () => {
  for (const payload of ["not-json", "null", "[]"]) {
    globalThis.fetch = async () => new Response(payload, { status: 200 });
    const response = await worker.fetch(request(), env());
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: "CHALLENGE_FAILED" });
  }
});
test("rejects oversized Turnstile verification responses without parsing them", async () => {
  globalThis.fetch = async () => new Response("x".repeat(16 * 1024 + 1), { status: 200 });
  const response = await worker.fetch(request(), env());
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "CHALLENGE_FAILED" });
});
test("rejects a Turnstile action mismatch", async () => {
  globalThis.fetch = async () => Response.json({ success: true, hostname: "cloudcredits.io", action: "different_action" });
  const response = await worker.fetch(request(), env());
  assert.equal(response.status, 403);
});
test("rejects a Turnstile hostname mismatch", async () => {
  globalThis.fetch = async () => Response.json({ success: true, hostname: "attacker.example", action: "allsparx_assistant" });
  const response = await worker.fetch(request(), env());
  assert.equal(response.status, 403);
});
test("rejects non-JSON content types", async () => {
  const response = await worker.fetch(request("/v1/ask", {
    headers: { "content-type": "text/plain" },
  }), env());
  assert.equal(response.status, 415);
});
test("rejects invalid task and provider contract after challenge validation", async () => {
  const response = await worker.fetch(request("/v1/ask", {
    body: JSON.stringify({ prompt: "x", task: "other", provider: "auto", contractVersion: 1 }),
  }), env());
  assert.equal(response.status, 400);
});
test("rejects request bodies above the 8 KiB limit", async () => {
  const response = await worker.fetch(request("/v1/ask", {
    body: JSON.stringify({ prompt: "x".repeat(9000), task: "startup-deal-recommendation", provider: "auto", contractVersion: 1 }),
  }), env());
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "BODY_TOO_LARGE" });
});
test("does not reserve budget when the requested provider is unavailable", async () => {
  let reservations = 0;
  const response = await worker.fetch(request("/v1/ask", {
    body: JSON.stringify({ prompt: "x", task: "startup-deal-recommendation", provider: "openai", contractVersion: 1 }),
  }), env({
    SPEND_BUDGET: stubNamespace(async () => { reservations += 1; return new Response("ok"); }),
  }));
  assert.equal(response.status, 503);
  assert.equal(reservations, 0);
});
test("does not configure providers with blank, padded, control-character, or oversized credentials", async () => {
  const cases = [
    ["openai", "OPENAI_API_KEY", "OPENAI_MODEL"],
    ["anthropic", "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL"],
    ["google", "GOOGLE_API_KEY", "GOOGLE_MODEL"],
  ];
  for (const [provider, keyName, modelName] of cases) {
    for (const key of ["   ", " padded-key", "key" + String.fromCharCode(10) + "value", "k".repeat(4097)]) {
      const response = await worker.fetch(request("/v1/ask", {
        body: JSON.stringify({ prompt: "x", task: "startup-deal-recommendation", provider, contractVersion: 1 }),
      }), env({ [keyName]: key }));
      assert.equal(response.status, 503, `${provider} unexpectedly accepted credential ${JSON.stringify(key)}`);
      assert.deepEqual(await response.json(), { error: "PROVIDER_UNAVAILABLE" });
    }
  }
});

test("does not treat an API key without an explicit model ID as a configured provider", async () => {
  const response = await worker.fetch(request("/v1/ask", {
    body: JSON.stringify({ prompt: "x", task: "startup-deal-recommendation", provider: "openai", contractVersion: 1 }),
  }), env({ OPENAI_API_KEY: "test-openai-key", OPENAI_MODEL: undefined }));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "PROVIDER_UNAVAILABLE" });
});

test("rejects blank, padded, control-character, and oversized provider model IDs", async () => {
  for (const model of ["   ", " test-model", "test-model" + String.fromCharCode(10), "test" + String.fromCharCode(10) + "model", "m".repeat(129)]) {
    const response = await worker.fetch(request("/v1/ask", {
      body: JSON.stringify({ prompt: "x", task: "startup-deal-recommendation", provider: "openai", contractVersion: 1 }),
    }), env({ OPENAI_API_KEY: "test-openai-key", OPENAI_MODEL: model }));
    assert.equal(response.status, 503, `unexpectedly accepted model ID: ${JSON.stringify(model)}`);
    assert.deepEqual(await response.json(), { error: "PROVIDER_UNAVAILABLE" });
  }
});

test("does not route local Ollama through the public Worker", async () => {
  const response = await worker.fetch(request("/v1/ask", {
    body: JSON.stringify({ prompt: "x", task: "startup-deal-recommendation", provider: "ollama", contractVersion: 1 }),
  }), env());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "PROVIDER_UNAVAILABLE" });
});
test("successful OpenAI request returns the validated response contract and request ID", async () => {
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("/siteverify")) {
      return Response.json({ success: true, hostname: "cloudcredits.io", action: "allsparx_assistant" });
    }
    if (String(url) === "https://api.openai.com/v1/responses") {
      assert.equal(JSON.parse(init?.body || "{}").model, "test-openai-model");
      return Response.json({
        output: [{ content: [{ type: "output_text", text: JSON.stringify({
          summary: "Validated summary", programs: [{ title: "Startup credits" }],
        }) }] }],
      });
    }
    throw new Error("Unexpected outbound request");
  };
  const response = await worker.fetch(request("/v1/ask", {
    body: JSON.stringify({ prompt: "Find startup credits", task: "startup-deal-recommendation", provider: "openai", contractVersion: 1 }),
  }), env({ OPENAI_API_KEY: "test-provider-key" }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-allsparx-request-id"), "test-request-001");
  assert.deepEqual(await response.json(), {
    summary: "Validated summary", programs: [{ title: "Startup credits" }], provider: "openai",
  });
});
test("rate limiter enforces a fixed one-minute window", async () => {
  const store = new Map();
  const state = transactionalState(store);
  const limiter = new RateLimiter(state, { RATE_LIMIT_PER_MINUTE: "2" });
  assert.equal((await limiter.fetch()).status, 200);
  assert.equal((await limiter.fetch()).status, 200);
  assert.equal((await limiter.fetch()).status, 429);
});
test("rate limiter remains within its limit under concurrent requests", async () => {
  const state = transactionalState();
  const limiter = new RateLimiter(state, { RATE_LIMIT_PER_MINUTE: "5" });
  const responses = await Promise.all(Array.from({ length: 25 }, () => limiter.fetch()));
  assert.equal(responses.filter((response) => response.status === 200).length, 5);
  assert.equal(responses.filter((response) => response.status === 429).length, 20);
});
test("monthly reservation guard refuses reservations above its configured ceiling", async () => {
  const store = new Map();
  const state = transactionalState(store);
  const budget = new SpendBudget(state, {
    MAX_REQUEST_COST_MICROS: "50000",
    MONTHLY_SPEND_LIMIT_MICROS: "50000",
  });
  assert.equal((await budget.fetch()).status, 200);
  assert.equal((await budget.fetch()).status, 429);
});
test("monthly spend reservations cannot exceed the cap under concurrent requests", async () => {
  const state = transactionalState();
  const budget = new SpendBudget(state, {
    MAX_REQUEST_COST_MICROS: "50000",
    MONTHLY_SPEND_LIMIT_MICROS: "250000",
  });
  const responses = await Promise.all(Array.from({ length: 25 }, () => budget.fetch()));
  assert.equal(responses.filter((response) => response.status === 200).length, 5);
  assert.equal(responses.filter((response) => response.status === 429).length, 20);
});

test("fails closed when durable evidence storage is unavailable", async () => {
  const response = await worker.fetch(request(), env({ EVIDENCE_LEDGER: undefined }));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "GATEWAY_NOT_CONFIGURED" });
});
test("records attempt and success before returning a provider response", async () => {
  const events = [];
  const evidenceNamespace = stubNamespace(async (_url, options) => {
    events.push(JSON.parse(options.body));
    return Response.json({ stored: true }, { status: 201 });
  });
  globalThis.fetch = async (url) => {
    if (String(url).includes("/siteverify")) return Response.json({
      success: true, hostname: "cloudcredits.io", action: "allsparx_assistant",
    });
    if (String(url) === "https://api.openai.com/v1/responses") return Response.json({
      output: [{ content: [{ type: "output_text", text: JSON.stringify({ summary: "Recorded", programs: [] }) }] }],
    });
    throw new Error("Unexpected outbound request");
  };
  const response = await worker.fetch(request("/v1/ask", {
    body: JSON.stringify({ prompt: "Find startup credits", task: "startup-deal-recommendation", provider: "openai", contractVersion: 1 }),
  }), env({ OPENAI_API_KEY: "test-provider-key", EVIDENCE_LEDGER: evidenceNamespace }));
  assert.equal(response.status, 200);
  assert.deepEqual(events.map((event) => event.eventType), ["ATTEMPTED", "SUCCEEDED"]);
  assert.match(events[0].operationId, /^[a-f0-9-]{36}$/);
  assert.equal(events[0].correlationId, "test-request-001");
  assert.match(events[0].promptHmacSha256, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(events).includes("Find startup credits"), false);
  assert.equal(events[1].provider, "openai");
});
test("automatic provider fallback reserves budget separately for each billable attempt", async () => {
  let reservations = 0;
  const budgetNamespace = stubNamespace(async () => {
    reservations += 1;
    return new Response("reserved");
  });
  globalThis.fetch = async (url) => {
    if (String(url).includes("/siteverify")) return Response.json({
      success: true, hostname: "cloudcredits.io", action: "allsparx_assistant",
    });
    if (String(url) === "https://api.openai.com/v1/responses") {
      return Response.json({ error: { message: "temporary provider failure" } }, { status: 500 });
    }
    if (String(url) === "https://api.anthropic.com/v1/messages") {
      return Response.json({ content: [{ type: "text", text: "Fallback succeeded" }] });
    }
    throw new Error("Unexpected outbound request");
  };
  const response = await worker.fetch(request("/v1/ask", {
    body: JSON.stringify({ prompt: "Find startup credits", task: "startup-deal-recommendation", provider: "auto", contractVersion: 1 }),
  }), env({
    OPENAI_API_KEY: "test-openai-key",
    ANTHROPIC_API_KEY: "test-anthropic-key",
    SPEND_BUDGET: budgetNamespace,
  }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).provider, "anthropic");
  assert.equal(reservations, 2);
});

test("hash-chained evidence ledger verifies appended records and detects tampering", async () => {
  const store = new Map();
  const storage = {
    get: async (key) => store.get(key),
    put: async (key, value) => store.set(key, value),
    transaction: async (callback) => callback({
      get: async (key) => store.get(key),
      put: async (key, value) => store.set(key, value),
    }),
  };
  const ledger = new EvidenceLedger({ storage });
  const event = {
    operationId: "00000000-0000-4000-8000-000000000001",
    eventType: "ATTEMPTED",
    status: "ATTEMPTED",
    timestamp: "2026-10-30T02:00:00.000Z",
    actor: { type: "anonymous-origin", origin: "https://cloudcredits.io" },
    correlationId: "test-correlation-1",
    provenance: { system: "ALLSPARX PRIME", producer: "gateway", environment: "test", deploymentId: "test-build" },
    objective: "startup-deal-recommendation",
    promptHmacSha256: "a".repeat(64),
    provider: null,
    outcomeCode: "REQUEST_ACCEPTED",
  };
  const appended = await ledger.fetch(new Request("https://evidence/append", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(event),
  }));
  assert.equal(appended.status, 201);
  const verified = await ledger.fetch(new Request("https://evidence/verify"));
  assert.equal(verified.status, 200);
  assert.equal((await verified.json()).valid, true);
  const stored = store.get("event:000000000001");
  store.set("event:000000000001", { ...stored, outcomeCode: "ALTERED" });
  const tampered = await ledger.fetch(new Request("https://evidence/verify"));
  assert.equal(tampered.status, 409);
  assert.equal((await tampered.json()).valid, false);
});
test("evidence verification is paginated and hash-linked across pages", async () => {
  const store = new Map();
  const storage = { get: async (key) => store.get(key), put: async (key, value) => store.set(key, value), transaction: async (callback) => callback({ get: async (key) => store.get(key), put: async (key, value) => store.set(key, value) }) };
  const ledger = new EvidenceLedger({ storage });
  for (let i = 1; i <= 3; i += 1) {
    const event = { operationId: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, correlationId: `test-${i}`, eventType: "ATTEMPTED", status: "ATTEMPTED", timestamp: `2026-10-30T02:00:0${i}.000Z`, actor: { type: "anonymous-origin", origin: "https://cloudcredits.io" }, provenance: { system: "ALLSPARX PRIME", producer: "gateway", environment: "test", deploymentId: "test-build" }, objective: "startup-deal-recommendation", promptHmacSha256: "a".repeat(64), provider: null, outcomeCode: "REQUEST_ACCEPTED" };
    const appended = await ledger.fetch(new Request("https://evidence/append", { method: "POST", body: JSON.stringify(event) }));
    assert.equal(appended.status, 201);
  }
  const first = await (await ledger.fetch(new Request("https://evidence/verify?limit=2"))).json();
  assert.equal(first.valid, true);
  assert.equal(first.complete, false);
  assert.equal(first.verifiedEvents, 2);
  const cursor = new URLSearchParams({ from: String(first.next.from), previousHash: first.next.previousHash });
  const forgedCursor = await ledger.fetch(new Request("https://evidence/verify?from=3&previousHash=" + "f".repeat(64)));
  assert.equal(forgedCursor.status, 400);
  const second = await (await ledger.fetch(new Request("https://evidence/verify?" + cursor))).json();
  assert.equal(second.valid, true);
  assert.equal(second.complete, true);
  assert.equal(second.verifiedEvents, 1);
  const oversizedPage = await ledger.fetch(new Request("https://evidence/verify?limit=101"));
  assert.equal(oversizedPage.status, 400);
});

test("evidence ledger rejects malformed provenance and non-canonical origins", async () => {
  const store = new Map();
  const storage = { get: async (key) => store.get(key), put: async (key, value) => store.set(key, value), transaction: async (callback) => callback({ get: async (key) => store.get(key), put: async (key, value) => store.set(key, value) }) };
  const ledger = new EvidenceLedger({ storage });
  const event = { operationId: "00000000-0000-4000-8000-000000000001", correlationId: "test-1", eventType: "ATTEMPTED", status: "ATTEMPTED", timestamp: "2026-10-30T02:00:00.000Z", actor: { type: "anonymous-origin", origin: "https://cloudcredits.io/path" }, provenance: { system: "ALLSPARX PRIME", producer: "gateway", environment: "test", deploymentId: "" }, objective: "startup-deal-recommendation", promptHmacSha256: "a".repeat(64), provider: null, outcomeCode: "REQUEST_ACCEPTED" };
  const response = await ledger.fetch(new Request("https://evidence/append", { method: "POST", body: JSON.stringify(event) }));
  assert.equal(response.status, 400);
});
test("evidence ledger rejects invalid and oversized records", async () => {
  const store = new Map();
  const storage = {
    get: async (key) => store.get(key),
    put: async (key, value) => store.set(key, value),
    transaction: async (callback) => callback({
      get: async (key) => store.get(key),
      put: async (key, value) => store.set(key, value),
    }),
  };
  const ledger = new EvidenceLedger({ storage });
  const invalid = await ledger.fetch(new Request("https://evidence/append", {
    method: "POST", body: JSON.stringify({ operationId: "bad" }),
  }));
  assert.equal(invalid.status, 400);
  const oversized = await ledger.fetch(new Request("https://evidence/append", {
    method: "POST", body: "x".repeat(5000),
  }));
  assert.equal(oversized.status, 400);
});



test("automatic provider fallback handles transient network failures", async () => {
  globalThis.fetch = async (url) => {
    if (String(url).includes("/siteverify")) return Response.json({
      success: true, hostname: "cloudcredits.io", action: "allsparx_assistant",
    });
    if (String(url) === "https://api.openai.com/v1/responses") {
      throw new TypeError("simulated transient network failure");
    }
    if (String(url) === "https://api.anthropic.com/v1/messages") {
      return Response.json({ content: [{ type: "text", text: "Fallback succeeded" }] });
    }
    throw new Error("Unexpected outbound request");
  };
  const response = await worker.fetch(request("/v1/ask", {
    body: JSON.stringify({
      prompt: "Find startup credits", task: "startup-deal-recommendation",
      provider: "auto", contractVersion: 1,
    }),
  }), env({
    OPENAI_API_KEY: "test-openai-key",
    ANTHROPIC_API_KEY: "test-anthropic-key",
  }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).provider, "anthropic");
});

test("automatic provider fallback handles non-JSON retryable provider errors", async () => {
  globalThis.fetch = async (url) => {
    if (String(url).includes("/siteverify")) return Response.json({
      success: true, hostname: "cloudcredits.io", action: "allsparx_assistant",
    });
    if (String(url) === "https://api.openai.com/v1/responses") {
      return new Response("upstream temporarily unavailable", {
        status: 503, headers: { "content-type": "text/plain" },
      });
    }
    if (String(url) === "https://api.anthropic.com/v1/messages") {
      return Response.json({ content: [{ type: "text", text: "Fallback succeeded" }] });
    }
    throw new Error("Unexpected outbound request");
  };
  const response = await worker.fetch(request("/v1/ask", {
    body: JSON.stringify({
      prompt: "Find startup credits", task: "startup-deal-recommendation",
      provider: "auto", contractVersion: 1,
    }),
  }), env({
    OPENAI_API_KEY: "test-openai-key",
    ANTHROPIC_API_KEY: "test-anthropic-key",
  }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).provider, "anthropic");
});


test("evidence ledger rejects lifecycle labels that misstate the outcome", async () => {
  const store = new Map();
  const storage = {
    get: async (key) => store.get(key),
    put: async (key, value) => store.set(key, value),
    transaction: async (callback) => callback({
      get: async (key) => store.get(key),
      put: async (key, value) => store.set(key, value),
    }),
  };
  const ledger = new EvidenceLedger({ storage });
  const event = {
    operationId: "00000000-0000-4000-8000-000000000001",
    correlationId: "test-lifecycle-1",
    eventType: "SUCCEEDED",
    status: "ATTEMPTED",
    timestamp: "2026-10-30T02:00:00.000Z",
    actor: { type: "anonymous-origin", origin: "https://cloudcredits.io" },
    provenance: { system: "ALLSPARX PRIME", producer: "gateway", environment: "test", deploymentId: "test-build" },
    objective: "startup-deal-recommendation",
    promptHmacSha256: "a".repeat(64),
    provider: "openai",
    outcomeCode: "REQUEST_ACCEPTED",
  };
  const response = await ledger.fetch(new Request("https://evidence/append", {
    method: "POST", body: JSON.stringify(event),
  }));
  assert.equal(response.status, 400);
  assert.equal(store.has("head"), false);
});
