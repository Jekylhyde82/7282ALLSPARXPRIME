import { createHash } from "node:crypto";

const SHA = /^[a-f0-9]{40}$/;
const REPOSITORY_ID = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const ALLOWED_ARCHIVE_HOSTS = new Set(["api.github.com", "codeload.github.com"]);
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function validateInput({ repository, mergeEvent, verifyMergeEvent, fetchImpl, storage, maxArchiveBytes }) {
  if (!repository || typeof repository !== "object") fail("REPOSITORY_INVALID", "A canonical repository record is required.");
  if (typeof repository.repository_id !== "string" || !REPOSITORY_ID.test(repository.repository_id)) {
    fail("REPOSITORY_ID_INVALID", "repository.repository_id must be a stable lowercase identifier.");
  }
  if (typeof repository.full_name !== "string" || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository.full_name)) {
    fail("REPOSITORY_NAME_INVALID", "repository.full_name must use owner/name form.");
  }
  if (!mergeEvent || mergeEvent.event_name !== "pull_request.closed" || mergeEvent.action !== "closed" ||
      mergeEvent.merged !== true || !Number.isInteger(mergeEvent.pull_request_number) ||
      mergeEvent.pull_request_number < 1 || !SHA.test(mergeEvent.merge_commit_sha ?? "") ||
      !SHA.test(mergeEvent.source_commit_sha ?? "")) {
    fail("MERGE_EVENT_INVALID", "Only a closed, successfully merged pull request with immutable source and merge commits can trigger acquisition.");
  }
  if (mergeEvent.license_decision?.status !== "approved" ||
      typeof mergeEvent.license_decision.expression !== "string" ||
      !mergeEvent.license_decision.expression.trim()) {
    fail("LICENSE_EVIDENCE_MISSING", "An approved licence decision and expression are required.");
  }
  if (typeof verifyMergeEvent !== "function") fail("EVENT_VERIFIER_REQUIRED", "An authenticated merge-event verifier is required.");
  if (typeof fetchImpl !== "function") fail("FETCH_REQUIRED", "A fetch implementation is required.");
  if (!storage || typeof storage.putIfAbsent !== "function") {
    fail("STORAGE_ADAPTER_REQUIRED", "A durable storage adapter implementing putIfAbsent is required.");
  }
  if (!Number.isSafeInteger(maxArchiveBytes) || maxArchiveBytes < 1024 || maxArchiveBytes > 1024 * 1024 * 1024) {
    fail("ARCHIVE_LIMIT_INVALID", "maxArchiveBytes must be between 1 KiB and 1 GiB.");
  }
}

function githubHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readBoundedBody(response, maxBytes) {
  if (!response.body || typeof response.body.getReader !== "function") {
    fail("ARCHIVE_BODY_MISSING", "The archive response did not contain a readable body.");
  }
  const declared = Number(response.headers?.get?.("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body.cancel?.();
    fail("ARCHIVE_TOO_LARGE", "The declared archive size exceeds the configured limit.");
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        fail("ARCHIVE_TOO_LARGE", "The streamed archive exceeds the configured limit.");
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  if (total === 0) fail("ARCHIVE_EMPTY", "The downloaded source archive is empty.");
  return Buffer.concat(chunks, total);
}

async function fetchArchive(fetchImpl, initialUrl, token, maxBytes) {
  let url = new URL(initialUrl);
  for (let redirects = 0; redirects <= 2; redirects += 1) {
    if (url.protocol !== "https:" || !ALLOWED_ARCHIVE_HOSTS.has(url.hostname) || url.username || url.password) {
      fail("ARCHIVE_HOST_REJECTED", "Archive URL is outside the approved HTTPS GitHub host allowlist.");
    }
    const response = await fetchImpl(url.href, {
      method: "GET",
      redirect: "manual",
      headers: url.hostname === "api.github.com" ? githubHeaders(token) : { Accept: "application/octet-stream" },
    });
    if (REDIRECT_STATUSES.has(response.status)) {
      if (redirects === 2) fail("REDIRECT_LIMIT", "The archive endpoint exceeded the redirect limit.");
      const location = response.headers?.get?.("location");
      if (!location) fail("REDIRECT_LOCATION_MISSING", "The archive redirect did not include a location.");
      url = new URL(location, url);
      continue;
    }
    if (!response.ok) fail("ARCHIVE_FETCH_FAILED", `GitHub archive request failed with HTTP ${response.status}.`);
    return readBoundedBody(response, maxBytes);
  }
  fail("REDIRECT_LIMIT", "The archive endpoint exceeded the redirect limit.");
}

/**
 * Acquire a complete, immutable GitHub source archive after an authenticated merge event.
 * This function never extracts or executes imported source. The caller supplies a durable,
 * atomic putIfAbsent storage adapter; no filesystem or cloud-storage assumptions are made here.
 */
export async function acquireMergedRepositorySnapshot({
  repository,
  mergeEvent,
  verifyMergeEvent,
  fetchImpl = globalThis.fetch,
  storage,
  token,
  maxArchiveBytes = 100 * 1024 * 1024,
  now = () => new Date(),
}) {
  validateInput({ repository, mergeEvent, verifyMergeEvent, fetchImpl, storage, maxArchiveBytes });
  if (await verifyMergeEvent(mergeEvent) !== true) {
    fail("MERGE_EVENT_UNVERIFIED", "The merge event failed authentication or merge-state verification.");
  }

  const [owner, name] = repository.full_name.split("/");
  const sourceCommit = mergeEvent.source_commit_sha;
  const apiRoot = `https://api.github.com/repos/${owner}/${name}`;
  const commitResponse = await fetchImpl(`${apiRoot}/commits/${sourceCommit}`, {
    method: "GET",
    redirect: "error",
    headers: githubHeaders(token),
  });
  if (!commitResponse.ok) fail("SOURCE_COMMIT_LOOKUP_FAILED", `Source commit lookup failed with HTTP ${commitResponse.status}.`);
  const commit = await commitResponse.json();
  if (commit?.sha !== sourceCommit) {
    fail("SOURCE_COMMIT_MISMATCH", "GitHub did not confirm the exact requested source commit.");
  }

  const archive = await fetchArchive(
    fetchImpl,
    `${apiRoot}/tarball/${sourceCommit}`,
    token,
    maxArchiveBytes,
  );
  const digest = createHash("sha256").update(archive).digest("hex");
  const key = `${repository.repository_id}/${sourceCommit}.tar.gz`;
  const metadata = Object.freeze({
    repository_id: repository.repository_id,
    repository_full_name: repository.full_name,
    repository_url: `https://github.com/${owner}/${name}`,
    source_commit_sha: sourceCommit,
    merge_pull_request_number: mergeEvent.pull_request_number,
    merge_commit_sha: mergeEvent.merge_commit_sha,
    license_expression: mergeEvent.license_decision.expression,
    license_decision: "approved",
    archive_digest: `sha256:${digest}`,
    archive_size_bytes: archive.byteLength,
    acquired_at: now().toISOString(),
    media_type: "application/gzip",
    executed_source_code: false,
    extracted: false,
  });

  const stored = await storage.putIfAbsent({ key, body: archive, metadata });
  if (!stored || typeof stored.digest !== "string") {
    fail("STORAGE_RECEIPT_INVALID", "Storage must return the digest of the stored or existing immutable object.");
  }
  if (stored.digest !== metadata.archive_digest) {
    fail("STORED_DIGEST_MISMATCH", "The immutable storage object does not match the downloaded archive digest.");
  }

  return Object.freeze({
    status: stored.created === true ? "stored" : "already_present",
    key,
    metadata,
  });
}
