/**
 * ALLSPARX PRIME runtime adapter for CloudCredits.io's Ask AI workflow.
 *
 * This is a local orchestration boundary, not a claim that a remote ALLSPARX
 * PRIME service is connected. The existing AI endpoint remains the execution
 * provider until a separately authenticated service contract is configured.
 */

export interface AllsparxTaskEvidence {
  requestId: string;
  engine: "ALLSPARX PRIME";
  controller: "SYPHON";
  task: "startup-deal-recommendation";
  status: "COMPLETED";
  provider: "configured-ai-endpoint";
  verified: false;
  verificationNote: string;
}

export interface AssistantProgramMatch {
  title: string;
}

export interface AssistantTaskResult {
  summary: string;
  programs: AssistantProgramMatch[];
  evidence: AllsparxTaskEvidence;
}

interface AssistantApiResponse {
  summary: string;
  programs?: AssistantProgramMatch[];
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `syphon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isAssistantApiResponse(value: unknown): value is AssistantApiResponse {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.summary === "string" &&
    (candidate.programs === undefined ||
      (Array.isArray(candidate.programs) &&
        candidate.programs.every(
          (program) =>
            typeof program === "object" &&
            program !== null &&
            typeof (program as Record<string, unknown>).title === "string",
        )))
  );
}

/**
 * Run one bounded Ask AI task through the ALLSPARX PRIME/SYPHON adapter.
 * The adapter validates the provider response and emits an evidence envelope.
 */
export async function runAllsparxPrimeTask(
  prompt: string,
  endpoint: string,
): Promise<AssistantTaskResult> {
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) {
    throw new Error("Enter a request before starting an ALLSPARX PRIME task.");
  }
  if (!endpoint || !/^https?:\/\//i.test(endpoint)) {
    throw new Error("The Ask AI endpoint must be an absolute HTTP(S) URL.");
  }

  const requestId = createRequestId();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-ALLSPARX-REQUEST-ID": requestId,
    },
    body: JSON.stringify({
      prompt: normalizedPrompt,
      orchestration: {
        engine: "ALLSPARX PRIME",
        controller: "SYPHON",
        protocolVersion: 1,
        task: "startup-deal-recommendation",
        requestId,
      },
    }),
  });

  if (!response.ok) {
    let message = "The AI service could not complete this request.";
    if (response.status >= 400 && response.status < 500) {
      try {
        const body: unknown = await response.json();
        if (
          typeof body === "object" &&
          body !== null &&
          typeof (body as Record<string, unknown>).message === "string"
        ) {
          message = (body as Record<string, string>).message;
        }
      } catch {
        // Keep the safe default when the service does not return JSON.
      }
    }
    throw new Error(message);
  }

  const body: unknown = await response.json();
  if (!isAssistantApiResponse(body)) {
    throw new Error("The AI service returned an invalid response format.");
  }

  return {
    summary: body.summary,
    programs: body.programs ?? [],
    evidence: {
      requestId,
      engine: "ALLSPARX PRIME",
      controller: "SYPHON",
      task: "startup-deal-recommendation",
      status: "COMPLETED",
      provider: "configured-ai-endpoint",
      verified: false,
      verificationNote:
        "Provider response validated; downstream recommendation accuracy and durable evidence have not been independently verified.",
    },
  };
}
