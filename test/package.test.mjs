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
