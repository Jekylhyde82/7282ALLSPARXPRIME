import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const STAGES = new Set(Array.from({ length: 9 }, (_, index) => `stage-${index + 1}`));
const RESULTS = new Set(["PASS", "HOLD"]);

function fail(message) {
  process.stderr.write(`PIPELINE_EVIDENCE_ERROR: ${message}\n`);
  process.exitCode = 1;
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function canonicalEvidence(stage, result, sourceSha, runId, runAttempt, checks) {
  return {
    schemaVersion: 1,
    system: "ALLSPARX PRIME",
    pipeline: "9-stage-continuous-build-integration-security-deployment",
    stage,
    result,
    sourceSha,
    runId,
    runAttempt,
    checks,
  };
}

async function writeEvidence(stage, result, checks) {
  if (!STAGES.has(stage) || !RESULTS.has(result) || !/^[0-9a-f]{40}$/.test(process.env.GITHUB_SHA || "") ||
      !/^\d+$/.test(process.env.GITHUB_RUN_ID || "") || !/^\d+$/.test(process.env.GITHUB_RUN_ATTEMPT || "") ||
      checks.length === 0 || checks.some((item) => !/^[a-z0-9][a-z0-9-]{1,79}$/.test(item))) {
    throw new Error("INVALID_EVIDENCE_INPUT");
  }
  const payload = canonicalEvidence(stage, result, process.env.GITHUB_SHA,
    process.env.GITHUB_RUN_ID, process.env.GITHUB_RUN_ATTEMPT, checks);
  const record = { ...payload, evidenceSha256: digest(payload) };
  const path = `.allsparx-evidence/${stage}.json`;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(record, null, 2) + "\n", { mode: 0o600 });
  process.stdout.write(`WROTE ${stage} evidence for ${payload.sourceSha}\n`);
}

async function verifyEvidence(path, expectedStage, expectedResult, expectedSha, expectedRunId, expectedAttempt) {
  if (!STAGES.has(expectedStage) || !RESULTS.has(expectedResult) ||
      !/^[0-9a-f]{40}$/.test(expectedSha || "") || !/^\d+$/.test(expectedRunId || "") ||
      !/^\d+$/.test(expectedAttempt || "")) throw new Error("INVALID_VERIFICATION_INPUT");
  const record = JSON.parse(await readFile(path, "utf8"));
  const { evidenceSha256, ...payload } = record;
  const valid = payload.schemaVersion === 1 &&
    payload.system === "ALLSPARX PRIME" &&
    payload.pipeline === "9-stage-continuous-build-integration-security-deployment" &&
    payload.stage === expectedStage && payload.result === expectedResult &&
    payload.sourceSha === expectedSha && payload.runId === expectedRunId &&
    payload.runAttempt === expectedAttempt && Array.isArray(payload.checks) &&
    payload.checks.length > 0 &&
    payload.checks.every((item) => typeof item === "string" && /^[a-z0-9][a-z0-9-]{1,79}$/.test(item)) &&
    evidenceSha256 === digest(payload);
  if (!valid) throw new Error(`EVIDENCE_REJECTED:${expectedStage}`);
  process.stdout.write(`VERIFIED ${expectedStage} ${expectedResult} sha=${expectedSha} run=${expectedRunId} attempt=${expectedAttempt}\n`);
}

const [mode, ...args] = process.argv.slice(2);
try {
  if (mode === "write") {
    const [stage, result, ...checks] = args;
    await writeEvidence(stage, result, checks);
  } else if (mode === "verify") {
    const [path, stage, result, sha, runId, attempt] = args;
    if (!path || !stage || !result || !sha || !runId || !attempt) throw new Error("USAGE: verify <file> <stage> <PASS|HOLD> <sha> <run-id> <attempt>");
    await verifyEvidence(path, stage, result, sha, runId, attempt);
  } else {
    throw new Error("USAGE: write <stage> <PASS|HOLD> <check...> | verify <file> <stage> <PASS|HOLD> <sha> <run-id> <attempt>");
  }
} catch (error) {
  fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
}
