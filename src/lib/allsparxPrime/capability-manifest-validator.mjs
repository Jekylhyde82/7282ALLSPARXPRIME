import Ajv2020 from "ajv/dist/2020.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const schemaPath = new URL("../../../schemas/capability-manifest.schema.json", import.meta.url);
const schema = JSON.parse(readFileSync(fileURLToPath(schemaPath), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false });

ajv.addFormat("email", (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
ajv.addFormat("uri", (value) => {
  try { return Boolean(new URL(value).protocol); }
  catch { return false; }
});
ajv.addFormat("date-time", (value) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  && Number.isFinite(Date.parse(value))
);

const validate = ajv.compile(schema);

/** Validate declarative manifest data; this function never loads or executes package code. */
export function validateCapabilityManifest(manifest) {
  const valid = validate(manifest);
  return Object.freeze({
    valid,
    errors: valid ? [] : (validate.errors ?? []).map((error) => ({
      instancePath: error.instancePath,
      schemaPath: error.schemaPath,
      keyword: error.keyword,
      message: error.message,
      params: error.params,
    })),
  });
}
