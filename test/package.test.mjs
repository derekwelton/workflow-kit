import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";
import { validatePackage } from "../scripts/validate-package.mjs";
const root = fileURLToPath(new URL("..", import.meta.url));

test("native package runs independently of the source repository", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-package-"));
  try {
    const installed = path.join(temporary, "plugin");
    fs.cpSync(path.join(root, "plugins", "workflow-kit"), installed, { recursive: true });
    assert.deepEqual(validatePackage(installed).errors, []);
    const result = spawnSync(process.execPath, [path.join(installed, "skills", "orchestrate", "scripts", "workload-manifest.mjs"), "pair", "--pair", "cross", "--implementer", "astra"], { cwd: temporary, encoding: "utf8", windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).reviewProvider, "claude");
    fs.unlinkSync(path.join(installed, "scripts", "workload-manifest.mjs"));
    assert.throws(() => validatePackage(installed), /ENOENT/);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

test("linked installed aliases resolve full dependencies and reject an incomplete package", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "workflow installed paths "));
  try {
    const installed = path.join(temporary, "plugin source");
    const target = path.join(temporary, "user skills");
    fs.cpSync(path.join(root, "plugins", "workflow-kit"), installed, { recursive: true });
    const script = path.join(installed, "scripts/install-codex-skills.mjs");
    const run = (...args) => spawnSync(process.execPath, [script, "--target-dir", target, "--json", ...args], { cwd: temporary, encoding: "utf8", windowsHide: true });
    assert.equal(JSON.parse(run().stdout).healthy, true);
    for (const name of ["orchestrate-queue", "integrate-reviewed", "workflow-doctor"]) {
      const publicFile = path.join(target, name, "SKILL.md");
      const source = fs.realpathSync(publicFile);
      const body = fs.readFileSync(publicFile, "utf8");
      assert.match(body, /Resolve this skill's real filesystem path/);
      for (const reference of body.matchAll(/`((?:\.\.\/)[^`]+\.(?:md|mjs))`/g)) {
        assert.equal(fs.existsSync(path.resolve(path.dirname(source), reference[1])), true, `${name}: ${reference[1]}`);
      }
    }
    assert.equal(JSON.parse(run("--check").stdout).healthy, true);
    assert.equal(JSON.parse(run("--check").stdout).healthy, true);
    fs.unlinkSync(path.join(installed, "skills/orchestrate/references/workload-contract.md"));
    const missing = run("--check");
    assert.equal(missing.status, 1);
    const report = JSON.parse(missing.stdout);
    assert.equal(report.healthy, false);
    assert.match(report.packageCheck.errors.join("\n"), /workload-contract.md/);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

test("generated parity survives Windows CRLF checkouts", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-crlf-"));
  try {
    for (const name of ["skills", "scripts", "templates", ".claude-plugin", "plugins"]) {
      fs.cpSync(path.join(root, name), path.join(temporary, name), { recursive: true });
    }
    function crlf(directory) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) crlf(file);
        else fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/\r?\n/g, "\r\n"));
      }
    }
    crlf(temporary);
    const checked = spawnSync(process.execPath, [path.join(temporary, "scripts/build-codex-package.mjs"), "--check"], { encoding: "utf8", windowsHide: true });
    assert.equal(checked.status, 0, checked.stderr);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});
