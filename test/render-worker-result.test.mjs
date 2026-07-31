import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parseArgs, renderWorkerResult } from "../skills/orchestrate/scripts/render-worker-result.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(TEST_DIR, "../skills/orchestrate/scripts/render-worker-result.mjs");
const RESULT = {
  schema: "workflow-kit.worker-result.v1",
  issue: "IRP-79",
  status: "completed",
  worktree: "C:\\Development\\CSharp\\IRP-workloads\\todo-batch\\irp-79",
  branch: "derekswelton/irp-79-project-documents-project-folder-adjustments",
  base_sha: "47fe4b3c12b2bcf3a51e080223af48662200d76c",
  head_sha: "34f94e11a081060d4e2c5697c5e5f9c522afd515",
  commit_created: false,
  summary: ["Added current-folder and project-root actions.", "Filtered orphan staging files."],
  validation: [
    { command: "dotnet test IRP.Api.Tests", result: "passed", tests: 21 },
    { command: "npm run check", result: "passed", details: "0 errors and 0 warnings" }
  ],
  notes: ["Existing vulnerability advisories were warnings only."]
};
const CONTRACT_RESULT = {
  issue: "IRP-82",
  stage: "implementation",
  branch: "owner/irp-82-contract-shape",
  worktree: "C:\\Development\\CSharp\\IRP-workloads\\batch\\irp-82",
  baseSha: "47fe4b3c12b2bcf3a51e080223af48662200d76c",
  headSha: "34f94e11a081060d4e2c5697c5e5f9c522afd515",
  provider: "codex",
  state: "complete",
  summary: ["Added contract-shaped worker reporting."],
  changedFiles: ["skills/orchestrate/SKILL.md"],
  untrackedFiles: [],
  tests: [{
    command: "dotnet test C:\\Development\\CSharp\\IRP\\IRP.Api.Tests",
    status: "passed",
    tests: 21,
    headSha: "34f94e11a081060d4e2c5697c5e5f9c522afd515",
    details: "Passed at 34f94e11a081060d4e2c5697c5e5f9c522afd515 in C:\\Development\\CSharp\\IRP-workloads\\batch\\irp-82"
  }],
  reviewReceipt: null,
  blocker: null,
  discoveries: []
};

test("renders a worker envelope as a human checkpoint by default", () => {
  const output = renderWorkerResult(RESULT);
  assert.match(output, /IRP-79 implementation is ready for coordinator review/);
  assert.match(output, /### What changed/);
  assert.match(output, /### Verification/);
  assert.match(output, /21 tests/);
  assert.match(output, /### Notes/);
  assert.match(output, /### Next/);
  assert.match(output, /audit the worktree, commit the accepted changes/);
  assert.doesNotMatch(output, /### Technical details/);
  assert.doesNotMatch(output, /workflow-kit\.worker-result\.v1/);
  assert.doesNotMatch(output, /IRP-workloads/);
  assert.doesNotMatch(output, /34f94e11a081/);
});

test("technical mode exposes exact machine details only when requested", () => {
  const output = renderWorkerResult(RESULT, { technical: true });
  assert.match(output, /### Technical details/);
  assert.match(output, /IRP-workloads/);
  assert.match(output, /34f94e11a081060d4e2c5697c5e5f9c522afd515/);
  assert.match(output, /47fe4b3c12b2bcf3a51e080223af48662200d76c/);
});

test("renders and redacts the documented worker envelope shape", () => {
  const output = renderWorkerResult(CONTRACT_RESULT);
  assert.match(output, /IRP-82 implementation is ready for coordinator review/);
  assert.match(output, /Added contract-shaped worker reporting/);
  assert.match(output, /Passed — 21 tests/);
  assert.match(output, /34f94e11a081…/);
  assert.match(output, /<absolute path>/);
  assert.doesNotMatch(output, /C:\\/);
  assert.doesNotMatch(output, /34f94e11a081060d4e2c5697c5e5f9c522afd515/);

  const technical = renderWorkerResult(CONTRACT_RESULT, { technical: true });
  assert.match(technical, /C:\\Development\\CSharp\\IRP-workloads/);
  assert.match(technical, /34f94e11a081060d4e2c5697c5e5f9c522afd515/);
  assert.match(technical, /Provider: `codex`/);
});

test("falls back to changed files and always reports a blocker", () => {
  const completed = renderWorkerResult({
    ...CONTRACT_RESULT,
    summary: [],
    changedFiles: ["src/project-documents.ts"]
  });
  assert.match(completed, /Changed src\/project-documents\.ts/);

  const blocked = renderWorkerResult({
    ...CONTRACT_RESULT,
    issue: "IRP-83",
    state: "blocked",
    summary: [],
    changedFiles: [],
    tests: [],
    blocker: "Migration 0042 fails: FK constraint."
  });
  assert.match(blocked, /IRP-83 is blocked/);
  assert.match(blocked, /Blocker: Migration 0042 fails: FK constraint/);
});

test("renders independent review without claiming implementation is next", () => {
  const output = renderWorkerResult({
    issue: "IRP-79",
    stage: "review",
    state: "complete",
    summary: ["No blocking findings."],
    tests: [{ status: "passed", tests: "674", command: "npm test -- --run" }],
    reviewReceipt: "claude:abc:review-1"
  });
  assert.match(output, /independent review is complete/);
  assert.match(output, /674 tests/);
  assert.match(output, /adjudicate the findings/);
  assert.doesNotMatch(output, /start independent code review/);
});

test("does not present a completion claim as ready without verification", () => {
  const output = renderWorkerResult({
    issue: "IRP-80",
    stage: "implementation",
    state: "complete",
    summary: ["Changed the endpoint."],
    validation: [],
    tests: []
  });
  assert.match(output, /incomplete worker checkpoint/);
  assert.match(output, /No verification evidence was returned/);
  assert.match(output, /must obtain or rerun conclusive passing verification/);
  assert.doesNotMatch(output, /ready for coordinator review/);
});

test("does not present a completion claim as ready with failing verification", () => {
  const output = renderWorkerResult({
    issue: "IRP-80",
    stage: "implementation",
    state: "complete",
    tests: [{ status: "failed", command: "npm test" }]
  });
  assert.match(output, /incomplete worker checkpoint/);
  assert.match(output, /Failed/);
  assert.match(output, /resolve the failing verification/);
  assert.doesNotMatch(output, /ready for coordinator review/);
});

test("does not present skipped or unknown verification as ready", () => {
  for (const status of ["skipped", "unknown"]) {
    const output = renderWorkerResult({
      issue: "IRP-80",
      stage: "implementation",
      state: "complete",
      summary: ["Changed the endpoint."],
      tests: [{ status, command: "npm test", tests: null }]
    });
    assert.match(output, /incomplete worker checkpoint/);
    assert.match(output, /without conclusive passing verification/);
    assert.doesNotMatch(output, /— 0 tests/);
    assert.doesNotMatch(output, /ready for coordinator review/);
  }
});

test("falls back to tests, normalizes results, and keeps worker text inside bullets", () => {
  const output = renderWorkerResult({
    issue: "IRP-81",
    state: "blocked",
    summary: ["# Injected heading\nsecond line"],
    validation: [],
    tests: [{ result: "FAILED", tests: "3", command: "tool `with` ticks" }],
    notes: [],
    discoveries: ["## Note\ncontinued"]
  }, { technical: true });
  assert.match(output, /IRP-81 is blocked/);
  assert.match(output, /- # Injected heading second line/);
  assert.match(output, /Failed — 3 tests/);
  assert.match(output, /``tool `with` ticks``/);
  assert.match(output, /- ## Note continued/);
});

test("CLI argument parsing rejects ambiguous or unknown input", () => {
  assert.deepEqual(parseArgs(["--stage", "review", "--technical", "result.json"]), {
    technical: true,
    stage: "review",
    file: "result.json",
    help: false
  });
  assert.throws(() => parseArgs(["one.json", "two.json"]), /Only one input file/);
  assert.throws(() => parseArgs(["--bogus"]), /Unknown argument/);
  assert.throws(() => parseArgs(["--stage", "planning"]), /Unknown worker stage/);
  assert.throws(() => parseArgs(["--stage="]), /--stage requires/);
});

test("CLI runs through a linked Codex skill directory", (context) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-kit-renderer-"));
  context.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));
  const linkDir = path.join(tempDir, "orchestrate-queue");
  fs.symlinkSync(path.dirname(path.dirname(SCRIPT)), linkDir, process.platform === "win32" ? "junction" : "dir");
  const linkedScript = path.join(linkDir, "scripts", path.basename(SCRIPT));
  const run = spawnSync(process.execPath, [linkedScript, "--stage", "implementation"], {
    input: JSON.stringify(RESULT),
    encoding: "utf8"
  });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /IRP-79 implementation is ready for coordinator review/);
  assert.doesNotMatch(run.stdout, /^\s*$/);
});
