/**
 * Browser-safe ALLSPARX PRIME gateway client.
 *
 * This calls a secured, vendor-neutral gateway. Provider credentials and
 * provider-specific API calls belong behind that gateway, never in this app.
 */
import type { AllsparxProviderId, ProviderPreference } from "./providers";

const SUPPORTED_PROVIDERS = ["openai", "anthropic", "google", "ollama"] as const;
function isProviderId(value: unknown): value is AllsparxProviderId {
  return typeof value === "string" && (SUPPORTED_PROVIDERS as readonly string[]).includes(value);
}

export interface AllsparxTaskEvidence {
  requestId: string;
  engine: "ALLSPARX PRIME";
  controller: "SYPHON";
  task: "startup-deal-recommendation";
  status: "PROVIDER_RESPONSE_VALIDATED";
  provider: AllsparxProviderId | "gateway";
  requestedProvider: ProviderPreference;
  verified: false;
  verificationNote: string;
}
export interface AssistantProgramMatch { title: string; }
export interface AssistantTaskResult {
  summary: string;
  programs: AssistantProgramMatch[];
  evidence: AllsparxTaskEvidence;
}
interface AssistantApiResponse {
  summary: string;
  programs?: AssistantProgramMatch[];
  provider?: AllsparxProviderId;
}
function createRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `syphon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
function isAssistantApiResponse(value: unknown): value is AssistantApiResponse {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.summary === "string" &&
    (candidate.programs === undefined ||
      (Array.isArray(candidate.programs) && candidate.programs.every(
        (program) => typeof program === "object" && program !== null &&
          typeof (program as Record<string, unknown>).title === "string",
      ))) &&
    (candidate.provider === undefined || isProviderId(candidate.provider));
}
const MAX_RESPONSE_BYTES = 64 * 1024;
async function readBoundedJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  const mediaType = contentType.split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json" &&
      !/^application\/[a-z0-9.+-]+\+json$/.test(mediaType)) {
    throw new Error("The AI gateway did not return JSON.");
  }
  const declaredLength = response.headers.get("content-length");
  if (declaredLength !== null) {
    const length = Number(declaredLength);
    if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES)
      throw new Error("The AI gateway response exceeded the 64 KiB safety limit.");
  }
  if (!response.body) throw new Error("The AI gateway returned an empty response.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("The AI gateway response exceeded the 64 KiB safety limit.");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new Error("The AI gateway returned invalid JSON or non-UTF-8 content."); }
}

/** Validates the gateway response, not the truth of the model's claims. */
export async function runAllsparxPrimeTask(
  prompt: string,
  gatewayEndpoint: string,
  providerPreference: ProviderPreference = "auto",
  turnstileToken: string,
): Promise<AssistantTaskResult> {
  if (!turnstileToken || !turnstileToken.trim()) throw new Error("Complete the Cloudflare security check before sending your request.");
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) throw new Error("Enter a request before starting an ALLSPARX PRIME task.");
  if (normalizedPrompt.length > 500) throw new Error("Requests must be 500 characters or fewer.");
  let endpointUrl: URL;
  try { endpointUrl = new URL(gatewayEndpoint); }
  catch { throw new Error("The ALLSPARX gateway must be an absolute HTTP(S) URL."); }
  const isLocalHttp = endpointUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(endpointUrl.hostname);
  if (endpointUrl.protocol !== "https:" && !isLocalHttp)
    throw new Error("The ALLSPARX gateway must use HTTPS (HTTP is allowed only for localhost development).");
  if (endpointUrl.username || endpointUrl.password || endpointUrl.hash)
    throw new Error("The ALLSPARX gateway URL must not contain credentials or a fragment.");
  if (!["auto", "openai", "anthropic", "google", "ollama"].includes(providerPreference))
    throw new Error("Unsupported AI provider preference.");
  const requestId = createRequestId();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(endpointUrl.toString(), {
      method: "POST", redirect: "error",
      headers: { "Content-Type": "application/json", "X-ALLSPARX-Request-ID": requestId, "X-ALLSPARX-Turnstile-Token": turnstileToken },
      signal: controller.signal,
      body: JSON.stringify({
        prompt: normalizedPrompt,
        task: "startup-deal-recommendation",
        provider: providerPreference,
        contractVersion: 1,
      }),
    });
    if (!response.ok) throw new Error("The ALLSPARX gateway could not complete this request.");
    const body: unknown = await readBoundedJson(response);
    if (!isAssistantApiResponse(body)) throw new Error("The ALLSPARX gateway returned an invalid response format.");
    // Explicit provider selection is a strict contract: require the gateway to
    // report the actual provider and reject silent substitution or omission.
    if (providerPreference !== "auto" && body.provider !== providerPreference) {
      throw new Error("The ALLSPARX gateway did not honor the explicitly selected provider.");
    }
    return {
      summary: body.summary, programs: body.programs ?? [],
      evidence: {
        requestId, engine: "ALLSPARX PRIME", controller: "SYPHON",
        task: "startup-deal-recommendation", status: "PROVIDER_RESPONSE_VALIDATED",
        provider: body.provider ?? "gateway", requestedProvider: providerPreference,
        verified: false,
        verificationNote: "Gateway response validated. Provider selection, recommendation accuracy, downstream outcomes, and durable evidence require independent verification.",
      },
    };
  } catch (error) {
    if (controller.signal.aborted) throw new Error("The ALLSPARX gateway timed out after 30 seconds. Please try again.");
    throw error;
  } finally { clearTimeout(timeout); }
}
