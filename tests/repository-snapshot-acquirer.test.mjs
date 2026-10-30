import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { acquireMergedRepositorySnapshot } from "../src/lib/allsparxPrime/repository-snapshot-acquirer.mjs";

const SOURCE = "a".repeat(40);
const MERGE = "b".repeat(40);
const archiveBytes = Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0x01, 0x02, 0x03]);
const digest = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

function fixture(overrides = {}) {
  const calls = [];
  const stored = new Map();
  const mergeEvent = {
    event_name: "pull_request.closed",
    action: "closed",
    merged: true,
    pull_request_number: 23,
    source_commit_sha: SOURCE,
    merge_commit_sha: MERGE,
    license_decision: { status: "approved", expression: "MIT" },
  };
  const storage = {
    async putIfAbsent({ key, body, metadata }) {
      if (stored.has(key)) return { created: false, digest: stored.get(key).digest };
      stored.set(key, { body: Buffer.from(body), metadata, digest: metadata.archive_digest });
      return { created: true, digest: metadata.archive_digest };
    },
  };
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith(`/commits/${SOURCE}`)) {
      return new Response(JSON.stringify({ sha: SOURCE }), { status: 200 });
    }
    if (String(url).endsWith(`/tarball/${SOURCE}`)) {
      return new Response(null, { status: 302, headers: { location: "https://codeload.github.com/acme/tool/legacy.tar.gz/" + SOURCE } });
    }
    if (String(url).startsWith("https://codeload.github.com/")) {
      return new Response(archiveBytes, { status: 200, headers: { "content-length": String(archiveBytes.length) } });
    }
    throw new Error("Unexpected URL: " + url);
  };
  return {
    calls,
    stored,
    mergeEvent,
    storage,
    fetchImpl,
    input: {
      repository: { repository_id: "acme-tool", full_name: "acme/tool" },
      mergeEvent,
      verifyMergeEvent: async () => true,
      fetchImpl,
      storage,
      now: () => new Date("2026-10-30T03:00:00.000Z"),
      ...overrides,
    },
  };
}

test("stores a complete archive pinned to the verified source commit and records provenance", async () => {
  const f = fixture();
  const result = await acquireMergedRepositorySnapshot(f.input);
  assert.equal(result.status, "stored");
  assert.equal(result.key, `acme-tool/${SOURCE}.tar.gz`);
  assert.equal(result.metadata.source_commit_sha, SOURCE);
  assert.equal(result.metadata.merge_commit_sha, MERGE);
  assert.equal(result.metadata.archive_digest, digest(archiveBytes));
  assert.equal(result.metadata.license_expression, "MIT");
  assert.equal(result.metadata.executed_source_code, false);
  assert.equal(result.metadata.extracted, false);
  assert.equal(f.stored.size, 1);
  assert.equal(f.calls.length, 3);
  assert.equal(f.calls[2].options.headers.Authorization, undefined, "credentials must not be forwarded to codeload");
});

test("rejects an unauthenticated merge event before making network requests", async () => {
  const f = fixture({ verifyMergeEvent: async () => false });
  await assert.rejects(() => acquireMergedRepositorySnapshot(f.input), { code: "MERGE_EVENT_UNVERIFIED" });
  assert.equal(f.calls.length, 0);
});

test("rejects a source commit that GitHub does not confirm exactly", async () => {
  const f = fixture({
    fetchImpl: async () => new Response(JSON.stringify({ sha: "c".repeat(40) }), { status: 200 }),
  });
  await assert.rejects(() => acquireMergedRepositorySnapshot(f.input), { code: "SOURCE_COMMIT_MISMATCH" });
  assert.equal(f.stored.size, 0);
});

test("rejects redirects outside the explicit GitHub archive host allowlist", async () => {
  const f = fixture({
    fetchImpl: async (url) => {
      if (String(url).endsWith(`/commits/${SOURCE}`)) return new Response(JSON.stringify({ sha: SOURCE }), { status: 200 });
      return new Response(null, { status: 302, headers: { location: "https://attacker.example/archive.tar.gz" } });
    },
  });
  await assert.rejects(() => acquireMergedRepositorySnapshot(f.input), { code: "ARCHIVE_HOST_REJECTED" });
  assert.equal(f.stored.size, 0);
});

test("rejects archives that exceed the configured streamed size limit", async () => {
  const oversized = Buffer.alloc(1025, 1);
  const f = fixture({
    maxArchiveBytes: 1024,
    fetchImpl: async (url) => {
      if (String(url).endsWith(`/commits/${SOURCE}`)) return new Response(JSON.stringify({ sha: SOURCE }), { status: 200 });
      if (String(url).endsWith(`/tarball/${SOURCE}`)) return new Response(null, { status: 302, headers: { location: "https://codeload.github.com/acme/tool/archive.tar.gz" } });
      return new Response(oversized, { status: 200 });
    },
  });
  await assert.rejects(() => acquireMergedRepositorySnapshot(f.input), { code: "ARCHIVE_TOO_LARGE" });
  assert.equal(f.stored.size, 0);
});

test("requires an approved licence decision before acquisition", async () => {
  const f = fixture();
  f.input.mergeEvent.license_decision.status = "pending";
  await assert.rejects(() => acquireMergedRepositorySnapshot(f.input), { code: "LICENSE_EVIDENCE_MISSING" });
  assert.equal(f.calls.length, 0);
});

test("treats duplicate merge deliveries as idempotent when storage confirms the same digest", async () => {
  const f = fixture();
  await acquireMergedRepositorySnapshot(f.input);
  const duplicate = await acquireMergedRepositorySnapshot(f.input);
  assert.equal(duplicate.status, "already_present");
  assert.equal(f.stored.size, 1);
});
test("rejects a non-gzip response even when the HTTP request succeeds", async () => {
  const f = fixture({
    fetchImpl: async (url) => {
      if (String(url).endsWith(`/commits/${SOURCE}`)) return new Response(JSON.stringify({ sha: SOURCE }), { status: 200 });
      if (String(url).endsWith(`/tarball/${SOURCE}`)) return new Response(null, { status: 302, headers: { location: "https://codeload.github.com/acme/tool/archive.tar.gz" } });
      return new Response("not an archive", { status: 200 });
    },
  });
  await assert.rejects(() => acquireMergedRepositorySnapshot(f.input), { code: "ARCHIVE_FORMAT_INVALID" });
  assert.equal(f.stored.size, 0);
});

test("rejects a storage receipt with a mismatched digest", async () => {
  const f = fixture({ storage: { putIfAbsent: async () => ({ created: true, digest: "sha256:" + "0".repeat(64) }) } });
  await assert.rejects(() => acquireMergedRepositorySnapshot(f.input), { code: "STORED_DIGEST_MISMATCH" });
});
