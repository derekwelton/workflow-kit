import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { checkManagedVersion } from "../scripts/managed-version.mjs";

test("managed drift distinguishes stale, newer, unstamped, absent, and ambiguous contracts without writes", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-version-"));
  try {
    const installed = checkManagedVersion({ cwd }).installed;
    assert.equal(checkManagedVersion({ cwd }).status, "missing");
    const file = path.join(cwd, "feature-lifecycle.md");
    for (const [version, status] of [["0.0.1", "stale"], [installed, "current"], ["999.0.0", "newer"], ["bad", "unknown"], [null, "unstamped"]]) {
      const text = version ? `<!-- workflow-kit:managed-start version=${version} -->\nlocal rules\n` : "local rules\n";
      fs.writeFileSync(file, text);
      const result = checkManagedVersion({ cwd });
      assert.equal(result.status, status);
      assert.equal(fs.readFileSync(file, "utf8"), text);
      if (status === "stale") assert.match(result.message, /workflow-update.*0.0.1 ->/);
      if (status === "newer") assert.match(result.message, /do not downgrade/);
    }
    fs.mkdirSync(path.join(cwd, "docs"));
    fs.writeFileSync(path.join(cwd, "docs/feature-lifecycle.md"), "custom");
    assert.equal(checkManagedVersion({ cwd }).status, "ambiguous");
    assert.equal(checkManagedVersion({ cwd, lifecycle: "docs/feature-lifecycle.md" }).status, "unstamped");
    assert.equal(checkManagedVersion({ cwd, lifecycle: "absent.md" }).status, "missing");
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});
