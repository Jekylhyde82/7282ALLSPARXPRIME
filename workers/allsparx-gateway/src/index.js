import { EvidenceLedger } from "./evidence-ledger.js";
export { EvidenceLedger };

const PROVIDERS = ["openai", "anthropic", "google"];
const MAX_BODY_BYTES = 8 * 1024;
const MAX_PROMPT_CHARS = 500;
const MAX_RESPONSE_BYTES = 64 * 1024;
const MAX_OUTPUT_TOKENS = 512;
const TIMEOUT_MS = 25_000;

async function promptFingerprint(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function recordEvidence(env, event) {
  try {
    const month = event.timestamp.slice(0, 7);
    const ledger = env.EVIDENCE_LEDGER.get(env.EVIDENCE_LEDGER.idFromName(month));
    const response = await ledger.fetch("https://evidence/append", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(event),
    });
    return response.ok;
  } catch { return false; }
}
function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", ...headers },
  });
}
function safeOrigin(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((v) => v.trim()).filter(Boolean);
  return origin && allowed.includes(origin) ? origin : null;
}
function cors(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-allsparx-request-id, x-allsparx-turnstile-token",
    "access-control-max-age": "600",
    "access-control-expose-headers": "x-allsparx-request-id",
    "vary": "Origin",
  };
}
async function readJsonBounded(request) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) throw new Error("BODY_TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("EMPTY_BODY");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error("BODY_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
async function readProviderJson(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("EMPTY_PROVIDER_RESPONSE");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("PROVIDER_RESPONSE_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

async function verifyTurnstile(token, request, env) {
  if (!env.TURNSTILE_SECRET_KEY || !token) return false;
  const form = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
    remoteip: request.headers.get("CF-Connecting-IP") || "",
  });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", body: form, redirect: "error", signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return false;
  const result = await response.json();
  const origin = request.headers.get("Origin");
  const expectedHostname = origin ? new URL(origin).hostname : "";
  return result.success === true && typeof result.hostname === "string" && result.hostname === expectedHostname && result.action === "allsparx_assistant";
}
function configuredProviders(env, preference) {
  const configured = PROVIDERS.filter((provider) => {
    if (provider === "openai") return Boolean(env.OPENAI_API_KEY);
    if (provider === "anthropic") return Boolean(env.ANTHROPIC_API_KEY);
    if (provider === "google") return Boolean(env.GOOGLE_API_KEY);
    return false;
  });
  if (preference === "auto") return configured;
  return configured.includes(preference) ? [preference] : [];
}
async function providerCall(provider, prompt, env) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let response, text = "";
    if (provider === "openai") {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST", redirect: "error",
        headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ model: "gpt-6-luna", input: prompt, max_output_tokens: MAX_OUTPUT_TOKENS }),
        signal: controller.signal,
      });
      if (!response.ok) throw Object.assign(new Error("PROVIDER_FAILURE"), { retryable: response.status >= 500 || response.status === 429 });
      const data = await readProviderJson(response);
      text = (data.output || []).flatMap((item) => item.content || []).filter((part) => part.type === "output_text").map((part) => part.text).join("\n");
    } else if (provider === "anthropic") {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", redirect: "error",
        headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: MAX_OUTPUT_TOKENS, messages: [{ role: "user", content: prompt }] }),
        signal: controller.signal,
      });
      if (!response.ok) throw Object.assign(new Error("PROVIDER_FAILURE"), { retryable: response.status >= 500 || response.status === 429 });
      const data = await readProviderJson(response);
      text = (data.content || []).filter((part) => part.type === "text").map((part) => part.text).join("\n");
    } else if (provider === "google") {
      const model = "gemini-3.8-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      response = await fetch(url, {
        method: "POST", redirect: "error", headers: { "content-type": "application/json", "x-goog-api-key": env.GOOGLE_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS } }),
        signal: controller.signal,
      });
      if (!response.ok) throw Object.assign(new Error("PROVIDER_FAILURE"), { retryable: response.status >= 500 || response.status === 429 });
      const data = await readProviderJson(response);
      text = (data.candidates || []).flatMap((candidate) => candidate.content?.parts || []).map((part) => part.text || "").join("\n");
    }
    if (!text.trim()) throw Object.assign(new Error("EMPTY_PROVIDER_RESPONSE"), { retryable: true });
    return text.slice(0, 48_000);
  } catch (error) {
    // Transient network failures and timeouts should advance the automatic
    // provider route; explicit provider selection remains strict at the caller.
    if (error?.name === "AbortError" || error?.name === "TypeError" || controller.signal.aborted) {
      throw Object.assign(new Error("PROVIDER_TRANSPORT_FAILURE"), { retryable: true });
    }
    throw error;
  } finally { clearTimeout(timer); }
}
function extractSummary(text) {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed.summary === "string") {
      const programs = Array.isArray(parsed.programs)
        ? parsed.programs.filter((p) => p && typeof p.title === "string").slice(0, 20).map((p) => ({ title: p.title.slice(0, 200) }))
        : [];
      return { summary: parsed.summary.slice(0, 12_000), programs };
    }
  } catch {}
  return { summary: trimmed.slice(0, 12_000), programs: [] };
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/healthz" && request.method === "GET") {
      return json({ status: "ok", service: "allsparx-prime-gateway" });
    }
    const origin = safeOrigin(request, env);
    if (!origin) return json({ error: "ORIGIN_NOT_ALLOWED" }, 403);
    const headers = cors(origin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (url.pathname !== "/v1/ask") return json({ error: "NOT_FOUND" }, 404, headers);
    if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405, headers);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "UNSUPPORTED_MEDIA_TYPE" }, 415, headers);
    if (!env.RATE_LIMITER || !env.SPEND_BUDGET || !env.EVIDENCE_LEDGER || !env.TURNSTILE_SECRET_KEY || !env.EVIDENCE_HMAC_KEY) return json({ error: "GATEWAY_NOT_CONFIGURED" }, 503, headers);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const rate = await env.RATE_LIMITER.get(env.RATE_LIMITER.idFromName(ip)).fetch("https://rate-limit/check");
    if (!rate.ok) return json({ error: "RATE_LIMITED" }, 429, { ...headers, "retry-after": "60" });

    const token = request.headers.get("X-ALLSPARX-Turnstile-Token");
    try {
      if (!(await verifyTurnstile(token, request, env))) return json({ error: "CHALLENGE_FAILED" }, 403, headers);
    } catch { return json({ error: "CHALLENGE_UNAVAILABLE" }, 503, headers); }

    let body;
    try { body = await readJsonBounded(request); }
    catch (error) { return json({ error: error.message === "BODY_TOO_LARGE" ? "BODY_TOO_LARGE" : "INVALID_JSON" }, 400, headers); }
    if (!body || typeof body.prompt !== "string" || body.prompt.trim().length < 1 || body.prompt.trim().length > MAX_PROMPT_CHARS ||
        body.task !== "startup-deal-recommendation" || body.contractVersion !== 1 ||
        !["auto", ...PROVIDERS, "ollama"].includes(body.provider)) {
      return json({ error: "INVALID_REQUEST" }, 400, headers);
    }
    const requestId = request.headers.get("X-ALLSPARX-Request-ID") || crypto.randomUUID();
    if (requestId.length > 128 || !/^[a-zA-Z0-9._:-]+$/.test(requestId)) return json({ error: "INVALID_REQUEST_ID" }, 400, headers);

    const candidates = configuredProviders(env, body.provider);
    if (!candidates.length) return json({ error: "PROVIDER_UNAVAILABLE" }, 503, headers);

    const timestamp = new Date().toISOString();
    const promptHmacSha256 = await promptFingerprint(body.prompt.trim(), env.EVIDENCE_HMAC_KEY);
    const operationId = crypto.randomUUID();
    const evidence = (eventType, status, provider, outcomeCode) => ({
      operationId,
      correlationId: requestId,
      eventType,
      status,
      timestamp: new Date().toISOString(),
      actor: { type: "anonymous-origin", origin },
      provenance: {
        system: "ALLSPARX PRIME",
        producer: "allsparx-prime-gateway",
        environment: env.ENVIRONMENT || "production",
        deploymentId: env.CF_VERSION_METADATA?.id || env.APP_VERSION || "unavailable",
      },
      objective: body.task,
      promptHmacSha256,
      provider: provider || null,
      outcomeCode,
    });
    if (!(await recordEvidence(env, evidence("ATTEMPTED", "ATTEMPTED", null, "REQUEST_ACCEPTED")))) {
      return json({ error: "EVIDENCE_UNAVAILABLE" }, 503, headers);
    }

    for (const provider of candidates) {
      // Each provider attempt can incur its own cost. Reserve separately so
      // automatic fallback cannot multiply spend beyond the configured ceiling.
      const budget = await env.SPEND_BUDGET.get(env.SPEND_BUDGET.idFromName(timestamp.slice(0, 7))).fetch("https://budget/reserve", { method: "POST" });
      if (!budget.ok) {
        const recorded = await recordEvidence(env, evidence("FAILED", "FAILED", provider, "MONTHLY_BUDGET_EXHAUSTED"));
        return json({ error: recorded ? "MONTHLY_BUDGET_EXHAUSTED" : "EVIDENCE_UNAVAILABLE" }, recorded ? 429 : 503, headers);
      }
      try {
        const output = await providerCall(provider, body.prompt.trim(), env);
        const result = extractSummary(output);
        if (!(await recordEvidence(env, evidence("SUCCEEDED", "PROVIDER_RESPONSE_RETURNED", provider, "PROVIDER_RESPONSE_RETURNED")))) {
          return json({ error: "EVIDENCE_UNAVAILABLE" }, 503, headers);
        }
        return json({ ...result, provider }, 200, { ...headers, "x-allsparx-request-id": requestId });
      } catch (error) {
        const recorded = await recordEvidence(env, evidence("FAILED", "PROVIDER_ATTEMPT_FAILED", provider, "PROVIDER_REQUEST_FAILED"));
        if (!recorded) return json({ error: "EVIDENCE_UNAVAILABLE" }, 503, headers);
        if (body.provider !== "auto" || !error.retryable) {
          return json({ error: "PROVIDER_REQUEST_FAILED", requestId }, 502, headers);
        }
      }
    }
    const recorded = await recordEvidence(env, evidence("FAILED", "FAILED", null, "ALL_PROVIDERS_UNAVAILABLE"));
    return json({ error: recorded ? "ALL_PROVIDERS_UNAVAILABLE" : "EVIDENCE_UNAVAILABLE", requestId }, recorded ? 503 : 503, headers);
  },
};

export class RateLimiter {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch() {
    const now = Date.now();
    const windowMs = 60_000;
    const limit = Number(this.env.RATE_LIMIT_PER_MINUTE || 10);
    const admitted = await this.state.storage.transaction(async (txn) => {
      const current = await txn.get("window");
      const window = !current || now - current.startedAt >= windowMs
        ? { startedAt: now, count: 0 }
        : current;
      if (window.count >= limit) return false;
      window.count += 1;
      await txn.put("window", window, { expirationTtl: 120 });
      return true;
    });
    return admitted ? new Response("ok") : new Response("limited", { status: 429 });
  }
}

export class SpendBudget {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch() {
    const month = new Date().toISOString().slice(0, 7);
    const key = `reserved:${month}`;
    const reservation = Number(this.env.MAX_REQUEST_COST_MICROS || 50000);
    const cap = Number(this.env.MONTHLY_SPEND_LIMIT_MICROS || 20000000);
    if (!Number.isSafeInteger(reservation) || reservation < 1 ||
        !Number.isSafeInteger(cap) || cap < reservation) {
      return new Response("budget exhausted", { status: 429 });
    }
    // Read-modify-write must be atomic: concurrent requests must not reserve
    // against the same stale balance and exceed the configured admission cap.
    const admitted = await this.state.storage.transaction(async (txn) => {
      const current = Number(await txn.get(key) || 0);
      if (!Number.isSafeInteger(current) || current < 0 || current + reservation > cap) return false;
      // Conservatively reserve the full configured request ceiling. Reservations
      // are not refunded until usage-based settlement is independently verified.
      await txn.put(key, current + reservation);
      return true;
    });
    return admitted ? new Response("reserved") : new Response("budget exhausted", { status: 429 });
  }
}
