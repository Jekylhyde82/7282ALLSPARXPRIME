import test from "node:test";
import assert from "node:assert/strict";
import { runContinuousImprovementCycle } from "../src/lib/allsparxPrime/continuous-improvement-pipeline.mjs";

const digestA = "sha256:" + "a".repeat(64);
const digestB = "sha256:" + "b".repeat(64);
const sourceSha = "c".repeat(40);
const mergeSha = "d".repeat(40);

function fixture(overrides = {}) {
  const calls = [];
  const candidate = {
    candidate_id: "candidate-1",
    source: {
      authorized: true,
      provenance_verified: true,
      license_status: "approved",
      license_expression: "MIT",
    },
    evidence: {
      baseline_id: "baseline-1",
      baseline_digest: digestA,
      candidate_digest: digestB,
      compatibility: "passed",
      tests: "passed",
      independent_review: "passed",
      measured_benefit_percent: 10,
      regression_percent: 0,
      duplication_score: 0.01,
    },
    change: { risk_tier: "low", rollback_tested: true },
  };
  const adapters = {
    async discover({ sources }) { calls.push(["discover", sources]); return [{ candidate_id: "candidate-1" }]; },
    async inspect(item) { calls.push(["inspect", item.candidate_id]); return candidate; },
    async prepareIsolated(item) { calls.push(["prepare", item.candidate_id]); return { isolated: true, production_secrets_present: false, id: "sandbox-1" }; },
    async verifyEvidence() { calls.push(["verify"]); return { verified: true, candidate }; },
    async merge() {
      calls.push(["merge"]);
      return {
        merged: true,
        repository: { repository_id: "acme-tool", full_name: "acme/tool" },
        pull_request_number: 17,
        source_commit_sha: sourceSha,
        merge_commit_sha: mergeSha,
      };
    },
    async acquireSnapshot({ mergeEvent }) {
      calls.push(["snapshot", mergeEvent.source_commit_sha, mergeEvent.license_decision.expression]);
      return { status: "stored", key: "acme-tool/snapshot.tar.gz", metadata: { source_commit_sha: sourceSha, archive_digest: digestA } };
    },
    ...overrides,
  };
  return { calls, adapters };
}

const policy = {
  auto_integrate_enabled: true,
  max_regression_percent: 0,
  max_duplication_score: 0.1,
  approved_policy_digest: digestA,
};

test("runs the full discover-inspect-isolate-verify-assess-merge-snapshot sequence", async () => {
  const f = fixture();
  const result = await runContinuousImprovementCycle({ sources: ["acme/tool"], adapters: f.adapters, policy });
  assert.equal(result.status, "completed");
  assert.equal(result.discovered_count, 1);
  assert.equal(result.outcomes[0].status, "assimilated");
  assert.equal(result.outcomes[0].merged, true);
  assert.equal(result.outcomes[0].snapshot_status, "stored");
  assert.deepEqual(f.calls.map((call) => call[0]), ["discover", "inspect", "prepare", "verify", "merge", "snapshot"]);
  assert.equal(f.calls.at(-1)[2], "MIT");
});

test("does not merge when isolation is not confirmed", async () => {
  const f = fixture({ async prepareIsolated() { return { isolated: false }; } });
  const result = await runContinuousImprovementCycle({ sources: ["acme/tool"], adapters: f.adapters, policy });
  assert.equal(result.outcomes[0].reason, "ISOLATION_NOT_VERIFIED");
  assert.equal(f.calls.some((call) => call[0] === "merge"), false);
});

test("does not merge when evidence verification is absent", async () => {
  const f = fixture({ async verifyEvidence() { return { verified: false }; } });
  const result = await runContinuousImprovementCycle({ sources: ["acme/tool"], adapters: f.adapters, policy });
  assert.equal(result.outcomes[0].reason, "EVIDENCE_NOT_VERIFIED");
  assert.equal(f.calls.some((call) => call[0] === "merge"), false);
});

test("holds candidates when the protected policy does not enable auto integration", async () => {
  const f = fixture();
  const result = await runContinuousImprovementCycle({ sources: ["acme/tool"], adapters: f.adapters, policy: { ...policy, auto_integrate_enabled: false } });
  assert.equal(result.outcomes[0].reason, "AUTO_INTEGRATION_NOT_ENABLED");
  assert.equal(f.calls.some((call) => call[0] === "merge"), false);
});

test("records a confirmed merge separately when post-merge snapshot acquisition fails", async () => {
  const f = fixture({ async acquireSnapshot() { throw Object.assign(new Error("storage unavailable"), { code: "STORAGE_UNAVAILABLE" }); } });
  const result = await runContinuousImprovementCycle({ sources: ["acme/tool"], adapters: f.adapters, policy });
  assert.equal(result.outcomes[0].status, "snapshot_failed");
  assert.equal(result.outcomes[0].merged, true);
  assert.equal(result.outcomes[0].snapshot_status, "failed");
  assert.equal(result.outcomes[0].merge_commit_sha, mergeSha);
});

test("does not claim merge success when the merge adapter returns an unverified result", async () => {
  const f = fixture({ async merge() { return { merged: true }; } });
  const result = await runContinuousImprovementCycle({ sources: ["acme/tool"], adapters: f.adapters, policy });
  assert.equal(result.outcomes[0].status, "merge_unconfirmed");
  assert.equal(result.outcomes[0].merged, false);
  assert.equal(f.calls.some((call) => call[0] === "snapshot"), false);
});

test("marks an uncertain merge attempt as unknown rather than falsely reporting failure", async () => {
  const f = fixture({ async merge() { throw new Error("network disconnected after request"); } });
  const result = await runContinuousImprovementCycle({ sources: ["acme/tool"], adapters: f.adapters, policy });
  assert.equal(result.outcomes[0].status, "merge_outcome_unknown");
  assert.equal(result.outcomes[0].merged, null);
  assert.equal(f.calls.some((call) => call[0] === "snapshot"), false);
});

test("requires an explicit source allowlist and every execution adapter", async () => {
  const f = fixture();
  await assert.rejects(() => runContinuousImprovementCycle({ sources: [], adapters: f.adapters, policy }), { code: "SOURCE_ALLOWLIST_REQUIRED" });
  const incomplete = { ...f.adapters };
  delete incomplete.acquireSnapshot;
  await assert.rejects(() => runContinuousImprovementCycle({ sources: ["acme/tool"], adapters: incomplete, policy }), { code: "PIPELINE_ADAPTER_MISSING" });
});
