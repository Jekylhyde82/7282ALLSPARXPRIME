import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { verifyEvidenceExport } from "./verify-evidence-export.mjs";
import { signEvidenceCheckpoint } from "./evidence-checkpoint.mjs";

async function main() {
  const [exportPath, sequenceText, hash, previousDigestText, privateKeyPath, outputPath] = process.argv.slice(2);
  if (!exportPath || !/^(0|[1-9]\d*)$/.test(sequenceText || "") || !/^[a-f0-9]{64}$/.test(hash || "") ||
      !previousDigestText || !privateKeyPath || !outputPath) {
    throw new Error("USAGE: node scripts/sign-evidence-checkpoint.mjs <export.json> <trusted-sequence> <trusted-sha256> <GENESIS|previous-checkpoint-sha256> <private-key.pem> <output.json>");
  }
  const bundle = JSON.parse(await readFile(exportPath, "utf8"));
  const verified = verifyEvidenceExport(bundle, { sequence: Number(sequenceText), hash });
  const previousCheckpointSha256 = previousDigestText === "GENESIS" ? null : previousDigestText;
  if (previousCheckpointSha256 !== null && !/^[a-f0-9]{64}$/.test(previousCheckpointSha256)) throw new Error("INVALID_PREVIOUS_CHECKPOINT");
  const privateKey = await readFile(privateKeyPath, "utf8");
  const checkpoint = signEvidenceCheckpoint({
    ledgerMonth: bundle.ledgerMonth, sequence: verified.sequence, hash: verified.hash,
    previousCheckpointSha256, issuedAt: new Date().toISOString(), privateKey,
  });
  await writeFile(outputPath, JSON.stringify(checkpoint, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  process.stdout.write(JSON.stringify({ signed: true, ledgerMonth: checkpoint.ledgerMonth, sequence: checkpoint.sequence, outputPath }) + "\n");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { process.stderr.write(error.message + "\n"); process.exitCode = 1; });
}
