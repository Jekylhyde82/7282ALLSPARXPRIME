import React, { useState, useEffect, useRef } from "react";
import AIInput from "./AIInput";
import ProgramCard from "./ProgramCard";
import LoadingIndicator from "./LoadingIndicator";
import StarCTADialog from "./StarCTADialog";
import { useStarCTA } from "./useStarCTA";
import {
  runAllsparxPrimeTask,
  type AllsparxTaskEvidence,
} from "@/lib/allsparxPrime/runtime";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
        theme?: "light" | "dark" | "auto";
      }) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

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
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [runtimeEvidence, setRuntimeEvidence] =
    useState<AllsparxTaskEvidence | null>(null);
  const [matchedPrograms, setMatchedPrograms] = useState<Program[]>([]);
  const [prompt, setPrompt] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");
  const turnstileContainer = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const [hasProcessedUrlPrompt, setHasProcessedUrlPrompt] = useState(false);
  const [pendingUrlPrompt, setPendingUrlPrompt] = useState("");
  const { shouldShow, triggerStarCTA, closeStarCTA } = useStarCTA();

  useEffect(() => {
    const sitekey = import.meta.env.PUBLIC_ALLSPARX_TURNSTILE_SITE_KEY;
    if (!sitekey) {
      setTurnstileError("Security challenge is not configured for this deployment.");
      return;
    }
    let active = true;
    const scriptId = "cloudflare-turnstile-script";
    const load = () => new Promise<void>((resolve, reject) => {
      if (window.turnstile) return resolve();
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener("error", () => reject(new Error("Cloudflare security challenge could not load.")), { once: true });
    });
    load().then(() => {
      if (!active || !turnstileContainer.current || !window.turnstile) return;
      turnstileWidgetId.current = window.turnstile.render(turnstileContainer.current, {
        sitekey,
        callback: (token) => { setTurnstileToken(token); setTurnstileError(""); },
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => { setTurnstileToken(""); setTurnstileError("Security challenge failed. Please reload the challenge."); },
        theme: "auto",
      });
    }).catch((error) => {
      if (active) setTurnstileError(error instanceof Error ? error.message : "Security challenge unavailable.");
    });
    return () => {
      active = false;
      if (turnstileWidgetId.current && window.turnstile) window.turnstile.remove(turnstileWidgetId.current);
      turnstileWidgetId.current = null;
    };
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

    if (urlPrompt && !hasProcessedUrlPrompt) {
      setPrompt(urlPrompt);
      setHasProcessedUrlPrompt(true);

      // Clear the URL parameter immediately to prevent re-processing
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("prompt");
      window.history.replaceState({}, "", newUrl.toString());

      setPendingUrlPrompt(urlPrompt);
    }
  }, [hasProcessedUrlPrompt]);

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
      if (!turnstileToken) {
        throw new Error("Complete the Cloudflare security check before sending your request.");
      }
      const apiResponse = await runAllsparxPrimeTask(inputPrompt, aiEndpoint, providerPreference as "auto" | "openai" | "anthropic" | "google" | "ollama", turnstileToken);

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
      setTurnstileToken("");
      if (turnstileWidgetId.current && window.turnstile) window.turnstile.reset(turnstileWidgetId.current);
    }
  };

  useEffect(() => {
    if (pendingUrlPrompt && turnstileToken && !isLoading) {
      const queuedPrompt = pendingUrlPrompt;
      setPendingUrlPrompt("");
      handleAPICall(queuedPrompt);
    }
  }, [pendingUrlPrompt, turnstileToken]);

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
          <AIInput onSubmit={handleSubmit} loading={isLoading || !turnstileToken} />
          <div className="mt-4 flex justify-center" aria-label="Cloudflare security verification">
            <div ref={turnstileContainer} />
          </div>
          {turnstileError && (
            <p role="alert" className="mt-2 text-center text-sm text-red-600">{turnstileError}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            ⏱️ I usually respond within 30 seconds - hang tight!
          </p>
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
