#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PASSED_STATUSES = new Set(["pass", "passed", "success", "succeeded"]);
const FAILED_STATUSES = new Set(["fail", "failed", "failure", "error", "blocked"]);
const OMITTED_TECHNICAL_TEXT = "[technical path omitted; use --technical]";

function values(value) {
  if (Array.isArray(value)) return value.filter((item) => item != null && String(item).trim());
  if (value == null || String(value).trim() === "") return [];
  return [value];
}

function plainText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function containsAbsolutePath(value) {
  const text = String(value);
  return (
    /(^|[^A-Za-z0-9])[A-Za-z]:[\\/](?![\\/])/.test(text) ||
    /\\\\(?=\S)/.test(text) ||
    /(^|[^A-Za-z0-9:/.])\/(?![\/\s])/.test(text) ||
    /(^|[^A-Za-z0-9])~[\\/](?=\S)/.test(text) ||
    /\bfile:\/\/\//i.test(text)
  );
}

function safeText(value, technical = false) {
  const text = plainText(value);
  if (technical) return text;
  if (containsAbsolutePath(text)) return OMITTED_TECHNICAL_TEXT;
  return text.replace(/\b[0-9a-f]{40,64}\b/gi, (sha) => `${sha.slice(0, 12)}…`);
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

function effectiveStatus(result) {
  const status = normalizedStatus(result.status ?? result.state);
  if (values(result.blocker).length > 0 && status !== "failed") return "blocked";
  return status;
}

function titleFor(result, stage, ready, technical) {
  const issue = safeText(result.issue ?? "Worker", technical);
  switch (effectiveStatus(result)) {
    case "completed":
    case "complete":
      if (!ready) return `${issue} returned an incomplete worker checkpoint`;
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

function leadFor(result, stage, verification, hasChangeSummary) {
  switch (effectiveStatus(result)) {
    case "completed":
    case "complete":
      if (verification === "missing") {
        return "The worker reported completion without verification evidence. The coordinator must treat this as incomplete.";
      }
      if (verification === "failed") {
        return "The worker reported completion with unsuccessful verification. The coordinator must treat this as incomplete.";
      }
      if (verification === "incomplete") {
        return "The worker reported completion without conclusive passing verification. The coordinator must treat this as incomplete.";
      }
      if (!hasChangeSummary) {
        return "The worker reported completion without a change summary. The coordinator must inspect the diff before continuing.";
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

function validationStatus(entry) {
  if (typeof entry === "object" && entry != null) {
    const status = normalizedStatus(entry.result ?? entry.status);
    if (PASSED_STATUSES.has(status)) return "passed";
    if (FAILED_STATUSES.has(status)) return "failed";
    return "incomplete";
  }
  const text = String(entry);
  const failureText = text.replace(
    /\b(?:0|no)\s+(?:tests?\s+)?(?:failed|failures?|errors?)\b/gi,
    ""
  );
  if (/\b(fail(?:ed|ure)?|error|blocked)\b/i.test(failureText)) return "failed";
  if (/\b(pass(?:ed|ing)?|success(?:ful|fully)?|succeeded)\b/i.test(text)) return "passed";
  return "incomplete";
}

function verificationState(validation) {
  if (validation.length === 0) return "missing";
  const statuses = validation.map(validationStatus);
  if (statuses.includes("failed")) return "failed";
  if (statuses.includes("incomplete")) return "incomplete";
  return "passed";
}

function formatValidation(entry, technical) {
  if (typeof entry !== "object" || entry == null) {
    const rendered = safeText(entry, technical);
    if (rendered !== OMITTED_TECHNICAL_TEXT) return rendered;
    const status = validationStatus(entry);
    const label = status === "passed" ? "Passed" : status === "failed" ? "Failed" : "Inconclusive";
    return `${label} — ${rendered}`;
  }
  const rawStatus = normalizedStatus(entry.result ?? entry.status);
  const labels = {
    pass: "Passed",
    passed: "Passed",
    success: "Passed",
    succeeded: "Passed",
    fail: "Failed",
    failed: "Failed",
    failure: "Failed",
    error: "Failed",
    blocked: "Blocked",
    skipped: "Skipped",
    unknown: "Unknown"
  };
  const label = labels[rawStatus] ?? safeText(entry.result ?? entry.status ?? "Unknown", technical);
  const rawCount = entry.tests;
  const hasCount =
    (typeof rawCount === "number" && Number.isInteger(rawCount) && rawCount >= 0) ||
    (typeof rawCount === "string" && /^\d+$/.test(rawCount.trim()));
  const count = hasCount ? ` — ${Number(rawCount)} tests` : "";
  const commandText = safeText(entry.command ?? "", technical);
  const command = commandText ? ` — ${inlineCode(commandText)}` : "";
  const detailsText = safeText(entry.details ?? "", technical);
  const details = detailsText ? ` — ${detailsText}` : "";
  const testedHead = entry.headSha ?? entry.head_sha ?? entry.testedHeadSha;
  const head = technical && testedHead ? ` — tested head ${inlineCode(testedHead)}` : "";
  return `${label}${count}${command}${details}${head}`;
}

function nextActionFor(result, stage, verification, hasChangeSummary) {
  const status = effectiveStatus(result);
  if (status === "blocked" || status === "failed") {
    return "The orchestrator will inspect the blocker, record a durable checkpoint, and continue only when the issue is safe to resume.";
  }
  if (verification === "missing" || verification === "incomplete") {
    return "The orchestrator must obtain or rerun conclusive passing verification before advancing this issue.";
  }
  if (verification === "failed") {
    return "The orchestrator must resolve the failing verification and rerun the affected checks before advancing this issue.";
  }
  if (!hasChangeSummary) {
    return "The orchestrator must inspect the changed files and record a meaningful change summary before advancing this issue.";
  }
  const base = result.base_sha ?? result.baseSha;
  const head = result.head_sha ?? result.headSha;
  const noCommitCreated =
    result.commit_created === false ||
    result.commitCreated === false ||
    (base && head && String(base) === String(head));
  if (stage === "implementation" && noCommitCreated) {
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

  const suppliedSummary = values(result.summary);
  const changedFiles = values(result.changedFiles ?? result.changed_files);
  const changeItems = suppliedSummary.length > 0
    ? suppliedSummary
    : changedFiles.map((file) => `Changed ${file}.`);
  const primaryValidation = values(result.validation);
  const validation = primaryValidation.length > 0 ? primaryValidation : values(result.tests);
  const suppliedNotes = values(result.notes);
  const discoveries = values(result.discoveries);
  const blocker = values(result.blocker).map((item) => `Blocker: ${safeText(item, technical)}`);
  const untrackedFiles = values(result.untrackedFiles ?? result.untracked_files);
  const notes = [...blocker, ...suppliedNotes, ...discoveries];
  if (untrackedFiles.length > 0) {
    notes.push(`${untrackedFiles.length} untracked file${untrackedFiles.length === 1 ? "" : "s"} require coordinator audit.`);
  }

  const stage = stageFor(result, stageOverride);
  const verification = verificationState(validation);
  const hasChangeSummary = suppliedSummary.some((item) => !containsAbsolutePath(plainText(item)));
  const hasChangeItems = changeItems.length > 0;
  const ready = verification === "passed" && hasChangeSummary;
  const branch = result.branch ? String(result.branch) : null;
  const head = result.head_sha ?? result.headSha;
  const lines = [
    `## ${titleFor(result, stage, ready, technical)}`,
    "",
    leadFor(result, stage, verification, hasChangeSummary),
    "",
    "### What changed",
    "",
    ...(hasChangeItems
      ? changeItems.map((item) => `- ${safeText(item, technical)}`)
      : ["- No change summary was returned; the coordinator must inspect the worker diff."])
  ];

  const verificationLines = validation.length > 0
    ? validation.map((item) => `- ${formatValidation(item, technical)}`)
    : ["- No verification evidence was returned; the coordinator must not advance this issue from this checkpoint."];
  lines.push("", "### Verification", "", ...verificationLines);
  if (notes.length > 0) {
    lines.push("", "### Notes", "", ...notes.map((item) => `- ${safeText(item, technical)}`));
  }

  lines.push("", "### Next", "", nextActionFor(result, stage, verification, hasChangeSummary));

  const details = [];
  if (technical && result.provider) details.push(`Provider: ${inlineCode(result.provider)}`);
  if (technical && branch) details.push(`Branch: ${inlineCode(branch)}`);
  if (technical && head) details.push(`Head: ${inlineCode(head)}`);
  if (technical && (result.worktree || result.worktreePath)) {
    details.push(`Worktree: ${inlineCode(result.worktree ?? result.worktreePath)}`);
  }
  if (technical && (result.base_sha || result.baseSha)) {
    details.push(`Base: ${inlineCode(result.base_sha ?? result.baseSha)}`);
  }
  if (technical && (result.reviewReceipt || result.review_receipt)) {
    details.push(`Review receipt: ${inlineCode(result.reviewReceipt ?? result.review_receipt)}`);
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
      const stage = arg.slice("--stage=".length);
      if (!stage) throw new Error("--stage requires implementation, review, or integration.");
      options.stage = stage;
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
