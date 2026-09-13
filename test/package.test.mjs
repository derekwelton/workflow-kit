import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import test from "node:test";
import { validatePackage } from "../scripts/validate-package.mjs";
const root = path.resolve(import.meta.dirname, "..");

test("generated compatibility package runs independently and detects missing dependencies", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-package-"));
  try {
    const installed = path.join(temporary, "plugin");
    fs.cpSync(path.join(root, "plugins/workflow-kit"), installed, { recursive: true });
    assert.deepEqual(validatePackage(installed).errors, []);
    const result = spawnSync(process.execPath, [path.join(installed, "skills/orchestrate/scripts/workload-manifest.mjs"), "pair", "--pair", "cross", "--implementer", "astra"], { cwd: temporary, encoding: "utf8", windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).reviewProvider, "claude");
    fs.unlinkSync(path.join(installed, "skills/orchestrate/references/workload-contract.md"));
    assert.match(validatePackage(installed).errors.join("\n"), /workload-contract.md/);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

test("generated parity survives Windows CRLF checkouts", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-crlf-"));
  try {
    for (const name of ["skills", "scripts", "templates", ".claude-plugin", "plugins", "catalog.json", "licenses", "UPSTREAM.md"]) {
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
