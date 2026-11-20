/**
 * Sourcey read-only API adapter for STARWIRE / SYPHON.
 *
 * Sourcey is a discovery and evidence source, never an approval authority.
 * All requests are GET-only and passed through the caller's approved SYPHON
 * source policy. No API key is required for documented anonymous reads.
 */
import type { SyphonCapture, SyphonCaptureOptions, SyphonSourcePolicy } from "./syphon.js";

export type SourceyResource =
  | { kind: "status" }
  | { kind: "release" }
  | { kind: "catalog" }
  | { kind: "entity"; entityId: string }
  | { kind: "entity-by-slug"; slug: string }
  | { kind: "program"; programId: string }
  | { kind: "program-by-slug"; entitySlug: string; programSlug: string }
  | { kind: "offer"; offerId: string }
  | { kind: "offer-by-slug"; entitySlug: string; offerSlug: string }
  | { kind: "provenance"; id: string }
  | { kind: "revision-provenance"; revisionId: string }
  | { kind: "event"; eventId: string }
  | { kind: "observation"; observationId: string }
  | { kind: "search-offers"; query: string; limit?: number }
  | { kind: "changes"; cursor?: string };

export interface SourceyRequest {
  url: string;
  method: "GET";
  accept: "application/json";
  sourceId: "sourcey-api";
  attribution: "CC-BY-4.0";
}

export type SourceyCapture = SyphonCapture & {
  sourceLicense: "CC-BY-4.0";
  sourceName: "Sourcey";
  sourceRevision: string | null;
  sourceArtifactDigest: string | null;
};

export interface SourceyOfferProvenance {
  sourceRecordId: string | null;
  sourceRecordRevision: string | null;
  sourceRecordUrl: string | null;
  sourceReleaseId: string | null;
  sourceArtifactSha256: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const optionalText = (value: unknown, field: string): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || !value.trim()) throw new Error(`Sourcey ${field} must be non-empty text when present.`);
  return value;
};
const pathId = (value: string, field: string): string => {
  if (!value.trim() || value.length > 256 || /[\u0000-\u001f\u007f]/.test(value))
    throw new Error(`Sourcey ${field} must be 1–256 printable characters.`);
  return encodeURIComponent(value);
};
const slugPath = (value: string, field: string): string => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value))
    throw new Error(`Sourcey ${field} must be a valid slug.`);
  return encodeURIComponent(value);
};

/**
 * Extracts only explicit upstream identifiers. Missing fields remain null;
 * this function never synthesizes IDs, revision digests or canonical URLs.
 */
export function extractSourceyOfferProvenance(
  offer: unknown,
  releaseMetadata: unknown = null,
): SourceyOfferProvenance {
  if (!isRecord(offer)) throw new Error("Sourcey offer record must be an object.");
  const release = isRecord(releaseMetadata) ? releaseMetadata : {};
  const artifactSha256 = optionalText(
    release.artifact_sha256 ?? offer.artifact_sha256,
    "artifact_sha256",
  );
  if (artifactSha256 !== null && !/^[a-f0-9]{64}$/i.test(artifactSha256))
    throw new Error("Sourcey artifact_sha256 must be a 64-character SHA-256 digest.");
  const canonicalUrl = optionalText(offer.canonical_url, "canonical_url");
  if (canonicalUrl !== null) {
    let parsed: URL;
    try { parsed = new URL(canonicalUrl); }
    catch { throw new Error("Sourcey canonical_url must be a valid HTTPS URL."); }
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hash)
      throw new Error("Sourcey canonical_url must be HTTPS and contain no credentials or fragment.");
  }
  return {
    sourceRecordId: optionalText(offer.offer_id, "offer_id"),
    sourceRecordRevision: optionalText(offer.revision_digest, "revision_digest"),
    sourceRecordUrl: canonicalUrl,
    sourceReleaseId: optionalText(release.release_id ?? offer.release_id, "release_id"),
    sourceArtifactSha256: artifactSha256?.toLowerCase() ?? null,
  };
}

const API_ORIGIN = "https://api.sourcey.com";

export function buildSourceyRequest(resource: SourceyResource): SourceyRequest {
  const url = new URL(API_ORIGIN);
  switch (resource.kind) {
    case "status":
      url.pathname = "/v1/status";
      break;
    case "release":
      url.pathname = "/v1/release";
      break;
    case "catalog":
      url.pathname = "/v1/catalog";
      break;
    case "entity":
      url.pathname = `/v1/entities/${pathId(resource.entityId, "entity ID")}`;
      break;
    case "entity-by-slug":
      url.pathname = `/v1/entities/by-slug/${slugPath(resource.slug, "entity slug")}`;
      break;
    case "program":
      url.pathname = `/v1/programs/${pathId(resource.programId, "program ID")}`;
      break;
    case "program-by-slug":
      url.pathname = `/v1/programs/${slugPath(resource.entitySlug, "entity slug")}/${slugPath(resource.programSlug, "program slug")}`;
      break;
    case "offer":
      url.pathname = `/v1/offers/${pathId(resource.offerId, "offer ID")}`;
      break;
    case "offer-by-slug":
      url.pathname = `/v1/offers/${slugPath(resource.entitySlug, "entity slug")}/${slugPath(resource.offerSlug, "offer slug")}`;
      break;
    case "provenance":
      url.pathname = `/v1/provenance/${pathId(resource.id, "provenance ID")}`;
      break;
    case "revision-provenance":
      url.pathname = `/v1/revisions/${pathId(resource.revisionId, "revision ID")}/provenance`;
      break;
    case "event":
      url.pathname = `/v1/events/${pathId(resource.eventId, "event ID")}`;
      break;
    case "observation":
      url.pathname = `/v1/observations/${pathId(resource.observationId, "observation ID")}`;
      break;
    case "search-offers": {
      const query = resource.query.trim();
      if (!query || query.length > 200) throw new Error("Sourcey offer search must be 1–200 characters.");
      const limit = resource.limit ?? 20;
      if (!Number.isInteger(limit) || limit < 1 || limit > 100)
        throw new Error("Sourcey search limit must be an integer from 1 to 100.");
      url.pathname = "/v1/search/offers";
      url.searchParams.set("q", query);
      url.searchParams.set("limit", String(limit));
      break;
    }
    case "changes":
      url.pathname = "/v1/changes";
      if (resource.cursor !== undefined) {
        if (!resource.cursor || resource.cursor.length > 2048)
          throw new Error("Sourcey change cursor must be 1–2048 characters.");
        url.searchParams.set("cursor", resource.cursor);
      }
      break;
    default: {
      const exhaustive: never = resource;
      throw new Error(`Unsupported Sourcey resource: ${String(exhaustive)}`);
    }
  }
  return {
    url: url.toString(),
    method: "GET",
    accept: "application/json",
    sourceId: "sourcey-api",
    attribution: "CC-BY-4.0",
  };
}

/**
 * Capture one documented Sourcey API resource through SYPHON.
 * The policy must be reviewed and enabled by the caller; this adapter does
 * not self-approve terms, robots policy, or production source configuration.
 */
export async function captureSourceyResource(
  resource: SourceyResource,
  policy: SyphonSourcePolicy,
  capture: (
    url: string,
    policy: SyphonSourcePolicy,
    options?: SyphonCaptureOptions,
  ) => Promise<SyphonCapture>,
  options: SyphonCaptureOptions = {},
): Promise<SourceyCapture> {
  const request = buildSourceyRequest(resource);
  if (policy.sourceId !== request.sourceId || policy.canonicalOrigin !== API_ORIGIN)
    throw new Error("Sourcey API capture requires the reviewed sourcey-api policy and canonical API origin.");
  const captured = await capture(request.url, policy, options);
  return {
    ...captured,
    sourceLicense: request.attribution,
    sourceName: "Sourcey",
    sourceRevision: captured.responseMetadata.sourceyReleaseId,
    sourceArtifactDigest: captured.responseMetadata.sourceyArtifactSha256,
  };
}
