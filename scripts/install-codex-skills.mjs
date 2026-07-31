#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORTABLE_SKILLS = new Map([
  ["orchestrate-queue", {
    sourcePath: path.join(ROOT, "skills", "orchestrate"),
    requiredFiles: ["SKILL.md", path.join("scripts", "render-worker-result.mjs")]
  }],
  ["integrate-reviewed", {
    sourcePath: path.join(ROOT, "skills", "integrate-reviewed"),
    requiredFiles: ["SKILL.md"]
  }],
  ["workflow-doctor", {
    sourcePath: path.join(ROOT, "skills", "workflow-doctor"),
    requiredFiles: ["SKILL.md"]
  }]
]);

function parseArgs(argv) {
  const options = {
    check: false,
    json: false,
    targetDir: path.join(os.homedir(), ".agents", "skills")
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") {
      options.check = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--target-dir") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--target-dir requires a path");
      }
      options.targetDir = path.resolve(value);
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function usage() {
  return [
    "Usage:",
    "  node scripts/install-codex-skills.mjs [--check] [--json] [--target-dir <path>]",
    "",
    "Installs stable Codex user-skill links for workflow-kit orchestration."
  ].join("\n");
}

function sameTarget(linkPath, sourcePath) {
  try {
    return fs.realpathSync.native(linkPath) === fs.realpathSync.native(sourcePath);
  } catch {
    return false;
  }
}

export function reconcileCodexSkillLinks(options = {}) {
  const targetDir = path.resolve(options.targetDir ?? path.join(os.homedir(), ".agents", "skills"));
  const check = options.check ?? false;
  const results = [];

  if (!check) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const [name, { sourcePath, requiredFiles }] of PORTABLE_SKILLS) {
    const missingFiles = requiredFiles.filter(
      (relativePath) => !fs.existsSync(path.join(sourcePath, relativePath))
    );
    if (missingFiles.length > 0) {
      throw new Error(`Portable skill source is incomplete: ${name} is missing ${missingFiles.join(", ")}`);
    }

    const linkPath = path.join(targetDir, name);
    if (sameTarget(linkPath, sourcePath)) {
      results.push({ name, status: "current", sourcePath, linkPath });
      continue;
    }
    if (fs.existsSync(linkPath)) {
      results.push({ name, status: "conflict", sourcePath, linkPath });
      continue;
    }
    if (check) {
      results.push({ name, status: "missing", sourcePath, linkPath });
      continue;
    }

    fs.symlinkSync(sourcePath, linkPath, process.platform === "win32" ? "junction" : "dir");
    results.push({ name, status: "installed", sourcePath, linkPath });
  }

  return {
    targetDir,
    healthy: results.every((entry) => entry.status === "current" || entry.status === "installed"),
    results
  };
}

export function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const report = reconcileCodexSkillLinks(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    for (const result of report.results) {
      process.stdout.write(`${result.name}: ${result.status} -> ${result.linkPath}\n`);
    }
  }
  if (!report.healthy) {
    process.exitCode = 1;
  }
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
