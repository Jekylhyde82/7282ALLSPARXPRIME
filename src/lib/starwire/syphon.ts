/**
 * STARWIRE / SYPHON bounded, read-only source capture.
 *
 * This module captures permitted source bytes and provenance. It does not
 * crawl links, interpret provider claims, execute downloaded content, approve
 * opportunities, or write to the acquisition register.
 */

export type SyphonRobotsDecision = "allowed" | "not-applicable" | "unknown" | "disallowed";

export interface SyphonSourcePolicy {
  sourceId: string;
  canonicalOrigin: string;
  termsApproved: boolean;
  robotsDecision: SyphonRobotsDecision;
  enabled: boolean;
  minimumIntervalMs?: number;
  maximumResponseBytes?: number;
  timeoutMs?: number;
}

export interface SyphonCapture {
  schemaVersion: 1;
  captureId: string;
  sourceId: string;
  sourceUrl: string;
  retrievedAt: string;
  httpStatus: number;
  contentType: string;
  byteLength: number;
  sha256: string;
  body: string;
  responseMetadata: {
    requestId: string | null;
    sourceyReleaseId: string | null;
    sourceyArtifactSha256: string | null;
    etag: string | null;
    lastModified: string | null;
  };
  verification: "CAPTURED_NOT_VERIFIED";
}

export interface SyphonCaptureOptions {
  fetchImpl?: typeof fetch;
  now?: () => number;
}

const DEFAULT_MAX_BYTES = 256 * 1024;
const HARD_MAX_BYTES = 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 15_000;
const HARD_TIMEOUT_MS = 30_000;
const DEFAULT_MIN_INTERVAL_MS = 5_000;
const lastRequestAt = new Map<string, number>();

function fail(message: string): never {
  throw new Error(message);
}

function isPublicHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") ||
      host.endsWith(".local") || host.endsWith(".internal") ||
      host.endsWith(".test") || host.endsWith(".invalid")) return false;
  // IP literals are deliberately excluded. Source policies should use a
  // reviewed public DNS hostname; network-level egress controls are still
  // required to defend against DNS rebinding and private-address resolution.
  if (/^[0-9.]+$/.test(host) || host.includes(":")) return false;
  return host.includes(".");
}

function validateUrl(rawUrl: string, policy: SyphonSourcePolicy): URL {
  let target: URL;
  let origin: URL;
  try {
    target = new URL(rawUrl);
    origin = new URL(policy.canonicalOrigin);
  } catch {
    return fail("SYPHON source and target must be valid absolute URLs.");
  }
  if (target.protocol !== "https:" || origin.protocol !== "https:")
    return fail("SYPHON remote sources must use HTTPS.");
  if (target.username || target.password || target.hash ||
      origin.username || origin.password || origin.hash)
    return fail("SYPHON URLs must not contain credentials or fragments.");
  if (!isPublicHostname(target.hostname) || !isPublicHostname(origin.hostname))
    return fail("SYPHON source host must be a public DNS hostname.");
  if (target.origin !== origin.origin)
    return fail("SYPHON target must remain on the source's approved origin.");
  return target;
}

function allowedMediaType(header: string): string | null {
  const mediaType = header.split(";")[0].trim().toLowerCase();
  if ([
    "text/html", "text/plain", "application/json", "application/xml",
    "text/xml", "application/rss+xml", "application/atom+xml",
  ].includes(mediaType)) return mediaType;
  if (/^application\/[a-z0-9.+-]+\+(json|xml)$/.test(mediaType)) return mediaType;
  return null;
}

async function readBoundedBody(response: Response, maximumBytes: number): Promise<Uint8Array> {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength !== null) {
    const parsed = Number(declaredLength);
    if (Number.isFinite(parsed) && parsed > maximumBytes)
      fail("SYPHON response exceeded its configured size limit.");
  }
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel();
        fail("SYPHON response exceeded its configured size limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function captureSyphonSource(
  rawUrl: string,
  policy: SyphonSourcePolicy,
  options: SyphonCaptureOptions = {},
): Promise<SyphonCapture> {
  if (!policy.enabled) fail("SYPHON source is disabled.");
  if (!policy.termsApproved) fail("SYPHON source terms have not been approved.");
  if (policy.robotsDecision === "unknown" || policy.robotsDecision === "disallowed")
    fail("SYPHON source robots/access policy is not approved.");
  if (policy.robotsDecision !== "allowed" && policy.robotsDecision !== "not-applicable")
    fail("SYPHON source requires an explicit robots/access-policy decision.");

  const target = validateUrl(rawUrl, policy);
  const maximumBytes = policy.maximumResponseBytes ?? DEFAULT_MAX_BYTES;
  const timeoutMs = policy.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const minimumIntervalMs = policy.minimumIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
  if (!Number.isInteger(maximumBytes) || maximumBytes < 1 || maximumBytes > HARD_MAX_BYTES)
    fail("SYPHON response limit must be between 1 byte and 1 MiB.");
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > HARD_TIMEOUT_MS)
    fail("SYPHON timeout must be between 1 ms and 30 seconds.");
  if (!Number.isInteger(minimumIntervalMs) || minimumIntervalMs < 1)
    fail("SYPHON minimum request interval must be at least 1 ms.");

  const now = options.now ?? Date.now;
  const currentTime = now();
  const previousTime = lastRequestAt.get(policy.sourceId);
  if (previousTime !== undefined && currentTime - previousTime < minimumIntervalMs)
    fail("SYPHON source rate limit has not elapsed.");
  // Reserve the interval before yielding so concurrent calls cannot race past it.
  lastRequestAt.set(policy.sourceId, currentTime);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(target.toString(), {
      method: "GET",
      redirect: "error",
      headers: { Accept: "text/html, text/plain, application/json, application/xml, application/rss+xml, application/atom+xml" },
      signal: controller.signal,
    });
    if (!response.ok) fail(`SYPHON source returned HTTP ${response.status}.`);
    const contentType = allowedMediaType(response.headers.get("content-type") ?? "");
    if (!contentType) fail("SYPHON source returned an unsupported content type.");
    const bytes = await readBoundedBody(response, maximumBytes);
    let body: string;
    try {
      body = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      return fail("SYPHON source returned invalid UTF-8 content.");
    }
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const retrievedAt = new Date(currentTime).toISOString();
    return {
      schemaVersion: 1,
      captureId: crypto.randomUUID(),
      sourceId: policy.sourceId,
      sourceUrl: target.toString(),
      retrievedAt,
      httpStatus: response.status,
      contentType,
      byteLength: bytes.byteLength,
      sha256: toHex(digest),
      body,
      responseMetadata: {
        requestId: response.headers.get("x-request-id"),
        sourceyReleaseId: response.headers.get("x-sourcey-release-id"),
        sourceyArtifactSha256: response.headers.get("x-sourcey-artifact-sha256"),
        etag: response.headers.get("etag"),
        lastModified: response.headers.get("last-modified"),
      },
      verification: "CAPTURED_NOT_VERIFIED",
    };
  } catch (error) {
    if (controller.signal.aborted) fail("SYPHON source request timed out.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/** Test-only reset; production callers must not expose this function to users. */
export function resetSyphonRateLimitForTests(): void {
  lastRequestAt.clear();
}
