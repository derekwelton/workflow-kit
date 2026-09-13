import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { buildSkillBundles, fileReferences } from "../scripts/build-skill-bundles.mjs";

const root = path.resolve(import.meta.dirname, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "catalog.json"), "utf8"));

test("every single skill folder is portable without sibling skills or repository helpers", t => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-bundles-"));
  t.after(() => {
    assert.equal(path.dirname(temporary), path.resolve(os.tmpdir()));
    fs.rmSync(temporary, { recursive: true, force: true });
  });
  for (const name of Object.keys(catalog.skills)) {
    const installed = path.join(temporary, name);
    fs.cpSync(path.join(root, "skills", name), installed, { recursive: true });
    const entrypoints = [];
    function inspect(directory) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) { inspect(file); continue; }
        if (entry.name === "SKILL.md") entrypoints.push(file);
        if (!/\.(md|mjs)$/.test(file) || entry.name === "UPSTREAM.md") continue;
        const content = fs.readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
        for (const match of content.matchAll(fileReferences)) {
          if (!match[0].startsWith(".") && !match[0].startsWith("bundled/")) continue;
          const target = path.resolve(path.dirname(file), match[0]);
          assert.ok(target.startsWith(installed + path.sep), `${name}: escaping ${match[0]} in ${file}`);
          assert.ok(fs.existsSync(target), `${name}: missing ${match[0]} in ${file}`);
        }
      }
    }
    inspect(installed);
    assert.deepEqual(entrypoints, [path.join(installed, "SKILL.md")]);
  }
  const ran = spawnSync(process.execPath, [path.join(temporary, "orchestrate/scripts/workload-manifest.mjs"), "pair", "--pair", "cross", "--implementer", "astra"], { cwd: temporary, encoding: "utf8", windowsHide: true });
  assert.equal(ran.status, 0, ran.stderr);
  assert.equal(JSON.parse(ran.stdout).reviewProvider, "claude");
});

test("bundles are reproducible from canonical owners", () => {
  assert.ok(buildSkillBundles(root, { check: true }) > 0);
});
