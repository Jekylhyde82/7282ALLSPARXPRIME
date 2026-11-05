import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const schema = JSON.parse(await readFile("schemas/capability-registry-record.schema.json", "utf8"));
const example = JSON.parse(await readFile("schemas/examples/capability-registry-record.example.json", "utf8"));

test("registry record is a closed versioned JSON Schema 2020-12 object", () => {
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.record_version.const, "1.0.0");
});

test("registry records preserve ordered append-only chain identity", () => {
  for (const key of ["record_id","sequence","capability_id","capability_version","package_digest","event_type","occurred_at","actor","decision","policy_version","previous_record_digest","record_digest"]) {
    assert.ok(schema.required.includes(key), `registry record missing required ${key}`);
  }
  assert.equal(schema.properties.sequence.minimum, 1);
  assert.equal(schema.properties.record_digest.pattern, "^sha256:[a-f0-9]{64}$");
  assert.equal(schema.properties.previous_record_digest.type.includes("null"), true);
});

test("registry event and actor vocabularies are constrained", () => {
  assert.ok(schema.properties.event_type.enum.includes("rolled-back"));
  assert.ok(schema.properties.event_type.enum.includes("revoked"));
  assert.deepEqual(schema.properties.actor.properties.type.enum, ["human","service","system"]);
  assert.deepEqual(schema.properties.decision.properties.outcome.enum, ["accepted","denied","recorded","failed","pending"]);
});

test("example is a genesis record with explicit actor, policy and integrity fields", () => {
  for (const key of schema.required) assert.ok(Object.hasOwn(example, key), `example missing ${key}`);
  assert.equal(example.sequence, 1);
  assert.equal(example.previous_record_digest, null);
  assert.equal(example.event_type, "discovered");
  assert.equal(example.decision.outcome, "recorded");
});
