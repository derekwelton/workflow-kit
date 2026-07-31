import assert from "node:assert/strict";
import test from "node:test";

import { renderWorkerResult } from "../skills/orchestrate/scripts/render-worker-result.mjs";

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

test("renders a worker envelope as a human checkpoint by default", () => {
  const output = renderWorkerResult(RESULT);
  assert.match(output, /IRP-79 implementation is ready for coordinator review/);
  assert.match(output, /### What changed/);
  assert.match(output, /### Verification/);
  assert.match(output, /21 tests/);
  assert.match(output, /### Notes/);
  assert.match(output, /### Next/);
  assert.match(output, /audit the worktree, commit the accepted changes/);
  assert.match(output, /34f94e11a081/);
  assert.doesNotMatch(output, /workflow-kit\.worker-result\.v1/);
  assert.doesNotMatch(output, /IRP-workloads/);
  assert.doesNotMatch(output, /34f94e11a081060d4e2c5697c5e5f9c522afd515/);
});

test("technical mode exposes exact machine details only when requested", () => {
  const output = renderWorkerResult(RESULT, { technical: true });
  assert.match(output, /IRP-workloads/);
  assert.match(output, /34f94e11a081060d4e2c5697c5e5f9c522afd515/);
  assert.match(output, /47fe4b3c12b2bcf3a51e080223af48662200d76c/);
});
