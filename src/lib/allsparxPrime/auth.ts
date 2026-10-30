type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

const SESSION_KEY = "allsparx-prime-auth-session";

let refreshInFlight: Promise<string | null> | null = null;

function readSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<AuthSession>;
    if (typeof value.access_token !== "string" || !value.access_token ||
        typeof value.refresh_token !== "string" || !value.refresh_token ||
        typeof value.expires_at !== "number" || !Number.isFinite(value.expires_at)) return null;
    return value as AuthSession;
  } catch {
    return null;
  }
}
function saveSession(value: Record<string, unknown>): string | null {
  if (typeof value.access_token !== "string" || typeof value.refresh_token !== "string") return null;
  const expiresIn = typeof value.expires_in === "number" ? value.expires_in : 3600;
  const session: AuthSession = {
    access_token: value.access_token,
    refresh_token: value.refresh_token,
    expires_at: Date.now() + expiresIn * 1000,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session.access_token;
}
function authHeaders(publishableKey: string) {
  return { apikey: publishableKey, "content-type": "application/json" };
}
async function authError(response: Response): Promise<never> {
  let message = "Authentication could not be completed.";
  try {
    const body = await response.json();
    if (typeof body.msg === "string") message = body.msg;
    else if (typeof body.message === "string") message = body.message;
    else if (typeof body.error_description === "string") message = body.error_description;
  } catch {}
  throw new Error(message);
}
export async function signInWithPassword(email: string, password: string, url: string, publishableKey: string): Promise<string> {
  const response = await fetch(url.replace(/\/$/, "") + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: authHeaders(publishableKey),
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (!response.ok) return authError(response);
  const token = saveSession(await response.json());
  if (!token) throw new Error("Supabase did not return an authenticated session.");
  return token;
}
export async function signUpWithPassword(email: string, password: string, url: string, publishableKey: string): Promise<string | null> {
  const response = await fetch(url.replace(/\/$/, "") + "/auth/v1/signup", {
    method: "POST", headers: authHeaders(publishableKey),
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (!response.ok) return authError(response);
  const result = await response.json();
  if (result.access_token) return saveSession(result);
  return null;
}
export async function getAuthAccessToken(url: string, publishableKey: string): Promise<string | null> {
  const session = readSession();
  if (!session) return null;
  if (session.expires_at > Date.now() + 60_000) return session.access_token;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const response = await fetch(url.replace(/\/$/, "") + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST", headers: authHeaders(publishableKey),
      body: JSON.stringify({ refresh_token: session.refresh_token }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return saveSession(await response.json());
  })();
  try { return await refreshInFlight; }
  finally { refreshInFlight = null; }
}
export async function restoreAuthSession(url: string, publishableKey: string): Promise<string | null> {
  return getAuthAccessToken(url, publishableKey);
}
export async function signOut(url: string, publishableKey: string): Promise<void> {
  const session = readSession();
  sessionStorage.removeItem(SESSION_KEY);
  if (!session) return;
  await fetch(url.replace(/\/$/, "") + "/auth/v1/logout", {
    method: "POST",
    headers: { ...authHeaders(publishableKey), authorization: "Bearer " + session.access_token },
  }).catch(() => undefined);
}
