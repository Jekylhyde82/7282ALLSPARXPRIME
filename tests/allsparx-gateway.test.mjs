import test from "node:test";
import assert from "node:assert/strict";
import worker, { RateLimiter, SpendBudget } from "../workers/allsparx-gateway/src/index.js";

function env(overrides = {}) {
  return {
    ALLOWED_ORIGINS: "https://cloudcredits.io",
    RATE_LIMITER: { get: () => ({ fetch: async () => new Response("ok") }) },
    SPEND_BUDGET: { get: () => ({ fetch: async () => new Response("ok") }) },
    TURNSTILE_SECRET_KEY: "test-secret",
    ...overrides,
  };
}
const request = (path = "/v1/ask", options = {}) => new Request("https://gateway.example" + path, {
  method: "POST", headers: { Origin: "https://cloudcredits.io", "content-type": "application/json", ...options.headers },
  body: options.body ?? JSON.stringify({ prompt: "Find startup credits", task: "startup-deal-recommendation", provider: "auto", contractVersion: 1 }),
});

test("rejects an unapproved origin before invoking dependencies", async () => {
  const response = await worker.fetch(new Request("https://gateway.example/v1/ask", { method: "POST", headers: { Origin: "https://evil.example" } }), env());
  assert.equal(response.status, 403);
});
test("rejects methods other than POST and OPTIONS", async () => {
  const response = await worker.fetch(new Request("https://gateway.example/v1/ask", { method: "GET", headers: { Origin: "https://cloudcredits.io" } }), env());
  assert.equal(response.status, 405);
});
test("fails closed when Turnstile is not configured", async () => {
  const response = await worker.fetch(request(), env({ TURNSTILE_SECRET_KEY: undefined }));
  assert.equal(response.status, 503);
});
test("rejects non-JSON content types", async () => {
  const response = await worker.fetch(request("/v1/ask", { headers: { "content-type": "text/plain" } }), env());
  assert.equal(response.status, 415);
});
test("rejects invalid task and provider contract", async () => {
  const response = await worker.fetch(request("/v1/ask", { body: JSON.stringify({ prompt: "x", task: "other", provider: "auto", contractVersion: 1 }) }), env());
  assert.equal(response.status, 400);
});
test("rate limiter enforces a fixed one-minute window", async () => {
  const store = new Map();
  const state = { storage: { get: async (k) => store.get(k), put: async (k, v) => store.set(k, v) } };
  const limiter = new RateLimiter(state, { RATE_LIMIT_PER_MINUTE: "2" });
  assert.equal((await limiter.fetch()).status, 200);
  assert.equal((await limiter.fetch()).status, 200);
  assert.equal((await limiter.fetch()).status, 429);
});
test("monthly budget refuses requests after the configured reservation ceiling", async () => {
  const store = new Map();
  const state = { storage: { get: async (k) => store.get(k), put: async (k, v) => store.set(k, v) } };
  const budget = new SpendBudget(state, { MONTHLY_REQUEST_BUDGET: "1" });
  assert.equal((await budget.fetch()).status, 200);
  assert.equal((await budget.fetch()).status, 429);
});
