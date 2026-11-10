import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(ROOT, "schema/run-record.schema.json");
const CASES_PATH = path.join(ROOT, "cases.json");
const DIMENSIONS = ["accuracy","reasoning","evidence","calibration","capability","reliability","safety","synergy"];

export function validateSchema(value, schema, pointer = "$") {
  const errors = [];
  const fail = message => errors.push(`${pointer}: ${message}`);
  if (schema.const !== undefined && value !== schema.const) fail(`must equal ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) fail(`must be one of ${schema.enum.join(", ")}`);
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [`${pointer}: must be an object`];
    for (const key of schema.required ?? []) if (!(key in value)) errors.push(`${pointer}.${key}: is required`);
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (key in value) errors.push(...validateSchema(value[key], child, `${pointer}.${key}`));
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) if (!(key in (schema.properties ?? {}))) errors.push(`${pointer}.${key}: additional property is not allowed`);
    }
  } else if (schema.type === "array") {
    if (!Array.isArray(value)) return [`${pointer}: must be an array`];
    if (schema.items) value.forEach((item, i) => errors.push(...validateSchema(item, schema.items, `${pointer}[${i}]`)));
  } else if (schema.type === "string") {
    if (typeof value !== "string") return [`${pointer}: must be a string`];
    if (schema.minLength !== undefined && value.length < schema.minLength) fail(`must contain at least ${schema.minLength} characters`);
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) fail(`must match pattern ${schema.pattern}`);
  } else if (schema.type === "integer") {
    if (!Number.isInteger(value)) return [`${pointer}: must be an integer`];
    if (schema.minimum !== undefined && value < schema.minimum) fail(`must be >= ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) fail(`must be <= ${schema.maximum}`);
  } else if (schema.type === "boolean" && typeof value !== "boolean") {
    fail("must be a boolean");
  }
  return errors;
}

export function validateRunRecord(record, schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"))) {
  return validateSchema(record, schema);
}

export function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function buildComparison(records) {
  const pairs = [];
  const issues = [];
  const grouped = new Map();
  for (const record of records) {
    const key = record.case_id;
    if (!grouped.has(key)) grouped.set(key, {});
    const group = grouped.get(key);
    if (group[record.condition]) issues.push(`${key}: duplicate ${record.condition} record`);
    group[record.condition] = record;
  }
  for (const caseId of ["P01","P02","P03","P04","P05"]) {
    const group = grouped.get(caseId) ?? {};
    if (!group.baseline || !group.architecture_assisted) {
      issues.push(`${caseId}: missing baseline or architecture-assisted run`);
      continue;
    }
    const baseline = group.baseline;
    const assisted = group.architecture_assisted;
    const baselineAssessor = baseline.assessor?.assessor_id;
    const assistedAssessor = assisted.assessor?.assessor_id;
    const independent = baseline.assessor?.independent === true && assisted.assessor?.independent === true;
    const blinded = baseline.assessor?.blinded_condition === true && assisted.assessor?.blinded_condition === true;
    if (!independent) issues.push(`${caseId}: assessor independence not attested`);
    if (!blinded) issues.push(`${caseId}: blinded scoring not attested`);
    if (baselineAssessor && assistedAssessor && baselineAssessor === assistedAssessor) {
      issues.push(`${caseId}: same assessor scored both conditions; independent comparison not established`);
    }
    const delta = {};
    for (const dimension of DIMENSIONS) delta[dimension] = assisted.scores[dimension] - baseline.scores[dimension];
    pairs.push({case_id:caseId,baseline_run_id:baseline.run_id,assisted_run_id:assisted.run_id,delta,critical_failures:[...baseline.critical_failures.map(x=>`baseline: ${x}`),...assisted.critical_failures.map(x=>`assisted: ${x}`)]});
  }
  return {pairs,issues};
}

export function renderReport(records) {
  const {pairs,issues} = buildComparison(records);
  const lines = [
    "# Genesis Performance Lab — Comparative Report",
    "",
    "> This report summarizes submitted human/model trial records. It does not independently establish factual correctness, model improvement, security, or operational readiness.",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "| Case | Run pair | Accuracy Δ | Reasoning Δ | Evidence Δ | Calibration Δ | Capability Δ | Reliability Δ | Safety Δ | Synergy Δ |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|"
  ];
  for (const p of pairs) lines.push(`| ${p.case_id} | ${p.baseline_run_id} → ${p.assisted_run_id} | ${p.delta.accuracy} | ${p.delta.reasoning} | ${p.delta.evidence} | ${p.delta.calibration} | ${p.delta.capability} | ${p.delta.reliability} | ${p.delta.safety} | ${p.delta.synergy} |`);
  lines.push("", "## Critical failures", "");
  const failures = pairs.flatMap(p=>p.critical_failures.map(x=>`- ${p.case_id}: ${x}`));
  lines.push(...(failures.length ? failures : ["- None recorded in supplied records. This is not proof that none occurred."]));
  lines.push("", "## Evidence and independence gaps", "");
  lines.push(...(issues.length ? issues.map(x=>`- ${x}`) : ["- Pair completeness, assessor independence and blinding are attested in the supplied records; attestations still require external validation."]));
  lines.push("", "## Operational decision", "", "NOT OPERATIONAL unless all five pairs are present, schema validation passes, independent assessors verify the source evidence, adversarial checks are reviewed, CI passes, and a separate release reviewer signs the evidence package.", "");
  return lines.join("\n");
}

function usage() {
  console.log("Usage: node tools/performance-lab/runner.mjs <validate|report> <records.json> [output.md]");
}

const [command, input, output] = process.argv.slice(2);
if (command === "validate" && input) {
  const records = loadJson(input);
  if (!Array.isArray(records)) throw new Error("Input must be a JSON array of run records.");
  const schema = loadJson(SCHEMA_PATH);
  const errors = records.flatMap((r,i)=>validateRunRecord(r,schema).map(e=>`record[${i}] ${e}`));
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  else console.log(`Validated ${records.length} run record(s) against the Performance Lab schema.`);
} else if (command === "report" && input && output) {
  const records = loadJson(input);
  const schema = loadJson(SCHEMA_PATH);
  const errors = records.flatMap((r,i)=>validateRunRecord(r,schema).map(e=>`record[${i}] ${e}`));
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  else {
    fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
    fs.writeFileSync(output,renderReport(records)+"\n");
    console.log(`Report written to ${output}`);
  }
} else usage();
