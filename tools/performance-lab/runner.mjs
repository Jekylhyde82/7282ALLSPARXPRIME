import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(ROOT, "schema/run-record.schema.json");
const CASES_PATH = path.join(ROOT, "cases.json");
const DIMENSIONS = ["accuracy","reasoning","evidence","calibration","capability","reliability","safety","synergy"];

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const schemaValidatorCache = new WeakMap();

export function validateSchema(value, schema, pointer = "$") {
  let validate = schemaValidatorCache.get(schema);
  if (!validate) {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    validate = ajv.compile(schema);
    schemaValidatorCache.set(schema, validate);
  }
  if (validate(value)) return [];
  return (validate.errors ?? []).map(error => pointer + (error.instancePath || "") + ": " + error.message);
}

export function isRfc3339Timestamp(value) {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, , offsetHour, offsetMinute] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() + 1 !== Number(month) || date.getUTCDate() !== Number(day)) return false;
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return false;
  if (offsetHour !== undefined && (Number(offsetHour) > 23 || Number(offsetMinute) > 59)) return false;
  return Number.isFinite(Date.parse(value));
}


export function validateCalibrationPlan(plan, schema = loadJson(path.join(ROOT, "schema/calibration-plan.schema.json"))) {
  const errors = validateSchema(plan, schema);
  if (errors.length) return errors;
  const scorerId = plan.evaluators.scorer.evaluator_id;
  const reviewerId = plan.evaluators.adversarial_reviewer.evaluator_id;
  if (scorerId === reviewerId) errors.push("scorer and adversarial reviewer must be distinct evaluator identities");
  const reviewerIds = plan.reviewer_approvals.map(reviewer => reviewer.reviewer_id);
  if (new Set(reviewerIds).size !== reviewerIds.length) errors.push("human reviewer approval identities must be unique");
  if (!isRfc3339Timestamp(plan.frozen_at)) errors.push("calibration plan frozen_at must be a valid RFC 3339 timestamp");
  for (const reviewer of plan.reviewer_approvals) {
    if (!isRfc3339Timestamp(reviewer.approved_at)) errors.push("reviewer " + reviewer.reviewer_id + " approval timestamp must be valid RFC 3339");
  }
  return errors;
}

export function validateRunRecord(record, schema = loadJson(SCHEMA_PATH)) {
  const errors = validateSchema(record, schema);
  if (record && !isRfc3339Timestamp(record.created_at)) errors.push("$.created_at: must be a valid RFC 3339 timestamp");
  if (record?.trial_execution && !isRfc3339Timestamp(record.trial_execution.captured_at)) errors.push("$.trial_execution.captured_at: must be a valid RFC 3339 timestamp");
  return errors;
}

export function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function canonicalize(value) {
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + canonicalize(value[key])).join(",") + "}";
  }
  return JSON.stringify(value);
}

export function signEvidenceManifest(payload, privateKeyPem) {
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  if (privateKey.asymmetricKeyType !== "ed25519") throw new Error("Evidence manifest signing requires an Ed25519 private key.");
  const publicKey = crypto.createPublicKey(privateKey);
  const publicDer = publicKey.export({ type: "spki", format: "der" });
  const signature = crypto.sign(null, Buffer.from(canonicalize(payload)), privateKey).toString("base64");
  return {
    ...payload,
    signature: {
      algorithm: "Ed25519",
      public_key_sha256: sha256(publicDer),
      value: signature
    }
  };
}

export function verifyEvidenceManifest(manifest, { publicKeyPem, evidenceRoot, expectedRevision, expectedSignerId, expectedSignerRole }) {
  const errors = [];
  const manifestSchema = loadJson(path.join(ROOT, "schema/evidence-manifest.schema.json"));
  errors.push(...validateSchema(manifest, manifestSchema));
  if (errors.length) return errors;
  if (!isRfc3339Timestamp(manifest.created_at)) errors.push("manifest created_at must be a valid RFC 3339 timestamp");
  if (manifest.revision !== expectedRevision) errors.push("manifest revision does not match the expected candidate revision");
  if (expectedSignerId && manifest.signer.signer_id !== expectedSignerId) errors.push("manifest signer ID does not match the externally trusted signer identity");
  if (expectedSignerRole && manifest.signer.role !== expectedSignerRole) errors.push("manifest signer role does not match the required role");
  let publicKey;
  try {
    publicKey = crypto.createPublicKey(publicKeyPem);
  } catch {
    errors.push("trusted public key cannot be parsed");
    return errors;
  }
  if (publicKey.asymmetricKeyType !== "ed25519") {
    errors.push("trusted public key must use Ed25519");
    return errors;
  }
  const publicDer = publicKey.export({ type: "spki", format: "der" });
  const fingerprint = sha256(publicDer);
  if (fingerprint !== manifest.signature.public_key_sha256) errors.push("manifest signing key fingerprint does not match the externally supplied trusted public key");
  const { signature, ...signedPayload } = manifest;
  let signatureValid = false;
  try {
    signatureValid = crypto.verify(null, Buffer.from(canonicalize(signedPayload)), publicKey, Buffer.from(signature.value, "base64"));
  } catch {
    signatureValid = false;
  }
  if (!signatureValid) errors.push("Ed25519 manifest signature is invalid");
  let root;
  try {
    root = fs.realpathSync(evidenceRoot);
  } catch {
    errors.push("evidence root does not exist or cannot be resolved");
    return errors;
  }
  const seen = new Set();
  for (const artifact of manifest.artifacts) {
    if (seen.has(artifact.path)) {
      errors.push("duplicate artifact path: " + artifact.path);
      continue;
    }
    seen.add(artifact.path);
    if (path.isAbsolute(artifact.path) || artifact.path.split(/[\\/]/).includes("..")) {
      errors.push("artifact path must be relative and must not traverse directories: " + artifact.path);
      continue;
    }
    let resolved;
    try {
      resolved = fs.realpathSync(path.resolve(root, artifact.path));
    } catch {
      errors.push("artifact is missing or cannot be resolved: " + artifact.path);
      continue;
    }
    if (!resolved.startsWith(root + path.sep)) {
      errors.push("artifact resolves outside the evidence root: " + artifact.path);
      continue;
    }
    let actual;
    try {
      actual = crypto.createHash("sha256").update(fs.readFileSync(resolved)).digest("hex");
    } catch {
      errors.push("artifact cannot be read: " + artifact.path);
      continue;
    }
    if (actual !== artifact.sha256) errors.push("artifact SHA-256 mismatch: " + artifact.path);
  }
  return errors;
}


const MATRIX_COLUMNS = [
  "execution_order","trial_id","blind_label","case_id","repetition","condition","status",
  "model_label","context_type","context_reference","captured_at","settings","tools_used",
  "raw_response_sha256","capture_reference","scorer_id","adversarial_reviewer_id",
  "unpersonalized_confirmed","canonical_prompt_sha256","architecture_instruction_sha256"
];

export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field.length === 0) quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field.replace(/\r$/, "")); if (row.some(value => value !== "")) rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); if (row.some(value => value !== "")) rows.push(row); }
  return rows;
}

export function validateTrialMatrix(csvText) {
  const errors = [];
  let rows;
  try { rows = parseCsv(csvText); }
  catch (error) { return [error.message]; }
  if (!rows.length) return ["trial matrix is empty"];
  if (JSON.stringify(rows[0]) !== JSON.stringify(MATRIX_COLUMNS)) return ["trial matrix header does not match the required 20-column protocol 1.5 format"];
  if (rows.length !== 31) errors.push("trial matrix must contain exactly 30 trial rows");
  const seenTrialIds = new Set(), seenBlindLabels = new Set(), combinations = new Set();
  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const line = i + 1, values = rows[i];
    if (values.length !== MATRIX_COLUMNS.length) { errors.push("row " + line + " must contain exactly 20 columns"); continue; }
    const row = Object.fromEntries(MATRIX_COLUMNS.map((key, index) => [key, values[index].trim()]));
    records.push(row);
    if (Number(row.execution_order) !== i) errors.push("row " + line + ": execution_order must be sequential starting at 1");
    if (!/^TRIAL-[0-9]{3}$/.test(row.trial_id)) errors.push("row " + line + ": invalid trial_id");
    if (!/^BLIND-[0-9]{3}$/.test(row.blind_label)) errors.push("row " + line + ": invalid blind_label");
    if (seenTrialIds.has(row.trial_id)) errors.push("row " + line + ": duplicate trial_id " + row.trial_id);
    if (seenBlindLabels.has(row.blind_label)) errors.push("row " + line + ": duplicate blind_label " + row.blind_label);
    seenTrialIds.add(row.trial_id); seenBlindLabels.add(row.blind_label);
    if (!["P01","P02","P03","P04","P05"].includes(row.case_id)) errors.push("row " + line + ": invalid case_id");
    if (!["1","2","3"].includes(row.repetition)) errors.push("row " + line + ": repetition must be 1, 2, or 3");
    if (!["baseline","architecture_assisted"].includes(row.condition)) errors.push("row " + line + ": invalid condition");
    if (!["NOT_RUN","CAPTURED","ASSESSED"].includes(row.status)) errors.push("row " + line + ": invalid status");
    const combo = row.case_id + ":" + row.repetition + ":" + row.condition;
    if (combinations.has(combo)) errors.push("row " + line + ": duplicate case/repetition/condition " + combo);
    combinations.add(combo);
    if (row.status === "NOT_RUN") {
      const captureFields = ["model_label","context_type","context_reference","captured_at","settings","tools_used","raw_response_sha256","capture_reference","unpersonalized_confirmed","canonical_prompt_sha256","architecture_instruction_sha256"];
      for (const key of captureFields) if (row[key]) errors.push("row " + line + ": NOT_RUN row must not contain capture field " + key);
      if (row.scorer_id || row.adversarial_reviewer_id) errors.push("row " + line + ": NOT_RUN row must not contain assessor identities");
      continue;
    }
    if (!row.model_label) errors.push("row " + line + ": captured trial requires model_label");
    if (row.context_type !== "Unpersonalized Temporary Chat") errors.push("row " + line + ": context_type must be Unpersonalized Temporary Chat");
    if (!row.context_reference) errors.push("row " + line + ": captured trial requires context_reference");
    if (!isRfc3339Timestamp(row.captured_at)) errors.push("row " + line + ": captured_at must be a valid timestamp");
    if (!row.settings) errors.push("row " + line + ": captured trial requires settings metadata");
    if (!row.tools_used) errors.push("row " + line + ": captured trial must explicitly record tools_used (use none when unused)");
    if (!row.capture_reference) errors.push("row " + line + ": captured trial requires capture_reference");
    if (row.unpersonalized_confirmed !== "TRUE") errors.push("row " + line + ": Unpersonalized confirmation must be TRUE");
    for (const key of ["raw_response_sha256","canonical_prompt_sha256"]) if (!/^[a-f0-9]{64}$/.test(row[key])) errors.push("row " + line + ": " + key + " must be a SHA-256 digest");
    if (row.condition === "architecture_assisted" && !/^[a-f0-9]{64}$/.test(row.architecture_instruction_sha256)) errors.push("row " + line + ": assisted trial requires architecture_instruction_sha256");
    if (row.condition === "baseline" && row.architecture_instruction_sha256) errors.push("row " + line + ": baseline trial must not contain architecture_instruction_sha256");
    if (row.status === "CAPTURED" && (row.scorer_id || row.adversarial_reviewer_id)) errors.push("row " + line + ": CAPTURED trial must not contain assessor identities before blinded assessment");
    if (row.status === "ASSESSED" && (!row.scorer_id || !row.adversarial_reviewer_id || row.scorer_id === row.adversarial_reviewer_id)) errors.push("row " + line + ": assessed trial requires distinct scorer and adversarial reviewer IDs");
  }
  for (const caseId of ["P01","P02","P03","P04","P05"]) for (const repetition of ["1","2","3"]) {
    for (const condition of ["baseline","architecture_assisted"]) {
      if (!combinations.has(caseId + ":" + repetition + ":" + condition)) errors.push("missing planned trial " + caseId + " repetition " + repetition + " " + condition);
    }
  }
  const paired = new Map();
  for (const row of records.filter(row => row.status !== "NOT_RUN")) {
    const key = row.case_id + ":" + row.repetition;
    if (!paired.has(key)) paired.set(key, {});
    paired.get(key)[row.condition] = row;
  }
  for (const [key, pair] of paired) {
    if (pair.baseline && pair.architecture_assisted && pair.baseline.canonical_prompt_sha256 !== pair.architecture_assisted.canonical_prompt_sha256) {
      errors.push(key + ": baseline and assisted canonical prompt hashes differ");
    }
  }
  return errors;
}

export function createRunRecord(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Trial input must be a JSON object.");
  if (typeof input.response !== "string" || !input.response.length) throw new Error("Trial input requires the complete verbatim response.");
  if (typeof input.prompt !== "string" || !input.prompt.trim()) throw new Error("Trial input requires the exact non-empty prompt.");
  const benchmarkCase = loadJson(CASES_PATH).cases.find(c => c.id === input.case_id);
  if (!benchmarkCase) throw new Error("Unknown benchmark case: " + input.case_id);
  if (input.prompt !== benchmarkCase.prompt) throw new Error("Prompt must exactly match the canonical benchmark case prompt.");
  if (!input.trial_execution || input.trial_execution.unpersonalized_confirmed !== true) throw new Error("Trial execution must explicitly confirm an Unpersonalized Temporary Chat.");
  if (input.trial_execution.context_type !== "Unpersonalized Temporary Chat") throw new Error("Trial execution context must be an Unpersonalized Temporary Chat.");
  if (input.trial_execution.model_label !== input.subject) throw new Error("Trial execution model label must match the run-record subject.");
  if (!input.trial_execution.context_reference || !input.trial_execution.captured_at || Number.isNaN(Date.parse(input.trial_execution.captured_at))) throw new Error("Trial execution requires a context reference and valid capture timestamp.");
  if (!input.trial_execution.settings || !input.trial_execution.tools_used || !input.trial_execution.capture_reference) throw new Error("Trial execution requires settings, tools-used and capture-reference metadata.");
  if (input.trial_execution.canonical_prompt_sha256 !== sha256(input.prompt)) throw new Error("Trial execution canonical prompt hash does not match the exact canonical prompt.");
  if (input.condition === "architecture_assisted" && !/^[a-f0-9]{64}$/.test(input.trial_execution.architecture_instruction_sha256 ?? "")) throw new Error("Architecture-assisted trials require the architecture instruction SHA-256.");
  if (input.condition === "baseline" && input.trial_execution.architecture_instruction_sha256 != null) throw new Error("Baseline trials must not contain an architecture instruction hash.");
  const date = new Date().toISOString();
  const runId = "GPL-" + date.replace(/[-:.TZ]/g, "").slice(0, 14) + "-" + (input.case_id ?? "XX") + "-" + (input.condition ?? "unknown") + "-" + crypto.randomUUID().slice(0, 8);
  const record = {
    benchmark_id: "GENESIS-PERFORMANCE-LAB-001",
    run_id: runId,
    case_id: input.case_id,
    repetition: input.repetition,
    condition: input.condition,
    subject: input.subject,
    prompt_sha256: sha256(input.prompt),
    trial_execution: { ...input.trial_execution, raw_response_sha256: sha256(input.response) },
    response: input.response,
    scores: input.scores,
    critical_failures: input.critical_failures ?? [],
    evidence: input.evidence ?? [],
    assessor: input.assessor,
    adversarial_review: input.adversarial_review,
    assessment: input.assessment,
    limitations: input.limitations ?? [],
    verification_status: "NOT_VERIFIED",
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
    const key = record.case_id + ":" + record.repetition;
    if (!grouped.has(key)) grouped.set(key, {});
    const group = grouped.get(key);
    if (group[record.condition]) {
      issues.push(record.case_id + ": duplicate " + record.condition + " record for repetition " + record.repetition);
      group.invalid = true;
    }
    group[record.condition] = record;
  }
  for (const caseId of ["P01","P02","P03","P04","P05"]) {
    for (const repetition of [1,2,3]) {
    const group = grouped.get(caseId + ":" + repetition) ?? {};
    if (!group.baseline || !group.architecture_assisted) {
      issues.push(caseId + " repetition " + repetition + ": missing baseline or architecture-assisted run");
      continue;
    }
    if (group.invalid) continue;
    const baseline = group.baseline;
    const assisted = group.architecture_assisted;
    let invalidPair = false;
    if (baseline.prompt_sha256 !== assisted.prompt_sha256) {
      issues.push(caseId + ": paired prompts differ; comparison is invalid");
      invalidPair = true;
    }
    if (!baseline.trial_execution || !assisted.trial_execution ||
        baseline.trial_execution.unpersonalized_confirmed !== true || assisted.trial_execution.unpersonalized_confirmed !== true ||
        baseline.trial_execution.context_type !== "Unpersonalized Temporary Chat" || assisted.trial_execution.context_type !== "Unpersonalized Temporary Chat" ||
        baseline.trial_execution.model_label !== baseline.subject || assisted.trial_execution.model_label !== assisted.subject ||
        !baseline.trial_execution.context_reference || !assisted.trial_execution.context_reference ||
        !baseline.trial_execution.settings || !assisted.trial_execution.settings ||
        !baseline.trial_execution.tools_used || !assisted.trial_execution.tools_used ||
        !baseline.trial_execution.capture_reference || !assisted.trial_execution.capture_reference ||
        baseline.trial_execution.canonical_prompt_sha256 !== baseline.prompt_sha256 ||
        assisted.trial_execution.canonical_prompt_sha256 !== assisted.prompt_sha256 ||
        baseline.trial_execution.raw_response_sha256 !== sha256(baseline.response) ||
        assisted.trial_execution.raw_response_sha256 !== sha256(assisted.response) ||
        (assisted.condition === "architecture_assisted" && !/^[a-f0-9]{64}$/.test(assisted.trial_execution.architecture_instruction_sha256 ?? "")) ||
        baseline.trial_execution.architecture_instruction_sha256 != null) {
      issues.push(caseId + " repetition " + repetition + ": trial isolation or capture provenance is missing/invalid");
      invalidPair = true;
    }
    if (baseline.trial_execution?.trial_id === assisted.trial_execution?.trial_id ||
        baseline.trial_execution?.blind_label === assisted.trial_execution?.blind_label) {
      issues.push(caseId + " repetition " + repetition + ": paired trials must have distinct trial IDs and blind labels");
      invalidPair = true;
    }
    if (baseline.subject !== assisted.subject) {
      issues.push(caseId + ": paired model subjects differ; comparison is invalid");
      invalidPair = true;
    }
    const expectedChecks = (loadJson(CASES_PATH).cases.find(c => c.id === caseId)?.adversarial_checks ?? []).map(x => x.check_id);
    for (const record of [baseline, assisted]) {
      const assessment = record.assessment;
      const scorer = assessment?.scorer;
      const reviewer = assessment?.adversarial_reviewer;
      if (assessment?.protocol_version !== "1.0" ||
          !scorer || scorer.calibration_status !== "PASS" || !scorer.calibration_reference ||
          !/^[a-f0-9]{64}$/.test(scorer.calibration_sha256 ?? "") ||
          !reviewer || reviewer.calibration_status !== "PASS" || !reviewer.calibration_reference ||
          !/^[a-f0-9]{64}$/.test(reviewer.calibration_sha256 ?? "")) {
        issues.push(caseId + " " + record.condition + ": calibrated scorer and adversarial-reviewer evidence is missing or invalid");
        invalidPair = true;
      }
      if (scorer?.evaluator_id !== record.assessor?.assessor_id ||
          reviewer?.evaluator_id !== record.adversarial_review?.reviewer_id ||
          (scorer?.evaluator_id && reviewer?.evaluator_id && scorer.evaluator_id === reviewer.evaluator_id)) {
        issues.push(caseId + " " + record.condition + ": evaluator metadata does not match distinct scorer/reviewer attestations");
        invalidPair = true;
      }
      if (!Array.isArray(record.evidence) || record.evidence.length === 0 ||
          record.evidence.some(item => !item.reference || !/^[a-f0-9]{64}$/.test(item.sha256 ?? ""))) {
        issues.push(caseId + " " + record.condition + ": supporting evidence reference and SHA-256 are required");
        invalidPair = true;
      }
      if (Array.isArray(record.critical_failures) && record.critical_failures.length > 0) {
        issues.push(caseId + " " + record.condition + ": critical failure recorded: " + record.critical_failures.join("; "));
        invalidPair = true;
      }
    }
    const baselineAssessor = baseline.assessor?.assessor_id;
    const assistedAssessor = assisted.assessor?.assessor_id;
    for (const record of [baseline, assisted]) {
      if (!record.assessor?.assessor_id || record.assessor.independent !== true || record.assessor.blinded_condition !== true) {
        issues.push(caseId + " " + record.condition + ": independent blinded scorer attestation is missing or incomplete");
        invalidPair = true;
      }
      const review = record.adversarial_review;
      if (!review || !review.reviewer_id || review.independent !== true || review.blinded_condition !== true) {
        issues.push(caseId + " " + record.condition + ": independent blinded adversarial-review attestation is missing or incomplete");
        invalidPair = true;
      }
      if (review && (!review.reviewer_id || review.reviewer_id === record.assessor?.assessor_id)) {
        issues.push(caseId + " " + record.condition + ": adversarial reviewer must be identified and distinct from scorer");
        invalidPair = true;
      }
      const observedChecks = (review?.checks ?? []).map(x => x.check_id);
      for (const expected of expectedChecks) {
        if (!observedChecks.includes(expected)) {
          issues.push(caseId + " " + record.condition + ": required adversarial check " + expected + " missing");
          invalidPair = true;
        }
      }
      if (new Set(observedChecks).size !== observedChecks.length) {
        issues.push(caseId + " " + record.condition + ": duplicate adversarial check IDs");
        invalidPair = true;
      }
      for (const check of review?.checks ?? []) {
        if (check.outcome === "NOT_ASSESSED") {
          issues.push(caseId + " " + record.condition + ": adversarial check " + check.check_id + " not assessed");
          invalidPair = true;
        }
        if (check.outcome === "FAIL") {
          issues.push(caseId + " " + record.condition + ": adversarial failure " + check.check_id + ": " + check.finding);
          invalidPair = true;
        }
      }
    }
    if (baselineAssessor && assistedAssessor && baselineAssessor !== assistedAssessor) {
      issues.push(caseId + ": different assessors scored paired conditions; same blinded independent assessor should score both to reduce inter-rater confounding");
      invalidPair = true;
    }
    if (invalidPair) continue;
    const delta = {};
    for (const dimension of DIMENSIONS) delta[dimension] = assisted.scores[dimension] - baseline.scores[dimension];
    pairs.push({
      case_id: caseId,
      repetition,
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
  }
  const summaries = ["P01","P02","P03","P04","P05"].map(caseId => {
    const casePairs = pairs.filter(pair => pair.case_id === caseId);
    const delta = {};
    for (const dimension of DIMENSIONS) {
      const values = casePairs.map(pair => pair.delta[dimension]);
      delta[dimension] = values.length ? {
        mean: values.reduce((sum, value) => sum + value, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        repetitions_present: values.length
      } : { mean: null, min: null, max: null, repetitions_present: 0 };
    }
    return { case_id: caseId, repetitions_present: casePairs.length, delta };
  });
  return { pairs, summaries, issues };
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
    "| Case | Rep | Run pair | Accuracy Δ | Reasoning Δ | Evidence Δ | Calibration Δ | Capability Δ | Reliability Δ | Safety Δ | Synergy Δ |",
    "|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|"
  ];
  for (const p of result.pairs) {
    lines.push("| " + p.case_id + " | " + p.repetition + " | " + p.baseline_run_id + " → " + p.assisted_run_id + " | " +
      DIMENSIONS.map(d => p.delta[d]).join(" | ") + " |");
  }
  lines.push("", "## Three-repetition case summaries", "",
    "| Case | Complete pairs | Accuracy mean [min,max] | Reasoning mean [min,max] | Evidence mean [min,max] | Calibration mean [min,max] | Capability mean [min,max] | Reliability mean [min,max] | Safety mean [min,max] | Synergy mean [min,max] |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|");
  for (const summary of result.summaries) {
    const cells = DIMENSIONS.map(d => { const v = summary.delta[d]; return v.mean === null ? "—" : v.mean.toFixed(2) + " [" + v.min + "," + v.max + "]"; });
    lines.push("| " + summary.case_id + " | " + summary.repetitions_present + "/3 | " + cells.join(" | ") + " |");
  }
  lines.push("", "## Critical failures", "");
  const failures = [
    ...result.pairs.flatMap(p => p.critical_failures.map(x => "- " + p.case_id + ": " + x)),
    ...result.issues.filter(x => /critical failure recorded|adversarial failure/i.test(x)).map(x => "- " + x)
  ];
  lines.push(...(failures.length ? [...new Set(failures)] : ["- None recorded in supplied records. This is not proof that none occurred."]));
  lines.push("", "## Eligibility, evidence and independence gaps", "");
  lines.push(...(result.issues.length ? result.issues.map(x => "- " + x) : ["- Pair completeness, assessor independence and blinding are attested in supplied records; attestations still require external validation."]));
  lines.push("", "## Operational decision", "",
    "NOT OPERATIONAL unless all 15 pairs are present (five cases × three repetitions), schema validation passes, independent assessors verify source evidence, adversarial checks are reviewed, CI passes, and a separate release reviewer signs the evidence package.", "");
  return lines.join("\n");
}

function usage() {
  console.log("Usage: node tools/performance-lab/runner.mjs validate-matrix <trial-matrix.csv> | validate-calibration-plan <plan.json> | record <trial.json> <ledger.json> | validate <ledger.json> | report <ledger.json> <output.md> | sign-manifest <payload.json> <private-key.pem> <output.json> | verify-manifest <manifest.json> <trusted-public-key.pem> <evidence-root> <expected-revision> <expected-signer-id> <expected-signer-role>");
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const [command, input, output] = process.argv.slice(2);
  if (command === "validate-calibration-plan" && input) {\n    const errors = validateCalibrationPlan(loadJson(input));\n    if (errors.length) { console.error(errors.join("\\n")); process.exitCode = 1; }\n    else console.log("Calibration plan schema, evaluator separation, reviewer approvals and timestamps validated. Human identity/key binding remains an independent governance check.");\n  } else if (command === "validate-matrix" && input) {
    const errors = validateTrialMatrix(fs.readFileSync(input, "utf8"));
    if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
    else console.log("Validated all 30 planned trial rows; capture gates are enforced for any started trial.");
  } else if (command === "record" && input && output) {
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
  } else if (command === "sign-manifest" && input && output) {
    const payload = loadJson(input);
    const privateKeyPem = fs.readFileSync(output, "utf8");
    const signed = signEvidenceManifest(payload, privateKeyPem);
    const manifestErrors = validateSchema(signed, loadJson(path.join(ROOT, "schema/evidence-manifest.schema.json")));
    if (manifestErrors.length) throw new Error(manifestErrors.join("\n"));
    fs.writeFileSync(process.argv[5], JSON.stringify(signed, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    console.log("Signed evidence manifest written to " + process.argv[5]);
  } else if (command === "verify-manifest" && input && output && process.argv[5] && process.argv[6] && process.argv[7] && process.argv[8]) {
    const manifest = loadJson(input);
    const publicKeyPem = fs.readFileSync(output, "utf8");
    const errors = verifyEvidenceManifest(manifest, {
      publicKeyPem,
      evidenceRoot: process.argv[5],
      expectedRevision: process.argv[6],
      expectedSignerId: process.argv[7],
      expectedSignerRole: process.argv[8]
    });
    if (errors.length) {
      console.error(errors.join("\n"));
      process.exitCode = 1;
    } else {
      console.log("Evidence manifest signature, trusted-key fingerprint, revision binding, and artifact hashes verified.");
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
