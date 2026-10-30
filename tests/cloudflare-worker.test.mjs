import test from "node:test";
import assert from "node:assert/strict";
import Worker, { SnapshotCoordinator } from "../src/worker/index.mjs";

async function signature(secret, body) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, body));
  return "sha256=" + Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function webhookRequest(payload, env, overrides = {}) {
  const secret = env.GITHUB_WEBHOOK_SECRET || "x".repeat(40);
  const body = new TextEncoder().encode(JSON.stringify(payload));
  const sig = overrides.signature ?? await signature(secret, body);
  return Worker.fetch(new Request("https://example.test/api/github/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-github-event": overrides.eventName ?? "pull_request",
      "x-github-delivery": overrides.deliveryId ?? "12345678-1234-1234-1234-123456789abc",
      "x-hub-signature-256": sig,
    },
    body,
  }), env);
}

function mergedPayload(source = "Jekylhyde82/7282ALLSPARXPRIME") {
  return {
    action: "closed",
    repository: { full_name: "Jekylhyde82/7282ALLSPARXPRIME" },
    pull_request: {
      number: 22,
      merged: true,
      merge_commit_sha: "a".repeat(40),
      head: { repo: { full_name: source }, sha: "b".repeat(40) },
      base: { ref: "main" },
    },
  };
}

const baseEnv = {
  GITHUB_WEBHOOK_SECRET: "s".repeat(48),
  GITHUB_TARGET_REPOSITORY: "Jekylhyde82/7282ALLSPARXPRIME",
  GITHUB_TARGET_BRANCH: "main",
  GITHUB_REPOSITORY_ALLOWLIST: JSON.stringify(["Jekylhyde82/7282ALLSPARXPRIME"]),
  REPOSITORY_LICENSE_POLICY: JSON.stringify({ "Jekylhyde82/7282ALLSPARXPRIME": "MIT" }),
  SNAPSHOTS: {},
  SNAPSHOT_COORDINATOR: {
    idFromName(name) { return name; },
    get(name) {
      return {
        async fetch(_url, init) {
          return new Response(JSON.stringify({ status: "accepted", name, payload: JSON.parse(init.body) }), {
            headers: { "content-type": "application/json" },
          });
        },
      };
    },
  },
};

test("webhook endpoint fails closed when signing secret is not configured", async () => {
  const response = await webhookRequest(mergedPayload(), { ...baseEnv, GITHUB_WEBHOOK_SECRET: undefined });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "webhook_secret_not_configured");
});

test("rejects invalid GitHub HMAC signatures", async () => {
  const response = await webhookRequest(mergedPayload(), baseEnv, { signature: "sha256=" + "0".repeat(64) });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "invalid_webhook_signature");
});

test("ignores correctly signed non-merged pull request events", async () => {
  const payload = mergedPayload();
  payload.pull_request.merged = false;
  const response = await webhookRequest(payload, baseEnv);
  assert.equal(response.status, 202);
  assert.equal((await response.json()).status, "ignored");
});

test("rejects source repositories outside the explicit allowlist", async () => {
  const response = await webhookRequest(mergedPayload("untrusted/other"), baseEnv);
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, "source_repository_not_allowlisted");
});

test("rejects missing approved licence policy", async () => {
  const env = { ...baseEnv, REPOSITORY_LICENSE_POLICY: "{}" };
  const response = await webhookRequest(mergedPayload(), env);
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, "approved_license_policy_missing");
});

test("forwards verified immutable merge identity to the Durable Object coordinator", async () => {
  let calledName;
  let forwarded;
  const env = {
    ...baseEnv,
    SNAPSHOT_COORDINATOR: {
      idFromName(name) { calledName = name; return name; },
      get(name) {
        return {
          async fetch(_url, init) {
            forwarded = JSON.parse(init.body);
            return new Response(JSON.stringify({ status: "accepted" }), { status: 202 });
          },
        };
      },
    },
  };
  const response = await webhookRequest(mergedPayload(), env);
  assert.equal(response.status, 202);
  assert.equal(calledName, "jekylhyde82/7282allsparxprime:" + "b".repeat(40));
  assert.equal(forwarded.source_commit_sha, "b".repeat(40));
  assert.equal(forwarded.merge_commit_sha, "a".repeat(40));
  assert.equal(forwarded.license_expression, "MIT");
});

test("rejects malformed delivery identifiers", async () => {
  const response = await webhookRequest(mergedPayload(), baseEnv, { deliveryId: "bad" });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_delivery_id");
});

test("Durable Object rejects malformed snapshot jobs before touching storage", async () => {
  let reads = 0;
  const state = {
    storage: { async get() { reads += 1; return null; }, async put() {} },
    async blockConcurrencyWhile(fn) { return fn(); },
  };
  const coordinator = new SnapshotCoordinator(state, {});
  const response = await coordinator.fetch(new Request("https://snapshot.internal/process", {
    method: "POST", body: JSON.stringify({ repository_full_name: "bad" }),
  }));
  assert.equal(response.status, 400);
  assert.equal(reads, 0);
});

test("Durable Object pins the source commit, hashes the archive and stores immutable provenance", async () => {
  const originalFetch = globalThis.fetch;
  const stored = new Map();
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls += 1;
    if (String(url).includes("/commits/")) {
      return new Response(JSON.stringify({ sha: "b".repeat(40) }), { headers: { "content-type": "application/json" } });
    }
    if (String(url).includes("/tarball/")) {
      return new Response(null, { status: 302, headers: { location: "https://codeload.github.com/archive.tar.gz" } });
    }
    if (String(url).startsWith("https://codeload.github.com/")) {
      return new Response(new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0x01]));
    }
    throw new Error("unexpected_url");
  };
  const stateValues = new Map();
  const state = {
    storage: {
      async get(key) { return stateValues.get(key); },
      async put(key, value) { stateValues.set(key, value); },
      async transaction(fn) {
        return fn({
          get: async (key) => stateValues.get(key),
          put: async (key, value) => stateValues.set(key, value),
        });
      },
    },
  };
  const bucket = {
    async head(key) { return stored.get(key) ?? null; },
    async put(key, body, options) {
      stored.set(key, { customMetadata: options.customMetadata, body });
    },
  };
  try {
    const coordinator = new SnapshotCoordinator(state, { SNAPSHOTS: bucket });
    const response = await coordinator.fetch(new Request("https://snapshot.internal/process", {
      method: "POST",
      body: JSON.stringify({
        delivery_id: "delivery-1",
        repository_full_name: "Jekylhyde82/7282ALLSPARXPRIME",
        source_commit_sha: "b".repeat(40),
        merge_commit_sha: "a".repeat(40),
        pull_request_number: 22,
        license_expression: "MIT",
      }),
    }));
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.status, "stored");
    assert.match(result.archive_digest, /^sha256:[a-f0-9]{64}$/);
    const object = stored.get(result.object_key);
    assert.equal(object.customMetadata.source_commit_sha, "b".repeat(40));
    assert.equal(object.customMetadata.license_expression, "MIT");
    assert.equal(object.customMetadata.executed_source_code, "false");
    assert.equal(object.customMetadata.extracted, "false");
    assert.equal(calls, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Durable Object verifies the R2 object before treating a retry as already stored", async () => {
  let fetchCalls = 0;
  const previous = {
    status: "stored",
    source_commit_sha: "b".repeat(40),
    archive_digest: "sha256:" + "c".repeat(64),
    object_key: "snapshots/repo/b.tar.gz",
  };
  const state = {
    storage: {
      async get() { return previous; },
      async put() {},
      async transaction(fn) {
        return fn({ get: async () => previous, put: async () => {} });
      },
    },
  };
  const bucket = {
    async head() { return { customMetadata: { archive_digest: previous.archive_digest, source_commit_sha: previous.source_commit_sha } }; },
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { fetchCalls += 1; throw new Error("must_not_download"); };
  try {
    const coordinator = new SnapshotCoordinator(state, { SNAPSHOTS: bucket });
    const response = await coordinator.fetch(new Request("https://snapshot.internal/process", {
      method: "POST",
      body: JSON.stringify({
        repository_full_name: "Jekylhyde82/7282ALLSPARXPRIME",
        source_commit_sha: "b".repeat(40),
        merge_commit_sha: "a".repeat(40),
        pull_request_number: 22,
        license_expression: "MIT",
      }),
    }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, "already_present");
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Durable Object returns retryable processing while an acquisition lease is active", async () => {
  const active = {
    status: "processing",
    lease_expires_at: new Date(Date.now() + 60000).toISOString(),
  };
  const state = {
    storage: {
      async transaction(fn) {
        return fn({ get: async () => active, put: async () => { throw new Error("must_not_claim"); } });
      },
    },
  };
  const coordinator = new SnapshotCoordinator(state, {});
  const response = await coordinator.fetch(new Request("https://snapshot.internal/process", {
    method: "POST",
    body: JSON.stringify({
      repository_full_name: "Jekylhyde82/7282ALLSPARXPRIME",
      source_commit_sha: "b".repeat(40),
      merge_commit_sha: "a".repeat(40),
      pull_request_number: 22,
      license_expression: "MIT",
    }),
  }));
  assert.equal(response.status, 202);
  assert.equal((await response.json()).status, "processing");
});
