#!/usr/bin/env node

import { resolveModel, resolveRouting, validateEffort } from "./lib/model-policy.mjs";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCHEMA_VERSION = 3;
const WORKFLOW_KIT_VERSION = "0.9.3";
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
  if (!Number.isSafeInteger(parsed)) fail(`${name} must be a safe positive integer.`);
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
  if (["codex", "codex-sol", "sol", "gpt-5.6-sol", "astra", "gpt-6-astra", "terra", "gpt-5.6-terra"].includes(provider)) {
    return "codex";
  }
  if (["claude", "claude-opus", "opus", "opus-5", "claude-opus-5", "fable", "claude-fable-5-1"].includes(provider)) {
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

const REVIEW_CONVERGENCE = {
  firstRoundBlocks: ["high", "medium"],
  laterRoundsBlock: ["high", "medium"],
  alwaysBlocks: ["acceptance", "correctness", "security", "data-loss"],
  remainingFindings: "Deferral requires run-scoped approval, a linked follow-up, and no acceptance/correctness/security/data-loss blocker."
};

function addReviewTracking(manifest) {
  if (manifest.policy.maxReviewRounds === undefined) manifest.policy.maxReviewRounds = null;
  manifest.policy.reviewConvergence ??= REVIEW_CONVERGENCE;
  manifest.policy.reviewPolicy ??= "legacy-unverified";
  manifest.policy.decisions ??= [];
  for (const issue of manifest.issues) {
    if (issue.reviewRounds === undefined) {
      issue.reviewRounds = 0;
      issue.reviewHistory = [];
      issue.reviewHistoryUnknownBeforeMigration = true;
    }
    issue.reviewFindings ??= [];
  }
}

// Called under the manifest lock. JSON is authoritative if a crash interrupts
// the derived handoff write; compare updatedAt when reconciling a resume.
function writeCheckpoint(filePath, manifest) {
  atomicWriteJson(filePath, manifest);
  // Narrative stays in the repository's canonical handoff surface (the synced
  // issue thread in Linear). A local derived snapshot is optional, not a gate.
  if (!manifest.policy.handoffSnapshot) return;
  const folder = path.join(path.dirname(filePath), manifest.id);
  fs.mkdirSync(folder, { recursive: true });
  const clean = (value) => String(value ?? "—").replace(/[\r\n|]/g, " ");
  const lines = [
    `# Handoff: ${clean(manifest.name)}`, "",
    `Manifest updatedAt: ${manifest.updatedAt}`, `Source of truth: ${filePath}`, "",
    "Resume: reconcile the manifest with Git, tracker, worker jobs, and review receipts before spawning.",
    "Human acceptance is separate; never infer merge permission from this checkpoint.", "",
    `Review limit: ${manifest.policy.maxReviewRounds ?? "legacy unknown"}; policy: ${manifest.policy.reviewPolicy}. Thresholds never confer approval.`,
    `Integration: ${clean(manifest.integration.state)} · ${clean(manifest.integration.branch)}`,
    `Base: ${clean(manifest.integration.baseSha)} · Head: ${clean(manifest.integration.headSha)}`,
    `PR: ${clean(manifest.integration.pullRequest)} · Tests: ${clean(manifest.integration.tests)}`,
    `Blocker: ${clean(manifest.integration.blocker)}`, "",
    "| Issue | Gate | Review rounds | Head | Worker | Receipt / tests | Blocker / follow-ups |",
    "| --- | --- | --- | --- | --- | --- | --- |"
  ];
  for (const issue of manifest.issues) {
    const execution = issue.reviewExecution ?? issue.implementationExecution;
    const followUps = [...new Set([...(issue.reviewFindings ?? []),
      ...(issue.reviewHistory ?? []).flatMap(round => round.findings ?? [])]
      .filter(f => f.followUp).map(f => f.followUp))];
    lines.push(`| ${[issue.key, issue.state,
      `${issue.reviewRounds ?? 0}${issue.reviewHistoryUnknownBeforeMigration ? " + unknown historical rounds" : ""}`,
      issue.headSha, execution ? `${execution.workerId} (${execution.requestedModel ?? "unknown"}, ${execution.effort ?? "unknown"})` : null,
      `${issue.reviewReceipt ?? "no receipt"}; ${issue.tests ?? "no tests"}`,
      `${issue.blocker ?? "none"}; ${followUps.join(", ")}`
    ].map(clean).join(" | ")} |`);
  }
  fs.writeFileSync(path.join(folder, `handoff-${manifest.updatedAt.slice(0, 10)}.md`), `${lines.join("\n")}\n`, "utf8");
}

function beginReviewRound(manifest, issue, options) {
  if (!["strict", "convergent"].includes(manifest.policy.reviewPolicy) || manifest.policy.maxReviewRounds === null) {
    fail("Legacy run policy is unverified. Reconcile its prior decisions, then use set-policy with --policy-decision before launching a review.");
  }
  const round = issue.reviewRounds + 1;
  const extra = booleanOption(options, "allow-extra-round");
  const reason = extra ? requireTextOption(options.reason, "reason") : null;
  if (round > manifest.policy.maxReviewRounds && !extra) {
    fail(`Review round ${round} exceeds maxReviewRounds ${manifest.policy.maxReviewRounds}. Stop and report the blocker, or use --allow-extra-round --reason with explicit authorization.`);
  }
  if (issue.reviewHistory.length) {
    const previous = issue.reviewHistory.at(-1);
    if (issue.reviewReceipt) previous.receipt = issue.reviewReceipt;
  }
  issue.reviewRounds = round;
  issue.reviewHistory.push({ id: `${manifest.id}/${issue.key}/${round}`, round, headSha: issue.headSha, startedAt: nowIso(), extraRoundReason: reason });
  issue.reviewExecution = null;
  issue.reviewReceipt = null;
  issue.reviewFindings = [];
}

function configurePolicy(manifest, options, { initial = false } = {}) {
  const policy = manifest.policy;
  const reviewPolicy = options["review-policy"] ?? (initial ? "strict" : policy.reviewPolicy);
  if (!["strict", "convergent"].includes(reviewPolicy)) fail("--review-policy must be strict or convergent.");
  const decision = options["policy-decision"] === undefined ? null : requireTextOption(options["policy-decision"], "policy-decision");
  if ((!initial || reviewPolicy === "convergent") && !decision) fail("This policy requires --policy-decision with the run-scoped user decision reference.");
  policy.maxReviewRounds = parsePositiveInteger(options["max-review-rounds"], policy.maxReviewRounds ?? 2, "max-review-rounds");
  policy.reviewPolicy = reviewPolicy;
  policy.reviewConvergence = { ...REVIEW_CONVERGENCE, laterRoundsBlock: reviewPolicy === "convergent" ? ["high"] : ["high", "medium"] };
  if (options["handoff-snapshot"] !== undefined) policy.handoffSnapshot = booleanOption(options, "handoff-snapshot");
  if (options.routing !== undefined) {
    const request = JSON.parse(requireTextOption(options.routing, "routing"));
    if (!request || Array.isArray(request) || !request.implementation || !request.review) fail("--routing requires implementation and review route objects.");
    policy.routing = Object.fromEntries(["implementation", "review"].map(role => [role, resolveRouting({ ...request[role], task: role === "review" ? "review" : request[role].task ?? "coding" })]));
  }
  policy.decisions ??= [];
  policy.decisions.push({ at: nowIso(), scope: manifest.id, source: decision ? "user-decision" : "package-default-or-cli-request", reference: decision,
    reviewPolicy, maxReviewRounds: policy.maxReviewRounds, routing: policy.routing ?? null, handoffSnapshot: policy.handoffSnapshot ?? false });
}

function commandSetPolicy(cwd, options) {
  const repository = resolveRepository(cwd), run = requireTextOption(options.run, "run");
  const filePath = manifestPath(repository, run);
  return withFileLock(filePath, () => {
    const { manifest } = readManifest(repository, run);
    addReviewTracking(manifest);
    configurePolicy(manifest, options);
    manifest.updatedAt = nowIso();
    assertManifestValid(manifest);
    writeCheckpoint(filePath, manifest);
    return { filePath, policy: manifest.policy };
  });
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
      maxReviewRounds: parsePositiveInteger(options["max-review-rounds"], 2, "max-review-rounds"),
      reviewConvergence: REVIEW_CONVERGENCE,
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
      implementationExecution: null,
      reviewExecution: null,
      reviewReceipt: null,
      reviewRounds: 0,
      reviewHistory: [],
      reviewFindings: [],
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
  configurePolicy(manifest, options, { initial: true });
  if (booleanOption(options, "dry-run")) {
    return { filePath, written: false, manifest };
  }
  withFileLock(filePath, () => {
    if (fs.existsSync(filePath) && !booleanOption(options, "force")) {
      fail(`Workload "${id}" already exists. Use --resume ${id}, or pass --force intentionally.`);
    }
    writeCheckpoint(filePath, manifest);
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
    addReviewTracking(manifest);
    const issue = manifest.issues.find((candidate) => candidate.key.toLowerCase() === issueKey.toLowerCase());
    if (!issue) {
      fail(`Issue "${issueKey}" is not in workload "${manifest.id}".`);
    }

    const previousReviewExecution = issue.reviewExecution ?? issue.reviewHistory.at(-1)?.execution;
    if (options.state !== undefined) {
      const state = String(options.state);
      if (!ISSUE_STATES.has(state)) {
        fail(`Unsupported issue state "${state}".`);
      }
      issue.state = state;
      if (state === "implementing") {
        issue.implementationExecution = null;
        issue.reviewExecution = null;
        issue.reviewReceipt = null;
      }
    }
    assignIfPresent(issue, "branch", options.branch, String);
    assignIfPresent(issue, "worktree", options.worktree, (value) => path.resolve(repository.root, String(value)));
    assignIfPresent(issue, "baseSha", options["base-sha"], (value) => resolveCommit(repository, value, "--base-sha"), "base-sha");
    assignIfPresent(issue, "headSha", options["head-sha"], (value) => resolveCommit(repository, value, "--head-sha"), "head-sha");
    assignIfPresent(issue, "pullRequest", options.pr, String);
    assignIfPresent(issue, "implementationProvider", options.implementer, (value) => normalizeProvider(value, { allowAuto: false }));
    assignIfPresent(issue, "reviewProvider", options.reviewer, (value) => normalizeProvider(value, { allowAuto: false }));
    const nextReviewExecution = options["review-execution"] === undefined ? null
      : JSON.parse(requireTextOption(options["review-execution"], "review-execution"));
    const completedReview = ["reviewed-pending-integration", "in-review", "done"].includes(issue.state);
    // A new review worker is a new round even if a caller omits the state flag.
    if (options.state === "code-review" ||
        (nextReviewExecution && previousReviewExecution && nextReviewExecution.workerId !== previousReviewExecution.workerId) ||
        (completedReview && issue.reviewHistory.length > 0 && issue.reviewHistory.at(-1).headSha !== issue.headSha) ||
        (completedReview && issue.reviewRounds === 0 && !issue.reviewHistoryUnknownBeforeMigration)) {
      beginReviewRound(manifest, issue, options);
    }
    for (const role of ["implementation", "review"]) {
      const input = options[`${role}-execution`];
      if (input !== undefined) {
        issue[`${role}Execution`] = JSON.parse(requireTextOption(input, `${role}-execution`));
        if (issue[`${role}Execution`]?.legacy) fail("Legacy execution records can only be created by schema migration.");
      }
    }
    assignIfPresent(issue, "reviewReceipt", options["review-receipt"], String, "review-receipt");
    if (options["review-findings"] !== undefined) {
      issue.reviewFindings = JSON.parse(requireTextOption(options["review-findings"], "review-findings"));
      if (Array.isArray(issue.reviewFindings)) {
        const previous = issue.reviewHistory.slice(0, -1).flatMap(round => round.findings ?? []);
        issue.reviewFindings = issue.reviewFindings.map(finding => ({ ...finding,
          occurrence: previous.some(old => old.id === finding?.id) ? "repeated" : "new" }));
      }
    }
    if (options["resume-context"] !== undefined) {
      const context = JSON.parse(requireTextOption(options["resume-context"], "resume-context"));
      if (!context || typeof context !== "object" || Array.isArray(context)) fail("--resume-context must be an object.");
      issue.resumeContext = context;
    }
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
    if (issue.reviewHistory.length && (issue.state === "code-review" || completedReview)) {
      Object.assign(issue.reviewHistory.at(-1), { findings: issue.reviewFindings, receipt: issue.reviewReceipt, execution: issue.reviewExecution });
    }
    assertManifestValid(manifest);
    writeCheckpoint(filePath, manifest);
    return { filePath, issue, manifestId: manifest.id };
  });
}

function commandSetIntegration(cwd, options) {
  const repository = resolveRepository(cwd);
  const runReference = requireTextOption(options.run, "run");
  const filePath = manifestPath(repository, runReference);
  return withFileLock(filePath, () => {
    const { manifest } = readManifest(repository, runReference);
    addReviewTracking(manifest);
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
    writeCheckpoint(filePath, manifest);
    return { filePath, integration, manifestId: manifest.id };
  });
}


export function validateExecution(value, provider) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("must be an object");
  if (value.legacy === true) {
    if (value.resolvedModel !== null || value.effort !== null || value.workerId !== null) throw new Error("legacy metadata must remain unknown");
    return;
  }
  for (const key of ["requestedModel", "workerId", "policyVersion"]) {
    if (typeof value[key] !== "string" || !value[key].trim()) throw new Error(`${key} is required`);
  }
  const requested = resolveModel(value.requestedModel);
  if (provider && requested.provider !== provider) throw new Error("model/provider mismatch");
  validateEffort(value.effort, value.highReason);
  if (value.resolvedEffort != null) validateEffort(value.resolvedEffort, value.highReason);
  if (value.resolvedModel !== null) {
    const resolved = resolveModel(value.resolvedModel);
    if (resolved.provider !== requested.provider) throw new Error("resolved model/provider mismatch");
    if (resolved.id !== requested.id && !String(value.fallbackReason ?? "").trim()) throw new Error("fallbackReason is required for substitution");
  } else if (value.resolutionStatus !== "unverified") throw new Error("unknown resolvedModel requires resolutionStatus unverified");
}

function commandMigrate(cwd, options) {
  const repository = resolveRepository(cwd);
  const run = requireTextOption(options.run, "run");
  const filePath = manifestPath(repository, run);
  const dryRun = booleanOption(options, "dry-run");
  const migrate = () => {
    const { manifest } = readManifest(repository, run);
    if (![2, 3].includes(manifest.schemaVersion)) fail("Only schema 2 or 3 can be migrated.");
    if (manifest.schemaVersion === 2) {
      for (const issue of manifest.issues) {
        for (const role of ["implementation", "review"]) {
          issue[`${role}Execution`] ??= { legacy: true, resolvedModel: null, effort: null, workerId: null };
        }
      }
      manifest.schemaVersion = 3;
      manifest.workflowKitVersion = WORKFLOW_KIT_VERSION;
    }
    addReviewTracking(manifest);
    assertManifestValid(manifest);
    if (!dryRun) writeCheckpoint(filePath, manifest);
    return { filePath, written: !dryRun, manifest };
  };
  return dryRun ? migrate() : withFileLock(filePath, migrate);
}

function validateManifest(manifest) {
  const errors = [];
  const isFullCommitSha = (value) => typeof value === "string" && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(value);
  const evidenceBindsHead = (receipt, headSha) =>
    typeof receipt === "string" && typeof headSha === "string" && receipt.includes(headSha);
  const receiptBindsReview = (receipt, provider, headSha) =>
    evidenceBindsHead(receipt, headSha) && typeof provider === "string" && receipt.toLowerCase().includes(provider);
  if (![2, SCHEMA_VERSION].includes(manifest.schemaVersion)) {
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
  const limit = manifest.policy?.maxReviewRounds;
  if (limit !== undefined && limit !== null && (!Number.isSafeInteger(limit) || limit < 1)) errors.push("policy.maxReviewRounds must be a positive safe integer");

  for (const issue of manifest.issues ?? []) {
    if (limit !== undefined) {
      if (!Number.isSafeInteger(issue.reviewRounds) || issue.reviewRounds < 0 ||
          !Array.isArray(issue.reviewHistory) || issue.reviewHistory.length !== issue.reviewRounds) {
        errors.push(`${issue.key}: reviewRounds must match reviewHistory`);
      } else {
        for (const [index, round] of issue.reviewHistory.entries()) {
          if (round.round !== index + 1 || !isFullCommitSha(round.headSha)) errors.push(`${issue.key}: invalid review history`);
          if (limit !== null && round.round > limit && (typeof round.extraRoundReason !== "string" || !round.extraRoundReason.trim())) {
            errors.push(`${issue.key}: extra review round requires a reason`);
          }
        }
      }
    }
    if (issue.reviewFindings !== undefined) {
      if (!Array.isArray(issue.reviewFindings)) errors.push(`${issue.key}: reviewFindings must be an array`);
      else for (const finding of issue.reviewFindings) {
        if (!finding || typeof finding.id !== "string" || !finding.id.trim() ||
            typeof finding.blocking !== "boolean" || typeof finding.category !== "string" || !finding.category.trim() ||
            !["high", "medium", "low"].includes(finding.severity) ||
            !["open", "resolved", "deferred"].includes(finding.status) ||
            typeof finding.summary !== "string" || !finding.summary.trim()) {
          errors.push(`${issue.key}: invalid review finding`); continue;
        }
        if (["reviewed-pending-integration", "in-review", "done"].includes(issue.state) && finding.status !== "resolved") {
          const approved = manifest.policy.reviewPolicy === "convergent" && manifest.policy.decisions?.some(d => d.reviewPolicy === "convergent" && typeof d.reference === "string" && d.reference.trim());
          if (finding.blocking === true || ["acceptance", "correctness", "security", "data-loss"].includes(finding.category)) {
            errors.push(`${issue.key}: acceptance/correctness/security/data-loss finding blocks regardless of severity`);
          } else if (finding.severity === "high" || (finding.severity === "medium" && (issue.reviewRounds < 2 || !approved))) {
            errors.push(`${issue.key}: unresolved ${finding.severity} finding blocks this review round`);
          } else if (!approved || finding.status !== "deferred" || typeof finding.followUp !== "string" || !finding.followUp.trim() || typeof finding.decision !== "string" || !finding.decision.trim()) {
            errors.push(`${issue.key}: unresolved finding requires approved deferral, a decision reference, and a linked follow-up issue`);
          }
        }
      }
    }
    if (issue.implementationExecution?.workerId && issue.implementationExecution.workerId === issue.reviewExecution?.workerId) {
      errors.push(`${issue.key}: implementation and review must use different worker sessions`);
    }
    for (const role of ["implementation", "review"]) {
      const execution = issue[`${role}Execution`];
      const completed = role === "implementation"
        ? ["code-review", "reviewed-pending-integration", "in-review", "done"].includes(issue.state)
        : ["reviewed-pending-integration", "in-review", "done"].includes(issue.state);
      if (manifest.schemaVersion === 3 && completed && !execution) errors.push(`${issue.key}: ${role}Execution is required`);
      if (execution) {
        try { validateExecution(execution, issue[`${role === "review" ? "review" : "implementation"}Provider`]); }
        catch (error) { errors.push(`${issue.key}: ${role}Execution: ${error.message}`); }
      }
    }
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
    if (issue.state === "done" && manifest.integration?.state !== "merged") {
      errors.push(`${issue.key}: done requires a merged integration branch`);
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
      "  workload-manifest.mjs migrate --run <id> [--dry-run]",
      "  workload-manifest.mjs set-policy --run <id> --policy-decision <reference> [--review-policy strict|convergent] [--max-review-rounds <n>] [--routing <JSON>] [--handoff-snapshot true|false]",
      "  workload-manifest.mjs show --run <id>",
      "init accepts --max-review-rounds <n> (default 2). Each --state code-review records a new round before dispatch.",
      "Strict review is default. Convergent deferral requires --review-policy convergent --policy-decision <reference>. Thresholds never confer approval.",
      "Extra rounds require --allow-extra-round --reason <authorized reason>. Findings: --review-findings JSON array of {id, severity, category, blocking, status, summary, followUp, decision}.",
      "set-issue accepts --implementation-execution and --review-execution JSON with requestedModel, resolvedModel (null if unverified), effort, highReason, workerId, policyVersion, fallbackReason.",
      "set-issue --resume-context accepts JSON for the intended environment, user-task acceptance evidence, owned runtime/jobs, prerequisites, and nextAction.",
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
    case "migrate":
      result = commandMigrate(cwd, options);
      break;
    case "set-policy":
      result = commandSetPolicy(cwd, options);
      break;
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
