import { assessImprovementCandidate } from "./improvement-assessment.mjs";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function requireFunction(adapters, name) {
  if (typeof adapters?.[name] !== "function") {
    fail("PIPELINE_ADAPTER_MISSING", `Required pipeline adapter "${name}" is not configured.`);
  }
}

function immutableOutcome(value) {
  return Object.freeze(value);
}

/**
 * Orchestrate a fail-closed improvement cycle through injected, auditable adapters.
 * This coordinator does not itself access networks, execute candidate code, merge PRs,
 * or persist snapshots. Each consequential action is delegated to an explicit adapter.
 */
export async function runContinuousImprovementCycle({
  sources,
  adapters,
  policy,
  onOutcome = async () => {},
}) {
  if (!Array.isArray(sources) || sources.length === 0 ||
      sources.some((source) => typeof source !== "string" || !source.trim())) {
    fail("SOURCE_ALLOWLIST_REQUIRED", "An explicit non-empty source allowlist is required.");
  }
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    fail("POLICY_INVALID", "A protected integration policy is required.");
  }
  for (const name of ["discover", "inspect", "prepareIsolated", "verifyEvidence", "merge", "acquireSnapshot"]) {
    requireFunction(adapters, name);
  }
  if (typeof onOutcome !== "function") fail("OUTCOME_SINK_INVALID", "onOutcome must be a function.");

  const discovered = await adapters.discover({ sources: [...new Set(sources)] });
  if (!Array.isArray(discovered)) fail("DISCOVERY_RESULT_INVALID", "Discovery adapter must return an array.");
  const outcomes = [];

  for (const discoveredCandidate of discovered) {
    const identity = discoveredCandidate?.candidate_id ?? null;
    let outcome;
    let mergeAttempted = false;
    let confirmedMerge = null;
    try {
      const inspected = await adapters.inspect(discoveredCandidate);
      if (!inspected || typeof inspected !== "object" || Array.isArray(inspected)) {
        fail("INSPECTION_RESULT_INVALID", "Inspection must return a candidate assessment object.");
      }

      const prepared = await adapters.prepareIsolated(inspected);
      if (!prepared || prepared.isolated !== true || prepared.production_secrets_present === true) {
        outcome = immutableOutcome({
          candidate_id: identity,
          status: "held",
          reason: "ISOLATION_NOT_VERIFIED",
          merged: false,
          snapshot_status: "not_applicable",
        });
      } else {
        const verified = await adapters.verifyEvidence({ inspected, prepared });
        if (!verified || verified.verified !== true || !verified.candidate) {
          outcome = immutableOutcome({
            candidate_id: identity,
            status: "held",
            reason: "EVIDENCE_NOT_VERIFIED",
            merged: false,
            snapshot_status: "not_applicable",
          });
        } else {
          const assessment = assessImprovementCandidate(verified.candidate, policy);
          if (assessment.decision !== "assimilate") {
            outcome = immutableOutcome({
              candidate_id: identity,
              status: assessment.decision === "reject" ? "rejected" : "held",
              reason: assessment.reason,
              assessment,
              merged: false,
              snapshot_status: "not_applicable",
            });
          } else {
            mergeAttempted = true;
            const mergeResult = await adapters.merge({ inspected, prepared, verified, assessment });
            if (!mergeResult || mergeResult.merged !== true ||
                !/^[a-f0-9]{40}$/.test(mergeResult.merge_commit_sha ?? "") ||
                !/^[a-f0-9]{40}$/.test(mergeResult.source_commit_sha ?? "") ||
                !Number.isInteger(mergeResult.pull_request_number) ||
                mergeResult.pull_request_number < 1) {
              outcome = immutableOutcome({
                candidate_id: identity,
                status: "merge_unconfirmed",
                reason: "MERGE_RESULT_NOT_VERIFIED",
                assessment,
                merged: false,
                snapshot_status: "not_started",
              });
            } else {
              confirmedMerge = mergeResult;
              const snapshot = await adapters.acquireSnapshot({
                repository: mergeResult.repository,
                mergeEvent: {
                  event_name: "pull_request.closed",
                  action: "closed",
                  merged: true,
                  pull_request_number: mergeResult.pull_request_number,
                  merge_commit_sha: mergeResult.merge_commit_sha,
                  source_commit_sha: mergeResult.source_commit_sha,
                  license_decision: {
                    status: "approved",
                    expression: verified.candidate.source.license_expression,
                  },
                },
              });
              const snapshotMatches = snapshot &&
                ["stored", "already_present"].includes(snapshot.status) &&
                snapshot.metadata?.source_commit_sha === mergeResult.source_commit_sha &&
                typeof snapshot.metadata?.archive_digest === "string" &&
                snapshot.metadata.archive_digest.startsWith("sha256:");
              outcome = immutableOutcome({
                candidate_id: identity,
                status: snapshotMatches ? "assimilated" : "snapshot_failed",
                reason: snapshotMatches ? "MERGE_AND_SNAPSHOT_VERIFIED" : "POST_MERGE_SNAPSHOT_NOT_VERIFIED",
                assessment,
                merged: true,
                merge_commit_sha: mergeResult.merge_commit_sha,
                source_commit_sha: mergeResult.source_commit_sha,
                snapshot_status: snapshotMatches ? snapshot.status : "failed",
                snapshot_key: snapshotMatches ? snapshot.key : null,
              });
            }
          }
        }
      }
    } catch (error) {
      outcome = immutableOutcome({
        candidate_id: identity,
        status: confirmedMerge ? "snapshot_failed" : mergeAttempted ? "merge_outcome_unknown" : "error",
        reason: typeof error?.code === "string" ? error.code : "PIPELINE_STEP_FAILED",
        merged: confirmedMerge ? true : mergeAttempted ? null : false,
        merge_commit_sha: confirmedMerge?.merge_commit_sha ?? null,
        source_commit_sha: confirmedMerge?.source_commit_sha ?? null,
        snapshot_status: confirmedMerge ? "failed" : "not_applicable",
      });
    }

    outcomes.push(outcome);
    await onOutcome(outcome);
  }

  return immutableOutcome({
    status: "completed",
    sources: Object.freeze([...new Set(sources)]),
    discovered_count: discovered.length,
    outcomes: Object.freeze(outcomes),
    autonomous_production_operation: false,
  });
}
