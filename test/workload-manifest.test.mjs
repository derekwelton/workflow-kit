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

const execution = (provider, role) => JSON.stringify({
  requestedModel: provider === "codex" ? "gpt-6-astra" : "claude-fable-5-1",
  resolvedModel: null, resolutionStatus: "unverified", effort: "medium",
  workerId: `${role}-fixture-session`, policyVersion: "2026-09-04", fallbackReason: null
});

function withExecutionFixtures(args) {
  if (args[0] !== "set-issue") return args;
  const result = [...args];
  for (const [flag, role] of [["--implementer", "implementation"], ["--reviewer", "review"]]) {
    const index = args.indexOf(flag);
    if (index !== -1 && !args.includes(`--${role}-execution`)) result.push(`--${role}-execution`, execution(args[index + 1], role));
  }
  return result;
}

function run(cwd, ...args) {
  args = withExecutionFixtures(args);
  return spawnSync(process.execPath, [SCRIPT, ...args, "--cwd", cwd], {
    cwd,
    encoding: "utf8",
    windowsHide: true
  });
}

function runAsync(cwd, ...args) {
  args = withExecutionFixtures(args);
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

test("repository subdirectories resolve the same git-common manifest directory", () => {
  withRepository((directory) => {
    const nested = path.join(directory, "DOCS", "nested");
    fs.mkdirSync(nested, { recursive: true });
    const init = run(directory, "init", "--name", "Nested Batch", "--issues", "IRP-1");
    assert.equal(init.status, 0, init.stderr);

    const show = run(nested, "show", "--run", "nested-batch");
    assert.equal(show.status, 0, show.stderr);
    assert.equal(JSON.parse(show.stdout).filePath, JSON.parse(init.stdout).filePath);
  });
});

test("manifest mutations lock, re-read, and refuse incomplete gated states", () => {
  withRepository((directory) => {
    const commit = git(directory, "rev-parse", "HEAD");
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
      "reviewed-pending-integration",
      "--branch",
      "issue/1",
      "--worktree",
      directory,
      "--base-sha",
      commit,
      "--head-sha",
      commit,
      "--implementer",
      "codex",
      "--reviewer",
      "claude",
      "--review-receipt",
      `claude:${commit}:review-1`,
      "--tests",
      `${commit}: node --test passed`
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

    const missingValue = run(
      directory,
      "set-issue",
      "--run",
      "guarded-batch",
      "--issue",
      "IRP-1",
      "--head-sha",
      "--implementer",
      "codex"
    );
    assert.equal(missingValue.status, 1);
    assert.match(missingValue.stderr, /--head-sha requires a non-empty value/);
  });
});

test("manifest lock refuses a second writer instead of racing", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-kit-lock-"));
  const filePath = path.join(root, "run.json");
  try {
    withFileLock(filePath, () => {
      assert.throws(
        () => withFileLock(filePath, () => undefined, { timeoutMs: 25, staleMs: 0 }),
        /Timed out waiting for workload manifest lock/
      );
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("integration handoff follows ordered, SHA-bound state transitions", () => {
  withRepository((directory) => {
    const commit = git(directory, "rev-parse", "HEAD");
    assert.equal(run(directory, "init", "--name", "Ordered Batch", "--issues", "IRP-1").status, 0);
    const reviewed = run(
      directory,
      "set-issue",
      "--run",
      "ordered-batch",
      "--issue",
      "IRP-1",
      "--state",
      "reviewed-pending-integration",
      "--base-sha",
      commit,
      "--head-sha",
      commit,
      "--implementer",
      "codex",
      "--reviewer",
      "claude",
      "--tests",
      `${commit}: focused tests passed`,
      "--review-receipt",
      `claude:${commit}:review-1`
    );
    assert.equal(reviewed.status, 0, reviewed.stderr);

    const assembling = run(
      directory,
      "set-integration",
      "--run",
      "ordered-batch",
      "--state",
      "assembling",
      "--base-sha",
      commit,
      "--head-sha",
      commit,
      "--pr",
      "https://example.invalid/pr/1",
      "--tests",
      `${commit}: combined tests passed`,
      "--no-conflicts"
    );
    assert.equal(assembling.status, 0, assembling.stderr);

    const handedOff = run(directory, "set-issue", "--run", "ordered-batch", "--issue", "IRP-1", "--state", "in-review");
    assert.equal(handedOff.status, 0, handedOff.stderr);
    assert.equal(run(directory, "set-integration", "--run", "ordered-batch", "--state", "ready-for-human-review").status, 0);
    assert.equal(run(directory, "set-integration", "--run", "ordered-batch", "--state", "assembling").status, 0);
    assert.equal(run(directory, "set-integration", "--run", "ordered-batch", "--state", "ready-for-human-review").status, 0);
    assert.equal(run(directory, "set-integration", "--run", "ordered-batch", "--state", "merged").status, 0);

    const invalidSha = run(
      directory,
      "set-issue",
      "--run",
      "ordered-batch",
      "--issue",
      "IRP-1",
      "--head-sha",
      "deadbeef"
    );
    assert.equal(invalidSha.status, 1);
    assert.match(invalidSha.stderr, /does not resolve to a commit/);
  });
});

test("concurrent issue writers retain both final updates", async () => {
  await withRepositoryAsync(async (directory) => {
    const commit = git(directory, "rev-parse", "HEAD");
    const init = run(directory, "init", "--name", "Concurrent Batch", "--issues", "IRP-1,IRP-2");
    assert.equal(init.status, 0, init.stderr);
    const update = (issue) =>
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
        commit,
        "--head-sha",
        commit,
        "--implementer",
        "codex",
        "--tests",
        `${commit}: node --test passed`
      );
    const results = await Promise.all([update("IRP-1"), update("IRP-2")]);
    for (const result of results) assert.equal(result.status, 0, result.stderr);
    const manifest = JSON.parse(run(directory, "show", "--run", "concurrent-batch").stdout).manifest;
    assert.equal(manifest.issues.find((issue) => issue.key === "IRP-1").headSha, commit);
    assert.equal(manifest.issues.find((issue) => issue.key === "IRP-2").headSha, commit);
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
  const baseSha = "a".repeat(40);
  const headSha = "b".repeat(40);
  const manifest = {
    schemaVersion: 2,
    id: "batch",
    name: "Batch",
    policy: { pairMode: "cross" },
    issues: [
      {
        key: "IRP-1",
        state: "in-review",
        baseSha,
        headSha,
        implementationProvider: "codex",
        reviewProvider: "claude",
        reviewReceipt: `claude:${headSha}:review-1`,
        tests: `${headSha}: passed`
      }
    ],
    integration: {
      state: "ready-for-human-review",
      baseSha,
      headSha,
      pullRequest: "https://example.invalid/pr/1",
      tests: `${headSha}: passed`
    }
  };
  assert.deepEqual(validateManifest(manifest), []);

  manifest.issues[0].reviewProvider = "codex";
  assert.match(validateManifest(manifest).join("\n"), /different review provider/);
  manifest.issues[0].reviewProvider = "claude";
  manifest.issues[0].state = "done";
  assert.match(validateManifest(manifest).join("\n"), /done requires a merged integration branch/);
  manifest.integration.state = "merged";
  assert.deepEqual(validateManifest(manifest), []);
});

test("integration-ready validation requires review of actual conflict resolutions", () => {
  const baseSha = "a".repeat(40);
  const headSha = "b".repeat(40);
  const manifest = {
    schemaVersion: 2,
    id: "conflicted-batch",
    name: "Conflicted Batch",
    policy: { pairMode: "cross" },
    issues: [
      {
        key: "IRP-1",
        state: "in-review",
        baseSha,
        headSha,
        implementationProvider: "codex",
        reviewProvider: "claude",
        reviewReceipt: `claude:${headSha}:review-1`,
        tests: `${headSha}: passed`
      }
    ],
    integration: {
      state: "ready-for-human-review",
      baseSha,
      headSha,
      pullRequest: "https://example.invalid/pr/1",
      tests: `${headSha}: passed`,
      conflictsOccurred: true,
      conflictReviewReceipt: null
    }
  };
  assert.match(validateManifest(manifest).join("\n"), /conflict resolutions require/);
  manifest.integration.conflictReviewReceipt = `codex:${headSha}:conflict-review-1`;
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
      Array(30).fill("installed")
    );
    assert.equal(
      fs.existsSync(path.join(targetDir, "orchestrate-queue", "scripts", "render-worker-result.mjs")),
      true
    );
    const checked = reconcileCodexSkillLinks({ targetDir, check: true });
    assert.equal(checked.healthy, true);
    assert.deepEqual(
      checked.results.map((entry) => entry.status),
      Array(30).fill("current")
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});


test("schema migration preserves historical receipts and never guesses model identity", () => {
  withRepository((directory) => {
    const init = JSON.parse(run(directory, "init", "--name", "Old Run", "--issues", "A-1").stdout);
    const old = init.manifest;
    old.schemaVersion = 2;
    const historicalSha = old.repository.baseSha;
    Object.assign(old.issues[0], { state: "reviewed-pending-integration", baseSha: historicalSha,
      headSha: historicalSha, implementationProvider: "codex", reviewProvider: "claude",
      tests: `${historicalSha}: historical tests passed`, reviewReceipt: `claude:${historicalSha}:historical-review` });
    delete old.issues[0].implementationExecution;
    delete old.issues[0].reviewExecution;
    fs.writeFileSync(init.filePath, JSON.stringify(old));
    const before = fs.readFileSync(init.filePath, "utf8");
    const dry = run(directory, "migrate", "--run", "old-run", "--dry-run");
    assert.equal(dry.status, 0, dry.stderr);
    assert.equal(fs.readFileSync(init.filePath, "utf8"), before);
    assert.equal(run(directory, "migrate", "--run", "old-run").status, 0);
    const migrated = JSON.parse(run(directory, "show", "--run", "old-run").stdout).manifest;
    assert.equal(migrated.schemaVersion, 3);
    assert.equal(migrated.repository.baseSha, old.repository.baseSha);
    assert.equal(migrated.issues[0].state, old.issues[0].state);
    assert.equal(migrated.issues[0].reviewReceipt, old.issues[0].reviewReceipt);
    assert.equal(migrated.issues[0].tests, old.issues[0].tests);
    assert.deepEqual(migrated.issues[0].implementationExecution, { legacy: true, resolvedModel: null, effort: null, workerId: null });
    assert.equal(run(directory, "migrate", "--run", "old-run").status, 0);
    const forged = run(directory, "set-issue", "--run", "old-run", "--issue", "A-1", "--implementation-execution", JSON.stringify({ legacy: true }));
    assert.equal(forged.status, 1);
    assert.equal(run(directory, "set-issue", "--run", "old-run", "--issue", "A-1", "--state", "implementing").status, 0);
    const newWork = run(directory, "set-issue", "--run", "old-run", "--issue", "A-1", "--state", "code-review");
    assert.equal(newWork.status, 1);
    assert.match(newWork.stderr, /implementationExecution is required/);
  });
});

test("schema 3 rejects completion without execution provenance", () => {
  withRepository((directory) => {
    run(directory, "init", "--name", "Missing Provenance", "--issues", "A-1", "--implementer", "codex");
    const sha = git(directory, "rev-parse", "HEAD");
    const result = run(directory, "set-issue", "--run", "missing-provenance", "--issue", "A-1", "--state", "code-review", "--base-sha", sha, "--head-sha", sha, "--tests", `${sha}: passed`);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /implementationExecution is required/);
  });
});
