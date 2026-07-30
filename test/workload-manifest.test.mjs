import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { reconcileCodexSkillLinks } from "../scripts/install-codex-skills.mjs";
import { reviewerFor, slugify, validateManifest, withFileLock } from "../scripts/workload-manifest.mjs";

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

function runAsync(cwd, ...args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT, ...args, "--cwd", cwd], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("exit", (status) => resolve({ status, stdout, stderr }));
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

async function withRepositoryAsync(callback, { branch = "main" } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-kit-test-"));
  try {
    git(directory, "init", "-b", branch);
    fs.writeFileSync(path.join(directory, "seed.txt"), "seed\n", "utf8");
    git(directory, "add", "seed.txt");
    git(directory, "-c", "user.name=Workflow Kit Tests", "-c", "user.email=tests@example.invalid", "commit", "-m", "seed");
    git(directory, "remote", "add", "origin", directory);
    git(directory, "update-ref", `refs/remotes/origin/${branch}`, "HEAD");
    git(directory, "symbolic-ref", "refs/remotes/origin/HEAD", `refs/remotes/origin/${branch}`);
    return await callback(directory);
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

test("manifest mutations lock, re-read, and refuse incomplete gated states", () => {
  withRepository((directory) => {
    const init = run(directory, "init", "--name", "Guarded Batch", "--issues", "IRP-1");
    assert.equal(init.status, 0, init.stderr);

    const invalidIssue = run(
      directory,
      "set-issue",
      "--run",
      "guarded-batch",
      "--issue",
      "IRP-1",
      "--state",
      "reviewed-pending-integration"
    );
    assert.equal(invalidIssue.status, 1);
    assert.match(invalidIssue.stderr, /Refusing to write an invalid workload manifest/);
    assert.equal(JSON.parse(run(directory, "show", "--run", "guarded-batch").stdout).manifest.issues[0].state, "selected");

    const reviewed = run(
      directory,
      "set-issue",
      "--run",
      "guarded-batch",
      "--issue",
      "IRP-1",
      "--state",
      "in-review",
      "--branch",
      "issue/1",
      "--worktree",
      directory,
      "--base-sha",
      "base",
      "--head-sha",
      "head",
      "--implementer",
      "codex",
      "--reviewer",
      "claude",
      "--review-receipt",
      "receipt",
      "--tests",
      "passed"
    );
    assert.equal(reviewed.status, 0, reviewed.stderr);

    const invalidIntegration = run(
      directory,
      "set-integration",
      "--run",
      "guarded-batch",
      "--state",
      "ready-for-human-review"
    );
    assert.equal(invalidIntegration.status, 1);
    const shown = JSON.parse(run(directory, "show", "--run", "guarded-batch").stdout).manifest;
    assert.equal(shown.integration.state, "pending");
  });
});

test("manifest lock refuses a second writer instead of racing", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-kit-lock-"));
  const filePath = path.join(root, "run.json");
  try {
    withFileLock(filePath, () => {
      assert.throws(
        () => withFileLock(filePath, () => undefined, { timeoutMs: 25, staleMs: 60_000 }),
        /Timed out waiting for workload manifest lock/
      );
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("concurrent issue writers retain both final updates", async () => {
  await withRepositoryAsync(async (directory) => {
    const init = run(directory, "init", "--name", "Concurrent Batch", "--issues", "IRP-1,IRP-2");
    assert.equal(init.status, 0, init.stderr);
    const update = (issue, head) =>
      runAsync(
        directory,
        "set-issue",
        "--run",
        "concurrent-batch",
        "--issue",
        issue,
        "--state",
        "code-review",
        "--branch",
        `issue/${issue}`,
        "--worktree",
        directory,
        "--base-sha",
        "base",
        "--head-sha",
        head,
        "--implementer",
        "codex",
        "--tests",
        "passed"
      );
    const results = await Promise.all([update("IRP-1", "head-1"), update("IRP-2", "head-2")]);
    for (const result of results) assert.equal(result.status, 0, result.stderr);
    const manifest = JSON.parse(run(directory, "show", "--run", "concurrent-batch").stdout).manifest;
    assert.equal(manifest.issues.find((issue) => issue.key === "IRP-1").headSha, "head-1");
    assert.equal(manifest.issues.find((issue) => issue.key === "IRP-2").headSha, "head-2");
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
        baseSha: "base",
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
        baseSha: "base",
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
