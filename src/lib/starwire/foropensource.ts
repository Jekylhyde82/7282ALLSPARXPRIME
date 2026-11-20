/**
 * Free for Open Source registry adapter.
 *
 * Uses the public GitHub Contents API to pin a repository commit and list
 * structured offer records, then raw.githubusercontent.com for individual
 * YAML records. Offer data attribution is required under CC BY 4.0.
 */
import type { SyphonCapture, SyphonCaptureOptions, SyphonSourcePolicy } from "./syphon.js";

export type ForOpenSourceResource =
  | { kind: "latest-commit"; branch?: string }
  | { kind: "offer-index"; commitSha: string }
  | { kind: "offer-file"; commitSha: string; fileName: string };

export interface ForOpenSourceRequest {
  url: string;
  method: "GET";
  accept: "application/json" | "text/plain";
  sourceId: "foropensource-github-api" | "foropensource-raw";
  attribution: "foropensource · CC BY 4.0";
  commitSha: string | null;
}

export interface ForOpenSourceOfferFile {
  name: string;
  path: string;
  sha: string;
  downloadUrl: string;
}

export type ForOpenSourceCapture = SyphonCapture & {
  sourceName: "foropensource";
  sourceLicense: "CC-BY-4.0";
  repository: "natwar86/foropensource";
  repositoryCommit: string | null;
  attribution: "foropensource";
};

export interface ForOpenSourceOfferProvenance {
  sourceLicense: "CC-BY-4.0";
  sourceRecordId: string;
  sourceRecordRevision: null;
  sourceRecordUrl: string;
  sourceRevision: string;
  /** Explicitly tagged as Git blob SHA-1, never confused with SHA-256. */
  sourceArtifactId: string;
  sourceReleaseId: null;
  sourceArtifactSha256: null;
}

/** Map a validated immutable GitHub offer-index entry to candidate provenance. */
export function extractForOpenSourceOfferProvenance(
  offer: ForOpenSourceOfferFile,
  commitSha: string,
): ForOpenSourceOfferProvenance {
  if (!SHA_PATTERN.test(commitSha)) throw new Error("Free for Open Source provenance requires a full commit SHA.");
  if (!offer || typeof offer !== "object" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*\.ya?ml$/i.test(offer.name) ||
      offer.path !== `data/offers/${offer.name}` ||
      !SHA_PATTERN.test(offer.sha))
    throw new Error("Free for Open Source offer provenance requires a validated immutable offer-index entry.");
  return {
    sourceLicense: "CC-BY-4.0",
    sourceRecordId: offer.path,
    sourceRecordRevision: null,
    sourceRecordUrl: `https://github.com/${REPOSITORY}/blob/${commitSha}/${offer.path}`,
    sourceRevision: commitSha,
    sourceArtifactId: `git-blob-sha1:${offer.sha}`,
    sourceReleaseId: null,
    sourceArtifactSha256: null,
  };
}

const API_ORIGIN = "https://api.github.com";
const RAW_ORIGIN = "https://raw.githubusercontent.com";
const REPOSITORY = "natwar86/foropensource";
const SHA_PATTERN = /^[a-f0-9]{40}$/;

export function buildForOpenSourceRequest(resource: ForOpenSourceResource): ForOpenSourceRequest {
  if (resource.kind === "latest-commit") {
    const branch = resource.branch ?? "main";
    if (!/^[A-Za-z0-9._/-]{1,100}$/.test(branch) || branch.includes(".."))
      throw new Error("Invalid Free for Open Source branch name.");
    return {
      url: `${API_ORIGIN}/repos/${REPOSITORY}/commits/${encodeURIComponent(branch)}`,
      method: "GET", accept: "application/json",
      sourceId: "foropensource-github-api",
      attribution: "foropensource · CC BY 4.0", commitSha: null,
    };
  }
  if (!SHA_PATTERN.test(resource.commitSha))
    throw new Error("Free for Open Source requests must pin a full 40-character commit SHA.");
  if (resource.kind === "offer-index") {
    const url = new URL(`${API_ORIGIN}/repos/${REPOSITORY}/contents/data/offers`);
    url.searchParams.set("ref", resource.commitSha);
    return {
      url: url.toString(), method: "GET", accept: "application/json",
      sourceId: "foropensource-github-api",
      attribution: "foropensource · CC BY 4.0", commitSha: resource.commitSha,
    };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.ya?ml$/i.test(resource.fileName))
    throw new Error("Offer filename must be a simple YAML filename.");
  return {
    url: `${RAW_ORIGIN}/${REPOSITORY}/${resource.commitSha}/data/offers/${encodeURIComponent(resource.fileName)}`,
    method: "GET", accept: "text/plain",
    sourceId: "foropensource-raw",
    attribution: "foropensource · CC BY 4.0", commitSha: resource.commitSha,
  };
}

export function extractForOpenSourceCommitSha(jsonBody: string): string {
  let value: unknown;
  try { value = JSON.parse(jsonBody); }
  catch { throw new Error("GitHub commit response is not valid JSON."); }
  if (typeof value !== "object" || value === null ||
      typeof (value as Record<string, unknown>).sha !== "string" ||
      !SHA_PATTERN.test((value as Record<string, string>).sha))
    throw new Error("GitHub commit response did not contain a full commit SHA.");
  return (value as Record<string, string>).sha;
}

export function parseForOpenSourceOfferIndex(jsonBody: string): ForOpenSourceOfferFile[] {
  let value: unknown;
  try { value = JSON.parse(jsonBody); }
  catch { throw new Error("Free for Open Source offer index is not valid JSON."); }
  if (!Array.isArray(value)) throw new Error("Free for Open Source offer index must be an array.");
  return value.map((entry, index) => {
    if (typeof entry !== "object" || entry === null)
      throw new Error(`Offer index entry ${index} is invalid.`);
    const row = entry as Record<string, unknown>;
    if (typeof row.name !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*\.ya?ml$/i.test(row.name) ||
        typeof row.path !== "string" || row.path !== `data/offers/${row.name}` ||
        typeof row.sha !== "string" || !/^[a-f0-9]{40}$/.test(row.sha) ||
        typeof row.download_url !== "string")
      throw new Error(`Offer index entry ${index} has an invalid GitHub file contract.`);
    const download = new URL(row.download_url);
    if (download.protocol !== "https:" || download.hostname !== "raw.githubusercontent.com" ||
        !download.pathname.startsWith(`/${REPOSITORY}/`))
      throw new Error(`Offer index entry ${index} has an untrusted download URL.`);
    return { name: row.name, path: row.path, sha: row.sha, downloadUrl: download.toString() };
  });
}

/**
 * Capture one Free for Open Source resource through SYPHON.
 * Each transport host has a separate source policy and must be approved.
 */
export async function captureForOpenSourceResource(
  resource: ForOpenSourceResource,
  policy: SyphonSourcePolicy,
  capture: (
    url: string,
    policy: SyphonSourcePolicy,
    options?: SyphonCaptureOptions,
  ) => Promise<SyphonCapture>,
  options: SyphonCaptureOptions = {},
): Promise<ForOpenSourceCapture> {
  const request = buildForOpenSourceRequest(resource);
  const expectedOrigin = request.sourceId === "foropensource-github-api" ? API_ORIGIN : RAW_ORIGIN;
  if (policy.sourceId !== request.sourceId || policy.canonicalOrigin !== expectedOrigin)
    throw new Error("Free for Open Source capture requires its matching reviewed source policy.");
  const captured = await capture(request.url, policy, options);
  return {
    ...captured,
    sourceName: "foropensource",
    sourceLicense: "CC-BY-4.0",
    repository: REPOSITORY,
    repositoryCommit: request.commitSha,
    attribution: "foropensource",
  };
}
