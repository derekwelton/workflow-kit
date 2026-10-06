#!/usr/bin/env node
// Source character counts only: not observed host context, token or billing data.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fileReferences } from "./build-skill-bundles.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

// Instruction files an invocation can reach by following Markdown references from
// SKILL.md inside the installed folder. Conditional references count, so this is
// an upper bound; invoked sibling skills and bundled/dependencies.md are measured
// as their own entrypoints.
export function reachableInstructions(skillRoot) {
  const seen = new Map();
  const queue = [path.join(skillRoot, "SKILL.md")];
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    const content = read(file);
    seen.set(file, [...content].length);
    for (const [reference] of content.matchAll(fileReferences)) {
      if (!reference.endsWith(".md") || reference.endsWith("bundled/dependencies.md")) continue;
      const target = [path.resolve(path.dirname(file), reference), path.resolve(skillRoot, reference)]
        .find(candidate => candidate.startsWith(skillRoot + path.sep) && fs.existsSync(candidate));
      if (target) queue.push(target);
    }
  }
  return seen;
}

export function measureSkills(sourceRoot = root) {
  const catalog = JSON.parse(read(path.join(sourceRoot, "catalog.json")));
  return Object.keys(catalog.skills).sort().map(name => {
    const skillRoot = path.join(sourceRoot, "skills", name);
    const source = read(path.join(skillRoot, "SKILL.md"));
    const metadata = read(path.join(skillRoot, "agents/openai.yaml"));
    const reachable = reachableInstructions(skillRoot);
    return { name, explicitOnly: /allow_implicit_invocation: false/.test(metadata), entrypointChars: [...source].length,
      descriptionChars: [...(source.match(/^description: (.*)$/m)?.[1] ?? "")].length,
      reachableChars: [...reachable.values()].reduce((sum, chars) => sum + chars, 0),
      reachableFiles: [...reachable.keys()].map(file => path.relative(skillRoot, file).split(path.sep).join("/")) };
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const skills = measureSkills();
  console.log(JSON.stringify({ note: "Source characters, not actual host context or token savings. Explicit-only descriptions may be filtered by the host; reachableChars counts conditional references as an upper bound.",
    count: skills.length, explicitOnly: skills.filter(s => s.explicitOnly).length, skills }, null, 2));
}
