import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";

const schema = JSON.parse(await readFile("schemas/source-repository-record.schema.json", "utf8"));
const example = JSON.parse(await readFile("schemas/examples/source-repository-record.example.json", "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

test("accepts the illustrative source repository record", () => {
  assert.equal(validate(structuredClone(example)), true, JSON.stringify(validate.errors));
});

test("rejects a repository record with an invalid URL or mutable source commit", () => {
  const badUrl = structuredClone(example);
  badUrl.repository_url = "http://github.com/example/repo";
  assert.equal(validate(badUrl), false);

  const mutable = structuredClone(example);
  mutable.source.commit = "main";
  assert.equal(validate(mutable), false);
});

test("requires pull request and merge commit evidence for merged sources", () => {
  const merged = structuredClone(example);
  merged.integration_status = "merged";
  assert.equal(validate(merged), false);

  merged.target.pull_request = "https://github.com/example/target/pull/12";
  merged.target.merge_commit = "1111111111111111111111111111111111111111";
  assert.equal(validate(merged), true, JSON.stringify(validate.errors));
});

test("rejects unknown fields and duplicate capability references", () => {
  const unknown = { ...structuredClone(example), trusted: true };
  assert.equal(validate(unknown), false);

  const duplicate = structuredClone(example);
  duplicate.capabilities = ["capability.one", "capability.one"];
  assert.equal(validate(duplicate), false);
});
