import test from "node:test";
import assert from "node:assert/strict";
import { resolveRouting, workerCapacity } from "../scripts/lib/model-policy.mjs";
import { resolveTracker, trackerTransition } from "../scripts/lib/tracker-policy.mjs";
import { validateExecution } from "../scripts/workload-manifest.mjs";

test("coding and review resolve conservatively without machine defaults", () => {
  assert.equal(resolveRouting().model, "gpt-6-astra");
  assert.equal(resolveRouting().effort, "low");
  assert.equal(resolveRouting({ task: "simple" }).model, "gpt-6-luna");
  assert.equal(resolveRouting({ task: "simple" }).effort, "low");
  assert.equal(resolveRouting({ task: "review" }).effort, "medium");
  const claudeCoding = resolveRouting({ provider: "claude" });
  assert.equal(claudeCoding.model, "claude-opus-5-5");
  assert.equal(claudeCoding.effort, "high");
  assert.match(claudeCoding.highReason, /Owner-selected Opus 5.5 high for Claude coding/);
  assert.equal(resolveRouting({ provider: "claude", model: "fable" }).model, "claude-fable-5-1");
  assert.equal(resolveRouting({ provider: "claude", model: "fable" }).effort, "low");
  assert.equal(resolveRouting({ provider: "claude", task: "orchestration" }).model, "claude-fable-5-1");
  assert.equal(resolveRouting({ model: "sol", effort: "medium" }).model, "gpt-6-sol");
  assert.equal(resolveRouting({ model: "sol56", effort: "low" }).model, "gpt-5.6-sol");
  assert.equal(resolveRouting({ model: "terra", effort: "low" }).model, "gpt-5.6-terra");
  assert.equal(resolveRouting({ provider: "codex", task: "design" }).model, "gpt-6-astra");
  assert.equal(resolveRouting({ provider: "codex", task: "design" }).effort, "medium");
  assert.equal(resolveRouting({ provider: "claude", task: "design" }).model, "claude-opus-5-5");
  assert.equal(resolveRouting({ provider: "claude", task: "design" }).effort, "medium");
  for (const retired of ["claude-opus-5", "gpt-5.5", "gpt-5.6-luna"]) assert.throws(() => resolveRouting({ model: retired }), /Retired model/);
});

test("Luna may run high without a reason; Opus 5.5 never runs low", () => {
  for (const effort of ["low", "medium", "high"]) assert.equal(resolveRouting({ task: "simple", effort }).effort, effort);
  assert.equal(resolveRouting({ task: "simple" }).highReason, null);
  assert.throws(() => resolveRouting({ task: "simple", effort: "xhigh" }), /Unsupported effort/);
  assert.throws(() => resolveRouting({ task: "simple", model: "astra", effort: "high" }), /High effort requires/);
  assert.throws(() => resolveRouting({ provider: "claude", model: "opus", effort: "low" }), /medium or high only/);
  assert.equal(resolveRouting({ provider: "claude", model: "opus", task: "intense" }).effort, "medium");
  assert.equal(resolveRouting({ provider: "claude", model: "opus", effort: "medium" }).highReason, null);
  assert.equal(resolveRouting({ provider: "claude", task: "review", model: "opus", effort: "medium" }).effort, "medium");
});

test("Claude review defaults to owner-selected Opus high and falls back in declared order", () => {
  const primary = resolveRouting({ provider: "claude", task: "review" });
  assert.equal(primary.model, "claude-opus-5-5");
  assert.equal(primary.effort, "high");
  assert.match(primary.highReason, /Owner-selected/);
  const fable = resolveRouting({ provider: "claude", task: "review", availableModels: ["claude-fable-5-1", "gpt-6-astra"] });
  assert.equal(fable.model, "claude-fable-5-1");
  assert.equal(fable.effort, "medium");
  assert.match(fable.fallbackReason, /unavailable/);
  const reviewFallback = { reason: "cli-not-installed", missingProvider: "claude", evidence: "command -v claude: not found" };
  assert.throws(() => resolveRouting({ provider: "claude", task: "review", availableModels: ["gpt-6-astra"] }), /fallback requires/);
  const codex = resolveRouting({ provider: "claude", task: "review", availableModels: ["gpt-6-astra"], reviewFallback });
  assert.equal(codex.provider, "codex");
  assert.equal(codex.effort, "medium");
  assert.deepEqual(codex.reviewFallback, reviewFallback);
  const unavailableClaude = { reason: "review-models-unavailable", unavailableProvider: "claude", attempts: [
    { model: "claude-opus-5-5", reason: "quota-unavailable", evidence: "Opus quota exhausted" },
    { model: "claude-fable-5-1", reason: "quota-unavailable", evidence: "Fable quota exhausted" }
  ] };
  assert.deepEqual(resolveRouting({ provider: "claude", task: "review", availableModels: ["gpt-6-astra"], reviewFallback: unavailableClaude }).reviewFallback, unavailableClaude);
  const unavailableCodex = { reason: "cli-not-installed", missingProvider: "codex", evidence: "command -v codex: not found" };
  const claude = resolveRouting({ provider: "codex", task: "review", availableModels: ["claude-opus-5-5", "claude-fable-5-1"], reviewFallback: unavailableCodex });
  assert.equal(claude.provider, "claude");
  assert.equal(claude.model, "claude-opus-5-5");
  assert.equal(claude.effort, "high");
  assert.deepEqual(claude.reviewFallback, unavailableCodex);
  assert.equal(resolveRouting({ provider: "claude", task: "review", availableModels: ["claude-opus-5-5"], reviewFallback: unavailableClaude }).reviewFallback, null);
  assert.equal(resolveRouting({ provider: "claude", task: "review", model: "fable", effort: "low" }).effort, "low");
  assert.throws(() => resolveRouting({ provider: "claude", task: "review", model: "opus", availableModels: ["claude-fable-5-1"] }), /unavailable/);
  assert.throws(() => resolveRouting({ task: "review", availableModels: [] }), /incomplete/);
  assert.equal(resolveRouting({ task: "review", availableModels: ["gpt-6-astra", "claude-opus-5-5"] }).provider, "codex");
});

test("high needs a reason and unsupported efforts cannot reach a worker", () => {
  for (const effort of ["xhigh", "max", "ultra", "none", "minimal"]) assert.throws(() => resolveRouting({ effort }), /Unsupported effort/);
  assert.throws(() => resolveRouting({ effort: "high" }), /High effort requires/);
  for (const provider of ["codex", "claude"]) {
    for (const task of ["orchestration", "intense"]) {
      const route = resolveRouting({ provider, task });
      assert.equal(route.effort, "medium");
      assert.equal(route.highReason, null);
      assert.equal(resolveRouting({ provider, task, effort: "low" }).effort, "low");
      assert.throws(() => resolveRouting({ provider, task, effort: "high" }), /High effort requires/);
    }
  }
  assert.equal(resolveRouting({ effort: "high", highReason: "intense deadlock reasoning" }).effort, "high");
  assert.throws(() => resolveRouting({ availableModels: ["gpt-6-luna"] }), /unavailable/);
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
  const execution = { requestedModel: "astra", resolvedModel: null, resolutionStatus: "unverified", effort: "medium", workerId: "worker-1", policyVersion: "2026-09-24" };
  assert.doesNotThrow(() => validateExecution(execution, "codex"));
  assert.throws(() => validateExecution({ ...execution, effort: "xhigh" }, "codex"), /Unsupported effort/);
  assert.throws(() => validateExecution({ ...execution, resolvedModel: "gpt-6-sol" }, "codex"), /fallbackReason/);
  assert.throws(() => validateExecution(execution, "claude"), /mismatch/);
});
