#!/usr/bin/env node
// Optional real-CLI smoke test. Install skills@latest into a temporary tool home,
// then pass its bin/cli.mjs path. No global skills or live tracker writes.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const cli = process.argv[2];
if (!cli || !fs.existsSync(cli)) throw new Error("Usage: node scripts/test-skills-cli.mjs <skills-package/bin/cli.mjs>");
const root = path.resolve(import.meta.dirname, "..");
const source = process.argv[3] ?? root;
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-skills-smoke-"));
const home = path.join(temporary, "home");
fs.mkdirSync(home);
const env = { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(home, ".codex"), XDG_CONFIG_HOME: path.join(home, ".config"), APPDATA: path.join(home, "AppData/Roaming"), LOCALAPPDATA: path.join(home, "AppData/Local"), DISABLE_TELEMETRY: "1", DO_NOT_TRACK: "1", CI: "1" };
function run(args, cwd) {
  const result = spawnSync(process.execPath, [path.resolve(cli), ...args], { cwd, env, encoding: "utf8", windowsHide: true, timeout: 120000 });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  return result.stdout.replace(/\x1b\[[0-9;]*m/g, "");
}
try {
  const listing = run(["add", source, "--list"], temporary);
  const catalog = JSON.parse(fs.readFileSync(path.join(root, "catalog.json"), "utf8"));
  assert.match(listing, new RegExp(`Found ${Object.keys(catalog.skills).length} skills`));
  for (const host of ["codex", "claude-code"]) {
    for (const copy of [true, false]) {
      const project = path.join(temporary, `${host}-${copy ? "copy" : "link"}`);
      fs.mkdirSync(project);
      run(["add", source, "--skill", "grill-me", "orchestrate-queue", "--agent", host, "--yes", ...(copy ? ["--copy"] : [])], project);
      const hostSkills = path.join(project, host === "codex" ? ".agents/skills" : ".claude/skills");
      assert.deepEqual(fs.readdirSync(hostSkills).sort(), ["grill-me", "orchestrate-queue"]);
      assert.ok(fs.existsSync(path.join(hostSkills, "grill-me/bundled/skills/grill-with-docs/references/interview.md")));
      const helper = spawnSync(process.execPath, [path.join(hostSkills, "orchestrate-queue/scripts/workload-manifest.mjs"), "pair", "--pair", "cross", "--implementer", "astra"], { cwd: project, env, encoding: "utf8", windowsHide: true });
      assert.equal(helper.status, 0, helper.stderr);
      assert.equal(JSON.parse(helper.stdout).reviewProvider, "claude");
      console.log(`Passed ${host}, ${copy ? "copy" : "default symlink/fallback"}: selected skills only, bundled interview and executable helper.`);
    }
  }
} finally {
  assert.equal(path.dirname(temporary), path.resolve(os.tmpdir()));
  fs.rmSync(temporary, { recursive: true, force: true });
}
