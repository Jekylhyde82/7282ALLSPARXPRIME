import test from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";

const source = await (await import("node:fs/promises")).readFile("src/lib/starwire/candidate.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const runtimeUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { validateCandidate, evaluateCandidate, evaluateUaieGate } = await import(runtimeUrl);

const candidate = (overrides = {}) => ({
  id: "cand-001",
  schemaVersion: 2,
  state: "DISCOVERED",
  source: {
    sourceId: "source-001", sourceUrl: "https://example.org/offers",
    sourceRecordUrl: "https://example.org/offers/offer-001",
    retrievedAt: "2026-11-20T00:00:00.000Z", contentSha256: "a".repeat(64),
    termsApproved: true,
    sourceLicense: "CC-BY-4.0", sourceRecordId: "offer-001",
    sourceRecordRevision: "revision-digest-001",
    sourceRevision: "a1b2c3d4", sourceArtifactId: "git-blob-sha1-001",
    sourceReleaseId: "release-2026-11",
    sourceArtifactSha256: "b".repeat(64),
  },
  providerUrl: "https://provider.example.org/programme",
  providerName: "Example Provider",
  programmeName: "Builder Credits",
  advertisedBenefit: { claim: "Up to $500 credits", value: 500, unit: "USD credit", currency: "USD" },
  eligibility: { status: "CONFIRMED", requirements: ["Registered startup"], unknowns: [] },
  restrictions: ["New customers only"],
  expiryAt: null,
  officialVerification: {
    status: "VERIFIED", verifiedAt: "2026-11-20T00:05:00.000Z",
    evidenceUrls: ["https://provider.example.org/programme"],
  },
  originalIdeaValue: { value: "Accelerate infrastructure capability", linkedIdeaId: "idea-09" },
  ...overrides,
});
const high = {
  capabilityRelevance: 5, practicalUsefulness: 5, eligibilityConfidence: 5,
  attainableEconomicValue: 4, strategicValue: 5, integrationEase: 4,
  operationalReliability: 4, evidenceQuality: 5, freshness: 5,
};

test("validator fails closed on malformed untrusted candidate shapes", () => {
  assert.ok(validateCandidate(null).some(x => x.includes("Candidate must be an object")));
  assert.ok(validateCandidate(candidate({ source: null })).some(x => x.includes("source provenance")));
  assert.ok(validateCandidate(candidate({ eligibility: null })).some(x => x.includes("Eligibility must be an object")));
  assert.ok(validateCandidate(candidate({ officialVerification: { status: "VERIFIED", verifiedAt: null, evidenceUrls: null } })).some(x => x.includes("evidence URLs must be an array")));
});
test("rejects invalid lifecycle states and malformed eligibility arrays", () => {
  assert.ok(validateCandidate(candidate({ state: "ACQUIRED" })).some(x => x.includes("lifecycle state")));
  assert.ok(validateCandidate(candidate({ eligibility: { status: "CONFIRMED", requirements: [" "], unknowns: [] } })).some(x => x.includes("non-empty text")));
});
test("valid candidate preserves Original Idea Value and source provenance", () => {
  assert.deepEqual(validateCandidate(candidate()), []);
});
test("permits genuinely unavailable upstream identifiers only as explicit nulls", () => {
  const source = {
    ...candidate().source,
    sourceRecordUrl: null, sourceLicense: null, sourceRecordId: null, sourceRecordRevision: null,
    sourceRevision: null, sourceArtifactId: null, sourceReleaseId: null,
    sourceArtifactSha256: null,
  };
  assert.deepEqual(validateCandidate(candidate({ source })), []);
});
test("retains source licence, record, revision, release and provider provenance", () => {
  const value = candidate();
  assert.equal(value.source.sourceRecordUrl, "https://example.org/offers/offer-001");
  assert.equal(value.source.sourceLicense, "CC-BY-4.0");
  assert.equal(value.source.sourceRecordId, "offer-001");
  assert.equal(value.source.sourceRecordRevision, "revision-digest-001");
  assert.equal(value.source.sourceRevision, "a1b2c3d4");
  assert.equal(value.source.sourceArtifactId, "git-blob-sha1-001");
  assert.equal(value.source.sourceReleaseId, "release-2026-11");
  assert.equal(value.source.sourceArtifactSha256, "b".repeat(64));
  assert.equal(value.providerUrl, "https://provider.example.org/programme");
});
test("rejects unsafe canonical source record URLs", () => {
  assert.ok(validateCandidate(candidate({ source: { ...candidate().source, sourceRecordUrl: "http://example.org/record" } })).some(x => x.includes("Source record URL")));
});
test("rejects empty record revision and artifact identifiers", () => {
  assert.ok(validateCandidate(candidate({ source: { ...candidate().source, sourceRecordRevision: " " } })).some(x => x.includes("Source record revision")));
  assert.ok(validateCandidate(candidate({ source: { ...candidate().source, sourceArtifactId: " " } })).some(x => x.includes("Source artifact ID")));
});
test("rejects malformed artifact digest and unsafe provider URL", () => {
  assert.ok(validateCandidate(candidate({ source: { ...candidate().source, sourceArtifactSha256: "bad" } })).some(x => x.includes("artifact SHA-256")));
  assert.ok(validateCandidate(candidate({ providerUrl: "http://provider.example.org" })).some(x => x.includes("Provider URL")));
});
test("rejects missing Original Idea Value, malformed digest and non-HTTPS source", () => {
  assert.ok(validateCandidate(candidate({ originalIdeaValue: { value: " ", linkedIdeaId: null } })).some(x => x.includes("Original Idea Value")));
  assert.ok(validateCandidate(candidate({ source: { ...candidate().source, contentSha256: "bad" } })).some(x => x.includes("SHA-256")));
  assert.ok(validateCandidate(candidate({ source: { ...candidate().source, sourceUrl: "http://example.org" } })).some(x => x.includes("HTTPS")));
});
test("AFI PRIME produces reproducible nine-criterion decision support", () => {
  const result = evaluateCandidate(candidate(), high, "2026-11-20T00:10:00.000Z", ["Assumes provider terms remain unchanged"], []);
  assert.equal(result.score, 4.67);
  assert.equal(result.recommendation, "PRIORITIZE");
  assert.equal(result.caveat, "DECISION_SUPPORT_ONLY");
});
test("AFI PRIME refuses incomplete verification or invalid scoring", () => {
  const unverified = candidate({ officialVerification: { status: "UNVERIFIED", verifiedAt: null, evidenceUrls: [] } });
  assert.equal(evaluateCandidate(unverified, high, "2026-11-20T00:10:00.000Z").recommendation, "INVESTIGATE");
  assert.throws(() => evaluateCandidate(candidate(), { ...high, freshness: 6 }, "2026-11-20T00:10:00.000Z"), /integer from 0 to 5/);
});
test("UAIE PRIME fails closed rather than throwing on malformed candidates", () => {
  const nullResult = evaluateUaieGate(null, null);
  assert.equal(nullResult.decision, "HOLD");
  assert.equal(nullResult.registerWriteAuthorized, false);
  const malformed = candidate({ officialVerification: { status: "VERIFIED", verifiedAt: null, evidenceUrls: null } });
  const malformedResult = evaluateUaieGate(malformed, null);
  assert.equal(malformedResult.decision, "HOLD");
  assert.equal(malformedResult.registerWriteAuthorized, false);
});
test("UAIE PRIME holds candidates without independent evidence and AFI assessment", () => {
  const result = evaluateUaieGate(candidate(), null);
  assert.equal(result.decision, "HOLD");
  assert.equal(result.registerWriteAuthorized, false);
  assert.equal(result.humanApprovalRequired, true);
});
test("UAIE PRIME only offers human review after all gates; it never approves", () => {
  const assessed = evaluateCandidate(candidate(), high, "2026-11-20T00:10:00.000Z");
  const result = evaluateUaieGate(candidate(), assessed);
  assert.equal(result.decision, "ELIGIBLE_FOR_HUMAN_REVIEW");
  assert.equal(result.registerWriteAuthorized, false);
  assert.equal(result.humanApprovalRequired, true);
});
test("UAIE PRIME rejects contradictory official evidence", () => {
  const contradicted = candidate({ officialVerification: { status: "CONTRADICTED", verifiedAt: "2026-11-20T00:05:00.000Z", evidenceUrls: ["https://provider.example.org/programme"] } });
  assert.equal(evaluateUaieGate(contradicted, null).decision, "REJECT");
});
