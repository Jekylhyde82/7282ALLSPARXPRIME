import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile("src/lib/allsparxPrime/auth.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const authUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const auth = await import(authUrl);
const originalFetch = globalThis.fetch;
const originalStorage = globalThis.sessionStorage;
let values;

function resetStorage() {
  values = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalStorage === undefined) delete globalThis.sessionStorage;
  else globalThis.sessionStorage = originalStorage;
});

test("rejects malformed stored sessions without calling Supabase", async () => {
  resetStorage();
  values.set("allsparx-prime-auth-session", JSON.stringify({
    access_token: "old", refresh_token: "refresh", expires_at: "not-a-timestamp",
  }));
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error("unexpected"); };
  assert.equal(await auth.getAuthAccessToken("https://project.supabase.co", "public-key"), null);
  assert.equal(called, false);
});

test("reuses an unexpired access token without refreshing", async () => {
  resetStorage();
  values.set("allsparx-prime-auth-session", JSON.stringify({
    access_token: "current-access", refresh_token: "refresh", expires_at: Date.now() + 300_000,
  }));
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error("unexpected"); };
  assert.equal(await auth.getAuthAccessToken("https://project.supabase.co", "public-key"), "current-access");
  assert.equal(called, false);
});

test("serializes concurrent refreshes to protect rotating refresh tokens", async () => {
  resetStorage();
  values.set("allsparx-prime-auth-session", JSON.stringify({
    access_token: "expired-access", refresh_token: "single-use-refresh", expires_at: Date.now() - 1_000,
  }));
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    assert.equal(JSON.parse(options.body).refresh_token, "single-use-refresh");
    await Promise.resolve();
    return Response.json({
      access_token: "new-access", refresh_token: "new-refresh", expires_in: 3600,
    });
  };
  const tokens = await Promise.all([
    auth.getAuthAccessToken("https://project.supabase.co", "public-key"),
    auth.getAuthAccessToken("https://project.supabase.co", "public-key"),
    auth.getAuthAccessToken("https://project.supabase.co", "public-key"),
  ]);
  assert.deepEqual(tokens, ["new-access", "new-access", "new-access"]);
  assert.equal(calls, 1);
  const saved = JSON.parse(values.get("allsparx-prime-auth-session"));
  assert.equal(saved.refresh_token, "new-refresh");
  assert.ok(saved.expires_at > Date.now());
});
