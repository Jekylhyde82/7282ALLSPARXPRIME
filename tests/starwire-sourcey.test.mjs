import test from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";

const source = await (await import("node:fs/promises")).readFile("src/lib/starwire/sourcey.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const runtimeUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { buildSourceyRequest, captureSourceyResource, extractSourceyOfferProvenance } = await import(runtimeUrl);

test("builds documented Sourcey read-only resource URLs", () => {
  assert.equal(buildSourceyRequest({ kind: "status" }).url, "https://api.sourcey.com/v1/status");
  assert.equal(buildSourceyRequest({ kind: "release" }).url, "https://api.sourcey.com/v1/release");
  assert.equal(buildSourceyRequest({ kind: "catalog" }).url, "https://api.sourcey.com/v1/catalog");
  const search = new URL(buildSourceyRequest({ kind: "search-offers", query: "GPU credits", limit: 25 }).url);
  assert.equal(search.pathname, "/v1/search/offers");
  assert.equal(search.searchParams.get("q"), "GPU credits");
  assert.equal(search.searchParams.get("limit"), "25");
});

test("preserves Sourcey's opaque change cursor without inventing pagination", () => {
  const cursor = "cursor+opaque/with==symbols";
  const request = new URL(buildSourceyRequest({ kind: "changes", cursor }).url);
  assert.equal(request.searchParams.get("cursor"), cursor);
});

test("validates query, limit and cursor bounds", () => {
  assert.throws(() => buildSourceyRequest({ kind: "search-offers", query: " " }), /1–200/);
  assert.throws(() => buildSourceyRequest({ kind: "search-offers", query: "x", limit: 101 }), /1 to 100/);
  assert.throws(() => buildSourceyRequest({ kind: "changes", cursor: "" }), /1–2048/);
});

test("captures through the reviewed SYPHON policy and preserves attribution metadata", async () => {
  const policy = {
    sourceId: "sourcey-api", canonicalOrigin: "https://api.sourcey.com",
    termsApproved: true, robotsDecision: "not-applicable", enabled: true,
  };
  const fakeCapture = async (url, receivedPolicy) => ({
    schemaVersion: 1, captureId: "cap-1", sourceId: receivedPolicy.sourceId,
    sourceUrl: url, retrievedAt: "2026-11-20T00:00:00.000Z", httpStatus: 200,
    contentType: "application/json", byteLength: 2, sha256: "a".repeat(64),
    body: "{}", responseMetadata: {
      requestId: "req-1", sourceyReleaseId: "rel-1",
      sourceyArtifactSha256: "b".repeat(64), etag: null, lastModified: null,
    }, verification: "CAPTURED_NOT_VERIFIED",
  });
  const result = await captureSourceyResource({ kind: "release" }, policy, fakeCapture);
  assert.equal(result.sourceLicense, "CC-BY-4.0");
  assert.equal(result.sourceName, "Sourcey");
  assert.equal(result.sourceRevision, "rel-1");
  assert.equal(result.sourceArtifactDigest, "b".repeat(64));
  assert.equal(result.verification, "CAPTURED_NOT_VERIFIED");
});

test("does not silently override an unapproved or mismatched source policy", async () => {
  let called = false;
  const fakeCapture = async () => { called = true; throw new Error("should not call"); };
  await assert.rejects(captureSourceyResource(
    { kind: "catalog" },
    { sourceId: "other", canonicalOrigin: "https://api.sourcey.com", termsApproved: true, robotsDecision: "allowed", enabled: true },
    fakeCapture,
  ), /reviewed sourcey-api policy/);
  assert.equal(called, false);
});
