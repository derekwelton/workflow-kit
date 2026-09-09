import test from "node:test";
import assert from "node:assert/strict";
import { resolveRouting, workerCapacity } from "../scripts/lib/model-policy.mjs";
import { resolveTracker, trackerTransition } from "../scripts/lib/tracker-policy.mjs";
import { validateExecution } from "../scripts/workload-manifest.mjs";

test("coding and review resolve conservatively without machine defaults", () => {
  assert.equal(resolveRouting().model, "gpt-6-astra");
  assert.equal(resolveRouting().effort, "low");
  assert.equal(resolveRouting({ task: "simple" }).model, "gpt-5.6-terra");
  assert.equal(resolveRouting({ task: "review" }).effort, "medium");
  assert.equal(resolveRouting({ provider: "claude" }).model, "claude-fable-5-1");
  assert.equal(resolveRouting({ model: "sol", effort: "medium" }).model, "gpt-5.6-sol");
});

test("high needs a reason and unsupported efforts cannot reach a worker", () => {
  for (const effort of ["xhigh", "max", "ultra", "none", "minimal"]) assert.throws(() => resolveRouting({ effort }), /Unsupported effort/);
  assert.throws(() => resolveRouting({ effort: "high" }), /High effort requires/);
  assert.equal(resolveRouting({ task: "orchestration" }).effort, "high");
  assert.equal(resolveRouting({ effort: "high", highReason: "intense deadlock reasoning" }).effort, "high");
  assert.throws(() => resolveRouting({ availableModels: ["gpt-5.6-terra"] }), /unavailable/);
  assert.throws(() => resolveRouting({ model: "fable" }), /cannot run/);
});

test("host capacity counts coordinator, existing workers, and nested reviews", () => {
  assert.equal(workerCapacity({ hostSlots: 4, requested: 4 }), 3);
  assert.equal(workerCapacity({ hostSlots: 4, requested: 2, nestedPerWorker: 2 }), 1);
  assert.equal(workerCapacity({ hostSlots: 4, activeWorkers: 3, requested: 2 }), 0);
  assert.throws(() => workerCapacity({ hostSlots: -1 }), /nonnegative/);
});

test("Projects preserves local statuses without fabricating an AI review column", () => {
  const config = { tracker: "github-projects", githubProject: { owner: "example", number: 1, statuses: { todo: "Ready", inProgress: "Building", inReview: "Derek Review" } } };
  assert.equal(resolveTracker(), "github");
  assert.equal(resolveTracker({ linearTeam: "ABC" }), "linear");
  assert.equal(trackerTransition(config, "inReview").status, "Derek Review");
  assert.equal(trackerTransition(config, "codeReview").status, null);
  assert.throws(() => resolveTracker({ ...config, linearTeam: "ABC" }), /Conflicting/);
  assert.throws(() => trackerTransition(config, "done"), /Agents do not set Done/);
});

test("execution provenance distinguishes unknown identity and explicit fallback", () => {
  const execution = { requestedModel: "astra", resolvedModel: null, resolutionStatus: "unverified", effort: "medium", workerId: "worker-1", policyVersion: "2026-09-04" };
  assert.doesNotThrow(() => validateExecution(execution, "codex"));
  assert.throws(() => validateExecution({ ...execution, effort: "xhigh" }, "codex"), /Unsupported effort/);
  assert.throws(() => validateExecution({ ...execution, resolvedModel: "gpt-5.6-sol" }, "codex"), /fallbackReason/);
  assert.throws(() => validateExecution(execution, "claude"), /mismatch/);
});
