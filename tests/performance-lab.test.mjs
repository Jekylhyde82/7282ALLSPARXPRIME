import test from "node:test";
import assert from "node:assert/strict";
import { validateSchema, validateRunRecord, buildComparison, renderReport, sha256, createRunRecord, appendRunRecord } from "../tools/performance-lab/runner.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const schema = JSON.parse(fs.readFileSync(new URL("../tools/performance-lab/schema/run-record.schema.json", import.meta.url)));
const cases = JSON.parse(fs.readFileSync(new URL("../tools/performance-lab/cases.json", import.meta.url)));
const dims = ["accuracy","reasoning","evidence","calibration","capability","reliability","safety","synergy"];
function record(condition, assessorId, caseId="P01", repetition=1) {
  return {
    benchmark_id:"GENESIS-PERFORMANCE-LAB-001",run_id:`GPL-20261110-${caseId}-R${repetition}-${condition === "baseline" ? "B" : "A"}`,
    case_id:caseId,repetition,condition,subject:"GPT-6",prompt_sha256:sha256("identical prompt"),
    response:"Recorded trial response.",scores:Object.fromEntries(dims.map(d=>[d,3])),
    critical_failures:[],evidence:[{kind:"test fixture",reference:"test://evidence",sha256:sha256("fixture evidence")}],assessor:{assessor_id:assessorId,blinded_condition:true,independent:true},
    adversarial_review:{reviewer_id:"critic-" + assessorId,blinded_condition:true,independent:true,checks:[{check_id:"AC01",outcome:"PASS",finding:"No unsupported claim found."},{check_id:"AC02",outcome:"PASS",finding:"Uncertainty was stated."}]},
    limitations:[],verification_status:"NOT_VERIFIED",created_at:"2026-11-10T00:00:00.000Z"
  };
}

test("valid record passes the Draft 2020-12 schema",()=>assert.deepEqual(validateRunRecord(record("baseline","A"),schema),[]));
test("Draft 2020-12 vocabulary is evaluated by the standards-compliant validator",()=>{
  const draftSchema={$schema:"https://json-schema.org/draft/2020-12/schema",type:"array",minItems:2,prefixItems:[{type:"string"},{type:"integer"}],items:false};
  assert.deepEqual(validateSchema(["case",2],draftSchema),[]);
  assert.ok(validateSchema(["case"],draftSchema).length>0);
  assert.ok(validateSchema(["case",2,3],draftSchema).length>0);
});

test("repetition index is constrained to one through three",()=>{
  assert.ok(validateRunRecord({...record("baseline","A"),repetition:4},schema).length>0);
});

test("invalid score and unknown property are rejected",()=>{
  const bad={...record("baseline","A"),unexpected:true,scores:{...record("baseline","A").scores,accuracy:6}};
  const errors=validateSchema(bad,schema);
  assert.ok(errors.some(e=>e.includes("additional properties")));
  assert.ok(errors.some(e=>e.includes("must be <= 5")));
});
test("pair comparison calculates per-dimension deltas",()=>{
  const b=record("baseline","reviewer"),a=record("architecture_assisted","reviewer");
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
test("three repetitions are paired separately and incomplete repetitions are flagged",()=>{
  const records=[];
  for (const repetition of [1,2,3]) {
    const b=record("baseline","same-blinded-scorer","P01",repetition);
    const a=record("architecture_assisted","same-blinded-scorer","P01",repetition);
    a.scores.accuracy=repetition+2;
    records.push(b,a);
  }
  const complete=buildComparison(records);
  assert.equal(complete.pairs.length,3);
  assert.equal(complete.summaries[0].repetitions_present,3);
  assert.equal(complete.summaries[0].delta.accuracy.mean,1);
  const incomplete=buildComparison(records.filter(r=>r.repetition!==3));
  assert.ok(incomplete.issues.some(x=>x.includes("P01 repetition 3: missing baseline or architecture-assisted run")));
});

test("duplicate condition within a repetition is rejected from clean pairing",()=>{
  const b=record("baseline","same-scorer","P01",1);
  const a=record("architecture_assisted","same-scorer","P01",1);
  const duplicate=record("baseline","same-scorer","P01",1);
  const result=buildComparison([b,a,duplicate]);
  assert.ok(result.issues.some(x=>x.includes("P01: duplicate baseline record for repetition 1")));
  assert.equal(result.pairs.length,0,"duplicate records must never produce a comparative delta");
});

test("report keeps operational status on HOLD",()=>{
  const report=renderReport([record("baseline","A"),record("architecture_assisted","B")]);
  assert.match(report,/NOT OPERATIONAL/);
});

test("automated record creation hashes the exact prompt and appends atomically",()=>{
  const trial={case_id:"P01",repetition:1,condition:"baseline",subject:"GPT-6",prompt:cases.cases.find(c=>c.id==="P01").prompt,response:"Captured response",scores:Object.fromEntries(dims.map(d=>[d,3])),assessor:{assessor_id:"reviewer",blinded_condition:true,independent:true},adversarial_review:{reviewer_id:"independent-critic",blinded_condition:true,independent:true,checks:[{check_id:"AC01",outcome:"PASS",finding:"No critical defect."},{check_id:"AC02",outcome:"PASS",finding:"Second control reviewed."}]}};
  const record=createRunRecord(trial);
  assert.equal(record.prompt_sha256,sha256(trial.prompt));
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"genesis-lab-"));
  const ledger=path.join(dir,"runs.json");
  assert.equal(appendRunRecord(record,ledger),1);
  assert.equal(JSON.parse(fs.readFileSync(ledger,"utf8")).length,1);
  fs.rmSync(dir,{recursive:true,force:true});
});

test("adversarial failures are surfaced and missing independent critic blocks readiness",()=>{
  const b=record("baseline","score-A"),a=record("architecture_assisted","score-A");
  a.adversarial_review.checks[0]={check_id:"AC01",outcome:"FAIL",finding:"Unsupported factual assertion."};
  const result=buildComparison([b,a]);
  assert.equal(result.pairs.length,0,"failed adversarial checks must not produce a certifiable comparison delta");
  assert.ok(result.issues.some(x=>x.includes("Unsupported factual assertion")));
  assert.match(renderReport([b,a]),/Unsupported factual assertion/,"the report must retain rejected critical findings");
  a.adversarial_review.reviewer_id=a.assessor.assessor_id;
  const blocked=buildComparison([b,a]);
  assert.ok(blocked.issues.some(x=>x.includes("distinct from scorer")));
});

test("missing required adversarial check blocks comparison readiness",()=>{
  const b=record("baseline","score-A");
  const a=record("architecture_assisted","score-A");
  a.adversarial_review.checks=a.adversarial_review.checks.filter(x=>x.check_id!=="AC02");
  const result=buildComparison([b,a]);
  assert.ok(result.issues.some(x=>x.includes("required adversarial check AC02 missing")));
  assert.equal(result.pairs.length,0,"incomplete adversarial coverage must not produce a comparative delta");
});

test("run records cannot self-promote verification status",()=>{
  const trial={case_id:"P01",repetition:1,condition:"baseline",subject:"GPT-6",prompt:cases.cases.find(c=>c.id==="P01").prompt,response:"Response",scores:Object.fromEntries(dims.map(d=>[d,3])),evidence:[{kind:"test",reference:"test://evidence",sha256:sha256("fixture evidence")}],assessor:{assessor_id:"scorer",blinded_condition:true,independent:true},adversarial_review:{reviewer_id:"critic",blinded_condition:true,independent:true,checks:[{check_id:"AC01",outcome:"PASS",finding:"Reviewed."},{check_id:"AC02",outcome:"PASS",finding:"Reviewed."}]},verification_status:"INDEPENDENTLY_REVIEWED"};
  const record=createRunRecord(trial);
  assert.equal(record.verification_status,"NOT_VERIFIED");
  assert.ok(validateRunRecord({...record,verification_status:"INDEPENDENTLY_REVIEWED"}).some(error=>error.includes("equal to constant")));
});


test("comparison fails closed when evidence hashes are missing",()=>{
  const b=record("baseline","scorer"),a=record("architecture_assisted","scorer");
  delete b.evidence[0].sha256;
  const result=buildComparison([b,a]);
  assert.equal(result.pairs.length,0);
  assert.ok(result.issues.some(x=>x.includes("evidence reference and SHA-256 are required")));
});

test("comparison fails closed when scorer independence or blinding is absent",()=>{
  const b=record("baseline","scorer"),a=record("architecture_assisted","scorer");
  a.assessor.independent=false;
  const result=buildComparison([b,a]);
  assert.equal(result.pairs.length,0);
  assert.ok(result.issues.some(x=>x.includes("independent blinded scorer attestation")));
});

test("comparison fails closed when adversarial review is missing or incomplete",()=>{
  const b=record("baseline","scorer"),a=record("architecture_assisted","scorer");
  a.adversarial_review.blinded_condition=false;
  const result=buildComparison([b,a]);
  assert.equal(result.pairs.length,0);
  assert.ok(result.issues.some(x=>x.includes("independent blinded adversarial-review attestation is missing")));
});

test("recorded critical failures prevent a clean comparative delta",()=>{
  const b=record("baseline","scorer"),a=record("architecture_assisted","scorer");
  a.critical_failures=["unsafe instruction"];
  const result=buildComparison([b,a]);
  assert.equal(result.pairs.length,0);
  assert.ok(result.issues.some(x=>x.includes("critical failure recorded")));
});

test("paired comparisons reject prompt or model subject drift",()=>{
  const b=record("baseline","scorer"),a=record("architecture_assisted","scorer");
  a.prompt_sha256=sha256("different prompt");
  a.subject="different-model";
  const result=buildComparison([b,a]);
  assert.ok(result.issues.some(x=>x.includes("paired prompts differ")));
  assert.ok(result.issues.some(x=>x.includes("paired model subjects differ")));
  assert.equal(result.pairs.length,0,"mismatched prompts or model subjects must never produce a comparative delta");
});
test("recording rejects a prompt that differs from the canonical case",()=>{
  const trial={case_id:"P01",condition:"baseline",subject:"GPT-6",prompt:"not the canonical prompt",response:"response",scores:Object.fromEntries(dims.map(d=>[d,3])),evidence:[{kind:"test",reference:"test://evidence",sha256:sha256("fixture evidence")}],assessor:{assessor_id:"scorer",blinded_condition:true,independent:true},adversarial_review:{reviewer_id:"critic",blinded_condition:true,independent:true,checks:[{check_id:"AC01",outcome:"PASS",finding:"Reviewed."},{check_id:"AC02",outcome:"PASS",finding:"Reviewed."}]}};
  assert.throws(()=>createRunRecord(trial),/canonical benchmark case prompt/);
});
