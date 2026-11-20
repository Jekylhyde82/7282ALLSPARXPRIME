import test from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";

const source = await (await import("node:fs/promises")).readFile("src/lib/starwire/foropensource.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const runtimeUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const {
  buildForOpenSourceRequest,
  extractForOpenSourceCommitSha,
  parseForOpenSourceOfferIndex,
  captureForOpenSourceResource,
  extractForOpenSourceOfferProvenance,
} = await import(runtimeUrl);

const commit = "a".repeat(40);
const policy = (sourceId, canonicalOrigin) => ({
  sourceId, canonicalOrigin, termsApproved: true,
  robotsDecision: "not-applicable", enabled: true, minimumIntervalMs: 1000,
});

test("pins the Free for Open Source repository commit before reading offers", () => {
  const request = buildForOpenSourceRequest({ kind: "latest-commit" });
  assert.equal(request.url, "https://api.github.com/repos/natwar86/foropensource/commits/main");
  assert.equal(request.sourceId, "foropensource-github-api");
  assert.equal(request.attribution, "foropensource · CC BY 4.0");
});

test("builds pinned offer index and raw YAML URLs", () => {
  const index = new URL(buildForOpenSourceRequest({ kind: "offer-index", commitSha: commit }).url);
  assert.equal(index.pathname, "/repos/natwar86/foropensource/contents/data/offers");
  assert.equal(index.searchParams.get("ref"), commit);
  const file = buildForOpenSourceRequest({ kind: "offer-file", commitSha: commit, fileName: "browserstack.yaml" });
  assert.equal(file.url, `https://raw.githubusercontent.com/natwar86/foropensource/${commit}/data/offers/browserstack.yaml`);
  assert.equal(file.accept, "text/plain");
});

test("rejects unpinned commits and unsafe offer paths", () => {
  assert.throws(() => buildForOpenSourceRequest({ kind: "offer-index", commitSha: "main" }), /full 40-character/);
  assert.throws(() => buildForOpenSourceRequest({ kind: "offer-file", commitSha: commit, fileName: "../secrets.yaml" }), /simple YAML filename/);
  assert.throws(() => buildForOpenSourceRequest({ kind: "latest-commit", branch: "../main" }), /branch name/);
});

test("extracts only a valid immutable commit SHA", () => {
  assert.equal(extractForOpenSourceCommitSha(JSON.stringify({ sha: commit })), commit);
  assert.throws(() => extractForOpenSourceCommitSha(JSON.stringify({ sha: "main" })), /full commit SHA/);
  assert.throws(() => extractForOpenSourceCommitSha("not-json"), /valid JSON/);
});

test("validates the offer index and constrains download hosts", () => {
  const records = [{
    name: "browserstack.yaml",
    path: "data/offers/browserstack.yaml",
    sha: "b".repeat(40),
    download_url: `https://raw.githubusercontent.com/natwar86/foropensource/${commit}/data/offers/browserstack.yaml`,
  }];
  assert.equal(parseForOpenSourceOfferIndex(JSON.stringify(records))[0].name, "browserstack.yaml");
  assert.throws(() => parseForOpenSourceOfferIndex(JSON.stringify([{ ...records[0], download_url: "https://evil.example/x" }])), /untrusted download URL/);
  assert.throws(() => parseForOpenSourceOfferIndex(JSON.stringify({ not: "an array" })), /must be an array/);
});

test("maps immutable offer records to explicit candidate provenance", () => {
  const record = { name: "browserstack.yaml", path: "data/offers/browserstack.yaml", sha: "b".repeat(40), downloadUrl: `https://raw.githubusercontent.com/natwar86/foropensource/${commit}/data/offers/browserstack.yaml` };
  assert.deepEqual(extractForOpenSourceOfferProvenance(record, commit), {
    sourceLicense: "CC-BY-4.0",
    sourceRecordId: "data/offers/browserstack.yaml",
    sourceRecordRevision: null,
    sourceRecordUrl: `https://github.com/natwar86/foropensource/blob/${commit}/data/offers/browserstack.yaml`,
    sourceRevision: commit,
    sourceArtifactId: `git-blob-sha1:${"b".repeat(40)}`,
    sourceReleaseId: null,
    sourceArtifactSha256: null,
  });
  assert.throws(() => extractForOpenSourceOfferProvenance(record, "main"), /full commit SHA/);
  assert.throws(() => extractForOpenSourceOfferProvenance({ ...record, sha: "bad" }, commit), /validated immutable/);
});
test("captures only through matching approved source policies", async () => {
  const apiPolicy = policy("foropensource-github-api", "https://api.github.com");
  const rawPolicy = policy("foropensource-raw", "https://raw.githubusercontent.com");
  const fakeCapture = async (url, receivedPolicy) => ({
    schemaVersion: 1, captureId: "fos-cap", sourceId: receivedPolicy.sourceId,
    sourceUrl: url, retrievedAt: "2026-11-20T00:00:00.000Z", httpStatus: 200,
    contentType: "application/json", byteLength: 2, sha256: "a".repeat(64),
    body: "{}", responseMetadata: {
      requestId: null, sourceyReleaseId: null, sourceyArtifactSha256: null,
      etag: '"etag"', lastModified: null,
    }, verification: "CAPTURED_NOT_VERIFIED",
  });
  const result = await captureForOpenSourceResource({ kind: "offer-index", commitSha: commit }, apiPolicy, fakeCapture);
  assert.equal(result.sourceLicense, "CC-BY-4.0");
  assert.equal(result.attribution, "foropensource");
  assert.equal(result.repositoryCommit, commit);
  await assert.rejects(captureForOpenSourceResource(
    { kind: "offer-file", commitSha: commit, fileName: "browserstack.yaml" },
    apiPolicy,
    fakeCapture,
  ), /matching reviewed source policy/);
  const file = await captureForOpenSourceResource(
    { kind: "offer-file", commitSha: commit, fileName: "browserstack.yaml" },
    rawPolicy,
    fakeCapture,
  );
  assert.equal(file.sourceId, "foropensource-raw");
});
