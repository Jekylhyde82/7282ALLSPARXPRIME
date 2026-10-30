const API_PATH = "/api/allsparx/v1/ask";
const MAX_BODY_BYTES = 48 * 1024;
const MAX_PROMPT_CHARS = 500;
const MAX_OUTPUT_TOKENS = 800;
const MAX_PROVIDER_RESPONSE_BYTES = 64 * 1024;
const PROVIDERS = ["openai", "anthropic", "google", "ollama"];
let jwksCache = { value: null, expiresAt: 0 };

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}
async function readBoundedText(request, maxBytes) {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("request_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
function configuredOrigins(env) {
  return (env.ALLOWED_ORIGINS || "").split(",").map((v) => v.trim()).filter(Boolean);
}
function corsHeaders(origin, env) {
  if (!origin || !configuredOrigins(env).includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "Authorization, Content-Type, X-ALLSPARX-Request-ID",
    "access-control-max-age": "600",
    "vary": "Origin",
  };
}
function b64urlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
function decodeJsonPart(value) {
  return JSON.parse(new TextDecoder().decode(b64urlDecode(value)));
}
async function getJwks(url) {
  if (jwksCache.value && Date.now() < jwksCache.expiresAt) return jwksCache.value;
  const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error("jwks_unavailable");
  const data = await readBoundedJson(response);
  if (!data || !Array.isArray(data.keys) || data.keys.length === 0) throw new Error("jwks_empty");
  jwksCache = { value: data, expiresAt: Date.now() + 10 * 60 * 1000 };
  return data;
}
async function verifySupabaseToken(request, env) {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer ([A-Za-z0-9._~-]+)$/);
  if (!match) throw new Error("unauthorized");
  const token = match[1];
  if (token.length > 16_384) throw new Error("unauthorized");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("unauthorized");
  let header, claims;
  try { header = decodeJsonPart(parts[0]); claims = decodeJsonPart(parts[1]); }
  catch { throw new Error("unauthorized"); }
  if (!["RS256", "ES256"].includes(header.alg) || typeof header.kid !== "string") throw new Error("unauthorized");
  const supabaseUrl = (env.SUPABASE_URL || "").replace(/\/$/, "");
  if (!/^https:\/\//.test(supabaseUrl)) throw new Error("auth_not_configured");
  const jwks = await getJwks(supabaseUrl + "/auth/v1/.well-known/jwks.json");
  const jwk = jwks.keys.find((key) => key.kid === header.kid &&
    (key.alg === undefined || key.alg === header.alg) &&
    (key.use === undefined || key.use === "sig") &&
    (key.key_ops === undefined || key.key_ops.includes("verify")) &&
    (header.alg === "RS256" ? key.kty === "RSA" : key.kty === "EC" && key.crv === "P-256"));
  if (!jwk) throw new Error("unauthorized");
  const algorithm = header.alg === "RS256"
    ? { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }
    : { name: "ECDSA", namedCurve: "P-256" };
  const key = await crypto.subtle.importKey("jwk", jwk, algorithm, false, ["verify"]);
  const signatureAlgorithm = header.alg === "RS256"
    ? { name: "RSASSA-PKCS1-v1_5" }
    : { name: "ECDSA", hash: "SHA-256" };
  const signed = new TextEncoder().encode(parts[0] + "." + parts[1]);
  const valid = await crypto.subtle.verify(signatureAlgorithm, key, b64urlDecode(parts[2]), signed);
  if (!valid) throw new Error("unauthorized");
  const now = Math.floor(Date.now() / 1000);
  const issuer = supabaseUrl + "/auth/v1";
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== issuer || !audience.includes("authenticated") ||
      typeof claims.sub !== "string" || !claims.sub ||
      typeof claims.iat !== "number" || claims.iat > now + 30 ||
      typeof claims.exp !== "number" || claims.exp <= now ||
      (claims.nbf !== undefined && (typeof claims.nbf !== "number" || claims.nbf > now + 30)) ||
      claims.role !== "authenticated") throw new Error("unauthorized");
  return claims.sub;
}
function providerConfigs(env) {
  const list = [];
  if (env.OPENAI_API_KEY && env.OPENAI_MODEL) list.push("openai");
  if (env.ANTHROPIC_API_KEY && env.ANTHROPIC_MODEL) list.push("anthropic");
  if (env.GOOGLE_API_KEY && env.GOOGLE_MODEL) list.push("google");
  if (env.OLLAMA_BASE_URL && env.OLLAMA_MODEL) list.push("ollama");
  return list;
}
async function readBoundedJson(response, maxBytes = MAX_PROVIDER_RESPONSE_BYTES) {
  const declared = Number(response.headers.get("content-length") || "0");
  if (declared > maxBytes) throw new Error("provider_response_too_large");
  if (!response.body) throw new Error("provider_invalid_response");
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
        throw new Error("provider_response_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
function extractJson(text) {
  try { return JSON.parse(text); } catch {}
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  return { summary: text };
}
async function callProvider(provider, prompt, catalog, env) {
  const instruction = "Answer the user's request helpfully. Return only JSON with a string summary and a programs array of objects with string title fields. Choose program titles only from this supplied catalog, matching titles exactly; never invent program titles, prices, eligibility, or facts. If no catalog entry is relevant, return an empty programs array. Available program catalog: " + JSON.stringify(catalog) + " User request: " + prompt;
  const signal = AbortSignal.timeout(25_000);
  let response, text;
  if (provider === "openai") {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal,
      headers: { authorization: "Bearer " + env.OPENAI_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ model: env.OPENAI_MODEL, messages: [{ role: "user", content: instruction }], max_tokens: MAX_OUTPUT_TOKENS, temperature: 0.2 }),
    });
    if (response.ok) { const data = await readBoundedJson(response); text = data.choices?.[0]?.message?.content; }
  } else if (provider === "anthropic") {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal,
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: env.ANTHROPIC_MODEL, max_tokens: MAX_OUTPUT_TOKENS, messages: [{ role: "user", content: instruction }] }),
    });
    if (response.ok) { const data = await readBoundedJson(response); text = data.content?.find((part) => part.type === "text")?.text; }
  } else if (provider === "google") {
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(env.GOOGLE_MODEL) + ":generateContent";
    response = await fetch(endpoint, {
      method: "POST", signal,
      headers: { "x-goog-api-key": env.GOOGLE_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: instruction }] }], generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.2 } }),
    });
    if (response.ok) { const data = await readBoundedJson(response); text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join(""); }
  } else {
    const base = env.OLLAMA_BASE_URL.replace(/\/$/, "");
    if (!/^https:\/\//.test(base)) throw new Error("provider_not_configured");
    response = await fetch(base + "/api/generate", {
      method: "POST", signal, headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: env.OLLAMA_MODEL, prompt: instruction, stream: false, format: "json", options: { num_predict: MAX_OUTPUT_TOKENS, temperature: 0.2 } }),
    });
    if (response.ok) { const data = await readBoundedJson(response); text = data.response; }
  }
  if (!response) throw new Error("provider_not_configured");
  if (!response.ok) {
    const error = new Error("provider_error");
    error.status = response.status;
    throw error;
  }
  if (typeof text !== "string" || !text.trim()) throw new Error("provider_invalid_response");
  const parsed = extractJson(text);
  if (typeof parsed.summary !== "string") throw new Error("provider_invalid_response");
  const programs = Array.isArray(parsed.programs)
    ? parsed.programs.filter((item) => item && typeof item.title === "string").slice(0, 20).map((item) => ({ title: item.title.slice(0, 160) }))
    : [];
  const allowedTitles = new Set(catalog);
  return { summary: parsed.summary.slice(0, 12_000), programs: programs.filter((item) => allowedTitles.has(item.title)), provider };
}
async function runTask(body, env) {
  const available = providerConfigs(env);
  const order = body.provider === "auto" ? ["openai", "anthropic", "google", "ollama"].filter((p) => available.includes(p)) : [body.provider];
  if (order.length === 0 || order.some((p) => !available.includes(p))) throw new Error("provider_unavailable");
  let lastError;
  for (const provider of order) {
    try { return await callProvider(provider, body.prompt.trim(), body.catalog || [], env); }
    catch (error) {
      lastError = error;
      const retryable = error instanceof TypeError ||
        error.name === "AbortError" || error.name === "TimeoutError" ||
        error.status === 429 || (error.status >= 500 && error.status <= 599);
      if (body.provider !== "auto" || !retryable) throw error;
    }
  }
  throw lastError || new Error("provider_unavailable");
}
export class UserRateLimiter {
  constructor(state) { this.state = state; }
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    const now = Date.now();
    const bucket = this.state.storage.kv.get("user-rate-limit");
    if (!bucket || now >= bucket.resetAt) {
      this.state.storage.kv.put("user-rate-limit", { count: 1, resetAt: now + 60_000 });
      return json({ success: true, retryAfter: 60 });
    }
    if (bucket.count >= 12) {
      return json({ success: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) });
    }
    this.state.storage.kv.put("user-rate-limit", { ...bucket, count: bucket.count + 1 });
    return json({ success: true, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) });
  }
}

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin") || "";
  const cors = corsHeaders(origin, env);
  if (origin && !cors["access-control-allow-origin"]) return json({ error: "origin_not_allowed" }, 403);
  if (request.method === "OPTIONS") {
    if (url.pathname !== API_PATH) return json({ error: "not_found" }, 404);
    return new Response(null, { status: 204, headers: cors });
  }
  if (url.pathname !== API_PATH) return env.ASSETS.fetch(request);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);
  if (!env.SUPABASE_URL || !env.ALLOWED_ORIGINS || !env.USER_RATE_LIMITER_DO) return json({ error: "gateway_not_configured" }, 503, cors);
  let userId;
  try { userId = await verifySupabaseToken(request, env); }
  catch (error) {
    const unavailable = error.message === "auth_not_configured" ||
      error.message === "jwks_unavailable" || error.message === "jwks_empty" ||
      error instanceof TypeError || error.name === "AbortError" || error.name === "TimeoutError";
    return json(
      { error: unavailable ? "authentication_unavailable" : "unauthorized" },
      unavailable ? 503 : 401,
      unavailable ? { ...cors, "retry-after": "5" } : cors,
    );
  }
  let limit;
  try {
    const limiterId = env.USER_RATE_LIMITER_DO.idFromName(userId);
    const limiter = env.USER_RATE_LIMITER_DO.get(limiterId);
    const limiterResponse = await limiter.fetch("https://rate-limiter/check", { method: "POST" });
    if (!limiterResponse.ok) throw new Error("rate_limiter_unavailable");
    limit = await limiterResponse.json();
  } catch {
    return json({ error: "rate_limit_unavailable" }, 503, cors);
  }
  if (!limit.success) return json({ error: "rate_limited" }, 429, { ...cors, "retry-after": String(limit.retryAfter || 60) });
  const declared = Number(request.headers.get("content-length") || "0");
  if (declared > MAX_BODY_BYTES) return json({ error: "request_too_large" }, 413, cors);
  const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return json({ error: "content_type_required" }, 415, cors);
  let raw;
  try { raw = await readBoundedText(request, MAX_BODY_BYTES); }
  catch (error) {
    const tooLarge = error.message === "request_too_large";
    return json({ error: tooLarge ? "request_too_large" : "invalid_request" }, tooLarge ? 413 : 400, cors);
  }
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "invalid_json" }, 400, cors); }
  if (!body || typeof body.prompt !== "string" || body.prompt.trim().length < 1 ||
      body.prompt.length > MAX_PROMPT_CHARS || body.task !== "startup-deal-recommendation" ||
      body.contractVersion !== 1 || !["auto", ...PROVIDERS].includes(body.provider) ||
      (body.catalog !== undefined && (!Array.isArray(body.catalog) || body.catalog.length > 200 ||
        body.catalog.some((title) => typeof title !== "string" || title.length < 1 || title.length > 160)))) {
    return json({ error: "invalid_request_contract" }, 400, cors);
  }
  try {
    const result = await runTask(body, env);
    const suppliedId = request.headers.get("x-allsparx-request-id") || "";
    const requestId = /^[A-Za-z0-9._:-]{1,128}$/.test(suppliedId) ? suppliedId : crypto.randomUUID();
    return json(result, 200, { ...cors, "x-allsparx-request-id": requestId });
  } catch (error) {
    const status = error.message === "provider_unavailable" || error.message === "provider_not_configured" ? 503 : 502;
    return json({ error: status === 503 ? "provider_unavailable" : "provider_failed" }, status, cors);
  }
}
export default { fetch: handleRequest };
