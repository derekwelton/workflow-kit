#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseline = process.argv[2] ?? "db7fde95c5c9832fc8f20c6b547aef838c3592dc";
const skill = name => `skills/${name}/SKILL.md`;
const lifecycle = "templates/feature-lifecycle.md";
const scope = "templates/lifecycle-contract.md";
const contract = "skills/orchestrate/references/workload-contract.md";
const preflight = "skills/workflow-doctor/references/preflight.md";
const count = text => [...text.replace(/\r\n/g, "\n")].length;
const cache = new Map();
function read(file, before) {
  const key = `${before}:${file}`;
  if (!cache.has(key)) {
    if (!before) cache.set(key, fs.readFileSync(path.join(root, file), "utf8"));
    else {
      const result = spawnSync("git", ["show", `${baseline}:${file}`], { cwd: root, encoding: "utf8", windowsHide: true });
      if (result.status) throw new Error(result.stderr);
      cache.set(key, result.stdout);
    }
  }
  return cache.get(key);
}
const commonBefore = [lifecycle];
const commonAfter = [lifecycle, scope];
const workload = [skill("orchestrate"), contract, skill("model-routing"), preflight];
const profiles = [
  ["board status", [skill("board"), skill("present"), skill("update-issue")], [skill("board")]],
  ["one-line fix through review dispatch", ["implement", "update-issue", "ponytail", "tdd", "code-review", "model-routing"].map(skill), [...["implement", "update-issue", "ponytail", "tdd", "code-review", "model-routing"].map(skill), "templates/tracker-write.md", "skills/code-review/references/providers.md", "skills/code-review/references/standards.md"]],
  ["short documentation lookup", ["research", "model-routing", "new-feature", "update-issue"].map(skill), [skill("research")]],
  ["personal research report in chat", ["research", "model-routing", "new-feature", "update-issue", "present"].map(skill), [skill("research")]],
  ["Linear workload initial reconciliation / resume", [...workload, skill("linear-mode")], [...workload, skill("linear-mode")]],
  ["Linear two-issue run through conflict/handoff policy", [...workload, skill("linear-mode"), "skills/orchestrate/references/worker-prompt.md"], [...workload, skill("linear-mode"), "templates/tracker-write.md", "skills/linear-mode/references/write.md", "skills/linear-mode/references/status.md", "skills/linear-mode/references/intake.md", "skills/orchestrate/references/commands.md", "skills/orchestrate/references/worker-prompt.md", "skills/orchestrate/references/worker-envelope.md"]],
  ["wrap accepted and merged issue", [skill("wrap-feature"), skill("update-issue")], [skill("wrap-feature"), skill("update-issue"), "templates/tracker-write.md"]],
];
const results = profiles.map(([scenario, beforeFiles, afterFiles]) => {
  const before = [...new Set([...commonBefore, ...beforeFiles])];
  const after = [...new Set([...commonAfter, ...afterFiles])];
  return { scenario, beforeChars: before.reduce((n, p) => n + count(read(p, true)), 0), afterChars: after.reduce((n, p) => n + count(read(p, false)), 0), beforeFiles: before, afterFiles: after };
});
const descriptions = before => fs.readdirSync(path.join(root, "skills")).reduce((n, name) => {
  const file = skill(name);
  if (!fs.existsSync(path.join(root, file))) return n;
  const text = read(file, before).replace(/\r\n/g, "\n");
  return n + count(text.match(/^description: ([^\n]*(?:\n[ \t]+[^\n]*)*)/m)?.[1] ?? "");
}, 0);
console.log(JSON.stringify({ baseline, units: "Unicode characters, LF normalized; unique source files for explicit replay profiles, not tokens", exclusions: "repository overrides, code/tracker contents, HTML assets, worker repeated context; later conditional phases shown separately", descriptions: { all30Before: descriptions(true), all30After: descriptions(false) }, results }, null, 2));
