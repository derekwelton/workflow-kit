#!/usr/bin/env node
// Source character counts only: not observed host context, token or billing data.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "catalog.json"), "utf8"));
const skills = Object.keys(catalog.skills).sort().map(name => {
  const source = fs.readFileSync(path.join(root, "skills", name, "SKILL.md"), "utf8").replace(/\r\n/g, "\n");
  const metadata = fs.readFileSync(path.join(root, "skills", name, "agents/openai.yaml"), "utf8");
  return { name, explicitOnly: /allow_implicit_invocation: false/.test(metadata), entrypointChars: [...source].length,
    descriptionChars: [...(source.match(/^description: (.*)$/m)?.[1] ?? "")].length };
});
console.log(JSON.stringify({ note: "Source characters, not actual host context or token savings. Explicit-only descriptions may be filtered by the host; references load conditionally.",
  count: skills.length, explicitOnly: skills.filter(s => s.explicitOnly).length, skills }, null, 2));
