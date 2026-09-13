#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaults = [".ai/workflows/feature-lifecycle.md", "docs/feature-lifecycle.md", ".claude/feature-lifecycle.md", "feature-lifecycle.md"];

export function checkManagedVersion({ cwd = process.cwd(), lifecycle, pluginRoot = packageRoot } = {}) {
  const git = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", windowsHide: true });
  const repo = git.status === 0 ? git.stdout.trim() : path.resolve(cwd);
  const installed = JSON.parse(fs.readFileSync(path.join(pluginRoot, ".claude-plugin/plugin.json"), "utf8")).version;
  const candidates = lifecycle ? [path.resolve(repo, lifecycle)] : defaults.map(f => path.join(repo, f));
  const found = candidates.filter(f => fs.existsSync(f));
  if (found.length > 1) return { status: "ambiguous", installed, message: "Multiple lifecycle docs found; pass --lifecycle with the repository's canonical path." };
  if (!found.length) return { status: "missing", installed, message: lifecycle ? "Configured lifecycle file is missing; reconcile the repository contract." : "No legacy lifecycle doc found. Project-local skills do not require one." };
  const file = found[0];
  const managed = fs.readFileSync(file, "utf8").match(/workflow-kit:managed-start version=([^\s>]+)/)?.[1] ?? null;
  const parse = v => /^\d+\.\d+\.\d+$/.test(v ?? "") ? v.split(".").map(Number) : null;
  const current = parse(managed), target = parse(installed);
  if (!target || (managed && !current)) return { status: "unknown", managed, installed, file, message: "Unrecognized version stamp; inspect before refreshing." };
  const comparison = current ? current.reduce((result, part, i) => result || Math.sign(part - target[i]), 0) : -1;
  const status = !current ? "unstamped" : comparison < 0 ? "stale" : comparison > 0 ? "newer" : "current";
  const message = ["stale", "unstamped"].includes(status)
    ? `Review the legacy migration guide before an explicit refresh (${managed ?? "unstamped"} -> ${installed}).`
    : status === "newer" ? `Repository lifecycle ${managed} is newer than this package ${installed}; refresh the machine plugin first, do not downgrade the repository.`
    : `Repository lifecycle and this package match (${installed}); loaded session version is not verified.`;
  return { status, managed, installed, file, message };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2), options = {}; let json = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--json") json = true;
      else if (["--cwd", "--lifecycle"].includes(args[i]) && args[i + 1] && !args[i + 1].startsWith("--")) options[args[i].slice(2)] = args[++i];
      else throw new Error("Usage: managed-version.mjs [--cwd <repo>] [--lifecycle <path>] [--json]");
    }
    const result = checkManagedVersion(options);
    console.log(json ? JSON.stringify(result, null, 2) : result.message);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
