import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { verifyEvidenceCheckpoint } from "./evidence-checkpoint.mjs";

async function main() {
  const [checkpointPath, publicKeyPath, expectedPreviousText] = process.argv.slice(2);
  if (!checkpointPath || !publicKeyPath || !expectedPreviousText) {
    throw new Error("USAGE: node scripts/verify-evidence-checkpoint.mjs <checkpoint.json> <pinned-public-key.pem> <GENESIS|previous-checkpoint-sha256>");
  }
  const checkpoint = JSON.parse(await readFile(checkpointPath, "utf8"));
  const publicKey = await readFile(publicKeyPath, "utf8");
  const expectedPrevious = expectedPreviousText === "GENESIS" ? null : expectedPreviousText;
  if (expectedPrevious !== null && !/^[a-f0-9]{64}$/.test(expectedPrevious)) throw new Error("INVALID_PREVIOUS_CHECKPOINT");
  const result = verifyEvidenceCheckpoint(checkpoint, publicKey, expectedPrevious);
  process.stdout.write(JSON.stringify(result) + "\\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { process.stderr.write(error.message + "\\n"); process.exitCode = 1; });
}
