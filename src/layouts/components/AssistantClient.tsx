import React, { useState, useEffect } from "react";
import AIInput from "./AIInput";
import ProgramCard from "./ProgramCard";
import LoadingIndicator from "./LoadingIndicator";
import StarCTADialog from "./StarCTADialog";
import { useStarCTA } from "./useStarCTA";
import {
  runAllsparxPrimeTask,
  type AllsparxTaskEvidence,
} from "@/lib/allsparxPrime/runtime";
import { getAuthAccessToken, restoreAuthSession, signInWithPassword, signOut, signUpWithPassword } from "@/lib/allsparxPrime/auth";

interface Program {
  id: string;
  slug?: string;
  collection: string;
  data: {
    title: string;
    intro: string;
    max_value: number;
    value_type: string;
    currency: string;
    status: "Active" | "Discontinued" | "Beta" | "Upcoming";
    tags: string[];
    url: string;
    provider_slug: string;
    tiers: Array<{
      effort_level: number;
    }>;
  };
}

interface Provider {
  id: string;
  slug?: string;
  collection: string;
  data: {
    title?: string;
    slug: string;
    color: string;
    logo?: string;
    website?: string;
  };
}

interface APIResponse {
  summary: string;
  programs: Array<{ title: string }>;
}

interface AssistantClientProps {
  allPrograms: Program[];
  allProviders: Provider[];
}

export default function AssistantClient({
  allPrograms,
  allProviders,
}: AssistantClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
  const supabasePublishableKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [runtimeEvidence, setRuntimeEvidence] =
    useState<AllsparxTaskEvidence | null>(null);
  const [matchedPrograms, setMatchedPrograms] = useState<Program[]>([]);
  const [prompt, setPrompt] = useState("");
  const [hasProcessedUrlPrompt, setHasProcessedUrlPrompt] = useState(false);
  const { shouldShow, triggerStarCTA, closeStarCTA } = useStarCTA();

  useEffect(() => {
    if (!supabaseUrl || !supabasePublishableKey) {
      setAuthMessage("Authentication is not configured for this deployment. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
      return;
    }
    restoreAuthSession(supabaseUrl, supabasePublishableKey)
      .then((token) => setAuthToken(token || ""))
      .catch(() => setAuthMessage("Could not restore your sign-in session. Please sign in again."));
  }, []);

  // Restore cached results on mount
  useEffect(() => {
    const cached = sessionStorage.getItem("ai-assistant-results");
    if (cached) {
      try {
        const {
          prompt: cachedPrompt,
          summary: cachedSummary,
          programIds,
        } = JSON.parse(cached);
        setPrompt(cachedPrompt);
        setSummary(cachedSummary);

        // Restore matched programs from IDs
        const matched = programIds
          .map((id: string) => allPrograms.find((p) => p.id === id))
          .filter((p: Program | undefined): p is Program => p !== undefined);
        setMatchedPrograms(matched);
      } catch (e) {
        console.error("Failed to restore cached results:", e);
      }
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPrompt = urlParams.get("prompt");

    if (urlPrompt && authToken && !hasProcessedUrlPrompt) {
      setPrompt(urlPrompt);
      setHasProcessedUrlPrompt(true);

      // Clear the URL parameter immediately to prevent re-processing
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("prompt");
      window.history.replaceState({}, "", newUrl.toString());

      handleAPICall(urlPrompt);
    }
  }, [hasProcessedUrlPrompt, authToken]);

  const handleAPICall = async (inputPrompt: string) => {
    setIsLoading(true);
    setError("");
    setSummary("");
    setRuntimeEvidence(null);
    setMatchedPrograms([]);

    try {
      const aiEndpoint = import.meta.env.PUBLIC_ALLSPARX_GATEWAY_URL;
      const providerPreference = import.meta.env.PUBLIC_ALLSPARX_PROVIDER || "auto";
      if (!aiEndpoint) {
        throw new Error(
          "ALLSPARX PRIME is not configured for this deployment. Set PUBLIC_ALLSPARX_GATEWAY_URL to the secured gateway URL, then rebuild the site.",
        );
      }
      const accessToken = await getAuthAccessToken(supabaseUrl, supabasePublishableKey);
      if (!accessToken) { setAuthToken(""); throw new Error("Your sign-in session has expired. Please sign in again."); }
      setAuthToken(accessToken);
      const apiResponse = await runAllsparxPrimeTask(
        inputPrompt, aiEndpoint,
        providerPreference as "auto" | "openai" | "anthropic" | "google" | "ollama",
        accessToken, allPrograms.map((program) => program.data.title).slice(0, 200),
        async () => {
          const refreshedToken = await getAuthAccessToken(supabaseUrl, supabasePublishableKey, true);
          if (refreshedToken) setAuthToken(refreshedToken);
          return refreshedToken;
        },
      );

      setSummary(apiResponse.summary);
      setRuntimeEvidence(apiResponse.evidence);

      // Find programs by title from the collection
      if (apiResponse.programs.length > 0) {
        const matched = apiResponse.programs
          .map((program: { title: string }) => {
            return allPrograms.find((p) => p.data.title === program.title);
          })
          .filter((p): p is Program => p !== undefined);
        setMatchedPrograms(matched);

        // Cache results in sessionStorage
        sessionStorage.setItem(
          "ai-assistant-results",
          JSON.stringify({
            prompt: inputPrompt,
            summary: apiResponse.summary,
            programIds: matched.map((p) => p.id),
          }),
        );
      }

      // Trigger star CTA after successful response
      triggerStarCTA();
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "AI can't handle this right now. Please try again later.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabaseUrl || !supabasePublishableKey) return;
    setAuthBusy(true); setAuthMessage("");
    try {
      const token = authMode === "signin"
        ? await signInWithPassword(authEmail, authPassword, supabaseUrl, supabasePublishableKey)
        : await signUpWithPassword(authEmail, authPassword, supabaseUrl, supabasePublishableKey);
      if (token) { setAuthToken(token); setAuthPassword(""); setAuthMessage("Signed in successfully."); }
      else setAuthMessage("Check your email to confirm your account, then sign in.");
    } catch (err) { setAuthMessage(err instanceof Error ? err.message : "Authentication failed."); }
    finally { setAuthBusy(false); }
  };

  const handleSignOut = async () => {
    await signOut(supabaseUrl, supabasePublishableKey);
    setAuthToken(""); setSummary(""); setMatchedPrograms([]); setRuntimeEvidence(null); sessionStorage.removeItem("ai-assistant-results");
    setAuthMessage("You have signed out.");
  };

  const handleSubmit = async (value: string) => {
    setPrompt(value);

    // Don't update URL with prompt parameter to avoid re-processing
    // Just call the API directly
    await handleAPICall(value);
  };

  return (
    <>
      {/* AI Input Section - Full width but with max-width for the input */}
      <div className="container">
        <div className="max-w-3xl mx-auto mb-8 mt-8">
          {!authToken ? (
            <form onSubmit={handleAuthSubmit} className="max-w-md mx-auto rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h2 className="text-xl font-semibold text-center">{authMode === "signin" ? "Sign in to ALLSPARX PRIME" : "Create your account"}</h2>
              <label className="block text-sm">Email<input type="email" required autoComplete="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="mt-1 w-full rounded-md border p-3 dark:bg-gray-900" /></label>
              <label className="block text-sm">Password<input type="password" required minLength={8} autoComplete={authMode === "signin" ? "current-password" : "new-password"} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="mt-1 w-full rounded-md border p-3 dark:bg-gray-900" /></label>
              <button type="submit" disabled={authBusy || !supabaseUrl || !supabasePublishableKey} className="btn bg-primary text-white px-6 py-3 rounded-md w-full disabled:opacity-50">{authBusy ? "Please wait…" : authMode === "signin" ? "Sign in" : "Create account"}</button>
              <button type="button" onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")} className="text-sm underline w-full">{authMode === "signin" ? "Create an account" : "Already have an account? Sign in"}</button>
              {authMessage && <p role="status" className="text-sm text-center text-gray-600 dark:text-gray-300">{authMessage}</p>}
            </form>
          ) : (
            <>
              <div className="flex justify-end"><button type="button" onClick={handleSignOut} className="text-sm underline">Sign out</button></div>
              <AIInput onSubmit={handleSubmit} loading={isLoading} />
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">⏱️ I usually respond within 30 seconds - hang tight!</p>
            </>
          )}
        </div>
      </div>

      <section className="section-sm">
        <div className="container">
          {/* Error message container */}
          {error && (
            <div
              id="error-message"
              className="text-center py-6 px-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg mb-6 animate-fade-in"
            >
              <div className="py-2">{error}</div>
              <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => prompt && handleAPICall(prompt)}
                  className="btn bg-primary text-white px-6 py-2 rounded-md inline-flex items-center gap-2 hover:bg-opacity-90"
                  disabled={isLoading}
                >
                  <span className="leading-none self-center">Try Again</span>
                </button>
                <a
                  href="/providers"
                  className="btn border border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center gap-2"
                >
                  <span className="leading-none self-center">
                    Explore Deals
                  </span>
                  <span className="leading-none self-center ml-1">→</span>
                </a>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && <LoadingIndicator />}

          {/* Results container */}
          {!isLoading && (summary || matchedPrograms.length > 0) && (
            <div id="results-container" className="animate-fade-in">
              {/* Summary - Full width but readable */}
              {summary && (
                <div
                  className="mb-10 prose prose-lg dark:prose-invert max-w-5xl mx-auto bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50"
                  data-summary
                >
                  <p
                    id="summary-container"
                    className="whitespace-pre-wrap break-words"
                  >
                    {summary}
                  </p>
                </div>
              )}

              {runtimeEvidence && (
                <p
                  className="mb-6 text-center text-xs text-gray-500 dark:text-gray-400"
                  role="status"
                  data-syphon-evidence
                >
                  ALLSPARX PRIME · SYPHON task {runtimeEvidence.status.toLowerCase()} ·
                  request {runtimeEvidence.requestId} · independent verification pending
                </p>
              )}

              {/* Programs - Full width grid */}
              {matchedPrograms.length > 0 && (
                <div id="programs-container" className="animate-fade-in">
                  <h2 className="mb-6 text-2xl font-bold text-center">
                    Recommended Programs
                  </h2>
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                    {matchedPrograms.map((program, index) => (
                      <div
                        key={program.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <ProgramCard
                          program={program}
                          allProviders={allProviders}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No results state */}
          {!isLoading &&
            prompt &&
            !error &&
            !summary &&
            matchedPrograms.length === 0 && (
              <div
                id="no-results"
                className="text-center py-12 animate-fade-in"
              >
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-semibold mb-3">
                    No matching programs found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try rephrasing your query or explore our full catalog of
                    deals.
                  </p>
                  <a
                    href="/providers"
                    className="btn bg-primary text-white px-6 py-3 rounded-md inline-flex items-center gap-2 hover:bg-opacity-90"
                  >
                    <span className="leading-none self-center">
                      Browse All Deals
                    </span>
                    <span className="leading-none self-center ml-1">→</span>
                  </a>
                </div>
              </div>
            )}

          {/* Empty state */}
          {!prompt && !isLoading && !error && (
            <div id="empty-state" className="text-center py-16 animate-fade-in">
              <div className="max-w-lg mx-auto">
                <h3 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
                  Ask me anything about cloud deals
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  I can help you find the perfect cloud credits, SaaS discounts,
                  and startup programs based on your specific needs.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  {[
                    "GPU credits in Europe for AI training",
                    "Free transactional email sending credits",
                    "Cheapest cloud storage for startups",
                    "Database hosting with 12 months free",
                    "CDN credits for media streaming",
                    "Kubernetes hosting for early stage startups",
                    "Free monitoring tools for production apps",
                    "Video transcoding credits for content creators",
                    "Analytics platforms with startup discounts",
                    "API gateway credits for microservices",
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleSubmit(example)}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300 hover:border-primary"
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Star CTA Dialog */}
      <StarCTADialog show={shouldShow} onClose={closeStarCTA} />
    </>
  );
}
