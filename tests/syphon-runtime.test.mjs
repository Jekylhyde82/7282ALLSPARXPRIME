import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile("src/lib/allsparxPrime/runtime.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const runtimeUrl = \`data:text/javascript;base64,\${Buffer.from(compiled).toString("base64")}\`;
const { runAllsparxPrimeTask } = await import(runtimeUrl);
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200, headers: { "content-type": "application/json" }, ...init,
  });
}

test("rejects non-local HTTP endpoints before making a request", async () => {
  let called = false;
  globalThis.fetch = async () => { called = true; return jsonResponse({ summary: "ok" }); };
  await assert.rejects(runAllsparxPrimeTask("find credits", "http://example.com/ai"), /must use HTTPS/);
  assert.equal(called, false);
});
test("rejects endpoint URL credentials and fragments", async () => {
  await assert.rejects(runAllsparxPrimeTask("find credits", "https://user:pass@example.com/ai"), /must not contain URL credentials or a fragment/);
  await assert.rejects(runAllsparxPrimeTask("find credits", "https://example.com/ai#token"), /must not contain URL credentials or a fragment/);
});
test("sends one POST, rejects redirects, and accepts valid bounded JSON", async () => {
  let captured;
  globalThis.fetch = async (_url, options) => { captured = options; return jsonResponse({ summary: "Found.", programs: [{ title: "Starter" }] }); };
  const result = await runAllsparxPrimeTask("find credits", "https://example.com/ai");
  assert.equal(captured.method, "POST");
  assert.equal(captured.redirect, "error");
  assert.deepEqual(JSON.parse(captured.body), { prompt: "find credits" });
  assert.equal(result.summary, "Found.");
  assert.deepEqual(result.programs, [{ title: "Starter" }]);
  assert.equal(result.evidence.verified, false);
});
test("rejects a response with a non-JSON content type", async () => {
  globalThis.fetch = async () => new Response("not json", { headers: { "content-type": "text/plain" } });
  await assert.rejects(runAllsparxPrimeTask("find credits", "https://example.com/ai"), /did not return JSON/);
});
test("rejects a declared response larger than 64 KiB", async () => {
  globalThis.fetch = async () => new Response('{"summary":"large"}', { headers: { "content-type": "application/json", "content-length": String(65537) } });
  await assert.rejects(runAllsparxPrimeTask("find credits", "https://example.com/ai"), /64 KiB safety limit/);
});
test("rejects a streamed response larger than 64 KiB", async () => {
  globalThis.fetch = async () => {
    const chunk = new TextEncoder().encode("x".repeat(40 * 1024));
    const body = new ReadableStream({ start(c) { c.enqueue(chunk); c.enqueue(chunk); c.close(); } });
    return new Response(body, { headers: { "content-type": "application/json" } });
  };
  await assert.rejects(runAllsparxPrimeTask("find credits", "https://example.com/ai"), /64 KiB safety limit/);
});
test("rejects invalid UTF-8 response bytes", async () => {
  globalThis.fetch = async () => new Response(new Uint8Array([0xff, 0xfe, 0x7b, 0x7d]), { headers: { "content-type": "application/json" } });
  await assert.rejects(runAllsparxPrimeTask("find credits", "https://example.com/ai"), /invalid JSON or non-UTF-8/);
});
test("rejects malformed response contracts", async () => {
  globalThis.fetch = async () => jsonResponse({ summary: 42, programs: "not-an-array" });
  await assert.rejects(runAllsparxPrimeTask("find credits", "https://example.com/ai"), /invalid response format/);
});
test("rejects blank and oversized prompts before making a request", async () => {
  let called = false;
  globalThis.fetch = async () => { called = true; return jsonResponse({ summary: "unexpected" }); };
  await assert.rejects(runAllsparxPrimeTask(" ", "https://example.com/ai"), /Enter a request/);
  await assert.rejects(runAllsparxPrimeTask("x".repeat(501), "https://example.com/ai"), /500 characters or fewer/);
  assert.equal(called, false);
});
test("allows localhost HTTP for development", async () => {
  globalThis.fetch = async () => jsonResponse({ summary: "local ok", programs: [] });
  assert.equal((await runAllsparxPrimeTask("test local", "http://localhost:4321/ai")).summary, "local ok");
});
test("does not expose provider-supplied error details", async () => {
  globalThis.fetch = async () => jsonResponse({ message: "internal-token=secret" }, { status: 400 });
  await assert.rejects(runAllsparxPrimeTask("find credits", "https://example.com/ai"), (error) => {
    assert.equal(error.message, "The AI service could not complete this request.");
    assert.equal(error.message.includes("secret"), false);
    return true;
  });
});
test("rejects JSON-like but invalid media types", async () => {
  globalThis.fetch = async () => new Response('{"summary":"no"}', { headers: { "content-type": "application/jsonp" } });
  await assert.rejects(runAllsparxPrimeTask("find credits", "https://example.com/ai"), /did not return JSON/);
});
test("accepts a structured-suffix JSON media type", async () => {
  globalThis.fetch = async () => new Response('{"summary":"vendor JSON","programs":[]}', { headers: { "content-type": "application/vnd.allsparx+json; charset=utf-8" } });
  assert.equal((await runAllsparxPrimeTask("find credits", "https://example.com/ai")).summary, "vendor JSON");
});
