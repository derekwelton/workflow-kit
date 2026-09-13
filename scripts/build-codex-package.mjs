#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderPortable, skillPathPreamble } from "./lib/portable-contract.mjs";
import { buildSkillBundles } from "./build-skill-bundles.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "plugins", "workflow-kit");
const check = process.argv.includes("--check");
buildSkillBundles(root, { check });
const expected = new Map();
const readText = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const portablePath = path.join(root, "templates", "feature-lifecycle-portable.md");
const portable = renderPortable(root);
if (check) {
  if (!fs.existsSync(portablePath) || readText(portablePath) !== portable) throw new Error("Portable contract drift; run build-codex-package.mjs");
} else fs.writeFileSync(portablePath, portable);
function collect(relative) {
  const source = path.join(root, relative);
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) collect(name);
    else {
      let content = readText(path.join(root, name));
      if (entry.name === "SKILL.md") {
        // Standard installer updates scan the whole repository for duplicate
        // names. These native-plugin copies are internal; root skills are public.
        if (/^metadata:/m.test(content)) throw new Error(`Merge internal discovery metadata explicitly: ${name}`);
        content = content.replace("\n---", "\nmetadata:\n  internal: true\n---");
        // Claude controls invocation in frontmatter; Codex uses agents/openai.yaml.
        content = content.replace(/^disable-model-invocation: true\r?\n/gm, "");
        content = content.replace(`\n\n${skillPathPreamble}\n`, "");
        const frontmatterEnd = content.indexOf("\n---", 4) + 4;
        content = content.slice(0, frontmatterEnd) + `\n\n${skillPathPreamble}\n` + content.slice(frontmatterEnd);
      }
      expected.set(name, content);
    }
  }
}
collect("skills");
collect("templates");
for (const file of ["workload-manifest.mjs", "managed-version.mjs", "validate-package.mjs", "install-codex-skills.mjs", "refresh-lifecycle.mjs"]) expected.set(path.join("scripts", file), readText(path.join(root, "scripts", file)));
collect("scripts/lib");
for (const file of ["install-skills.mjs"]) expected.set(path.join("scripts", file), readText(path.join(root, "scripts", file)));
for (const file of ["catalog.json", "UPSTREAM.md"]) expected.set(file, readText(path.join(root, file)));
expected.set(path.join(".codex-plugin", "plugin.json"), readText(path.join(root, "templates/codex-plugin.json")));
expected.set(path.join(".claude-plugin", "plugin.json"), readText(path.join(root, ".claude-plugin/plugin.json")));
for (const [relative, content] of expected) {
  const target = path.join(output, relative);
  if (check) {
    if (!fs.existsSync(target) || readText(target) !== content) throw new Error(`Generated package drift: ${relative}`);
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
}
function inspect(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      inspect(file);
      if (!check && fs.readdirSync(file).length === 0) fs.rmdirSync(file);
    }
    else if (!expected.has(path.relative(output, file))) {
      if (check) throw new Error(`Unexpected generated file: ${file}`);
      // Output is exclusively generated and confined to this fixed package root.
      if (!path.resolve(file).startsWith(output + path.sep)) throw new Error("Generated path escaped output");
      fs.unlinkSync(file);
    }
  }
}
inspect(output);
console.log(`${check ? "Verified" : "Generated"} ${expected.size} Codex package files. Edit root sources, then regenerate.`);
