import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile("src/lib/allsparxPrime/runtime.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;
const runtimeUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { runAllsparxPrimeTask } = await import(runtimeUrl);

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

test("rejects non-local HTTP endpoints before making a request", async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return jsonResponse({ summary: "ok", programs: [] });
  };

  await assert.rejects(
    runAllsparxPrimeTask("find cloud credits", "http://example.com/ai"),
    /must use HTTPS/,
  );
  assert.equal(called, false);
});

test("rejects endpoint URL credentials and fragments", async () => {
  await assert.rejects(
    runAllsparxPrimeTask("find cloud credits", "https://user:pass@example.com/ai"),
    /must not contain URL credentials or a fragment/,
  );
  await assert.rejects(
    runAllsparxPrimeTask("find cloud credits", "https://example.com/ai#token"),
    /must not contain URL credentials or a fragment/,
  );
});

test("sends one POST, rejects redirects, and accepts a valid bounded JSON response", async () => {
  let captured;
  globalThis.fetch = async (_url, options) => {
    captured = options;
    return jsonResponse({ summary: "Relevant programs found.", programs: [{ title: "Cloud Starter" }] });
  };

  const result = await runAllsparxPrimeTask("find cloud credits", "https://example.com/ai");

  assert.equal(captured.method, "POST");
  assert.equal(captured.redirect, "error");
  assert.deepEqual(JSON.parse(captured.body), { prompt: "find cloud credits" });
  assert.equal(result.summary, "Relevant programs found.");
  assert.deepEqual(result.programs, [{ title: "Cloud Starter" }]);
  assert.equal(result.evidence.controller, "SYPHON");
  assert.equal(result.evidence.verified, false);
});

test("rejects a response with a non-JSON content type", async () => {
  globalThis.fetch = async () =>
    new Response("not json", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });

  await assert.rejects(
    runAllsparxPrimeTask("find cloud credits", "https://example.com/ai"),
    /did not return JSON/,
  );
});

test("rejects a declared response larger than 64 KiB before parsing", async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ summary: "too large" }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "content-length": String(64 * 1024 + 1),
      },
    });

  await assert.rejects(
    runAllsparxPrimeTask("find cloud credits", "https://example.com/ai"),
    /exceeded the 64 KiB safety limit/,
  );
});

test("rejects malformed response contracts", async () => {
  globalThis.fetch = async () => jsonResponse({ summary: 42, programs: "not-an-array" });

  await assert.rejects(
    runAllsparxPrimeTask("find cloud credits", "https://example.com/ai"),
    /invalid response format/,
  );
});

test("allows localhost HTTP for development", async () => {
  globalThis.fetch = async () => jsonResponse({ summary: "local ok", programs: [] });

  const result = await runAllsparxPrimeTask("test local", "http://localhost:4321/ai");
  assert.equal(result.summary, "local ok");
});
