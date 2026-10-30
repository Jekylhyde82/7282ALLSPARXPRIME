const PROVIDERS = ["openai", "anthropic", "google"];
const MAX_BODY_BYTES = 8 * 1024;
const MAX_PROMPT_CHARS = 500;
const MAX_RESPONSE_BYTES = 64 * 1024;
const MAX_OUTPUT_TOKENS = 512;
const TIMEOUT_MS = 25_000;

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
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
async function verifyTurnstile(token, request, env) {
  if (!env.TURNSTILE_SECRET_KEY || !token) return false;
  const form = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
    remoteip: request.headers.get("CF-Connecting-IP") || "",
  });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", body: form, signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return false;
  const result = await response.json();
  const origin = request.headers.get("Origin");
  const expectedHostname = origin ? new URL(origin).hostname : "";
  return result.success === true && typeof result.hostname === "string" && result.hostname === expectedHostname;
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
        method: "POST",
        headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ model: "gpt-4.1-mini", input: prompt, max_output_tokens: MAX_OUTPUT_TOKENS }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw Object.assign(new Error("PROVIDER_FAILURE"), { retryable: response.status >= 500 || response.status === 429 });
      text = (data.output || []).flatMap((item) => item.content || []).filter((part) => part.type === "output_text").map((part) => part.text).join("\n");
    } else if (provider === "anthropic") {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-3-5-haiku-latest", max_tokens: MAX_OUTPUT_TOKENS, messages: [{ role: "user", content: prompt }] }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw Object.assign(new Error("PROVIDER_FAILURE"), { retryable: response.status >= 500 || response.status === 429 });
      text = (data.content || []).filter((part) => part.type === "text").map((part) => part.text).join("\n");
    } else if (provider === "google") {
      const model = "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      response = await fetch(url, {
        method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": env.GOOGLE_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS } }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw Object.assign(new Error("PROVIDER_FAILURE"), { retryable: response.status >= 500 || response.status === 429 });
      text = (data.candidates || []).flatMap((candidate) => candidate.content?.parts || []).map((part) => part.text || "").join("\n");
    }
    if (!text.trim()) throw Object.assign(new Error("EMPTY_PROVIDER_RESPONSE"), { retryable: true });
    return text.slice(0, 48_000);
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
    const origin = safeOrigin(request, env);
    if (!origin) return json({ error: "ORIGIN_NOT_ALLOWED" }, 403);
    const headers = cors(origin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405, headers);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "UNSUPPORTED_MEDIA_TYPE" }, 415, headers);
    if (!env.RATE_LIMITER || !env.SPEND_BUDGET || !env.TURNSTILE_SECRET_KEY) return json({ error: "GATEWAY_NOT_CONFIGURED" }, 503, headers);

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

    const budget = await env.SPEND_BUDGET.get(env.SPEND_BUDGET.idFromName(new Date().toISOString().slice(0, 7))).fetch("https://budget/reserve", { method: "POST" });
    if (!budget.ok) return json({ error: "MONTHLY_BUDGET_EXHAUSTED" }, 429, headers);
    for (const provider of candidates) {
      try {
        const output = await providerCall(provider, body.prompt.trim(), env);
        return json({ ...extractSummary(output), provider }, 200, { ...headers, "x-allsparx-request-id": requestId });
      } catch (error) {
        if (body.provider !== "auto" || !error.retryable) {
          return json({ error: "PROVIDER_REQUEST_FAILED", requestId }, 502, headers);
        }
      }
    }
    return json({ error: "ALL_PROVIDERS_UNAVAILABLE", requestId }, 503, headers);
  },
};

export class RateLimiter {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch() {
    const now = Date.now();
    const windowMs = 60_000;
    const limit = Number(this.env.RATE_LIMIT_PER_MINUTE || 10);
    const current = await this.state.storage.get("window");
    const window = !current || now - current.startedAt >= windowMs ? { startedAt: now, count: 0 } : current;
    if (window.count >= limit) return new Response("limited", { status: 429 });
    window.count += 1;
    await this.state.storage.put("window", window, { expirationTtl: 120 });
    return new Response("ok");
  }
}

export class SpendBudget {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch() {
    const month = new Date().toISOString().slice(0, 7);
    const key = `reserved:${month}`;
    const reservation = Number(this.env.MAX_REQUEST_COST_MICROS || 50000);
    const cap = Number(this.env.MONTHLY_SPEND_LIMIT_MICROS || 20000000);
    const current = Number(await this.state.storage.get(key) || 0);
    if (!Number.isSafeInteger(reservation) || reservation < 1 || !Number.isSafeInteger(cap) || cap < reservation || current + reservation > cap)
      return new Response("budget exhausted", { status: 429 });
    // Conservatively reserve the full configured request ceiling. Reservations
    // are not refunded until usage-based settlement is independently verified.
    await this.state.storage.put(key, current + reservation);
    return new Response("reserved");
  }
}
