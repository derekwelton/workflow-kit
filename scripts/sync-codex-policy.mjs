#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2];
if (!target) throw new Error("Usage: node scripts/sync-codex-policy.mjs <codex-kit-root> [--check]");
const destination = path.resolve(target);
const manifest = JSON.parse(fs.readFileSync(path.join(destination, ".claude-plugin/plugin.json"), "utf8"));
if (manifest.name !== "codex") throw new Error("Target must be the codex-kit plugin root.");
for (const relative of ["scripts/lib/model-policy.mjs", "skills/model-routing/SKILL.md"]) {
  const source = fs.readFileSync(path.join(root, relative));
  const output = path.join(destination, relative);
  if (process.argv.includes("--check")) {
    if (!fs.existsSync(output) || !source.equals(fs.readFileSync(output))) throw new Error(`Policy drift: ${relative}`);
  } else {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, source);
  }
}
console.log(process.argv.includes("--check") ? "Codex policy is current." : "Codex policy synchronized.");
