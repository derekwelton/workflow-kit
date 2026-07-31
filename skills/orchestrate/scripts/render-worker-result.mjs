#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

function values(value) {
  if (Array.isArray(value)) return value.filter((item) => item != null && String(item).trim());
  if (value == null || String(value).trim() === "") return [];
  return [value];
}

function plainText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function inlineCode(value) {
  const content = plainText(value);
  const longestRun = Math.max(0, ...(content.match(/`+/g) ?? []).map((run) => run.length));
  const delimiter = "`".repeat(longestRun + 1);
  const padding = content.startsWith("`") || content.endsWith("`") ? " " : "";
  return `${delimiter}${padding}${content}${padding}${delimiter}`;
}

function normalizedStatus(value) {
  return plainText(value ?? "unknown").toLowerCase();
}

function stageFor(result, override) {
  const candidate = plainText(
    override ?? result.stage ?? result.worker_stage ?? result.workerStage ?? ""
  ).toLowerCase();
  if (["implementation", "implement", "implementer"].includes(candidate)) return "implementation";
  if (["review", "code-review", "code review", "reviewer"].includes(candidate)) return "review";
  if (["integration", "integrate", "integration-review"].includes(candidate)) return "integration";
  if (result.reviewReceipt || result.review_receipt) return "review";
  if (Object.hasOwn(result, "commit_created") || Object.hasOwn(result, "commitCreated")) {
    return "implementation";
  }
  return "unknown";
}

function titleFor(result, stage, hasVerification) {
  const issue = plainText(result.issue ?? "Worker");
  switch (normalizedStatus(result.status ?? result.state)) {
    case "completed":
    case "complete":
      if (!hasVerification) return `${issue} returned an incomplete worker checkpoint`;
      if (stage === "implementation") return `${issue} implementation is ready for coordinator review`;
      if (stage === "review") return `${issue} independent review is complete`;
      if (stage === "integration") return `${issue} integration checkpoint is complete`;
      return `${issue} worker checkpoint is ready for coordinator review`;
    case "blocked":
      return `${issue} is blocked`;
    case "failed":
      return `${issue} worker failed`;
    default:
      return `${issue} worker update`;
  }
}

function leadFor(result, stage, hasVerification, verificationFailed) {
  switch (normalizedStatus(result.status ?? result.state)) {
    case "completed":
    case "complete":
      if (!hasVerification) {
        return "The worker reported completion without verification evidence. The coordinator must treat this as incomplete.";
      }
      if (verificationFailed) {
        return "The worker reported completion with unsuccessful verification. The coordinator must treat this as incomplete.";
      }
      if (stage === "implementation") {
        return "The implementation worker finished its pass. This is a worker checkpoint, not the final workload handoff.";
      }
      if (stage === "review") {
        return "The independent reviewer finished its pass. The coordinator still needs to adjudicate findings and bind the receipt to the final head.";
      }
      if (stage === "integration") {
        return "The integration worker finished its pass. The coordinator still needs to validate the combined gate before human handoff.";
      }
      return "The worker finished its pass. This is a worker checkpoint, not the final workload handoff.";
    case "blocked":
      return "The worker could not complete this issue. The workload coordinator will reconcile the blocker before continuing.";
    case "failed":
      return "The worker run failed. The workload coordinator will inspect the failure before deciding whether to retry.";
    default:
      return "The worker returned an intermediate checkpoint for coordinator review.";
  }
}

function formatValidation(entry) {
  if (typeof entry !== "object" || entry == null) return plainText(entry);
  const rawStatus = normalizedStatus(entry.result ?? entry.status);
  const labels = {
    pass: "Passed",
    passed: "Passed",
    success: "Passed",
    succeeded: "Passed",
    fail: "Failed",
    failed: "Failed",
    error: "Failed",
    blocked: "Blocked",
    skipped: "Skipped",
    unknown: "Unknown"
  };
  const label = labels[rawStatus] ?? plainText(entry.result ?? entry.status ?? "Unknown");
  const testCount = Number(entry.tests);
  const count = Number.isFinite(testCount) ? ` — ${testCount} tests` : "";
  const command = entry.command ? ` — ${inlineCode(entry.command)}` : "";
  const details = entry.details ? ` — ${plainText(entry.details)}` : "";
  return `${label}${count}${command}${details}`;
}

function hasFailedVerification(validation) {
  return validation.some((entry) => {
    if (typeof entry === "object" && entry != null) {
      return ["fail", "failed", "error", "blocked"].includes(
        normalizedStatus(entry.result ?? entry.status)
      );
    }
    return /\b(fail(?:ed|ure)?|error|blocked)\b/i.test(String(entry));
  });
}

function nextActionFor(result, stage, hasVerification, verificationFailed) {
  const status = normalizedStatus(result.status ?? result.state);
  if (status === "blocked" || status === "failed") {
    return "The orchestrator will inspect the blocker, record a durable checkpoint, and continue only when the issue is safe to resume.";
  }
  if (!hasVerification) {
    return "The orchestrator must obtain or rerun the required verification before advancing this issue.";
  }
  if (verificationFailed) {
    return "The orchestrator must resolve the failing verification and rerun the affected checks before advancing this issue.";
  }
  if (stage === "implementation" && (result.commit_created === false || result.commitCreated === false)) {
    return "The orchestrator will audit the worktree, commit the accepted changes, and then move the issue into independent code review.";
  }
  if (stage === "implementation") {
    return "The orchestrator will verify the recorded head, start independent code review, and continue the workload from that result.";
  }
  if (stage === "review") {
    return "The orchestrator will adjudicate the findings, rerun affected checks after any fixes, and record a review receipt for the final head.";
  }
  if (stage === "integration") {
    return "The orchestrator will validate the combined branch and its current-main gate before preparing the human test handoff.";
  }
  return "The orchestrator will validate this checkpoint against the manifest and continue from the appropriate workflow gate.";
}

export function renderWorkerResult(result, { technical = false, stage: stageOverride } = {}) {
  if (typeof result !== "object" || result == null || Array.isArray(result)) {
    throw new Error("Worker result must be a JSON object.");
  }

  const summary = values(result.summary);
  const primaryValidation = values(result.validation);
  const validation = primaryValidation.length > 0 ? primaryValidation : values(result.tests);
  const notes = values(result.notes ?? result.discoveries);
  const stage = stageFor(result, stageOverride);
  const hasVerification = validation.length > 0;
  const verificationFailed = hasFailedVerification(validation);
  const ready = hasVerification && !verificationFailed;
  const branch = result.branch ? String(result.branch) : null;
  const head = result.head_sha ?? result.headSha;
  const lines = [
    `## ${titleFor(result, stage, ready)}`,
    "",
    leadFor(result, stage, hasVerification, verificationFailed)
  ];

  if (summary.length > 0) {
    lines.push("", "### What changed", "", ...summary.map((item) => `- ${plainText(item)}`));
  }
  const verificationLines = hasVerification
    ? validation.map((item) => `- ${formatValidation(item)}`)
    : ["- No verification evidence was returned; the coordinator must not advance this issue from this checkpoint."];
  lines.push("", "### Verification", "", ...verificationLines);
  if (notes.length > 0) {
    lines.push("", "### Notes", "", ...notes.map((item) => `- ${plainText(item)}`));
  }

  lines.push("", "### Next", "", nextActionFor(result, stage, hasVerification, verificationFailed));

  const details = [];
  if (technical && branch) details.push(`Branch: ${inlineCode(branch)}`);
  if (technical && head) details.push(`Head: ${inlineCode(head)}`);
  if (technical && (result.worktree || result.worktreePath)) {
    details.push(`Worktree: ${inlineCode(result.worktree ?? result.worktreePath)}`);
  }
  if (technical && (result.base_sha || result.baseSha)) {
    details.push(`Base: ${inlineCode(result.base_sha ?? result.baseSha)}`);
  }
  if (details.length > 0) {
    lines.push("", "### Technical details", "", ...details.map((item) => `- ${item}`));
  }

  return `${lines.join("\n")}\n`;
}

function usage() {
  return [
    "Usage:",
    "  node render-worker-result.mjs [--stage <implementation|review|integration>] [--technical] [file]",
    "",
    "Reads a worker-result JSON object from a file or stdin and prints a human checkpoint."
  ].join("\n");
}

export function parseArgs(argv) {
  const options = { technical: false, stage: undefined, file: undefined, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--technical") {
      options.technical = true;
    } else if (arg === "--stage") {
      const stage = argv[index + 1];
      if (!stage) throw new Error("--stage requires implementation, review, or integration.");
      options.stage = stage;
      index += 1;
    } else if (arg.startsWith("--stage=")) {
      options.stage = arg.slice("--stage=".length);
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown argument: ${arg}`);
    } else if (options.file) {
      throw new Error("Only one input file may be provided.");
    } else {
      options.file = arg;
    }
  }
  if (options.stage && stageFor({}, options.stage) === "unknown") {
    throw new Error(`Unknown worker stage: ${options.stage}`);
  }
  return options;
}

export function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const source = options.file ? fs.readFileSync(options.file, "utf8") : fs.readFileSync(0, "utf8");
  process.stdout.write(renderWorkerResult(JSON.parse(source), options));
}

function sameFile(left, right) {
  try {
    return fs.realpathSync.native(left) === fs.realpathSync.native(right);
  } catch {
    return path.resolve(left) === path.resolve(right);
  }
}

if (process.argv[1] && sameFile(fileURLToPath(import.meta.url), process.argv[1])) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
