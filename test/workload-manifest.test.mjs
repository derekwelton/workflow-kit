import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { reconcileCodexSkillLinks } from "../scripts/install-codex-skills.mjs";
import { reviewerFor, slugify, validateManifest } from "../scripts/workload-manifest.mjs";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const SCRIPT = path.join(ROOT, "scripts", "workload-manifest.mjs");

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function run(cwd, ...args) {
  return spawnSync(process.execPath, [SCRIPT, ...args, "--cwd", cwd], {
    cwd,
    encoding: "utf8",
    windowsHide: true
  });
}

function withRepository(callback, { branch = "main" } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-kit-test-"));
  try {
    git(directory, "init", "-b", branch);
    fs.writeFileSync(path.join(directory, "seed.txt"), "seed\n", "utf8");
    git(directory, "add", "seed.txt");
    git(directory, "-c", "user.name=Workflow Kit Tests", "-c", "user.email=tests@example.invalid", "commit", "-m", "seed");
    git(directory, "remote", "add", "origin", directory);
    git(directory, "update-ref", `refs/remotes/origin/${branch}`, "HEAD");
    git(directory, "symbolic-ref", "refs/remotes/origin/HEAD", `refs/remotes/origin/${branch}`);
    callback(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("normalizes workload names and enforces cross-provider review", () => {
  assert.equal(slugify("Job Status Reliability"), "job-status-reliability");
  assert.equal(reviewerFor("cross", "codex"), "claude");
  assert.equal(reviewerFor("cross", "claude"), "codex");
  assert.equal(reviewerFor("codex-only", "codex"), "codex");
});

test("same-provider pair modes force both providers and cross rejects a self-review pair", () => {
  withRepository((directory) => {
    const codexOnly = run(
      directory,
      "init",
      "--name",
      "Codex Batch",
      "--issues",
      "IRP-1",
      "--pair",
      "codex-only"
    );
    assert.equal(codexOnly.status, 0, codexOnly.stderr);
    const manifest = JSON.parse(codexOnly.stdout).manifest;
    assert.equal(manifest.policy.implementationProvider, "codex");
    assert.equal(manifest.policy.reviewProvider, "codex");

    const invalid = run(
      directory,
      "init",
      "--name",
      "Invalid Cross",
      "--issues",
      "IRP-2",
      "--pair",
      "cross",
      "--implementer",
      "codex",
      "--reviewer",
      "codex"
    );
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /cross requires different providers/);
  });
});

test("creates one manifest shared through the git common directory", () => {
  withRepository((directory) => {
    const init = run(
      directory,
      "init",
      "--name",
      "Bug Sweep",
      "--issues",
      "IRP-1,IRP-2",
      "--labels",
      "Bug",
      "--implementer",
      "codex"
    );
    assert.equal(init.status, 0, init.stderr);
    const payload = JSON.parse(init.stdout);
    assert.equal(payload.manifest.id, "bug-sweep");
    assert.equal(payload.manifest.policy.reviewProvider, "claude");
    assert.match(payload.filePath, /workflow-kit[\\/]runs[\\/]bug-sweep\.json$/);

    const show = run(directory, "show", "--run", "bug-sweep");
    assert.equal(show.status, 0, show.stderr);
    assert.equal(JSON.parse(show.stdout).manifest.issues.length, 2);
  });
});

test("detects a non-main default branch from origin HEAD", () => {
  withRepository(
    (directory) => {
      const init = run(directory, "init", "--name", "Trunk Batch", "--issues", "IRP-1");
      assert.equal(init.status, 0, init.stderr);
      assert.equal(JSON.parse(init.stdout).manifest.repository.baseRef, "origin/trunk");
    },
    { branch: "trunk" }
  );
});

test("integration-ready validation requires reviewed issues and a complete branch receipt", () => {
  const manifest = {
    schemaVersion: 1,
    id: "batch",
    name: "Batch",
    policy: { pairMode: "cross" },
    issues: [
      {
        key: "IRP-1",
        state: "in-review",
        headSha: "abc",
        implementationProvider: "codex",
        reviewProvider: "claude",
        reviewReceipt: "receipt",
        tests: "passed"
      }
    ],
    integration: {
      state: "ready-for-human-review",
      baseSha: "base",
      headSha: "head",
      pullRequest: "https://example.invalid/pr/1",
      tests: "passed"
    }
  };
  assert.deepEqual(validateManifest(manifest), []);

  manifest.issues[0].reviewProvider = "codex";
  assert.match(validateManifest(manifest).join("\n"), /different review provider/);
});

test("integration-ready validation requires review of actual conflict resolutions", () => {
  const manifest = {
    schemaVersion: 1,
    id: "conflicted-batch",
    name: "Conflicted Batch",
    policy: { pairMode: "cross" },
    issues: [
      {
        key: "IRP-1",
        state: "in-review",
        headSha: "abc",
        implementationProvider: "codex",
        reviewProvider: "claude",
        reviewReceipt: "receipt",
        tests: "passed"
      }
    ],
    integration: {
      state: "ready-for-human-review",
      baseSha: "base",
      headSha: "head",
      pullRequest: "https://example.invalid/pr/1",
      tests: "passed",
      conflictsOccurred: true,
      conflictResolutionReviewed: false
    }
  };
  assert.match(validateManifest(manifest).join("\n"), /conflict resolutions require/);
  manifest.integration.conflictResolutionReviewed = true;
  assert.deepEqual(validateManifest(manifest), []);
});

test("Codex skill installer creates stable links and is idempotent", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-kit-skills-"));
  const targetDir = path.join(root, "skills");
  try {
    const installed = reconcileCodexSkillLinks({ targetDir });
    assert.equal(installed.healthy, true);
    assert.deepEqual(
      installed.results.map((entry) => entry.status),
      ["installed", "installed", "installed"]
    );
    const checked = reconcileCodexSkillLinks({ targetDir, check: true });
    assert.equal(checked.healthy, true);
    assert.deepEqual(
      checked.results.map((entry) => entry.status),
      ["current", "current", "current"]
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
