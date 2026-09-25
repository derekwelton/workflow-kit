import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { installSkills } from "../scripts/install-skills.mjs";
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
  workerId: `${role}-fixture-session`, policyVersion: "2026-09-24", fallbackReason: null
});

function withExecutionFixtures(args) {
  // Existing fixtures explicitly exercise the preserved legacy launch accounting.
  // New bounded-policy scenarios opt in below; production init defaults to bounded.
  if (args[0] === "init" && !args.includes("--review-policy")) return [...args, "--review-policy", "strict"];
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

test("bounded review: clean first review, optional finding, and nonfunctional carry-forward", () => {
  withRepository(directory => {
    const sha = git(directory, "rev-parse", "HEAD");
    const init = run(directory, "init", "--name", "Bounded-new", "--issues", "A-1", "--implementer", "codex", "--review-policy", "bounded");
    assert.equal(init.status, 0, init.stderr);
    const common = ["set-issue", "--run", "bounded-new", "--issue", "A-1"];
    const guide = headSha => JSON.stringify({ headSha, features: [{ name: "Docs", outcome: "Clearer text", access: "seed.txt", prerequisites: "None", steps: ["Read seed.txt"], expected: "Correct text" }], actions: [], verification: "Content checked", limitations: "None", delivery: "Local branch; not merged" });
    const dispatch = status => JSON.stringify({ id: "r1", scope: "full issue", kind: "initial", attempt: { id: "a1", status, ...(status === "completed" ? { receipt: `claude:${sha}:r1`, verdict: "pass" } : {}) } });
    let result = run(directory, ...common, "--state", "code-review", "--base-sha", sha, "--head-sha", sha, "--implementer", "codex", "--reviewer", "claude", "--tests", `${sha}: passed`, "--review-dispatch", dispatch("running"));
    assert.equal(result.status, 0, result.stderr);
    const optional = JSON.stringify([{ id: "style-1", severity: "low", category: "style", blocking: false, status: "open", summary: "Optional wording" }]);
    result = run(directory, ...common, "--state", "reviewed-pending-integration", "--review-dispatch", dispatch("completed"), "--review-findings", optional, "--completion-guide", guide(sha));
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).issue.reviewDispatches.length, 1);
    // A real LOW defect cannot be treated as optional.
    const defect = JSON.stringify([{ id: "bug-1", severity: "low", category: "correctness", blocking: false, status: "open", summary: "Wrong result" }]);
    result = run(directory, ...common, "--review-findings", defect);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /blocks regardless/);
    fs.writeFileSync(path.join(directory, "seed.txt"), "clearer wording\n");
    git(directory, "add", "seed.txt");
    git(directory, "-c", "user.name=Tests", "-c", "user.email=tests@example.invalid", "commit", "-m", "wording");
    const next = git(directory, "rev-parse", "HEAD");
    result = run(directory, ...common, "--head-sha", next, "--tests", `${next}: passed`, "--completion-guide", guide(next));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /attestation|reviewed headSha/);
    const attestation = { reviewedSha: sha, classification: "wording", reason: "Only ordinary wording; operating instructions unchanged", assessor: "coordinator", checks: `${next}: content checked` };
    result = run(directory, ...common, "--head-sha", next, "--tests", `${next}: passed`, "--completion-guide", guide(next), "--review-attestation", JSON.stringify(attestation));
    assert.equal(result.status, 0, result.stderr);
    const issue = JSON.parse(result.stdout).issue;
    assert.equal(issue.reviewReceipt, `claude:${sha}:r1`);
    assert.equal(issue.reviewAttestation.headSha, next);
    assert.equal(issue.reviewDispatches.length, 1);
    assert.equal(issue.reviewAttestation.changedFiles[0], "seed.txt");
    assert.equal(run(directory, ...common, "--review-attestation", JSON.stringify({ ...attestation, classification: "behavior" })).status, 1);
    assert.equal(run(directory, "validate", "--run", "bounded-new").status, 0);
    const filePath = JSON.parse(init.stdout).filePath;
    const tampered = JSON.parse(fs.readFileSync(filePath, "utf8"));
    tampered.issues[0].reviewAttestation.deltaHash = "0".repeat(64);
    fs.writeFileSync(filePath, JSON.stringify(tampered));
    const invalid = run(directory, "validate", "--run", "bounded-new");
    assert.equal(JSON.parse(invalid.stdout).valid, false);
    assert.match(invalid.stdout, /attested delta does not match Git/);
  });
});

test("default policy is bounded and adoption preserves completed legacy receipts atomically", () => {
  withRepository(directory => {
    const direct = spawnSync(process.execPath, [SCRIPT, "init", "--name", "Default", "--issues", "A-1", "--dry-run", "--cwd", directory], { encoding: "utf8", windowsHide: true });
    assert.equal(direct.status, 0, direct.stderr);
    assert.equal(JSON.parse(direct.stdout).manifest.policy.reviewPolicy, "bounded");
    const sha = git(directory, "rev-parse", "HEAD");
    assert.equal(run(directory, "init", "--name", "Legacy", "--issues", "A-1").status, 0);
    const done = run(directory, "set-issue", "--run", "legacy", "--issue", "A-1", "--state", "reviewed-pending-integration", "--base-sha", sha, "--head-sha", sha, "--implementer", "codex", "--reviewer", "claude", "--tests", `${sha}: passed`, "--review-receipt", `claude:${sha}:legacy`);
    assert.equal(done.status, 0, done.stderr);
    const policyArgs = ["set-policy", "--run", "legacy", "--review-policy", "bounded", "--policy-decision", "user-approved-adoption"];
    assert.equal(run(directory, ...policyArgs).status, 1);
    assert.equal(JSON.parse(run(directory, "show", "--run", "legacy").stdout).manifest.policy.reviewPolicy, "strict");
    const guide = { headSha: sha, features: [{ name: "Feature", outcome: "Implemented", access: "CLI", prerequisites: "None", steps: ["Run command"], expected: "Result" }], actions: [], verification: "Passed", limitations: "None", delivery: "Local" };
    const adopted = run(directory, ...policyArgs, "--completion-guides", JSON.stringify({ "A-1": guide }));
    assert.equal(adopted.status, 0, adopted.stderr);
    const manifest = JSON.parse(run(directory, "show", "--run", "legacy").stdout).manifest;
    assert.equal(manifest.issues[0].reviewRounds, 1);
    assert.equal(manifest.issues[0].reviewHistory[0].receipt, `claude:${sha}:legacy`);
    assert.deepEqual(manifest.issues[0].reviewDispatches, []);
    assert.equal(run(directory, "validate", "--run", "legacy").status, 0);
  });
});

test("bounded CLI preserves substantive findings through retry and focused verification", () => {
  withRepository(directory => {
    const sha = git(directory, "rev-parse", "HEAD");
    assert.equal(run(directory, "init", "--name", "Fix", "--issues", "A-1", "--review-policy", "bounded").status, 0);
    const args = ["set-issue", "--run", "fix", "--issue", "A-1"];
    const dispatch = (id, attempt, status, verdict) => JSON.stringify({ id, scope: id === "r1" ? "full scope" : "F-1 fix", kind: id === "r1" ? "initial" : "fix-verification", attempt: { id: attempt, status, ...(status === "failed" ? { reason: "Bad CLI argument" } : {}), ...(status === "completed" ? { verdict, receipt: `claude:${sha}:${id}` } : {}) } });
    let result = run(directory, ...args, "--state", "code-review", "--base-sha", sha, "--head-sha", sha, "--implementer", "codex", "--reviewer", "claude", "--tests", `${sha}: passed`, "--review-dispatch", dispatch("r1", "a1", "failed"));
    assert.equal(result.status, 0, result.stderr);
    const finding = { id: "F-1", severity: "low", category: "correctness", blocking: true, status: "open", summary: "Incorrect result" };
    result = run(directory, ...args, "--review-dispatch", dispatch("r1", "a2", "completed", "changes-required"), "--review-findings", JSON.stringify([finding]));
    assert.equal(result.status, 0, result.stderr);
    result = run(directory, ...args, "--review-findings", "[]");
    assert.equal(JSON.parse(result.stdout).issue.reviewFindings.length, 1);
    const premature = run(directory, ...args, "--state", "reviewed-pending-integration", "--review-findings", JSON.stringify([{ ...finding, status: "resolved" }]));
    assert.equal(premature.status, 1);
    assert.match(premature.stderr, /changes-required/);
    result = run(directory, ...args, "--review-dispatch", dispatch("r2", "a1", "running"));
    assert.equal(result.status, 0, result.stderr);
    result = run(directory, ...args, "--review-dispatch", dispatch("r2", "a1", "completed", "pass"), "--review-findings", JSON.stringify([{ ...finding, status: "resolved", decision: "Independently verified against existing behavior" }]));
    assert.equal(result.status, 0, result.stderr);
    const issue = JSON.parse(result.stdout).issue;
    assert.equal(issue.reviewDispatches.filter(item => item.status === "completed").length, 2);
    assert.equal(issue.reviewDispatches[0].attempts[0].status, "failed");
    assert.equal(issue.reviewDispatches[0].attempts[0].execution.workerId, "review-fixture-session");
  });
});

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

test("missing optional CLI permits a recorded fresh same-provider review for either author", () => {
  for (const provider of ["codex", "claude"]) withRepository(directory => {
    const missingProvider = provider === "codex" ? "claude" : "codex";
    const fallback = { reason: "cli-not-installed", missingProvider, evidence: `Get-Command ${missingProvider}: not found` };
    const initialized = run(directory, "init", "--name", "fallback", "--issues", "I-1",
      "--implementer", provider, "--reviewer", provider, "--review-fallback", JSON.stringify(fallback));
    assert.equal(initialized.status, 0, initialized.stderr);
    const manifest = JSON.parse(initialized.stdout).manifest;
    assert.deepEqual(manifest.issues[0].reviewFallback, fallback);
    assert.deepEqual(validateManifest(manifest), []);
    delete manifest.issues[0].reviewFallback;
    assert.match(validateManifest(manifest).join("\n"), /different review provider/);
    manifest.issues[0].reviewFallback = fallback;
    manifest.issues[0].implementationExecution = JSON.parse(execution(provider, "implementation"));
    manifest.issues[0].reviewExecution = { ...manifest.issues[0].implementationExecution };
    assert.match(validateManifest(manifest).join("\n"), /different worker sessions/);
    manifest.issues[0].reviewExecution.workerId = "fresh-review-session";
    assert.deepEqual(validateManifest(manifest), []);
    for (const invalid of [{ ...fallback, reason: "login-failed" }, { ...fallback, evidence: " " }, { ...fallback, missingProvider: provider }]) {
      manifest.issues[0].reviewFallback = invalid;
      assert.match(validateManifest(manifest).join("\n"), /fallback requires/);
    }
  });
});

test("a saved cross run can record a missing CLI later and clear fallback on return", () => {
  withRepository(directory => {
    assert.equal(run(directory, "init", "--name", "later", "--issues", "I-1", "--implementer", "codex").status, 0);
    const fallback = JSON.stringify({ reason: "cli-not-installed", missingProvider: "claude", evidence: "command -v claude: exit 1" });
    const changed = run(directory, "set-issue", "--run", "later", "--issue", "I-1", "--reviewer", "codex", "--review-fallback", fallback);
    assert.equal(changed.status, 0, changed.stderr);
    const restored = run(directory, "set-issue", "--run", "later", "--issue", "I-1", "--reviewer", "claude", "--review-fallback", "null");
    assert.equal(restored.status, 0, restored.stderr);
    assert.equal(JSON.parse(restored.stdout).issue.reviewFallback, null);
  });
});

test("quota or credentials fallback requires evidence for all authorized review models", () => {
  withRepository(directory => {
    const fallback = {
      reason: "review-models-unavailable", unavailableProvider: "claude",
      attempts: [
        { model: "claude-opus-5-5", reason: "quota-unavailable", evidence: "Opus review: HTTP 429 usage credits exhausted" },
        { model: "claude-fable-5-1", reason: "quota-unavailable", evidence: "Fable review: HTTP 429 usage credits exhausted" }
      ]
    };
    const result = run(directory, "init", "--name", "quota", "--issues", "I-1", "--implementer", "codex", "--reviewer", "codex", "--review-fallback", JSON.stringify(fallback));
    assert.equal(result.status, 0, result.stderr);
    const manifest = JSON.parse(result.stdout).manifest;
    assert.deepEqual(validateManifest(manifest), []);
    manifest.issues[0].reviewFallback.attempts.pop();
    assert.match(validateManifest(manifest).join("\n"), /every authorized/);
    manifest.issues[0].reviewFallback = { ...fallback, attempts: fallback.attempts.map(attempt => ({ ...attempt, reason: "network-timeout" })) };
    assert.match(validateManifest(manifest).join("\n"), /every authorized/);
    manifest.issues[0].implementationProvider = "claude";
    manifest.issues[0].reviewProvider = "claude";
    manifest.issues[0].reviewFallback = { reason: "review-models-unavailable", unavailableProvider: "codex", attempts: [
      { model: "gpt-6-astra", reason: "credentials-unavailable", evidence: "Codex login status: not authenticated" }
    ] };
    assert.deepEqual(validateManifest(manifest), []);
  });
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

  for (const invalidReceipt of [
    `claude:${baseSha}:review-${headSha}`,
    `path/claude/${headSha}/review`,
    `codex:${headSha}:claude-review`,
    `claude:${headSha}:`,
    `claude:${headSha}:review:extra`
  ]) {
    manifest.issues[0].reviewReceipt = invalidReceipt;
    assert.match(validateManifest(manifest).join("\n"), /reviewReceipt must include/);
  }
  manifest.issues[0].reviewReceipt = `claude:${headSha}:review-1`;
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
  for (const invalidReceipt of [`codex:${baseSha}:review-${headSha}`, `path/codex/${headSha}`, 123]) {
    manifest.integration.conflictReviewReceipt = invalidReceipt;
    assert.match(validateManifest(manifest).join("\n"), /conflict review receipt must include/);
  }
});

test("project-local installation retains the workload renderer and is idempotent", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-kit-skills-"));
  const targetDir = path.join(root, ".agents", "skills");
  try {
    const installed = installSkills({ project: root, all: true });
    assert.equal(installed.healthy, true);
    assert.deepEqual(
      installed.selections.codex.included.length,
      Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, "catalog.json"), "utf8")).skills).length
    );
    assert.equal(
      fs.existsSync(path.join(targetDir, "orchestrate-queue", "scripts", "render-worker-result.mjs")),
      true
    );
    const checked = installSkills({ project: root, check: true });
    assert.equal(checked.healthy, true);
    assert.deepEqual(
      checked.changes,
      []
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

test("review rounds are bounded, severity converges, and checkpoints survive resume", () => {
  withRepository((directory) => {
    const preview = run(directory, "init", "--name", "Bounded", "--issues", "A-1,A-2,A-3,A-4", "--dry-run");
    const plan = JSON.parse(preview.stdout);
    assert.equal(plan.manifest.policy.maxReviewRounds, 2);
    assert.deepEqual(plan.manifest.policy.reviewConvergence.laterRoundsBlock, ["high", "medium"]);
    assert.equal(plan.manifest.policy.reviewPolicy, "strict");
    assert.equal(fs.existsSync(path.dirname(plan.filePath)), false);
    const init = JSON.parse(run(directory, "init", "--name", "Bounded", "--issues", "A-1", "--implementer", "codex", "--review-policy", "convergent", "--policy-decision", "Owner approved eligible deferrals for this run", "--handoff-snapshot").stdout);
    const sha = git(directory, "rev-parse", "HEAD");
    const fields = ["--run", "bounded", "--issue", "A-1"];
    const round = (...extra) => run(directory, "set-issue", ...fields, "--state", "code-review", "--base-sha", sha, "--head-sha", sha, "--implementer", "codex", "--tests", `${sha}: passed`, ...extra);
    assert.equal(round().status, 0);
    const findings = (severity, status, followUp) => JSON.stringify([{ id: "F-1", severity, status, summary: "A review concern", category: "documentation", blocking: false, followUp, decision: "Owner approved nonblocking documentation follow-up" }]);
    const complete = (value) => run(directory, "set-issue", ...fields, "--state", "reviewed-pending-integration", "--reviewer", "claude", "--review-receipt", `claude:${sha}:receipt`, "--review-findings", value);
    assert.match(complete(findings("medium", "deferred", "A-2")).stderr, /unresolved medium/);
    assert.equal(round().status, 0);
    assert.match(complete(findings("high", "deferred", "A-2")).stderr, /unresolved high/);
    assert.match(complete(findings("medium", "open")).stderr, /linked follow-up/);
    const acceptance = JSON.parse(findings("medium", "deferred", "A-2"));
    acceptance[0].category = "acceptance";
    assert.match(complete(JSON.stringify(acceptance)).stderr, /blocks regardless of severity/);
    assert.equal(complete(findings("medium", "deferred", "A-2")).status, 0);
    const saved = fs.readFileSync(init.filePath, "utf8");
    assert.match(round().stderr, /exceeds maxReviewRounds 2/);
    assert.equal(fs.readFileSync(init.filePath, "utf8"), saved);
    assert.match(round("--allow-extra-round").stderr, /reason/);
    assert.equal(round("--allow-extra-round", "--reason", "Owner authorized one final high-severity verification").status, 0);
    const manifest = JSON.parse(fs.readFileSync(init.filePath, "utf8"));
    assert.equal(manifest.issues[0].reviewRounds, 3);
    assert.match(manifest.issues[0].reviewHistory[2].extraRoundReason, /Owner authorized/);
    const checkpoint = path.join(path.dirname(init.filePath), "bounded", `handoff-${manifest.updatedAt.slice(0, 10)}.md`);
    assert.match(fs.readFileSync(checkpoint, "utf8"), /A-1.*code-review.*3/);
    assert.match(fs.readFileSync(checkpoint, "utf8"), new RegExp(sha));
    assert.match(fs.readFileSync(checkpoint, "utf8"), /A-2/);
    const forged = structuredClone(manifest);
    forged.issues[0].reviewHistory[2].extraRoundReason = null;
    assert.match(validateManifest(forged).join("\n"), /extra review round requires a reason/);
  });
});

test("worker replacement and reopening implementation cannot bypass the review budget", () => {
  withRepository((directory) => {
    run(directory, "init", "--name", "Limited", "--issues", "A-1", "--max-review-rounds", "1");
    const sha = git(directory, "rev-parse", "HEAD");
    const common = ["--run", "limited", "--issue", "A-1"];
    const completed = run(directory, "set-issue", ...common, "--state", "reviewed-pending-integration", "--base-sha", sha, "--head-sha", sha, "--implementer", "codex", "--reviewer", "claude", "--review-receipt", `claude:${sha}:first`, "--tests", `${sha}: passed`);
    assert.equal(completed.status, 0, completed.stderr);
    const replacement = JSON.parse(execution("claude", "review")); replacement.workerId = "replacement";
    const changed = run(directory, "set-issue", ...common, "--review-execution", JSON.stringify(replacement));
    assert.match(changed.stderr, /exceeds maxReviewRounds 1/);
    assert.equal(run(directory, "set-issue", ...common, "--state", "implementing").status, 0);
    const reopened = run(directory, "set-issue", ...common, "--state", "code-review", "--implementer", "codex");
    assert.match(reopened.stderr, /exceeds maxReviewRounds 1/);
    for (const value of ["0", "-1", "1.5", "9007199254740992"]) {
      assert.equal(run(directory, "init", "--name", "Invalid", "--issues", "A-1", "--max-review-rounds", value, "--dry-run").status, 1);
    }
  });
});

test("resume preserves explicit routes and decisions while legacy migration invents no consent", () => {
  withRepository((directory) => {
    const route = { implementation: { provider: "codex", model: "astra", effort: "low" }, review: { provider: "claude", model: "fable", effort: "medium" } };
    const created = JSON.parse(run(directory, "init", "--name", "Policy", "--issues", "A-1", "--routing", JSON.stringify(route), "--policy-decision", "session:owner-request").stdout);
    assert.equal(fs.existsSync(path.join(path.dirname(created.filePath), "policy")), false, "handoff files are opt-in");
    const savedPolicy = created.manifest.policy;
    assert.equal(savedPolicy.routing.implementation.model, "gpt-6-astra");
    assert.equal(savedPolicy.decisions[0].scope, "policy");
    assert.equal(savedPolicy.decisions[0].reference, "session:owner-request");
    const context = { nextAction: "Verify save and reload", prerequisites: [{ name: "Test environment", status: "unknown" }] };
    assert.equal(run(directory, "set-issue", "--run", "policy", "--issue", "A-1", "--resume-context", JSON.stringify(context)).status, 0);
    const shown = JSON.parse(run(directory, "show", "--run", "policy").stdout).manifest;
    assert.deepEqual(shown.policy, savedPolicy);
    assert.deepEqual(shown.issues[0].resumeContext, context);
    assert.equal(run(directory, "set-policy", "--run", "policy", "--review-policy", "convergent").status, 1);
    const changed = run(directory, "set-policy", "--run", "policy", "--review-policy", "convergent", "--policy-decision", "session:approved-deferrals");
    assert.equal(changed.status, 0, changed.stderr);
    assert.equal(JSON.parse(changed.stdout).policy.decisions.length, 2);

    const legacy = structuredClone(created.manifest);
    legacy.schemaVersion = 2;
    for (const field of ["maxReviewRounds", "reviewPolicy", "reviewConvergence", "decisions", "routing"]) delete legacy.policy[field];
    for (const field of ["reviewRounds", "reviewHistory", "reviewFindings"]) delete legacy.issues[0][field];
    fs.writeFileSync(created.filePath, JSON.stringify(legacy));
    const preview = JSON.parse(run(directory, "migrate", "--run", "policy", "--dry-run").stdout).manifest;
    assert.equal(preview.policy.maxReviewRounds, null);
    assert.equal(preview.policy.reviewPolicy, "legacy-unverified");
    assert.deepEqual(preview.policy.decisions, []);
    assert.equal(preview.issues[0].reviewHistoryUnknownBeforeMigration, true);
    assert.equal(JSON.parse(fs.readFileSync(created.filePath)).schemaVersion, 2);
    assert.equal(run(directory, "migrate", "--run", "policy").status, 0);
    const sha = git(directory, "rev-parse", "HEAD");
    const review = run(directory, "set-issue", "--run", "policy", "--issue", "A-1", "--state", "code-review", "--base-sha", sha, "--head-sha", sha, "--implementer", "codex", "--tests", `${sha}: passed`);
    assert.match(review.stderr, /Legacy run policy is unverified/);
    const adopt = run(directory, "set-policy", "--run", "policy", "--review-policy", "strict", "--max-review-rounds", "3", "--policy-decision", "session:reconciled-legacy-policy");
    assert.equal(adopt.status, 0, adopt.stderr);
    assert.equal(JSON.parse(adopt.stdout).policy.maxReviewRounds, 3);
  });
});
