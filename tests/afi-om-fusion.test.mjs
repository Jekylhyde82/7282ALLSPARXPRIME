import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  AFI_OM_CONTRACT_VERSION,
  OMNI_IDENTITIES,
  buildAfiOmFusionPacket,
  recordAfiOmSynthesis,
} from "../src/lib/allsparxPrime/afi-om-fusion.mjs";

const contribution = (overrides = {}) => ({
  contribution_id: "c-1",
  identity: "OMNI GENIUS",
  source_ref: "evidence://reasoning/run-001",
  summary: "The available evidence supports option A.",
  confidence: 0.82,
  claims: [{
    claim_id: "claim-1",
    topic: "preferred-option",
    position: "option-a",
    statement: "Option A best satisfies the stated objective.",
    evidence_refs: ["evidence://source/a"],
  }],
  ...overrides,
});

test("exports exactly the nine canonical 9 FOLD OMNI identities", () => {
  assert.equal(AFI_OM_CONTRACT_VERSION, "1.0.0");
  assert.deepEqual(OMNI_IDENTITIES.map(({ identity }) => identity), [
    "EB9 PRIME",
    "OMNI GENIUS",
    "OMNI BRAINSTORM",
    "OMNI CRITIC",
    "OMNI ENGINEER",
    "OMNIVELOCITY PRIME",
    "OMNIGENESIS PRIME",
    "OMNIEVOLUTION PRIME",
    "AFI PRIME",
  ]);
});

test("builds an attributed packet and reports missing specialist coverage", () => {
  const packet = buildAfiOmFusionPacket({
    task_id: "task-001",
    objective: "Compare two engineering proposals.",
    contributions: [contribution()],
  });
  assert.equal(packet.status, "READY_FOR_SYNTHESIS");
  assert.equal(packet.coverage.complete, false);
  assert.ok(packet.coverage.missing_identities.includes("OMNI CRITIC"));
  assert.equal(packet.contributions[0].source_ref, "evidence://reasoning/run-001");
  assert.equal(packet.execution_authorized, false);
  assert.equal(packet.approval_authorized, false);
  assert.equal(packet.verification_state, "NOT_VERIFIED");
  assert.ok(Object.isFrozen(packet.contributions[0]));
});

test("surfaces explicit disagreement without discarding either contribution", () => {
  const packet = buildAfiOmFusionPacket({
    task_id: "task-002",
    objective: "Evaluate preferred option.",
    contributions: [
      contribution(),
      contribution({
        contribution_id: "c-2",
        identity: "OMNI CRITIC",
        source_ref: "evidence://critic/run-002",
        summary: "The evidence is insufficient for option A.",
        confidence: 0.67,
        claims: [{
          claim_id: "claim-2",
          topic: "preferred-option",
          position: "insufficient-evidence",
          statement: "The current evidence does not justify selecting option A.",
          evidence_refs: ["evidence://source/b"],
        }],
      }),
    ],
  });
  assert.equal(packet.contributions.length, 2);
  assert.equal(packet.disagreements.length, 1);
  assert.equal(packet.disagreements[0].positions.length, 2);
  assert.deepEqual(
    packet.disagreements[0].positions.flatMap((position) =>
      position.contributions.map((item) => item.contribution_id)),
    ["c-1", "c-2"],
  );
});

test("rejects unknown identities, duplicate IDs and invalid confidence", () => {
  assert.throws(() => buildAfiOmFusionPacket({
    task_id: "task-003",
    objective: "Invalid identity.",
    contributions: [contribution({ identity: "INVENTED PRIME" })],
  }), /nine canonical/);

  assert.throws(() => buildAfiOmFusionPacket({
    task_id: "task-004",
    objective: "Duplicate IDs.",
    contributions: [contribution(), contribution()],
  }), /must be unique/);

  assert.throws(() => buildAfiOmFusionPacket({
    task_id: "task-005",
    objective: "Invalid confidence.",
    contributions: [contribution({ confidence: 1.2 })],
  }), /between 0 and 1/);
});

test("records synthesis only when supporting contributions and evidence exist", () => {
  const packet = buildAfiOmFusionPacket({
    task_id: "task-006",
    objective: "Summarise verified source contributions.",
    contributions: [contribution()],
  });
  const record = recordAfiOmSynthesis({
    packet,
    synthesis: {
      summary: "Option A is the current advisory recommendation.",
      conclusions: [{
        statement: "Option A is supported by the cited source.",
        supporting_contribution_ids: ["c-1"],
        evidence_refs: ["evidence://source/a"],
      }],
      unresolved_disagreements: [],
      decision: "recommendation_only",
    },
  });
  assert.equal(record.status, "SYNTHESIS_RECORDED");
  assert.equal(record.authority, "ADVISORY_ONLY");
  assert.equal(record.execution_authorized, false);
  assert.equal(record.approval_authorized, false);
  assert.equal(record.verification_state, "NOT_VERIFIED");
});

test("rejects synthesis that invents contribution or evidence references", () => {
  const packet = buildAfiOmFusionPacket({
    task_id: "task-007",
    objective: "Reject unsupported synthesis.",
    contributions: [contribution()],
  });
  assert.throws(() => recordAfiOmSynthesis({
    packet,
    synthesis: {
      summary: "Unsupported.",
      conclusions: [{
        statement: "Invented support.",
        supporting_contribution_ids: ["not-in-packet"],
        evidence_refs: ["evidence://not-in-packet"],
      }],
      unresolved_disagreements: [],
      decision: "recommendation_only",
    },
  }), /known supporting contributions/);
});

test("rejects an approval or execution decision disguised as synthesis", () => {
  const packet = buildAfiOmFusionPacket({
    task_id: "task-008",
    objective: "Keep authority separate.",
    contributions: [contribution()],
  });
  assert.throws(() => recordAfiOmSynthesis({
    packet,
    synthesis: {
      summary: "This must not self-approve.",
      conclusions: [],
      unresolved_disagreements: [],
      decision: "approved",
    },
  }), /remain advisory/);
});

test("rejects a tampered fusion packet before recording synthesis", () => {
  const packet = buildAfiOmFusionPacket({
    task_id: "task-009",
    objective: "Detect packet tampering.",
    contributions: [contribution()],
  });
  const tampered = structuredClone(packet);
  tampered.coverage.complete = true;
  assert.throws(() => recordAfiOmSynthesis({
    packet: tampered,
    synthesis: {
      summary: "Must not accept altered coverage.",
      conclusions: [],
      unresolved_disagreements: [],
      decision: "requires_review",
    },
  }), /integrity validation failed/);
});

test("schema declares the same nine canonical identities and fail-closed authority", async () => {
  const schema = JSON.parse(await readFile("schemas/afi-om-fusion-packet.schema.json", "utf8"));
  const identities = schema.$defs.identities.items.enum;
  assert.deepEqual(identities, OMNI_IDENTITIES.map(({ identity }) => identity));
  assert.equal(schema.properties.execution_authorized.const, false);
  assert.equal(schema.properties.approval_authorized.const, false);
  assert.equal(schema.properties.verification_state.const, "NOT_VERIFIED");
});
