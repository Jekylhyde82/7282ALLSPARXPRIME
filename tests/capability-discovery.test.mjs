import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { discoverCapabilities } from "../src/lib/allsparxPrime/capability-discovery.mjs";

const example = JSON.parse(await readFile("schemas/examples/capability-manifest.example.json", "utf8"));

async function temporaryDirectory(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "allsparx-discovery-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test("discovers manifests and package metadata without executing package scripts", async (t) => {
  const root = await temporaryDirectory(t);
  const project = path.join(root, "project");
  await mkdir(project);
  await writeFile(path.join(project, "package.json"), JSON.stringify({
    name: "sample-package",
    version: "1.2.3",
    scripts: { preinstall: "throw new Error('must never execute')" },
  }));
  await writeFile(path.join(project, "allsparx.capability.json"), JSON.stringify(example));

  const result = await discoverCapabilities({ roots: [root] });
  assert.equal(result.mode, "read-only");
  assert.equal(result.executed_source_code, false);
  assert.equal(result.modified_source_files, false);
  assert.equal(result.candidates.length, 2);
  assert.ok(result.candidates.some((item) => item.kind === "package-metadata" && item.name === "sample-package"));
  assert.ok(result.candidates.some((item) => item.kind === "capability-manifest" && item.status === "manifest-valid-unverified"));
});

test("rejects invalid manifests and reports malformed package metadata", async (t) => {
  const root = await temporaryDirectory(t);
  await writeFile(path.join(root, "capability.manifest.json"), JSON.stringify({ capability_id: "bad" }));
  await mkdir(path.join(root, "broken"));
  await writeFile(path.join(root, "broken", "package.json"), "{not-json");

  const result = await discoverCapabilities({ roots: [root] });
  assert.equal(result.candidates[0].status, "manifest-invalid");
  assert.ok(result.diagnostics.some((item) => item.code === "PACKAGE_METADATA_INVALID"));
});

test("does not follow symlinked directories", async (t) => {
  const root = await temporaryDirectory(t);
  const external = await temporaryDirectory(t);
  await writeFile(path.join(external, "package.json"), JSON.stringify({ name: "outside" }));
  await symlink(external, path.join(root, "linked"), "dir");

  const result = await discoverCapabilities({ roots: [root] });
  assert.equal(result.candidates.length, 0);
});

test("enforces scan bounds and validates options", async (t) => {
  const root = await temporaryDirectory(t);
  await writeFile(path.join(root, "one.txt"), "one");
  await writeFile(path.join(root, "two.txt"), "two");

  const result = await discoverCapabilities({ roots: [root], maxFiles: 1 });
  assert.equal(result.truncated, true);
  assert.ok(result.diagnostics.some((item) => item.code === "FILE_LIMIT_REACHED"));
  await assert.rejects(() => discoverCapabilities({ roots: [] }), /non-empty array/);
});
