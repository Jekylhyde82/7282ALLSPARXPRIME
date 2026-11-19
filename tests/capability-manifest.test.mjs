import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const schema = JSON.parse(await readFile("schemas/capability-manifest.schema.json", "utf8"));
const sample = JSON.parse(await readFile("schemas/examples/capability-manifest.example.json", "utf8"));

test("manifest schema declares JSON Schema 2020-12 and closes the root object", () => {
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.type, "object");
  assert.equal(schema.additionalProperties, false);
});

test("manifest requires provenance, rights, integrity, interfaces, permissions and review evidence", () => {
  for (const key of ["manifest_version","capability_id","version","source","license","package","interfaces","dependencies","runtime","permissions","data_handling","verification","security_review"]) {
    assert.ok(schema.required.includes(key), `missing required manifest field: ${key}`);
    assert.ok(schema.properties[key], `missing schema definition: ${key}`);
  }
});

test("manifest uses explicit bounded permission enums and HTTPS destinations", () => {
  const permissions = schema.properties.permissions;
  assert.equal(permissions.additionalProperties, false);
  assert.ok(permissions.properties.capabilities.items.enum.includes("credentials:read"));
  assert.ok(!permissions.properties.capabilities.items.enum.includes("*"));
  assert.equal(permissions.properties.network_destinations.items.pattern, "^https://");
  assert.equal(schema.properties.data_handling.properties.secret_access.const, false);
});

test("manifest provenance and package integrity require immutable source and SHA-256 digests", () => {
  assert.match(schema.properties.source.properties.commit.pattern, /40/);
  assert.equal(schema.properties.package.properties.digest.pattern, "^sha256:[a-f0-9]{64}$");
  assert.ok(schema.properties.source.properties.path.pattern.includes("\\.\\."));
});

test("example manifest is internally consistent with required core fields", () => {
  for (const key of schema.required) assert.ok(Object.hasOwn(sample, key), `example missing ${key}`);
  assert.equal(sample.manifest_version, "1.0.0");
  assert.equal(sample.package.digest, `sha256:${"b".repeat(64)}`);
  assert.equal(sample.source.commit, "a".repeat(40));
  assert.deepEqual(sample.permissions.capabilities, ["read:declared-input", "write:declared-output"]);
  assert.deepEqual(sample.permissions.network_destinations, []);
  assert.equal(sample.data_handling.secret_access, false);
  assert.equal(sample.security_review.status, "pending");
  assert.equal(sample.verification.status, "not-run");
});
