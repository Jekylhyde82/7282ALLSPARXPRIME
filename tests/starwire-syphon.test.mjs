import test from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";

const source = await (await import("node:fs/promises")).readFile("src/lib/starwire/syphon.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const runtimeUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { captureSyphonSource, resetSyphonRateLimitForTests } = await import(runtimeUrl);

const basePolicy = (overrides = {}) => ({
  sourceId: "test-source",
  canonicalOrigin: "https://example.org",
  termsApproved: true,
  robotsDecision: "allowed",
  enabled: true,
  minimumIntervalMs: 1,
  ...overrides,
});
const response = (body = "permitted evidence", init = {}) => new Response(body, {
  status: 200,
  headers: { "content-type": "text/plain; charset=utf-8" },
  ...init,
});

test("captures permitted text with provenance and SHA-256 digest", async () => {
  resetSyphonRateLimitForTests();
  const captured = await captureSyphonSource("https://example.org/offers", basePolicy(), {
    fetchImpl: async (_url, options) => {
      assert.equal(options.method, "GET");
      assert.equal(options.redirect, "error");
      return response();
    },
    now: () => 1_800_000_000_000,
  });
  assert.equal(captured.sourceId, "test-source");
  assert.equal(captured.sourceUrl, "https://example.org/offers");
  assert.equal(captured.retrievedAt, "2027-01-15T08:00:00.000Z");
  assert.equal(captured.body, "permitted evidence");
  assert.equal(captured.byteLength, 18);
  assert.match(captured.sha256, /^[a-f0-9]{64}$/);
  assert.equal(captured.verification, "CAPTURED_NOT_VERIFIED");
});

test("fails closed when source is disabled or terms are not approved", async () => {
  await assert.rejects(captureSyphonSource("https://example.org/a", basePolicy({ enabled: false })), /disabled/);
  await assert.rejects(captureSyphonSource("https://example.org/a", basePolicy({ termsApproved: false })), /terms/);
});

test("requires explicit allowed robots/access decision", async () => {
  await assert.rejects(captureSyphonSource("https://example.org/a", basePolicy({ robotsDecision: "unknown" })), /robots\/access/);
  await assert.rejects(captureSyphonSource("https://example.org/a", basePolicy({ robotsDecision: "disallowed" })), /robots\/access/);
});

test("rejects HTTP, credentials, fragments, private names, IP literals and unapproved origins", async () => {
  const policy = basePolicy();
  await assert.rejects(captureSyphonSource("http://example.org/a", policy), /HTTPS/);
  await assert.rejects(captureSyphonSource("https://user:pass@example.org/a", policy), /credentials/);
  await assert.rejects(captureSyphonSource("https://example.org/a#secret", policy), /fragments/);
  await assert.rejects(captureSyphonSource("https://localhost/a", basePolicy({ canonicalOrigin: "https://localhost" })), /public DNS/);
  await assert.rejects(captureSyphonSource("https://127.0.0.1/a", basePolicy({ canonicalOrigin: "https://127.0.0.1" })), /public DNS/);
  await assert.rejects(captureSyphonSource("https://evil.example/a", policy), /approved origin/);
});

test("rejects redirects rather than following them", async () => {
  resetSyphonRateLimitForTests();
  await assert.rejects(captureSyphonSource("https://example.org/a", basePolicy(), {
    fetchImpl: async (_url, options) => {
      assert.equal(options.redirect, "error");
      throw new TypeError("redirect rejected");
    },
  }), /redirect rejected/);
});

test("rejects unsupported media types", async () => {
  resetSyphonRateLimitForTests();
  await assert.rejects(captureSyphonSource("https://example.org/a", basePolicy(), {
    fetchImpl: async () => response("<binary>", { headers: { "content-type": "application/octet-stream" } }),
  }), /unsupported content type/);
});

test("enforces declared and streamed response limits", async () => {
  resetSyphonRateLimitForTests();
  await assert.rejects(captureSyphonSource("https://example.org/a", basePolicy({ maximumResponseBytes: 4 }), {
    fetchImpl: async () => response("12345", { headers: { "content-type": "text/plain", "content-length": "5" } }),
  }), /size limit/);
  resetSyphonRateLimitForTests();
  await assert.rejects(captureSyphonSource("https://example.org/a", basePolicy({ maximumResponseBytes: 4 }), {
    fetchImpl: async () => response("12345", { headers: { "content-type": "text/plain" } }),
  }), /size limit/);
});

test("rejects invalid UTF-8", async () => {
  resetSyphonRateLimitForTests();
  await assert.rejects(captureSyphonSource("https://example.org/a", basePolicy(), {
    fetchImpl: async () => new Response(new Uint8Array([0xff, 0xfe]), { headers: { "content-type": "text/plain" } }),
  }), /invalid UTF-8/);
});

test("enforces per-source minimum interval", async () => {
  resetSyphonRateLimitForTests();
  const policy = basePolicy({ minimumIntervalMs: 10 });
  const options = { fetchImpl: async () => response(), now: () => 100 };
  await captureSyphonSource("https://example.org/a", policy, options);
  await assert.rejects(captureSyphonSource("https://example.org/b", policy, options), /rate limit/);
});

test("rejects excessive resource limits", async () => {
  await assert.rejects(captureSyphonSource("https://example.org/a", basePolicy({ maximumResponseBytes: 2 * 1024 * 1024 })), /1 MiB/);
  await assert.rejects(captureSyphonSource("https://example.org/a", basePolicy({ timeoutMs: 31_000 })), /30 seconds/);
});
