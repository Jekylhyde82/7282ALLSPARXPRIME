/** Vendor-neutral provider policy for the ALLSPARX PRIME gateway.
 * This module contains identifiers and routing policy only; never put provider
 * credentials or provider SDKs in browser-bundled code.
 */
export const ALLSPARX_PROVIDERS = ["openai", "anthropic", "google", "ollama"] as const;
export type AllsparxProviderId = (typeof ALLSPARX_PROVIDERS)[number];
export type ProviderPreference = "auto" | AllsparxProviderId;
export type AllsparxTask = "startup-deal-recommendation";

const TASK_ROUTES: Record<AllsparxTask, readonly AllsparxProviderId[]> = {
  "startup-deal-recommendation": ["openai", "anthropic", "google", "ollama"],
};

/** Ordered preference only. The gateway must skip unconfigured providers and
 * record the actual provider used. An explicit preference does not silently
 * fall back to another vendor.
 */
export function resolveProviderRoute(
  task: AllsparxTask,
  preference: ProviderPreference = "auto",
): readonly AllsparxProviderId[] {
  if (preference === "auto") return TASK_ROUTES[task];
  if (!ALLSPARX_PROVIDERS.includes(preference)) {
    throw new Error("Unsupported AI provider preference.");
  }
  return [preference];
}

export function isProviderId(value: unknown): value is AllsparxProviderId {
  return typeof value === "string" &&
    (ALLSPARX_PROVIDERS as readonly string[]).includes(value);
}
