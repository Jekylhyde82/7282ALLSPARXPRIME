import test from "node:test";
import assert from "node:assert/strict";
import { validateSchema, validateRunRecord, buildComparison, renderReport, sha256 } from "../tools/performance-lab/runner.mjs";
import fs from "node:fs";

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
  assert.deepEqual(result.issues,[]);
});
test("missing pair and same assessor are flagged",()=>{
  const b=record("baseline","same");
  const result=buildComparison([b,record("architecture_assisted","same")]);
  assert.ok(result.issues.some(x=>x.includes("same assessor")));
  assert.ok(buildComparison([b]).issues.some(x=>x.includes("missing baseline")));
});
test("report keeps operational status on HOLD",()=>{
  const report=renderReport([record("baseline","A"),record("architecture_assisted","B")]);
  assert.match(report,/NOT OPERATIONAL/);
});
