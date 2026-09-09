#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "plugins", "workflow-kit");
const check = process.argv.includes("--check");
const expected = new Map();
function collect(relative) {
  const source = path.join(root, relative);
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) collect(name);
    else {
      let content = fs.readFileSync(path.join(root, name), "utf8");
      if (entry.name === "SKILL.md") {
        // Claude controls invocation in frontmatter; Codex uses agents/openai.yaml.
        content = content.replace(/^disable-model-invocation: true\r?\n/gm, "");
        const frontmatterEnd = content.indexOf("\n---", 4) + 4;
        content = content.slice(0, frontmatterEnd) + "\n\nResolve this skill's real filesystem path before following relative references.\nThe package root is two directories above this SKILL.md; retain its sibling\nskills, scripts, and templates together.\n" + content.slice(frontmatterEnd);
      }
      expected.set(name, content);
    }
  }
}
collect("skills");
collect("templates");
for (const file of ["workload-manifest.mjs", "workflow-doctor.mjs", "managed-version.mjs", "validate-package.mjs", "install-codex-skills.mjs", "sync-codex-policy.mjs"]) expected.set(path.join("scripts", file), fs.readFileSync(path.join(root, "scripts", file), "utf8"));
collect("scripts/lib");
expected.set(path.join(".codex-plugin", "plugin.json"), fs.readFileSync(path.join(root, "templates/codex-plugin.json"), "utf8"));
expected.set(path.join(".claude-plugin", "plugin.json"), fs.readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf8"));
for (const [relative, content] of expected) {
  const target = path.join(output, relative);
  if (check) {
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== content) throw new Error(`Generated package drift: ${relative}`);
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
}
function inspect(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) inspect(file);
    else if (!expected.has(path.relative(output, file))) throw new Error(`Unexpected generated file (remove explicitly after review): ${file}`);
  }
}
inspect(output);
console.log(`${check ? "Verified" : "Generated"} ${expected.size} Codex package files. Edit root sources, then regenerate.`);
