import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile("src/lib/allsparxPrime/providers.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { resolveProviderRoute, isProviderId } = await import(moduleUrl);

test("automatic deal-recommendation route orders primary and specialist providers", () => {
  assert.deepEqual(resolveProviderRoute("startup-deal-recommendation", "auto"),
    ["openai", "anthropic", "google", "ollama"]);
});
test("explicit provider preference returns only that provider", () => {
  assert.deepEqual(resolveProviderRoute("startup-deal-recommendation", "google"), ["google"]);
});
test("provider identifiers are validated against the supported set", () => {
  assert.equal(isProviderId("openai"), true);
  assert.equal(isProviderId("anthropic"), true);
  assert.equal(isProviderId("google"), true);
  assert.equal(isProviderId("ollama"), true);
  assert.equal(isProviderId("unknown"), false);
});
test("unknown explicit providers are rejected", () => {
  assert.throws(() => resolveProviderRoute("startup-deal-recommendation", "unknown"), /Unsupported AI provider/);
});
