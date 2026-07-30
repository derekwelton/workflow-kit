#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCHEMA_VERSION = 1;
const WORKFLOW_KIT_VERSION = "0.8.3";
const PAIR_MODES = new Set(["cross", "codex-only", "claude-only"]);
const ISSUE_STATES = new Set([
  "selected",
  "implementing",
  "code-review",
  "reviewed-pending-integration",
  "integration-blocked",
  "in-review",
  "done"
]);
const INTEGRATION_STATES = new Set([
  "pending",
  "assembling",
  "blocked",
  "ready-for-human-review",
  "merged"
]);

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const options = {};
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const equalsIndex = token.indexOf("=");
    if (equalsIndex > 2) {
      options[token.slice(2, equalsIndex)] = token.slice(equalsIndex + 1);
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (next != null && !next.startsWith("--")) {
      options[key] = next;
      index += 1;
    } else {
      options[key] = true;
    }
  }

  return { options, positionals };
}

function runGit(cwd, args, { allowFailure = false } = {}) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    windowsHide: true
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0 && !allowFailure) {
    fail((result.stderr || result.stdout || `git ${args.join(" ")} failed`).trim());
  }
  return {
    status: result.status ?? 1,
    stdout: String(result.stdout ?? "").trim(),
    stderr: String(result.stderr ?? "").trim()
  };
}

function resolveRepository(cwd) {
  const root = runGit(cwd, ["rev-parse", "--show-toplevel"]).stdout;
  const commonDirValue = runGit(cwd, ["rev-parse", "--git-common-dir"]).stdout;
  const commonDir = path.resolve(cwd, commonDirValue);
  const remote = runGit(root, ["remote", "get-url", "origin"], { allowFailure: true }).stdout || null;
  return { root, commonDir, remote };
}

function stateDirectory(repository) {
  return path.join(repository.commonDir, "workflow-kit", "runs");
}

function slugify(value) {
  const slug = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) {
    fail("A workload name containing at least one letter or number is required.");
  }
  return slug;
}

function parseList(value) {
  if (value == null || value === true) {
    return [];
  }
  return [...new Set(String(value).split(",").map((item) => item.trim()).filter(Boolean))];
}

function parsePositiveInteger(value, fallback, name) {
  if (value == null) {
    return fallback;
  }
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    fail(`${name} must be a positive integer.`);
  }
  const parsed = Number(value);
  return parsed;
}

function booleanOption(options, name) {
  const value = options[name];
  if (value === undefined) return false;
  if (value === true || value === "true") return true;
  if (value === "false") return false;
  fail(`--${name} must be true or false.`);
}

function requireTextOption(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`--${name} requires a non-empty value.`);
  }
  return value.trim();
}

function normalizeProvider(value, { allowAuto = true } = {}) {
  const provider = String(value ?? "auto").trim().toLowerCase();
  if (allowAuto && provider === "auto") {
    return "auto";
  }
  if (["codex", "codex-sol", "sol", "gpt-5.6-sol"].includes(provider)) {
    return "codex";
  }
  if (["claude", "claude-opus", "opus", "opus-5", "claude-opus-5"].includes(provider)) {
    return "claude";
  }
  fail(`Unsupported provider "${value}". Use codex, claude, or auto.`);
}

function reviewerFor(pairMode, implementationProvider, explicitReviewer = "auto") {
  if (!PAIR_MODES.has(pairMode)) {
    fail(`Unsupported pair mode "${pairMode}". Use cross, codex-only, or claude-only.`);
  }

  const implementer = normalizeProvider(implementationProvider);
  const reviewer = normalizeProvider(explicitReviewer);
  if (reviewer !== "auto") {
    return reviewer;
  }
  if (pairMode === "codex-only") {
    return "codex";
  }
  if (pairMode === "claude-only") {
    return "claude";
  }
  if (implementer === "codex") {
    return "claude";
  }
  if (implementer === "claude") {
    return "codex";
  }
  return "auto";
}

function manifestPath(repository, runReference) {
  const slug = slugify(runReference);
  return path.join(stateDirectory(repository), `${slug}.json`);
}

function atomicWriteJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  for (let attempt = 0; ; attempt += 1) {
    try {
      fs.renameSync(temporaryPath, filePath);
      break;
    } catch (error) {
      if (!["EPERM", "EBUSY"].includes(error?.code) || attempt >= 4) throw error;
      sleepSync(25 * (attempt + 1));
    }
  }
}

const LOCK_SLEEP = new Int32Array(new SharedArrayBuffer(4));

function sleepSync(milliseconds) {
  Atomics.wait(LOCK_SLEEP, 0, 0, milliseconds);
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === "ESRCH") return false;
    return true;
  }
}

function readLockOwner(lockPath) {
  try {
    return JSON.parse(fs.readFileSync(lockPath, "utf8"));
  } catch {
    return null;
  }
}

function withFileLock(filePath, callback, options = {}) {
  const lockPath = `${filePath}.lock`;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const staleMs = options.staleMs ?? 5 * 60_000;
  const deadline = Date.now() + timeoutMs;
  const ownerToken = randomUUID();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  let handle = null;
  while (handle == null) {
    try {
      handle = fs.openSync(lockPath, "wx");
      fs.writeFileSync(
        handle,
        `${JSON.stringify({ token: ownerToken, pid: process.pid, createdAt: nowIso() })}\n`,
        "utf8"
      );
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      try {
        if (Date.now() - fs.statSync(lockPath).mtimeMs >= staleMs) {
          const owner = readLockOwner(lockPath);
          if (!owner || !isProcessAlive(owner.pid)) {
            fs.unlinkSync(lockPath);
            continue;
          }
        }
      } catch (statError) {
        if (statError?.code === "ENOENT") continue;
        throw statError;
      }
      if (Date.now() >= deadline) {
        fail(`Timed out waiting for workload manifest lock ${lockPath}.`);
      }
      sleepSync(50);
    }
  }

  try {
    return callback();
  } finally {
    fs.closeSync(handle);
    try {
      if (readLockOwner(lockPath)?.token === ownerToken) {
        fs.unlinkSync(lockPath);
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

function readManifest(repository, runReference) {
  const filePath = manifestPath(repository, runReference);
  if (!fs.existsSync(filePath)) {
    fail(`No workload manifest found for "${runReference}" at ${filePath}.`);
  }
  return { filePath, manifest: JSON.parse(fs.readFileSync(filePath, "utf8")) };
}

function nowIso() {
  return new Date().toISOString();
}

function validateBranchName(repository, branch) {
  const result = runGit(repository.root, ["check-ref-format", "--branch", branch], { allowFailure: true });
  if (result.status !== 0) {
    fail(`Invalid integration branch "${branch}".`);
  }
}

function resolveCommit(repository, reference, label = "Base ref") {
  const result = runGit(repository.root, ["rev-parse", "--verify", `${reference}^{commit}`], {
    allowFailure: true
  });
  if (result.status !== 0) {
    fail(`${label} "${reference}" does not resolve to a commit.`);
  }
  return result.stdout;
}

function assertAncestor(repository, baseSha, headSha, label) {
  const result = runGit(repository.root, ["merge-base", "--is-ancestor", baseSha, headSha], { allowFailure: true });
  if (result.status !== 0) {
    fail(`${label} baseSha ${baseSha} is not an ancestor of headSha ${headSha}.`);
  }
}

function detectDefaultBaseRef(repository) {
  const symbolic = runGit(repository.root, ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"], {
    allowFailure: true
  });
  if (symbolic.status === 0 && symbolic.stdout) {
    return symbolic.stdout;
  }
  for (const candidate of ["origin/main", "origin/master", "main", "master"]) {
    const resolved = runGit(repository.root, ["rev-parse", "--verify", `${candidate}^{commit}`], {
      allowFailure: true
    });
    if (resolved.status === 0) {
      return candidate;
    }
  }
  fail("Could not resolve the repository default branch. Fetch origin or pass --base explicitly.");
}

function normalizePairSelection(pairMode, implementerValue, reviewerValue) {
  let implementationProvider = normalizeProvider(implementerValue);
  let explicitReviewer = normalizeProvider(reviewerValue);

  if (pairMode === "codex-only") {
    if (implementationProvider === "auto") implementationProvider = "codex";
    if (explicitReviewer === "auto") explicitReviewer = "codex";
    if (implementationProvider !== "codex" || explicitReviewer !== "codex") {
      fail("codex-only requires Codex for both implementation and review.");
    }
  } else if (pairMode === "claude-only") {
    if (implementationProvider === "auto") implementationProvider = "claude";
    if (explicitReviewer === "auto") explicitReviewer = "claude";
    if (implementationProvider !== "claude" || explicitReviewer !== "claude") {
      fail("claude-only requires Claude for both implementation and review.");
    }
  }

  const reviewProvider = reviewerFor(pairMode, implementationProvider, explicitReviewer);
  if (
    pairMode === "cross" &&
    implementationProvider !== "auto" &&
    reviewProvider !== "auto" &&
    implementationProvider === reviewProvider
  ) {
    fail("cross requires different providers. Use --pair codex-only or --pair claude-only for same-provider work.");
  }
  return { implementationProvider, reviewProvider };
}

function commandInit(cwd, options) {
  const repository = resolveRepository(cwd);
  const name = requireTextOption(options.name, "name");
  const id = slugify(name);
  const issues = parseList(options.issues);
  if (issues.length === 0) {
    fail("Pass the frozen issue keys with --issues KEY-1,KEY-2 after tracker selection.");
  }

  const pairMode = String(options.pair ?? "cross").trim().toLowerCase();
  if (!PAIR_MODES.has(pairMode)) {
    fail(`Unsupported pair mode "${pairMode}".`);
  }
  const { implementationProvider, reviewProvider } = normalizePairSelection(
    pairMode,
    options.implementer,
    options.reviewer
  );
  const baseRef = String(options.base ?? detectDefaultBaseRef(repository));
  const branch = String(options.branch ?? `integration/${id}`);
  validateBranchName(repository, branch);

  const timestamp = nowIso();
  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    workflowKitVersion: WORKFLOW_KIT_VERSION,
    id,
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    repository: {
      root: repository.root,
      remote: repository.remote,
      baseRef,
      baseSha: resolveCommit(repository, baseRef)
    },
    selection: {
      status: String(options.status ?? "Todo"),
      labels: parseList(options.labels),
      issueKeys: issues
    },
    policy: {
      pairMode,
      implementationProvider,
      reviewProvider,
      maxImplementers: parsePositiveInteger(options["max-implementers"], 4, "max-implementers"),
      maxReviewers: parsePositiveInteger(options["max-reviewers"], 2, "max-reviewers"),
      allowPartial: booleanOption(options, "allow-partial"),
      terminal: "integrated-in-review"
    },
    issues: issues.map((key) => ({
      key,
      state: "selected",
      branch: null,
      worktree: null,
      baseSha: null,
      headSha: null,
      pullRequest: null,
      implementationProvider: implementationProvider === "auto" ? null : implementationProvider,
      reviewProvider: reviewProvider === "auto" ? null : reviewProvider,
      reviewReceipt: null,
      tests: null,
      blocker: null,
      updatedAt: timestamp
    })),
    integration: {
      state: "pending",
      branch,
      baseRef,
      baseSha: null,
      headSha: null,
      pullRequest: null,
      tests: null,
      conflictsOccurred: false,
      conflictReviewReceipt: null,
      blocker: null,
      updatedAt: timestamp
    }
  };

  const filePath = manifestPath(repository, id);
  if (booleanOption(options, "dry-run")) {
    return { filePath, written: false, manifest };
  }
  withFileLock(filePath, () => {
    if (fs.existsSync(filePath) && !booleanOption(options, "force")) {
      fail(`Workload "${id}" already exists. Use --resume ${id}, or pass --force intentionally.`);
    }
    atomicWriteJson(filePath, manifest);
  });
  return { filePath, written: true, manifest };
}

function assignIfPresent(target, property, value, transform = (item) => item, optionName = property) {
  if (value !== undefined) {
    if (typeof value !== "string" || value.trim() === "") {
      fail(`--${optionName} requires a non-empty value.`);
    }
    target[property] = transform(value.trim());
  }
}

function commandSetIssue(cwd, options) {
  const repository = resolveRepository(cwd);
  const runReference = requireTextOption(options.run, "run");
  const issueKey = requireTextOption(options.issue, "issue");
  const filePath = manifestPath(repository, runReference);
  return withFileLock(filePath, () => {
    const { manifest } = readManifest(repository, runReference);
    const issue = manifest.issues.find((candidate) => candidate.key.toLowerCase() === issueKey.toLowerCase());
    if (!issue) {
      fail(`Issue "${issueKey}" is not in workload "${manifest.id}".`);
    }

    if (options.state !== undefined) {
      const state = String(options.state);
      if (!ISSUE_STATES.has(state)) {
        fail(`Unsupported issue state "${state}".`);
      }
      issue.state = state;
    }
    assignIfPresent(issue, "branch", options.branch, String);
    assignIfPresent(issue, "worktree", options.worktree, (value) => path.resolve(repository.root, String(value)));
    assignIfPresent(issue, "baseSha", options["base-sha"], (value) => resolveCommit(repository, value, "--base-sha"), "base-sha");
    assignIfPresent(issue, "headSha", options["head-sha"], (value) => resolveCommit(repository, value, "--head-sha"), "head-sha");
    assignIfPresent(issue, "pullRequest", options.pr, String);
    assignIfPresent(issue, "implementationProvider", options.implementer, (value) => normalizeProvider(value, { allowAuto: false }));
    assignIfPresent(issue, "reviewProvider", options.reviewer, (value) => normalizeProvider(value, { allowAuto: false }));
    assignIfPresent(issue, "reviewReceipt", options["review-receipt"], String, "review-receipt");
    assignIfPresent(issue, "tests", options.tests, String);
    assignIfPresent(issue, "blocker", options.blocker, String);
    if (booleanOption(options, "clear-blocker")) {
      issue.blocker = null;
    }

    if (issue.implementationProvider && !issue.reviewProvider) {
      issue.reviewProvider = reviewerFor(manifest.policy.pairMode, issue.implementationProvider);
    }
    if (issue.baseSha && issue.headSha) {
      assertAncestor(repository, issue.baseSha, issue.headSha, issue.key);
    }
    issue.updatedAt = nowIso();
    manifest.updatedAt = issue.updatedAt;
    assertManifestValid(manifest);
    atomicWriteJson(filePath, manifest);
    return { filePath, issue, manifestId: manifest.id };
  });
}

function commandSetIntegration(cwd, options) {
  const repository = resolveRepository(cwd);
  const runReference = requireTextOption(options.run, "run");
  const filePath = manifestPath(repository, runReference);
  return withFileLock(filePath, () => {
    const { manifest } = readManifest(repository, runReference);
    const integration = manifest.integration;
    const previousState = integration.state;
    const conflictsOccurred = booleanOption(options, "conflicts-occurred");
    const noConflicts = booleanOption(options, "no-conflicts");
    if (conflictsOccurred && noConflicts) {
      fail("--conflicts-occurred and --no-conflicts are mutually exclusive.");
    }

    if (options.state !== undefined) {
      const state = String(options.state);
      if (!INTEGRATION_STATES.has(state)) {
        fail(`Unsupported integration state "${state}".`);
      }
      const allowedTransitions = {
        pending: new Set(["pending", "assembling", "blocked"]),
        assembling: new Set(["assembling", "blocked", "ready-for-human-review"]),
        blocked: new Set(["blocked", "assembling"]),
        "ready-for-human-review": new Set(["ready-for-human-review", "assembling", "merged"]),
        merged: new Set(["merged"])
      };
      if (!allowedTransitions[previousState]?.has(state)) {
        fail(`Invalid integration transition ${previousState} -> ${state}.`);
      }
      integration.state = state;
    }
    assignIfPresent(integration, "branch", options.branch, String);
    assignIfPresent(integration, "baseRef", options.base, String);
    assignIfPresent(integration, "baseSha", options["base-sha"], (value) => resolveCommit(repository, value, "--base-sha"), "base-sha");
    assignIfPresent(integration, "headSha", options["head-sha"], (value) => resolveCommit(repository, value, "--head-sha"), "head-sha");
    assignIfPresent(integration, "pullRequest", options.pr, String);
    assignIfPresent(integration, "tests", options.tests, String);
    assignIfPresent(integration, "blocker", options.blocker, String);
    if (booleanOption(options, "clear-blocker")) {
      integration.blocker = null;
    }
    if (booleanOption(options, "conflict-review-complete")) {
      fail("--conflict-review-complete is unsafe because it is not a receipt. Pass --conflict-review-receipt <provider:head-sha:receipt-id>.");
    }
    assignIfPresent(
      integration,
      "conflictReviewReceipt",
      options["conflict-review-receipt"],
      String,
      "conflict-review-receipt"
    );
    if (conflictsOccurred) {
      integration.conflictsOccurred = true;
    }
    if (noConflicts) {
      if (integration.conflictsOccurred) {
        fail("--no-conflicts cannot erase recorded conflict history.");
      }
      integration.conflictsOccurred = false;
    }
    if (integration.baseSha && integration.headSha) {
      assertAncestor(repository, integration.baseSha, integration.headSha, "integration");
    }
    integration.updatedAt = nowIso();
    manifest.updatedAt = integration.updatedAt;
    assertManifestValid(manifest);
    atomicWriteJson(filePath, manifest);
    return { filePath, integration, manifestId: manifest.id };
  });
}

function validateManifest(manifest) {
  const errors = [];
  const isFullCommitSha = (value) => typeof value === "string" && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(value);
  const evidenceBindsHead = (receipt, headSha) =>
    typeof receipt === "string" && typeof headSha === "string" && receipt.includes(headSha);
  const receiptBindsReview = (receipt, provider, headSha) =>
    evidenceBindsHead(receipt, headSha) && typeof provider === "string" && receipt.toLowerCase().includes(provider);
  if (manifest.schemaVersion !== SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${SCHEMA_VERSION}`);
  }
  if (!manifest.id || !manifest.name) {
    errors.push("id and name are required");
  }
  if (!Array.isArray(manifest.issues) || manifest.issues.length === 0) {
    errors.push("at least one issue is required");
  }
  if (!PAIR_MODES.has(manifest.policy?.pairMode)) {
    errors.push("policy.pairMode is invalid");
  }

  for (const issue of manifest.issues ?? []) {
    if (!ISSUE_STATES.has(issue.state)) {
      errors.push(`${issue.key}: invalid state ${issue.state}`);
    }
    if (["code-review", "reviewed-pending-integration", "in-review", "done"].includes(issue.state)) {
      if (!issue.baseSha) errors.push(`${issue.key}: completed implementation requires baseSha`);
      if (!issue.headSha) errors.push(`${issue.key}: reviewed work requires headSha`);
      if (!issue.implementationProvider) errors.push(`${issue.key}: completed implementation requires implementationProvider`);
      if (!issue.tests) errors.push(`${issue.key}: completed implementation requires tests`);
      if (issue.baseSha && !isFullCommitSha(issue.baseSha)) errors.push(`${issue.key}: baseSha must be a full commit SHA`);
      if (issue.headSha && !isFullCommitSha(issue.headSha)) errors.push(`${issue.key}: headSha must be a full commit SHA`);
      if (issue.tests && issue.headSha && !evidenceBindsHead(issue.tests, issue.headSha)) {
        errors.push(`${issue.key}: tests evidence must include the tested headSha`);
      }
    }
    if (issue.state === "in-review" && !["assembling", "ready-for-human-review", "merged"].includes(manifest.integration?.state)) {
      errors.push(`${issue.key}: in-review requires an assembling or completed integration branch`);
    }
    if (issue.state === "in-review" && manifest.integration?.state === "assembling") {
      if (!manifest.integration.baseSha) errors.push(`${issue.key}: in-review requires integration.baseSha`);
      if (!manifest.integration.headSha) errors.push(`${issue.key}: in-review requires integration.headSha`);
      if (!manifest.integration.pullRequest) errors.push(`${issue.key}: in-review requires integration.pullRequest`);
      if (!manifest.integration.tests) errors.push(`${issue.key}: in-review requires integration.tests`);
      if (
        manifest.integration.tests &&
        manifest.integration.headSha &&
        !evidenceBindsHead(manifest.integration.tests, manifest.integration.headSha)
      ) {
        errors.push(`${issue.key}: integration.tests must include the tested integration headSha`);
      }
      if (manifest.integration.conflictsOccurred && !manifest.integration.conflictReviewReceipt) {
        errors.push(`${issue.key}: in-review requires the integration conflict review receipt`);
      }
    }
    if (["reviewed-pending-integration", "in-review", "done"].includes(issue.state)) {
      if (!issue.reviewReceipt) errors.push(`${issue.key}: reviewed work requires reviewReceipt`);
      if (!issue.reviewProvider) errors.push(`${issue.key}: reviewed work requires reviewProvider`);
      if (
        issue.reviewReceipt &&
        issue.headSha &&
        !receiptBindsReview(issue.reviewReceipt, issue.reviewProvider, issue.headSha)
      ) {
        errors.push(`${issue.key}: reviewReceipt must include the review provider and reviewed headSha`);
      }
    }
    if (
      manifest.policy?.pairMode === "cross" &&
      issue.implementationProvider &&
      issue.reviewProvider &&
      issue.implementationProvider === issue.reviewProvider
    ) {
      errors.push(`${issue.key}: cross mode requires a different review provider`);
    }
  }

  if (["ready-for-human-review", "merged"].includes(manifest.integration?.state)) {
    const allowedStates = manifest.integration.state === "merged" ? new Set(["in-review", "done"]) : new Set(["in-review"]);
    if (manifest.issues.some((issue) => !allowedStates.has(issue.state))) {
      errors.push(`every issue must be ${manifest.integration.state === "merged" ? "in-review or done" : "in-review"} before integration is ${manifest.integration.state}`);
    }
    if (!manifest.integration.baseSha) errors.push("integration.baseSha is required");
    if (!manifest.integration.headSha) errors.push("integration.headSha is required");
    if (!manifest.integration.pullRequest) errors.push("integration.pullRequest is required");
    if (!manifest.integration.tests) errors.push("integration.tests is required");
    if (
      manifest.integration.tests &&
      manifest.integration.headSha &&
      !evidenceBindsHead(manifest.integration.tests, manifest.integration.headSha)
    ) {
      errors.push("integration.tests evidence must include the tested headSha");
    }
    if (manifest.integration.baseSha && !isFullCommitSha(manifest.integration.baseSha)) {
      errors.push("integration.baseSha must be a full commit SHA");
    }
    if (manifest.integration.headSha && !isFullCommitSha(manifest.integration.headSha)) {
      errors.push("integration.headSha must be a full commit SHA");
    }
    if (manifest.integration.conflictsOccurred && !manifest.integration.conflictReviewReceipt) {
      errors.push("integration conflict resolutions require an independent review receipt");
    }
    if (
      manifest.integration.conflictsOccurred &&
      manifest.integration.conflictReviewReceipt &&
      manifest.integration.headSha &&
      !evidenceBindsHead(manifest.integration.conflictReviewReceipt, manifest.integration.headSha)
    ) {
      errors.push("integration conflict review receipt must include the reviewed headSha");
    }
  }

  return errors;
}

function assertManifestValid(manifest) {
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    fail(`Refusing to write an invalid workload manifest:\n- ${errors.join("\n- ")}`);
  }
}

function commandShow(cwd, options) {
  const repository = resolveRepository(cwd);
  const runReference = requireTextOption(options.run, "run");
  const { filePath, manifest } = readManifest(repository, runReference);
  return { filePath, manifest };
}

function commandValidate(cwd, options) {
  const { filePath, manifest } = commandShow(cwd, options);
  const errors = validateManifest(manifest);
  return { filePath, valid: errors.length === 0, errors, manifest };
}

function commandList(cwd) {
  const repository = resolveRepository(cwd);
  const directory = stateDirectory(repository);
  if (!fs.existsSync(directory)) {
    return { directory, runs: [] };
  }
  const runs = fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const filePath = path.join(directory, name);
      try {
        const manifest = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return {
          id: manifest.id,
          name: manifest.name,
          updatedAt: manifest.updatedAt,
          integrationState: manifest.integration?.state ?? null,
          issueCount: manifest.issues?.length ?? 0,
          filePath,
          error: null
        };
      } catch (error) {
        return {
          id: path.basename(name, ".json"),
          name: null,
          updatedAt: null,
          integrationState: null,
          issueCount: null,
          filePath,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    })
    .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
  return { directory, runs };
}

function printUsage() {
  process.stdout.write(
    [
      "Usage:",
      "  workload-manifest.mjs init --name <name> --issues <keys> [--status Todo] [--labels Bug] [--pair cross|codex-only|claude-only]",
      "  workload-manifest.mjs pair --pair <mode> --implementer <provider> [--reviewer <provider>]",
      "  workload-manifest.mjs set-issue --run <id> --issue <key> [fields]",
      "  workload-manifest.mjs set-integration --run <id> [fields]",
      "  workload-manifest.mjs show --run <id>",
      "  workload-manifest.mjs validate --run <id>",
      "  workload-manifest.mjs list",
      "",
      "Review receipts use <provider>:<full-head-sha>:<receipt-id>; test evidence must include the tested full head SHA.",
      "Integration must transition pending -> assembling -> ready-for-human-review -> merged.",
      "All commands accept --cwd <repository-or-worktree-or-subdirectory>. Output is JSON."
    ].join("\n") + "\n"
  );
}

function main() {
  const [command, ...argv] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help") {
    printUsage();
    return;
  }
  const { options } = parseArgs(argv);
  const cwd = options.cwd === undefined ? process.cwd() : path.resolve(process.cwd(), requireTextOption(options.cwd, "cwd"));
  let result;

  switch (command) {
    case "init":
      result = commandInit(cwd, options);
      break;
    case "pair": {
      const pairMode = String(options.pair ?? "cross").toLowerCase();
      if (!PAIR_MODES.has(pairMode)) fail(`Unsupported pair mode "${pairMode}".`);
      result = { pairMode, ...normalizePairSelection(pairMode, options.implementer, options.reviewer) };
      break;
    }
    case "set-issue":
      result = commandSetIssue(cwd, options);
      break;
    case "set-integration":
      result = commandSetIntegration(cwd, options);
      break;
    case "show":
      result = commandShow(cwd, options);
      break;
    case "validate":
      result = commandValidate(cwd, options);
      if (!result.valid) process.exitCode = 2;
      break;
    case "list":
      result = commandList(cwd);
      break;
    default:
      fail(`Unknown command "${command}".`);
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (executedPath === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

export {
  main,
  normalizeProvider,
  reviewerFor,
  slugify,
  validateManifest,
  withFileLock
};
