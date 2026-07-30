#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCHEMA_VERSION = 1;
const WORKFLOW_KIT_VERSION = "0.8.2";
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
  const commonDir = path.resolve(root, commonDirValue);
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
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    fail(`${name} must be a positive integer.`);
  }
  return parsed;
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
  fs.renameSync(temporaryPath, filePath);
}

const LOCK_SLEEP = new Int32Array(new SharedArrayBuffer(4));

function sleepSync(milliseconds) {
  Atomics.wait(LOCK_SLEEP, 0, 0, milliseconds);
}

function withFileLock(filePath, callback, options = {}) {
  const lockPath = `${filePath}.lock`;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const staleMs = options.staleMs ?? 5 * 60_000;
  const deadline = Date.now() + timeoutMs;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  let handle = null;
  while (handle == null) {
    try {
      handle = fs.openSync(lockPath, "wx");
      fs.writeFileSync(handle, `${JSON.stringify({ pid: process.pid, createdAt: nowIso() })}\n`, "utf8");
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      try {
        if (Date.now() - fs.statSync(lockPath).mtimeMs >= staleMs) {
          fs.unlinkSync(lockPath);
          continue;
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
      fs.unlinkSync(lockPath);
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

function resolveCommit(repository, reference) {
  const result = runGit(repository.root, ["rev-parse", "--verify", `${reference}^{commit}`], {
    allowFailure: true
  });
  if (result.status !== 0) {
    fail(`Base ref "${reference}" does not resolve to a commit. Fetch it or pass --base explicitly.`);
  }
  return result.stdout;
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
  const name = String(options.name ?? "").trim();
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
      allowPartial: Boolean(options["allow-partial"]),
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
      conflictResolutionReviewed: false,
      blocker: null,
      updatedAt: timestamp
    }
  };

  const filePath = manifestPath(repository, id);
  if (options["dry-run"]) {
    return { filePath, written: false, manifest };
  }
  withFileLock(filePath, () => {
    if (fs.existsSync(filePath) && !options.force) {
      fail(`Workload "${id}" already exists. Use --resume ${id}, or pass --force intentionally.`);
    }
    atomicWriteJson(filePath, manifest);
  });
  return { filePath, written: true, manifest };
}

function assignIfPresent(target, property, value, transform = (item) => item) {
  if (value !== undefined) {
    target[property] = transform(value);
  }
}

function commandSetIssue(cwd, options) {
  const repository = resolveRepository(cwd);
  const runReference = options.run;
  const issueKey = String(options.issue ?? "").trim();
  if (!runReference || !issueKey) {
    fail("set-issue requires --run <id> and --issue <key>.");
  }
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
    assignIfPresent(issue, "baseSha", options["base-sha"], String);
    assignIfPresent(issue, "headSha", options["head-sha"], String);
    assignIfPresent(issue, "pullRequest", options.pr, String);
    assignIfPresent(issue, "implementationProvider", options.implementer, (value) => normalizeProvider(value, { allowAuto: false }));
    assignIfPresent(issue, "reviewProvider", options.reviewer, (value) => normalizeProvider(value, { allowAuto: false }));
    assignIfPresent(issue, "reviewReceipt", options["review-receipt"], String);
    assignIfPresent(issue, "tests", options.tests, String);
    assignIfPresent(issue, "blocker", options.blocker, String);
    if (options["clear-blocker"]) {
      issue.blocker = null;
    }

    if (issue.implementationProvider && !issue.reviewProvider) {
      issue.reviewProvider = reviewerFor(manifest.policy.pairMode, issue.implementationProvider);
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
  if (!options.run) {
    fail("set-integration requires --run <id>.");
  }
  const filePath = manifestPath(repository, options.run);
  return withFileLock(filePath, () => {
    const { manifest } = readManifest(repository, options.run);
    const integration = manifest.integration;

    if (options.state !== undefined) {
      const state = String(options.state);
      if (!INTEGRATION_STATES.has(state)) {
        fail(`Unsupported integration state "${state}".`);
      }
      integration.state = state;
    }
    assignIfPresent(integration, "branch", options.branch, String);
    assignIfPresent(integration, "baseRef", options.base, String);
    assignIfPresent(integration, "baseSha", options["base-sha"], String);
    assignIfPresent(integration, "headSha", options["head-sha"], String);
    assignIfPresent(integration, "pullRequest", options.pr, String);
    assignIfPresent(integration, "tests", options.tests, String);
    assignIfPresent(integration, "blocker", options.blocker, String);
    if (options["clear-blocker"]) {
      integration.blocker = null;
    }
    if (options["conflict-review-complete"]) {
      integration.conflictResolutionReviewed = true;
    }
    if (options["conflicts-occurred"]) {
      integration.conflictsOccurred = true;
    }
    if (options["no-conflicts"]) {
      integration.conflictsOccurred = false;
      integration.conflictResolutionReviewed = false;
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
    }
    if (["reviewed-pending-integration", "in-review", "done"].includes(issue.state)) {
      if (!issue.reviewReceipt) errors.push(`${issue.key}: reviewed work requires reviewReceipt`);
      if (!issue.reviewProvider) errors.push(`${issue.key}: reviewed work requires reviewProvider`);
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
    if (manifest.integration.conflictsOccurred && !manifest.integration.conflictResolutionReviewed) {
      errors.push("integration conflict resolutions require an independent review receipt");
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
  if (!options.run) {
    fail("show requires --run <id>.");
  }
  const { filePath, manifest } = readManifest(repository, options.run);
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
      "All commands accept --cwd <repository-or-worktree>. Output is JSON."
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
  const cwd = options.cwd ? path.resolve(process.cwd(), String(options.cwd)) : process.cwd();
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
