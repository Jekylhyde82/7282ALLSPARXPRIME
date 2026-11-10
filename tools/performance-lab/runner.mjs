import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(ROOT, "schema/run-record.schema.json");
const CASES_PATH = path.join(ROOT, "cases.json");
const DIMENSIONS = ["accuracy","reasoning","evidence","calibration","capability","reliability","safety","synergy"];

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function validateSchema(value, schema, pointer = "$") {
  const errors = [];
  const fail = message => errors.push(pointer + ": " + message);
  if (schema.const !== undefined && value !== schema.const) fail("must equal " + JSON.stringify(schema.const));
  if (schema.enum && !schema.enum.includes(value)) fail("must be one of " + schema.enum.join(", "));
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [pointer + ": must be an object"];
    for (const key of schema.required ?? []) if (!(key in value)) errors.push(pointer + "." + key + ": is required");
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (key in value) errors.push(...validateSchema(value[key], child, pointer + "." + key));
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) if (!(key in (schema.properties ?? {}))) errors.push(pointer + "." + key + ": additional property is not allowed");
    }
  } else if (schema.type === "array") {
    if (!Array.isArray(value)) return [pointer + ": must be an array"];
    if (schema.items) value.forEach((item, i) => errors.push(...validateSchema(item, schema.items, pointer + "[" + i + "]")));
  } else if (schema.type === "string") {
    if (typeof value !== "string") return [pointer + ": must be a string"];
    if (schema.minLength !== undefined && value.length < schema.minLength) fail("must contain at least " + schema.minLength + " characters");
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) fail("must match pattern " + schema.pattern);
  } else if (schema.type === "integer") {
    if (!Number.isInteger(value)) return [pointer + ": must be an integer"];
    if (schema.minimum !== undefined && value < schema.minimum) fail("must be >= " + schema.minimum);
    if (schema.maximum !== undefined && value > schema.maximum) fail("must be <= " + schema.maximum);
  } else if (schema.type === "boolean" && typeof value !== "boolean") {
    fail("must be a boolean");
  }
  return errors;
}

export function validateRunRecord(record, schema = loadJson(SCHEMA_PATH)) {
  return validateSchema(record, schema);
}

export function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function createRunRecord(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Trial input must be a JSON object.");
  if (typeof input.prompt !== "string" || !input.prompt.trim()) throw new Error("Trial input requires the exact non-empty prompt.");
  const date = new Date().toISOString();
  const runId = "GPL-" + date.replace(/[-:.TZ]/g, "").slice(0, 14) + "-" + (input.case_id ?? "XX") + "-" + (input.condition ?? "unknown") + "-" + crypto.randomUUID().slice(0, 8);
  const record = {
    benchmark_id: "GENESIS-PERFORMANCE-LAB-001",
    run_id: runId,
    case_id: input.case_id,
    condition: input.condition,
    subject: input.subject,
    prompt_sha256: sha256(input.prompt),
    response: input.response,
    scores: input.scores,
    critical_failures: input.critical_failures ?? [],
    evidence: input.evidence ?? [],
    assessor: input.assessor,
    adversarial_review: input.adversarial_review,
    limitations: input.limitations ?? [],
    verification_status: input.verification_status ?? "NOT_VERIFIED",
    created_at: date
  };
  const errors = validateRunRecord(record);
  if (errors.length) throw new Error(errors.join("\n"));
  return record;
}

export function appendRunRecord(record, ledgerPath) {
  const existing = fs.existsSync(ledgerPath) ? loadJson(ledgerPath) : [];
  if (!Array.isArray(existing)) throw new Error("Existing run ledger must be a JSON array.");
  const schema = loadJson(SCHEMA_PATH);
  const errors = [
    ...existing.flatMap((r, i) => validateRunRecord(r, schema).map(e => "existing[" + i + "] " + e)),
    ...validateRunRecord(record, schema)
  ];
  if (errors.length) throw new Error(errors.join("\n"));
  const next = [...existing, record];
  fs.mkdirSync(path.dirname(path.resolve(ledgerPath)), { recursive: true });
  const temp = ledgerPath + "." + process.pid + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(next, null, 2) + "\n", { flag: "wx" });
  fs.renameSync(temp, ledgerPath);
  return next.length;
}

export function buildComparison(records) {
  const pairs = [];
  const issues = [];
  const grouped = new Map();
  for (const record of records) {
    const key = record.case_id;
    if (!grouped.has(key)) grouped.set(key, {});
    const group = grouped.get(key);
    if (group[record.condition]) issues.push(key + ": duplicate " + record.condition + " record");
    group[record.condition] = record;
  }
  for (const caseId of ["P01","P02","P03","P04","P05"]) {
    const group = grouped.get(caseId) ?? {};
    if (!group.baseline || !group.architecture_assisted) {
      issues.push(caseId + ": missing baseline or architecture-assisted run");
      continue;
    }
    const baseline = group.baseline;
    const assisted = group.architecture_assisted;
    const baselineAssessor = baseline.assessor?.assessor_id;
    const assistedAssessor = assisted.assessor?.assessor_id;
    const independent = baseline.assessor?.independent === true && assisted.assessor?.independent === true;
    const blinded = baseline.assessor?.blinded_condition === true && assisted.assessor?.blinded_condition === true;
    if (!independent) issues.push(caseId + ": assessor independence not attested");
    if (!blinded) issues.push(caseId + ": blinded scoring not attested");
    for (const record of [baseline, assisted]) {
      const review = record.adversarial_review;
      if (!review || review.independent !== true || review.blinded_condition !== true) {
        issues.push(caseId + " " + record.condition + ": independent blinded adversarial review missing");
      }
      if (review && review.reviewer_id === record.assessor?.assessor_id) {
        issues.push(caseId + " " + record.condition + ": adversarial reviewer must be distinct from scorer");
      }
      const expectedChecks = (loadJson(CASES_PATH).cases.find(c => c.id === caseId)?.adversarial_checks ?? []).map(x => x.check_id);
      const observedChecks = (review?.checks ?? []).map(x => x.check_id);
      for (const expected of expectedChecks) {
        if (!observedChecks.includes(expected)) issues.push(caseId + " " + record.condition + ": required adversarial check " + expected + " missing");
      }
      if (new Set(observedChecks).size !== observedChecks.length) issues.push(caseId + " " + record.condition + ": duplicate adversarial check IDs");
      for (const check of review?.checks ?? []) {
        if (check.outcome === "NOT_ASSESSED") issues.push(caseId + " " + record.condition + ": adversarial check " + check.check_id + " not assessed");
      }
    }
    if (baselineAssessor && assistedAssessor && baselineAssessor !== assistedAssessor) {
      issues.push(caseId + ": different assessors scored paired conditions; same blinded independent assessor should score both to reduce inter-rater confounding");
    }
    const delta = {};
    for (const dimension of DIMENSIONS) delta[dimension] = assisted.scores[dimension] - baseline.scores[dimension];
    pairs.push({
      case_id: caseId,
      baseline_run_id: baseline.run_id,
      assisted_run_id: assisted.run_id,
      delta,
      critical_failures: [
        ...baseline.critical_failures.map(x => "baseline: " + x),
        ...assisted.critical_failures.map(x => "assisted: " + x),
        ...(baseline.adversarial_review?.checks ?? []).filter(x => x.outcome === "FAIL").map(x => "baseline adversarial " + x.check_id + ": " + x.finding),
        ...(assisted.adversarial_review?.checks ?? []).filter(x => x.outcome === "FAIL").map(x => "assisted adversarial " + x.check_id + ": " + x.finding)
      ]
    });
  }
  return { pairs, issues };
}

export function renderReport(records) {
  const result = buildComparison(records);
  const lines = [
    "# Genesis Performance Lab — Comparative Report",
    "",
    "> This report summarizes submitted human/model trial records. It does not independently establish factual correctness, model improvement, security, or operational readiness.",
    "",
    "Generated: " + new Date().toISOString(),
    "",
    "| Case | Run pair | Accuracy Δ | Reasoning Δ | Evidence Δ | Calibration Δ | Capability Δ | Reliability Δ | Safety Δ | Synergy Δ |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|"
  ];
  for (const p of result.pairs) {
    lines.push("| " + p.case_id + " | " + p.baseline_run_id + " → " + p.assisted_run_id + " | " +
      DIMENSIONS.map(d => p.delta[d]).join(" | ") + " |");
  }
  lines.push("", "## Critical failures", "");
  const failures = result.pairs.flatMap(p => p.critical_failures.map(x => "- " + p.case_id + ": " + x));
  lines.push(...(failures.length ? failures : ["- None recorded in supplied records. This is not proof that none occurred."]));
  lines.push("", "## Evidence and independence gaps", "");
  lines.push(...(result.issues.length ? result.issues.map(x => "- " + x) : ["- Pair completeness, assessor independence and blinding are attested in supplied records; attestations still require external validation."]));
  lines.push("", "## Operational decision", "",
    "NOT OPERATIONAL unless all five pairs are present, schema validation passes, independent assessors verify source evidence, adversarial checks are reviewed, CI passes, and a separate release reviewer signs the evidence package.", "");
  return lines.join("\n");
}

function usage() {
  console.log("Usage: node tools/performance-lab/runner.mjs record <trial.json> <ledger.json> | validate <ledger.json> | report <ledger.json> <output.md>");
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const [command, input, output] = process.argv.slice(2);
  if (command === "record" && input && output) {
    const payload = loadJson(input);
    const record = createRunRecord(payload);
    const count = appendRunRecord(record, output);
    console.log("Recorded " + record.run_id + "; ledger contains " + count + " record(s).");
  } else if (command === "validate" && input) {
    const records = loadJson(input);
    if (!Array.isArray(records)) throw new Error("Input must be a JSON array of run records.");
    const schema = loadJson(SCHEMA_PATH);
    const errors = records.flatMap((r, i) => validateRunRecord(r, schema).map(e => "record[" + i + "] " + e));
    if (errors.length) {
      console.error(errors.join("\n"));
      process.exitCode = 1;
    } else {
      console.log("Validated " + records.length + " run record(s) against the Performance Lab schema.");
    }
  } else if (command === "report" && input && output) {
    const records = loadJson(input);
    const schema = loadJson(SCHEMA_PATH);
    const errors = records.flatMap((r, i) => validateRunRecord(r, schema).map(e => "record[" + i + "] " + e));
    if (errors.length) {
      console.error(errors.join("\n"));
      process.exitCode = 1;
    } else {
      fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
      fs.writeFileSync(output, renderReport(records) + "\n");
      console.log("Report written to " + output);
    }
  } else {
    usage();
  }
}
