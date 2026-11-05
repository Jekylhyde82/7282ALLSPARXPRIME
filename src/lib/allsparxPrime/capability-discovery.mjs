import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { validateCapabilityManifest } from "./capability-manifest-validator.mjs";

const SKIP_DIRECTORIES = new Set([
  ".git", "node_modules", ".next", "dist", "build", "coverage", ".astro",
]);
const MANIFEST_NAMES = new Set([
  "allsparx.capability.json",
  "capability.manifest.json",
]);

function freezeDeep(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

/**
 * Read-only discovery of declarative capability manifests and package metadata.
 * Does not execute package scripts, load modules, follow symlinks, or modify sources.
 */
export async function discoverCapabilities({
  roots,
  maxDepth = 8,
  maxFiles = 5000,
  maxManifestBytes = 256 * 1024,
} = {}) {
  if (!Array.isArray(roots) || roots.length === 0 || roots.some((root) => typeof root !== "string" || !root.trim())) {
    throw new TypeError("roots must be a non-empty array of directory paths");
  }
  if (!Number.isInteger(maxDepth) || maxDepth < 0 || maxDepth > 32) {
    throw new RangeError("maxDepth must be an integer from 0 to 32");
  }
  if (!Number.isInteger(maxFiles) || maxFiles < 1 || maxFiles > 50000) {
    throw new RangeError("maxFiles must be an integer from 1 to 50000");
  }
  if (!Number.isInteger(maxManifestBytes) || maxManifestBytes < 1024 || maxManifestBytes > 2 * 1024 * 1024) {
    throw new RangeError("maxManifestBytes must be between 1024 and 2097152");
  }

  const candidates = [];
  const diagnostics = [];
  const visitedRoots = [];
  let filesVisited = 0;
  let truncated = false;

  for (const requestedRoot of [...new Set(roots.map((root) => path.resolve(root)))]) {
    let root;
    try {
      const info = await lstat(requestedRoot);
      if (info.isSymbolicLink() || !info.isDirectory()) {
        diagnostics.push({ code: "ROOT_NOT_DIRECTORY", path: requestedRoot });
        continue;
      }
      root = await realpath(requestedRoot);
    } catch {
      diagnostics.push({ code: "ROOT_UNAVAILABLE", path: requestedRoot });
      continue;
    }

    visitedRoots.push(root);

    async function walk(directory, depth) {
      if (truncated) return;
      let entries;
      try {
        entries = await readdir(directory, { withFileTypes: true });
      } catch {
        diagnostics.push({ code: "DIRECTORY_UNREADABLE", path: path.relative(root, directory) || "." });
        return;
      }

      entries.sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) {
        if (truncated) return;
        const absolute = path.join(directory, entry.name);
        const relative = path.relative(root, absolute).split(path.sep).join("/");

        // Dirent symlinks are deliberately ignored: discovery never follows them.
        if (entry.isSymbolicLink()) continue;

        if (entry.isDirectory()) {
          if (SKIP_DIRECTORIES.has(entry.name) || entry.name === ".") continue;
          if (depth < maxDepth) await walk(absolute, depth + 1);
          continue;
        }
        if (!entry.isFile()) continue;

        filesVisited += 1;
        if (filesVisited > maxFiles) {
          truncated = true;
          diagnostics.push({ code: "FILE_LIMIT_REACHED", limit: maxFiles });
          return;
        }

        if (entry.name === "package.json") {
          try {
            const stat = await lstat(absolute);
            if (stat.size > maxManifestBytes) {
              diagnostics.push({ code: "PACKAGE_METADATA_TOO_LARGE", path: relative });
              continue;
            }
            const pkg = JSON.parse(await readFile(absolute, "utf8"));
            if (pkg && typeof pkg === "object" && !Array.isArray(pkg)) {
              candidates.push({
                kind: "package-metadata",
                status: "candidate-needs-manifest",
                path: relative,
                name: typeof pkg.name === "string" ? pkg.name : null,
                version: typeof pkg.version === "string" ? pkg.version : null,
                private: pkg.private === true,
                source_root: root,
              });
            } else {
              diagnostics.push({ code: "PACKAGE_METADATA_INVALID", path: relative });
            }
          } catch {
            diagnostics.push({ code: "PACKAGE_METADATA_INVALID", path: relative });
          }
          continue;
        }

        if (!MANIFEST_NAMES.has(entry.name)) continue;
        try {
          const stat = await lstat(absolute);
          if (stat.size > maxManifestBytes) {
            diagnostics.push({ code: "CAPABILITY_MANIFEST_TOO_LARGE", path: relative });
            continue;
          }
          const manifest = JSON.parse(await readFile(absolute, "utf8"));
          const validation = validateCapabilityManifest(manifest);
          candidates.push({
            kind: "capability-manifest",
            status: validation.valid ? "manifest-valid-unverified" : "manifest-invalid",
            path: relative,
            capability_id: typeof manifest?.capability_id === "string" ? manifest.capability_id : null,
            version: typeof manifest?.version === "string" ? manifest.version : null,
            source_root: root,
            validation_errors: validation.errors,
          });
        } catch {
          diagnostics.push({ code: "CAPABILITY_MANIFEST_INVALID_JSON", path: relative });
        }
      }
    }

    await walk(root, 0);
  }

  return freezeDeep({
    mode: "read-only",
    executed_source_code: false,
    modified_source_files: false,
    roots_scanned: visitedRoots,
    files_visited: filesVisited,
    truncated,
    candidates,
    diagnostics,
  });
}
