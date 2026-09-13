import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import test from "node:test";
import { installSkills, projectPayload } from "../scripts/install-skills.mjs";

const root = path.resolve(import.meta.dirname, "..");
function fixture(run) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), "workflow project "));
  try { return run(project); } finally { fs.rmSync(project, { recursive: true, force: true }); }
}
const read = (project, file) => fs.readFileSync(path.join(project, file), "utf8");

test("source and generated downloads produce identical project files for both hosts", () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, "catalog.json"), "utf8"));
  for (const host of ["codex", "claude"]) {
    const options = { host, selected: Object.keys(catalog.skills), catalog };
    assert.deepEqual(projectPayload({ ...options, root: path.join(root, "plugins/workflow-kit") }), projectPayload({ ...options, root }));
  }
});
function snapshot(directory) {
  const files = {};
  function visit(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(file); else files[path.relative(directory, file)] = fs.readFileSync(file).toString("base64");
  } }
  visit(directory); return files;
}

test("install-all copies 23 skills for both hosts and preserves explicit activation", () => fixture(project => {
  fs.writeFileSync(path.join(project, "AGENTS.md"), "Owner rules\n");
  const result = installSkills({ project, host: "both", all: true });
  for (const host of ["codex", "claude"]) assert.equal(result.selections[host].included.length, 23);
  assert.equal(read(project, "AGENTS.md"), "Owner rules\n");
  assert.match(read(project, ".claude/skills/triage/SKILL.md"), /disable-model-invocation: true/);
  assert.doesNotMatch(read(project, ".agents/skills/triage/SKILL.md"), /disable-model-invocation:/);
  assert.match(read(project, ".agents/skills/triage/agents/openai.yaml"), /allow_implicit_invocation: false/);
  assert.match(read(project, ".agents/skills/orchestrate-queue/agents/openai.yaml"), /allow_implicit_invocation: false/);
  assert.match(read(project, ".claude/skills/ponytail-audit/SKILL.md"), /disable-model-invocation: true/);
  assert.doesNotMatch(read(project, ".agents/skills/wizard/agents/openai.yaml"), /allow_implicit_invocation: false/);
  assert.ok(fs.existsSync(path.join(project, ".agents/skills/wizard/template.sh")));
  assert.ok(!fs.existsSync(path.join(project, ".agents/skills/workflow-init")));
  assert.ok(!fs.existsSync(path.join(project, ".agents/skills/setup-matt-pocock-skills")));
  assert.ok(!fs.existsSync(path.join(project, "feature-lifecycle.md")));
  assert.equal(installSkills({ project, host: "both", check: true }).changes.length, 0);
}));

test("selective install includes declared dependencies without unrelated tracker adapters", () => fixture(project => {
  const result = installSkills({ project, skills: ["tdd"] });
  assert.deepEqual(result.selections.codex.included, ["codebase-design", "tdd"]);
  assert.deepEqual(result.selections.codex.dependencies, ["codebase-design"]);
  assert.ok(!fs.existsSync(path.join(project, ".agents/skills/linear-mode")));
  assert.ok(!fs.existsSync(path.join(project, ".agents/workflow-kit/templates/lifecycle-contract.md")));
  const additional = installSkills({ project, skills: ["wizard"] });
  assert.deepEqual(additional.selections.codex.included, ["codebase-design", "tdd", "wizard"]);
}));

test("every individual skill installs with a valid declared dependency closure", () => fixture(project => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, "catalog.json"), "utf8"));
  for (const name of Object.keys(catalog.skills)) {
    const target = path.join(project, name); fs.mkdirSync(target);
    installSkills({ project: target, skills: [name] });
    assert.equal(installSkills({ project: target, check: true }).healthy, true, name);
    for (const [file, encoded] of Object.entries(snapshot(target))) {
      if (!/\.(md|mjs)$/.test(file)) continue;
      const text = Buffer.from(encoded, "base64").toString("utf8").replace(/```[\s\S]*?```/g, "");
      for (const reference of text.matchAll(/(?:\.\.\/|\.\/)+(?:[\w.-]+\/)*[\w.-]+\.(?:md|mjs|json|html)/g)) {
        assert.ok(fs.existsSync(path.resolve(target, path.dirname(file), reference[0])), `${file}: ${reference[0]}`);
      }
    }
  }
}));

test("copied orchestrator runs after relocation without the installation source", () => fixture(project => {
  const source = path.join(project, "download"), consumer = path.join(project, "consumer"), moved = path.join(project, "moved consumer");
  fs.cpSync(path.join(root, "plugins/workflow-kit"), source, { recursive: true });
  fs.mkdirSync(consumer);
  installSkills({ project: consumer, skills: ["orchestrate-queue"], root: source });
  fs.renameSync(consumer, moved);
  fs.rmSync(source, { recursive: true, force: true });
  const result = spawnSync(process.execPath, [path.join(moved, ".agents/skills/orchestrate-queue/scripts/workload-manifest.mjs"), "pair", "--pair", "cross", "--implementer", "astra"], { cwd: moved, encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).reviewProvider, "claude");
}));

test("preview and check write nothing; missing and unknown selections fail clearly", () => fixture(project => {
  assert.throws(() => installSkills({ project }), /Choose --all or --skills/);
  assert.throws(() => installSkills({ project, skills: ["missing"] }), /Unknown skill/);
  assert.throws(() => installSkills({ project, all: true, skills: ["tdd"] }), /not both/);
  const before = snapshot(project);
  assert.equal(installSkills({ project, all: true, check: true }).healthy, false);
  const preview = installSkills({ project, skills: ["ponytail"], diff: true, dryRun: true });
  assert.ok(preview.changes.some(change => change.diff?.includes("+++ .agents/skills/ponytail/SKILL.md")));
  assert.deepEqual(snapshot(project), before);
}));

test("local changes block the complete update before any files are written", () => fixture(project => {
  installSkills({ project, skills: ["ponytail"] });
  fs.appendFileSync(path.join(project, ".agents/skills/ponytail/SKILL.md"), "\nLocal customization\n");
  const before = snapshot(project);
  assert.throws(() => installSkills({ project, all: true }), /Local edit or unowned file/);
  assert.deepEqual(snapshot(project), before);
}));

test("unowned skills, linked paths and malicious ownership paths cannot be overwritten", () => fixture(project => {
  const occupied = path.join(project, ".agents/skills/ponytail"); fs.mkdirSync(occupied, { recursive: true });
  fs.writeFileSync(path.join(occupied, "SKILL.md"), "Another skill\n");
  assert.throws(() => installSkills({ project, skills: ["ponytail"] }), /unowned file/);
  assert.equal(read(project, ".agents/skills/ponytail/SKILL.md"), "Another skill\n");
  fs.writeFileSync(path.join(project, ".workflow-skills.json"), JSON.stringify({ schema: 1, hosts: { codex: { requested: ["ponytail"], files: { "../outside": "invalid" } } } }));
  assert.throws(() => installSkills({ project }), /Invalid owned path/);
  fs.writeFileSync(path.join(project, ".workflow-skills.json"), JSON.stringify({ schema: 1, hosts: { codex: { requested: ["ponytail"], files: { ".agents/skills/../../outside": "invalid" } } } }));
  assert.throws(() => installSkills({ project }), /Non-canonical owned path/);
}));

test("directory junctions are rejected without writing through them", () => fixture(project => {
  const outside = path.join(project, "outside"); fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(project, ".agents"), process.platform === "win32" ? "junction" : "dir");
  assert.throws(() => installSkills({ project, skills: ["ponytail"] }), /linked destination/);
  assert.deepEqual(fs.readdirSync(outside), []);
}));

test("updates preserve CRLF installations without false modification conflicts", () => fixture(project => {
  installSkills({ project, skills: ["ponytail"] });
  const file = path.join(project, ".agents/skills/ponytail/SKILL.md");
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/\n/g, "\r\n"));
  assert.equal(installSkills({ project, check: true }).healthy, true);
}));

test("reviewed source updates replace owned files, remove retired owned files, and preserve project additions", () => fixture(project => {
  const source = path.join(project, "download"), consumer = path.join(project, "consumer");
  fs.cpSync(path.join(root, "plugins/workflow-kit"), source, { recursive: true });
  fs.mkdirSync(consumer);
  const retired = "skills/ponytail/old-reference.md";
  fs.writeFileSync(path.join(source, retired), "Old optional reference\n");
  installSkills({ project: consumer, skills: ["ponytail"], root: source });
  fs.writeFileSync(path.join(consumer, ".agents/skills/ponytail/local-notes.md"), "Owner notes\n");
  fs.appendFileSync(path.join(source, "skills/ponytail/SKILL.md"), "\nUpdated upstream guidance\n");
  fs.unlinkSync(path.join(source, retired));
  const before = snapshot(consumer);
  const preview = installSkills({ project: consumer, root: source, diff: true });
  assert.deepEqual(snapshot(consumer), before);
  assert.ok(preview.changes.some(change => change.action === "update" && change.diff?.includes("Updated upstream guidance")));
  assert.ok(preview.changes.some(change => change.action === "remove" && change.path.endsWith("old-reference.md")));
  installSkills({ project: consumer, root: source });
  assert.match(read(consumer, ".agents/skills/ponytail/SKILL.md"), /Updated upstream guidance/);
  assert.equal(read(consumer, ".agents/skills/ponytail/local-notes.md"), "Owner notes\n");
  assert.ok(!fs.existsSync(path.join(consumer, ".agents/skills/ponytail/old-reference.md")));
  assert.equal(installSkills({ project: consumer, root: source, check: true }).healthy, true);
}));
