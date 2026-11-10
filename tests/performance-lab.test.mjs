import test from "node:test";
import assert from "node:assert/strict";
import { validateSchema, validateRunRecord, buildComparison, renderReport, sha256, createRunRecord, appendRunRecord } from "../tools/performance-lab/runner.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const schema = JSON.parse(fs.readFileSync(new URL("../tools/performance-lab/schema/run-record.schema.json", import.meta.url)));
const dims = ["accuracy","reasoning","evidence","calibration","capability","reliability","safety","synergy"];
function record(condition, assessorId, caseId="P01") {
  return {
    benchmark_id:"GENESIS-PERFORMANCE-LAB-001",run_id:`GPL-20261110-${caseId}-${condition === "baseline" ? "B" : "A"}`,
    case_id:caseId,condition,subject:"GPT-6",prompt_sha256:sha256("identical prompt"),
    response:"Recorded trial response.",scores:Object.fromEntries(dims.map(d=>[d,3])),
    critical_failures:[],evidence:[],assessor:{assessor_id:assessorId,blinded_condition:true,independent:true},
    limitations:[],verification_status:"NOT_VERIFIED",created_at:"2026-11-10T00:00:00.000Z"
  };
}

test("valid record passes the declared schema subset",()=>assert.deepEqual(validateRunRecord(record("baseline","A"),schema),[]));
test("invalid score and unknown property are rejected",()=>{
  const bad={...record("baseline","A"),unexpected:true,scores:{...record("baseline","A").scores,accuracy:6}};
  const errors=validateSchema(bad,schema);
  assert.ok(errors.some(e=>e.includes("additional property")));
  assert.ok(errors.some(e=>e.includes("must be <= 5")));
});
test("pair comparison calculates per-dimension deltas",()=>{
  const b=record("baseline","A"),a=record("architecture_assisted","B");
  a.scores.accuracy=5;
  const result=buildComparison([b,a]);
  assert.equal(result.pairs[0].delta.accuracy,2);
  assert.ok(result.issues.every(x=>x.includes("missing baseline or architecture-assisted run")));
});
test("same independent blinded assessor scores both conditions; missing pairs are flagged",()=>{
  const b=record("baseline","reviewer-independent");
  const result=buildComparison([b,record("architecture_assisted","reviewer-independent")]);
  assert.ok(!result.issues.some(x=>x.includes("different assessors")));
  assert.ok(buildComparison([b]).issues.some(x=>x.includes("missing baseline")));
});
test("report keeps operational status on HOLD",()=>{
  const report=renderReport([record("baseline","A"),record("architecture_assisted","B")]);
  assert.match(report,/NOT OPERATIONAL/);
});

test("automated record creation hashes the exact prompt and appends atomically",()=>{
  const trial={case_id:"P01",condition:"baseline",subject:"GPT-6",prompt:"Exact controlled prompt",response:"Captured response",scores:Object.fromEntries(dims.map(d=>[d,3])),assessor:{assessor_id:"reviewer",blinded_condition:true,independent:true}};
  const record=createRunRecord(trial);
  assert.equal(record.prompt_sha256,sha256(trial.prompt));
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"genesis-lab-"));
  const ledger=path.join(dir,"runs.json");
  assert.equal(appendRunRecord(record,ledger),1);
  assert.equal(JSON.parse(fs.readFileSync(ledger,"utf8")).length,1);
  fs.rmSync(dir,{recursive:true,force:true});
});
