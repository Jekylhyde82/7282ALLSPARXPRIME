import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest, UserRateLimiter } from "../src/worker.mjs";

const encoder = new TextEncoder();
const b64url = (bytes) => Buffer.from(bytes).toString("base64url");
const baseEnv = {
  ASSETS: { fetch: async () => new Response("asset") },
  USER_RATE_LIMITER_DO: {
    idFromName: (key) => key,
    get: () => ({ fetch: async () => Response.json({ success: true, retryAfter: 60 }) }),
  },
};
const tokenFixture = await makeToken();

async function makeToken() {
  const pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true, ["sign", "verify"],
  );
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  jwk.kid = "test-key";
  jwk.alg = "RS256";
  jwk.key_ops = ["verify"];
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test-key" })));
  const payload = b64url(encoder.encode(JSON.stringify({
    iss: "https://project.supabase.co/auth/v1", aud: "authenticated",
    sub: "user-123", role: "authenticated", iat: now, exp: now + 300,
  })));
  const input = header + "." + payload;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, encoder.encode(input));
  return { token: input + "." + b64url(signature), jwk };
}

test("serves static assets through the existing asset binding", async () => {
  const response = await handleRequest(new Request("https://example.test/"), baseEnv);
  assert.equal(await response.text(), "asset");
});

test("rejects unapproved origins before processing API requests", async () => {
  const response = await handleRequest(new Request("https://example.test/api/allsparx/v1/ask", {
    method: "POST", headers: { origin: "https://attacker.test" },
  }), { ...baseEnv, ALLOWED_ORIGINS: "https://app.example.test" });
  assert.equal(response.status, 403);
});

test("does not expose an API route when the gateway is not configured", async () => {
  const response = await handleRequest(new Request("https://example.test/api/allsparx/v1/ask", {
    method: "POST",
  }), baseEnv);
  assert.equal(response.status, 503);
});

test("rejects non-POST methods for the gateway", async () => {
  const response = await handleRequest(new Request("https://example.test/api/allsparx/v1/ask", {
    method: "GET",
  }), { ...baseEnv, SUPABASE_URL: "https://project.supabase.co", ALLOWED_ORIGINS: "https://app.example.test", USER_RATE_LIMITER_DO: { idFromName: (key) => key, get: () => ({ fetch: async () => Response.json({ success: true, retryAfter: 60 }) }) } });
  assert.equal(response.status, 405);
});

test("rejects an unapproved origin on OPTIONS preflight", async () => {
  const response = await handleRequest(new Request("https://example.test/api/allsparx/v1/ask", {
    method: "OPTIONS", headers: { origin: "https://bad.example" },
  }), { ...baseEnv, ALLOWED_ORIGINS: "https://app.example.test" });
  assert.equal(response.status, 403);
});

test("requires a bearer token before calling any provider", async () => {
  const response = await handleRequest(new Request("https://example.test/api/allsparx/v1/ask", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt: "hello", task: "startup-deal-recommendation", provider: "auto", contractVersion: 1, catalog: ["Starter"] }),
  }), {
    ...baseEnv, SUPABASE_URL: "https://project.supabase.co",
    ALLOWED_ORIGINS: "https://app.example.test",
    USER_RATE_LIMITER_DO: { idFromName: (key) => key, get: () => ({ fetch: async () => Response.json({ success: true, retryAfter: 60 }) }) },
  });
  assert.equal(response.status, 401);
});

test("verifies Supabase JWT, applies per-user rate limit, and routes to configured provider", async () => {
  const { token, jwk } = tokenFixture;
  const originalFetch = globalThis.fetch;
  let limitedKey = "";
  globalThis.fetch = async (url) => {
    if (String(url).endsWith("/auth/v1/.well-known/jwks.json")) {
      return Response.json({ keys: [jwk] });
    }
    if (String(url) === "https://api.openai.com/v1/chat/completions") {
      return Response.json({ choices: [{ message: { content: JSON.stringify({ summary: "Verified route", programs: [{ title: "Starter" }, { title: "Invented" }] }) } }] });
    }
    throw new Error("Unexpected network request");
  };
  try {
    const response = await handleRequest(new Request("https://example.test/api/allsparx/v1/ask", {
      method: "POST",
      headers: {
        authorization: "Bearer " + token, origin: "https://app.example.test",
        "content-type": "application/json", "x-allsparx-request-id": "test-request",
      },
      body: JSON.stringify({ prompt: "hello", task: "startup-deal-recommendation", provider: "auto", contractVersion: 1, catalog: ["Starter"] }),
    }), {
      ...baseEnv, SUPABASE_URL: "https://project.supabase.co",
      ALLOWED_ORIGINS: "https://app.example.test",
      OPENAI_API_KEY: "test-only", OPENAI_MODEL: "test-model",
      USER_RATE_LIMITER_DO: {
        idFromName: (key) => { limitedKey = key; return key; },
        get: () => ({ fetch: async () => Response.json({ success: true, retryAfter: 60 }) }),
      },
    });
    assert.equal(response.status, 200);
    assert.equal(limitedKey, "user-123");
    const body = await response.json();
    assert.equal(body.provider, "openai");
    assert.equal(body.summary, "Verified route");
    assert.deepEqual(body.programs, [{ title: "Starter" }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("returns 503 when the Supabase JWKS endpoint is temporarily unavailable", async () => {
  const { token } = tokenFixture;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new TypeError("network unavailable"); };
  try {
    const response = await handleRequest(new Request("https://example.test/api/allsparx/v1/ask", {
      method: "POST", headers: { authorization: "Bearer " + token },
    }), {
      ...baseEnv, SUPABASE_URL: "https://jwks-outage.supabase.co",
      ALLOWED_ORIGINS: "https://app.example.test",
    });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, "authentication_unavailable");
    assert.equal(response.headers.get("retry-after"), "5");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("returns 429 when the configured user rate limiter rejects a request", async () => {
  const { token, jwk } = tokenFixture;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ keys: [jwk] });
  try {
    const response = await handleRequest(new Request("https://example.test/api/allsparx/v1/ask", {
      method: "POST", headers: { authorization: "Bearer " + token },
    }), {
      ...baseEnv, SUPABASE_URL: "https://project.supabase.co",
      ALLOWED_ORIGINS: "https://app.example.test",
      USER_RATE_LIMITER_DO: { idFromName: (key) => key, get: () => ({ fetch: async () => Response.json({ success: false, retryAfter: 37 }) }) },
    });
    assert.equal(response.status, 429);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects non-JSON content types after authentication", async () => {
  const { token } = tokenFixture;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ keys: [tokenFixture.jwk] });
  try {
    const response = await handleRequest(new Request("https://example.test/api/allsparx/v1/ask", {
      method: "POST", headers: { authorization: "Bearer " + token, "content-type": "text/plain" }, body: "{}",
    }), {
      ...baseEnv, SUPABASE_URL: "https://project.supabase.co", ALLOWED_ORIGINS: "https://app.example.test",
      USER_RATE_LIMITER_DO: { idFromName: (key) => key, get: () => ({ fetch: async () => Response.json({ success: true, retryAfter: 60 }) }) },
    });
    assert.equal(response.status, 415);
  } finally { globalThis.fetch = originalFetch; }
});

test("rejects oversized request bodies before JSON parsing", async () => {
  const { token } = tokenFixture;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ keys: [tokenFixture.jwk] });
  try {
    const response = await handleRequest(new Request("https://example.test/api/allsparx/v1/ask", {
      method: "POST",
      headers: { authorization: "Bearer " + token, "content-type": "application/json" },
      body: JSON.stringify({ prompt: "x".repeat(49 * 1024) }),
    }), {
      ...baseEnv, SUPABASE_URL: "https://project.supabase.co", ALLOWED_ORIGINS: "https://app.example.test",
      USER_RATE_LIMITER_DO: { idFromName: (key) => key, get: () => ({ fetch: async () => Response.json({ success: true, retryAfter: 60 }) }) },
    });
    assert.equal(response.status, 413);
  } finally { globalThis.fetch = originalFetch; }
});

test("Durable Object limiter enforces a serialized per-user window", async () => {
  const values = new Map();
  const state = {
    storage: {
      kv: {
        get: (key) => values.get(key),
        put: (key, value) => values.set(key, value),
      },
    },
  };
  const limiter = new UserRateLimiter(state);
  for (let i = 0; i < 12; i++) {
    const response = await limiter.fetch(new Request("https://rate-limiter/check", { method: "POST" }));
    assert.equal((await response.json()).success, true);
  }
  const rejected = await limiter.fetch(new Request("https://rate-limiter/check", { method: "POST" }));
  const body = await rejected.json();
  assert.equal(body.success, false);
  assert.ok(body.retryAfter >= 1);
});


test("does not fall back to another provider after an invalid provider response", async () => {
  const { token, jwk } = tokenFixture;
  const originalFetch = globalThis.fetch;
  let anthropicCalls = 0;
  globalThis.fetch = async (url) => {
    if (String(url).endsWith("/auth/v1/.well-known/jwks.json")) return Response.json({ keys: [jwk] });
    if (String(url) === "https://api.openai.com/v1/chat/completions") {
      return Response.json({ choices: [{ message: { content: "" } }] });
    }
    if (String(url) === "https://api.anthropic.com/v1/messages") {
      anthropicCalls++;
      return Response.json({ content: [{ type: "text", text: JSON.stringify({ summary: "unexpected fallback", programs: [] }) }] });
    }
    throw new Error("Unexpected network request");
  };
  try {
    const response = await handleRequest(new Request("https://example.test/api/allsparx/v1/ask", {
      method: "POST",
      headers: { authorization: "Bearer " + token, "content-type": "application/json" },
      body: JSON.stringify({ prompt: "hello", task: "startup-deal-recommendation", provider: "auto", contractVersion: 1, catalog: [] }),
    }), {
      ...baseEnv, SUPABASE_URL: "https://project.supabase.co", ALLOWED_ORIGINS: "https://app.example.test",
      OPENAI_API_KEY: "test-only", OPENAI_MODEL: "test-model",
      ANTHROPIC_API_KEY: "test-only", ANTHROPIC_MODEL: "test-model",
    });
    assert.equal(response.status, 502);
    assert.equal(anthropicCalls, 0);
  } finally { globalThis.fetch = originalFetch; }
});

test("rejects oversized provider response bodies", async () => {
  const { token, jwk } = tokenFixture;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).endsWith("/auth/v1/.well-known/jwks.json")) return Response.json({ keys: [jwk] });
    if (String(url) === "https://api.openai.com/v1/chat/completions") {
      return new Response("x".repeat(65 * 1024), {
        status: 200,
        headers: { "content-type": "application/json", "content-length": String(65 * 1024) },
      });
    }
    throw new Error("Unexpected network request");
  };
  try {
    const response = await handleRequest(new Request("https://example.test/api/allsparx/v1/ask", {
      method: "POST",
      headers: { authorization: "Bearer " + token, "content-type": "application/json" },
      body: JSON.stringify({ prompt: "hello", task: "startup-deal-recommendation", provider: "auto", contractVersion: 1, catalog: [] }),
    }), {
      ...baseEnv, SUPABASE_URL: "https://project.supabase.co", ALLOWED_ORIGINS: "https://app.example.test",
      OPENAI_API_KEY: "test-only", OPENAI_MODEL: "test-model",
    });
    assert.equal(response.status, 502);
  } finally { globalThis.fetch = originalFetch; }
});
