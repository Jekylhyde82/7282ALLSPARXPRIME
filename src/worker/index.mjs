const MAX_WEBHOOK_BYTES = 1024 * 1024;
const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;
const SHA = /^[a-f0-9]{40}$/i;
const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const ARCHIVE_HOSTS = new Set(["api.github.com", "codeload.github.com"]);
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

function response(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function hexBytes(value) {
  if (typeof value !== "string" || !/^[a-f0-9]+$/i.test(value) || value.length % 2) return null;
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function constantTimeEqual(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) mismatch |= left[i] ^ right[i];
  return mismatch === 0;
}

async function verifyGitHubSignature(secret, body, header) {
  if (typeof secret !== "string" || secret.length < 32 || typeof header !== "string") return false;
  const supplied = hexBytes(header.startsWith("sha256=") ? header.slice(7) : "");
  if (!supplied || supplied.length !== 32) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, body));
  return constantTimeEqual(expected, supplied);
}

async function readBoundedRequest(request, limit) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) return null;
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function parseRepositoryAllowlist(value) {
  if (typeof value !== "string" || !value.trim()) return new Set();
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return new Set(parsed.filter((item) => typeof item === "string"));
  } catch {}
  return new Set(value.split(",").map((item) => item.trim()).filter(Boolean));
}

function parseLicensePolicy(value) {
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function handleWebhook(request, env) {
  if (!env.GITHUB_WEBHOOK_SECRET) return response(503, { error: "webhook_secret_not_configured" });
  const body = await readBoundedRequest(request, MAX_WEBHOOK_BYTES);
  if (!body) return response(413, { error: "webhook_body_too_large" });
  const valid = await verifyGitHubSignature(
    env.GITHUB_WEBHOOK_SECRET,
    body,
    request.headers.get("x-hub-signature-256"),
  );
  if (!valid) return response(401, { error: "invalid_webhook_signature" });

  const eventName = request.headers.get("x-github-event");
  const deliveryId = request.headers.get("x-github-delivery");
  if (!deliveryId || !/^[A-Za-z0-9-]{16,128}$/.test(deliveryId)) {
    return response(400, { error: "invalid_delivery_id" });
  }

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return response(400, { error: "invalid_json" });
  }

  if (eventName !== "pull_request" || payload?.action !== "closed" || payload?.pull_request?.merged !== true) {
    return response(202, { status: "ignored", reason: "not_a_merged_pull_request" });
  }

  const targetRepository = payload?.repository?.full_name;
  const configuredTarget = env.GITHUB_TARGET_REPOSITORY;
  const targetBranch = env.GITHUB_TARGET_BRANCH || "main";
  const sourceRepository = payload?.pull_request?.head?.repo?.full_name;
  const sourceCommit = payload?.pull_request?.head?.sha;
  const mergeCommit = payload?.pull_request?.merge_commit_sha;
  const pullRequestNumber = payload?.pull_request?.number;
  if (!configuredTarget || targetRepository !== configuredTarget ||
      payload?.pull_request?.base?.ref !== targetBranch) {
    return response(403, { error: "target_repository_or_branch_not_allowed" });
  }
  if (typeof sourceRepository !== "string" || !REPOSITORY.test(sourceRepository) ||
      !SHA.test(sourceCommit || "") || !SHA.test(mergeCommit || "") ||
      !Number.isInteger(pullRequestNumber) || pullRequestNumber < 1) {
    return response(400, { error: "merge_event_fields_invalid" });
  }

  const allowedRepositories = parseRepositoryAllowlist(env.GITHUB_REPOSITORY_ALLOWLIST);
  if (!allowedRepositories.has(sourceRepository)) {
    return response(403, { error: "source_repository_not_allowlisted" });
  }
  const licensePolicy = parseLicensePolicy(env.REPOSITORY_LICENSE_POLICY);
  const licenseExpression = licensePolicy[sourceRepository];
  if (typeof licenseExpression !== "string" || !licenseExpression.trim()) {
    return response(403, { error: "approved_license_policy_missing" });
  }
  if (!env.SNAPSHOT_COORDINATOR || !env.SNAPSHOTS) {
    return response(503, { error: "snapshot_storage_not_configured" });
  }

  const coordinatorName = sourceRepository.toLowerCase() + ":" + sourceCommit.toLowerCase();
  const id = env.SNAPSHOT_COORDINATOR.idFromName(coordinatorName);
  const stub = env.SNAPSHOT_COORDINATOR.get(id);
  const result = await stub.fetch("https://snapshot.internal/process", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      delivery_id: deliveryId,
      repository_full_name: sourceRepository,
      source_commit_sha: sourceCommit,
      merge_commit_sha: mergeCommit,
      pull_request_number: pullRequestNumber,
      license_expression: licenseExpression,
    }),
  });
  const resultBody = await result.json().catch(() => ({ error: "snapshot_coordinator_invalid_response" }));
  return response(result.status, resultBody);
}

async function readBoundedArchive(responseObject) {
  const declared = Number(responseObject.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_ARCHIVE_BYTES) {
    throw new Error("archive_size_limit_exceeded");
  }
  if (!responseObject.body) throw new Error("archive_body_missing");
  const reader = responseObject.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > MAX_ARCHIVE_BYTES) {
        await reader.cancel();
        throw new Error("archive_size_limit_exceeded");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const archive = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    archive.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (archive.length < 2 || archive[0] !== 0x1f || archive[1] !== 0x8b) {
    throw new Error("archive_format_invalid");
  }
  return archive;
}

async function fetchPinnedArchive(owner, repository, sourceCommit, token) {
  const apiRoot = "https://api.github.com/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repository);
  const headers = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    ...(token ? { authorization: "Bearer " + token } : {}),
  };
  const commitResponse = await fetch(apiRoot + "/commits/" + sourceCommit, {
    method: "GET", redirect: "error", headers,
  });
  if (!commitResponse.ok) throw new Error("source_commit_lookup_failed");
  const commit = await commitResponse.json();
  if (commit?.sha !== sourceCommit) throw new Error("source_commit_mismatch");

  let url = new URL(apiRoot + "/tarball/" + sourceCommit);
  for (let redirects = 0; redirects <= 2; redirects += 1) {
    if (url.protocol !== "https:" || !ARCHIVE_HOSTS.has(url.hostname) || url.username || url.password) {
      throw new Error("archive_host_rejected");
    }
    const archiveResponse = await fetch(url.href, {
      method: "GET",
      redirect: "manual",
      headers: url.hostname === "api.github.com" ? headers : { accept: "application/octet-stream" },
    });
    if (REDIRECTS.has(archiveResponse.status)) {
      if (redirects === 2) throw new Error("archive_redirect_limit");
      const location = archiveResponse.headers.get("location");
      if (!location) throw new Error("archive_redirect_location_missing");
      url = new URL(location, url);
      continue;
    }
    if (!archiveResponse.ok) throw new Error("archive_download_failed");
    return readBoundedArchive(archiveResponse);
  }
  throw new Error("archive_redirect_limit");
}

export class SnapshotCoordinator {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    if (request.method !== "POST" || new URL(request.url).pathname !== "/process") {
      return response(404, { error: "not_found" });
    }
    let event;
    try {
      event = await request.json();
    } catch {
      return response(400, { error: "invalid_json" });
    }
    if (!event || !REPOSITORY.test(event.repository_full_name || "") ||
        !SHA.test(event.source_commit_sha || "") || !SHA.test(event.merge_commit_sha || "") ||
        !Number.isInteger(event.pull_request_number) || event.pull_request_number < 1 ||
        typeof event.license_expression !== "string" || !event.license_expression.trim()) {
      return response(400, { error: "snapshot_request_invalid" });
    }

    return this.state.blockConcurrencyWhile(async () => {
      const previous = await this.state.storage.get("snapshot");
      if (previous?.status === "stored" &&
          previous.source_commit_sha === event.source_commit_sha &&
          previous.archive_digest && previous.object_key) {
        return response(200, {
          status: "already_present",
          source_commit_sha: previous.source_commit_sha,
          archive_digest: previous.archive_digest,
          object_key: previous.object_key,
        });
      }

      const now = new Date().toISOString();
      await this.state.storage.put("snapshot", {
        status: "processing",
        source_commit_sha: event.source_commit_sha,
        delivery_id: event.delivery_id,
        started_at: now,
      });

      try {
        const parts = event.repository_full_name.split("/");
        const archive = await fetchPinnedArchive(parts[0], parts[1], event.source_commit_sha, this.env.GITHUB_API_TOKEN);
        const digestBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", archive));
        const digest = "sha256:" + Array.from(digestBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
        const objectKey = "snapshots/" + parts[0] + "/" + parts[1] + "/" + event.source_commit_sha + ".tar.gz";
        const metadata = {
          repository_full_name: event.repository_full_name,
          source_commit_sha: event.source_commit_sha,
          merge_commit_sha: event.merge_commit_sha,
          pull_request_number: String(event.pull_request_number),
          license_expression: event.license_expression,
          archive_digest: digest,
          archive_size_bytes: String(archive.byteLength),
          acquired_at: now,
          executed_source_code: "false",
          extracted: "false",
        };

        const existing = await this.env.SNAPSHOTS.head(objectKey);
        let status = "stored";
        if (existing) {
          if (existing.customMetadata?.archive_digest !== digest ||
              existing.customMetadata?.source_commit_sha !== event.source_commit_sha) {
            throw new Error("snapshot_object_conflict");
          }
          status = "already_present";
        } else {
          await this.env.SNAPSHOTS.put(objectKey, archive, {
            httpMetadata: { contentType: "application/gzip" },
            customMetadata: metadata,
          });
        }

        await this.state.storage.put("snapshot", {
          status: "stored",
          source_commit_sha: event.source_commit_sha,
          archive_digest: digest,
          object_key: objectKey,
          acquired_at: now,
          delivery_id: event.delivery_id,
        });
        return response(200, {
          status,
          source_commit_sha: event.source_commit_sha,
          archive_digest: digest,
          object_key: objectKey,
        });
      } catch (error) {
        const code = typeof error?.message === "string" ? error.message.slice(0, 100) : "snapshot_failed";
        await this.state.storage.put("snapshot", {
          status: "failed",
          source_commit_sha: event.source_commit_sha,
          delivery_id: event.delivery_id,
          failed_at: new Date().toISOString(),
          error_code: code,
        });
        return response(503, { error: code, retryable: true });
      }
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/github/webhook" && request.method === "POST") {
      return handleWebhook(request, env);
    }
    if (url.pathname.startsWith("/api/")) return response(404, { error: "not_found" });
    if (!env.ASSETS) return response(503, { error: "static_assets_not_configured" });
    return env.ASSETS.fetch(request);
  },
};
