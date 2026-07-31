#!/usr/bin/env node

import fs from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";

function values(value) {
  if (Array.isArray(value)) return value.filter((item) => item != null && String(item).trim());
  if (value == null || String(value).trim() === "") return [];
  return [value];
}

function inlineCode(value) {
  return `\`${String(value).replaceAll("`", "\\`")}\``;
}

function shortSha(value) {
  const sha = String(value ?? "").trim();
  return sha ? sha.slice(0, 12) : null;
}

function normalizedStatus(value) {
  return String(value ?? "unknown").trim().toLowerCase();
}

function titleFor(result) {
  const issue = String(result.issue ?? "Worker").trim();
  switch (normalizedStatus(result.status ?? result.state)) {
    case "completed":
    case "complete":
      return `${issue} implementation is ready for coordinator review`;
    case "blocked":
      return `${issue} is blocked`;
    case "failed":
      return `${issue} worker failed`;
    default:
      return `${issue} worker update`;
  }
}

function leadFor(result) {
  switch (normalizedStatus(result.status ?? result.state)) {
    case "completed":
    case "complete":
      return "The implementation worker finished its pass. This is a worker checkpoint, not the final workload handoff.";
    case "blocked":
      return "The worker could not complete this issue. The workload coordinator will reconcile the blocker before continuing.";
    case "failed":
      return "The worker run failed. The workload coordinator will inspect the failure before deciding whether to retry.";
    default:
      return "The worker returned an intermediate checkpoint for coordinator review.";
  }
}

function formatValidation(entry) {
  if (typeof entry !== "object" || entry == null) return String(entry);
  const passed = String(entry.result ?? entry.status ?? "unknown").toLowerCase() === "passed";
  const label = passed ? "Passed" : String(entry.result ?? entry.status ?? "Unknown");
  const count = Number.isFinite(entry.tests) ? ` — ${entry.tests} tests` : "";
  const command = entry.command ? ` — ${inlineCode(entry.command)}` : "";
  const details = entry.details ? ` — ${entry.details}` : "";
  return `${label}${count}${command}${details}`;
}

function nextActionFor(result) {
  const status = normalizedStatus(result.status ?? result.state);
  if (status === "blocked" || status === "failed") {
    return "The orchestrator will inspect the blocker, record a durable checkpoint, and continue only when the issue is safe to resume.";
  }
  if (result.commit_created === false || result.commitCreated === false) {
    return "The orchestrator will audit the worktree, commit the accepted changes, and then move the issue into independent code review.";
  }
  return "The orchestrator will verify the recorded head, start independent code review, and continue the workload from that result.";
}

export function renderWorkerResult(result, { technical = false } = {}) {
  if (typeof result !== "object" || result == null || Array.isArray(result)) {
    throw new Error("Worker result must be a JSON object.");
  }

  const summary = values(result.summary);
  const validation = values(result.validation ?? result.tests);
  const notes = values(result.notes ?? result.discoveries);
  const branch = result.branch ? String(result.branch) : null;
  const head = result.head_sha ?? result.headSha;
  const lines = [`## ${titleFor(result)}`, "", leadFor(result)];

  if (summary.length > 0) {
    lines.push("", "### What changed", "", ...summary.map((item) => `- ${String(item)}`));
  }
  if (validation.length > 0) {
    lines.push("", "### Verification", "", ...validation.map((item) => `- ${formatValidation(item)}`));
  }
  if (notes.length > 0) {
    lines.push("", "### Notes", "", ...notes.map((item) => `- ${String(item)}`));
  }

  lines.push("", "### Next", "", nextActionFor(result));

  const details = [];
  if (branch) details.push(`Branch: ${inlineCode(branch)}`);
  if (head) details.push(`Head: ${inlineCode(technical ? head : shortSha(head))}`);
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

function parseInput(argv) {
  const technical = argv.includes("--technical");
  const file = argv.find((value) => value !== "--technical");
  const source = file ? fs.readFileSync(file, "utf8") : fs.readFileSync(0, "utf8");
  return { result: JSON.parse(source), technical };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const { result, technical } = parseInput(process.argv.slice(2));
    process.stdout.write(renderWorkerResult(result, { technical }));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
