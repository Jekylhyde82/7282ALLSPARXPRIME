import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateCapabilityManifest } from "../src/lib/allsparxPrime/capability-manifest-validator.mjs";

const example = JSON.parse(await readFile("schemas/examples/capability-manifest.example.json", "utf8"));

test("accepts the complete declarative example manifest", () => {
  const result = validateCapabilityManifest(structuredClone(example));
  assert.equal(result.valid, true, JSON.stringify(result.errors));
  assert.deepEqual(result.errors, []);
});

test("rejects missing required fields and unknown root properties", () => {
  const missing = structuredClone(example);
  delete missing.source;
  assert.equal(validateCapabilityManifest(missing).valid, false);

  const unknown = { ...structuredClone(example), unexpected_runtime_hook: true };
  assert.equal(validateCapabilityManifest(unknown).valid, false);
});

test("rejects mutable source references and path traversal", () => {
  const mutable = structuredClone(example);
  mutable.source.commit = "main";
  assert.equal(validateCapabilityManifest(mutable).valid, false);

  const traversal = structuredClone(example);
  traversal.source.path = "../../outside/package";
  assert.equal(validateCapabilityManifest(traversal).valid, false);
});

test("rejects wildcard permissions, duplicate grants and secret access", () => {
  const wildcard = structuredClone(example);
  wildcard.permissions.capabilities = ["*"];
  assert.equal(validateCapabilityManifest(wildcard).valid, false);

  const duplicate = structuredClone(example);
  duplicate.permissions.capabilities = [
    "read:declared-input",
    "read:declared-input",
  ];
  assert.equal(validateCapabilityManifest(duplicate).valid, false);

  const secret = structuredClone(example);
  secret.data_handling.secret_access = true;
  assert.equal(validateCapabilityManifest(secret).valid, false);
});

test("rejects malformed package digests and non-HTTPS destinations", () => {
  const digest = structuredClone(example);
  digest.package.digest = "sha256:invalid";
  assert.equal(validateCapabilityManifest(digest).valid, false);

  const destination = structuredClone(example);
  destination.permissions.network_destinations = ["http://example.test"];
  assert.equal(validateCapabilityManifest(destination).valid, false);
});
