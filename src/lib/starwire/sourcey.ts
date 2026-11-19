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
