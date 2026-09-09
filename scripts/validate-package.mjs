#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function validatePackage(root) {
  const errors = [];
  const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
  const claude = JSON.parse(read(".claude-plugin/plugin.json"));
  const codex = JSON.parse(read(fs.existsSync(path.join(root, ".codex-plugin/plugin.json")) ? ".codex-plugin/plugin.json" : "templates/codex-plugin.json"));
  if (claude.version !== codex.version) errors.push("Claude/Codex versions differ");
  if (!read("templates/feature-lifecycle.md").includes(`managed-start version=${codex.version}`)) errors.push("Lifecycle version differs");
  if (!read("scripts/workload-manifest.mjs").includes(`WORKFLOW_KIT_VERSION = "${codex.version}"`)) errors.push("Manifest helper version differs");
  const names = new Set();
  for (const directory of fs.readdirSync(path.join(root, "skills"))) {
    const file = path.join(root, "skills", directory, "SKILL.md");
    if (!fs.existsSync(file)) continue;
    const body = fs.readFileSync(file, "utf8");
    const name = body.match(/^name:\s*([a-z0-9-]+)\s*$/m)?.[1];
    if (!name || names.has(name)) errors.push(`Missing/duplicate skill name: ${directory}`);
    names.add(name);
    if (!/^description:\s*\S/m.test(body)) errors.push(`Missing description: ${directory}`);
    const metadata = path.join(root, "skills", directory, "agents", "openai.yaml");
    if (!fs.existsSync(metadata)) errors.push(`Missing Codex metadata: ${directory}`);
    else {
      const yaml = fs.readFileSync(metadata, "utf8");
      if (!yaml.includes(`$${name}`)) errors.push(`Wrong default_prompt: ${directory}`);
      if (/disable-model-invocation: true/.test(body) && !/allow_implicit_invocation: false/.test(yaml)) errors.push(`Invocation policy differs: ${directory}`);
    }
  }
  // Inspect actual relative dependencies, including references outside a skill folder.
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (/\.(md|mjs)$/.test(entry.name)) {
        const content = fs.readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
        const references = [...content.matchAll(/(?:from\s+["']|\]\(|`)((?:\.\.\/|\.\/)[^\s"'`)#]+\.(?:md|mjs|json|html))/g)];
        for (const match of references) if (!fs.existsSync(path.resolve(path.dirname(file), match[1]))) errors.push(`Missing dependency ${match[1]} in ${path.relative(root, file)}`);
      }
    }
  }
  visit(path.join(root, "skills"));
  visit(path.join(root, "scripts"));
  return { valid: errors.length === 0, version: codex.version, skills: names.size, errors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = validatePackage(root);
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}
