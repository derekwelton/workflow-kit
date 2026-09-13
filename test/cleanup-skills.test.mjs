import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { installSkills } from "../scripts/install-skills.mjs";

for (const name of ["cleanup-audit", "merge-cleanup", "unslop"]) {
  test(`${name} installs by exact name on both hosts and survives a repeated install`, () => {
    const project = fs.mkdtempSync(path.join(os.tmpdir(), "cleanup-skill-"));
    try {
      const installed = installSkills({ project, host: "both", skills: [name] });
      for (const [host, dir] of [["codex", ".agents"], ["claude", ".claude"]]) {
        assert.ok(installed.selections[host].included.includes(name));
        const read = file => fs.readFileSync(path.join(project, dir, file), "utf8");
        const body = read(`skills/${name}/SKILL.md`);
        const metadata = read(`skills/${name}/agents/openai.yaml`);
        assert.equal(body.includes("disable-model-invocation: true"), host === "claude" && name !== "unslop");
        assert.equal(metadata.includes("allow_implicit_invocation: false"), name !== "unslop");
        if (name !== "unslop") {
          assert.ok(read("workflow-kit/templates/cleanup-owned.md"));
          assert.ok(read("workflow-kit/templates/merge-completion.md"));
          assert.ok(read("workflow-kit/templates/tracker-write.md"));
          // Tracker choice remains a consumer decision, not an implicit installation.
          assert.ok(!installed.selections[host].included.includes("linear-mode"));
        } else {
          assert.deepEqual(installed.selections[host].included, ["unslop"]);
          assert.match(read("workflow-kit/licenses/pstack-LICENSE.txt"), /Copyright.*Lauren Tan/);
        }
      }
      assert.equal(installSkills({ project, host: "both", skills: [name] }).changes.length, 0);
    } finally {
      assert.ok(project.startsWith(path.join(os.tmpdir(), "cleanup-skill-")));
      fs.rmSync(project, { recursive: true, force: true });
    }
  });
}
