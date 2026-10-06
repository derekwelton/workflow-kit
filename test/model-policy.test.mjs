import test from "node:test";
import assert from "node:assert/strict";
import { resolveRouting, workerCapacity } from "../scripts/lib/model-policy.mjs";
import { resolveTracker, trackerTransition } from "../scripts/lib/tracker-policy.mjs";
import { validateExecution } from "../scripts/workload-manifest.mjs";

test("coding and review resolve conservatively without machine defaults", () => {
  const codexCoding = resolveRouting();
  assert.equal(codexCoding.model, "gpt-6.1-sol");
  assert.equal(codexCoding.effort, "high");
  assert.match(codexCoding.highReason, /Owner-selected GPT-6.1 Sol high for Codex coding/);
  assert.equal(resolveRouting({ effort: "low" }).highReason, null);
  assert.equal(resolveRouting({ task: "simple" }).model, "gpt-6-luna");
  assert.equal(resolveRouting({ task: "simple" }).effort, "high");
  const codexReview = resolveRouting({ task: "review" });
  assert.equal(codexReview.model, "gpt-6.1-sol");
  assert.equal(codexReview.effort, "high");
  assert.match(codexReview.highReason, /Owner-selected GPT-6.1 Sol high for independent review/);
  assert.equal(resolveRouting({ task: "review", effort: "medium" }).highReason, null);
  const claudeCoding = resolveRouting({ provider: "claude" });
  assert.equal(claudeCoding.model, "claude-opus-5-5");
  assert.equal(claudeCoding.effort, "high");
  assert.match(claudeCoding.highReason, /Owner-selected Opus 5.5 high for Claude coding/);
  assert.equal(resolveRouting({ provider: "claude", model: "fable" }).model, "claude-fable-5-1");
  assert.equal(resolveRouting({ provider: "claude", model: "fable" }).effort, "low");
  const claudeOrchestration = resolveRouting({ provider: "claude", task: "orchestration" });
  assert.equal(claudeOrchestration.model, "claude-opus-5-5");
  assert.equal(claudeOrchestration.effort, "high");
  assert.match(claudeOrchestration.highReason, /Claude orchestration/);
  const claudeIntense = resolveRouting({ provider: "claude", task: "intense" });
  assert.equal(claudeIntense.model, "claude-fable-5-1");
  assert.equal(claudeIntense.effort, "high");
  assert.match(claudeIntense.highReason, /Fable 5.1 high for intense reasoning/);
  const codexIntense = resolveRouting({ task: "intense" });
  assert.equal(codexIntense.effort, "xhigh");
  assert.match(codexIntense.highReason, /Sol xhigh for intense reasoning/);
  assert.match(resolveRouting({ task: "intense", effort: "high" }).highReason, /Sol xhigh/);
  assert.equal(resolveRouting({ model: "sol", effort: "medium" }).model, "gpt-6.1-sol");
  assert.equal(resolveRouting({ model: "astra", effort: "low" }).model, "gpt-6-astra");
  assert.equal(resolveRouting({ model: "sol60", effort: "low" }).model, "gpt-6-sol");
  assert.equal(resolveRouting({ model: "sol56", effort: "low" }).model, "gpt-5.6-sol");
  assert.equal(resolveRouting({ model: "terra", effort: "low" }).model, "gpt-5.6-terra");
  assert.equal(resolveRouting({ provider: "codex", task: "design" }).model, "gpt-6.1-sol");
  assert.equal(resolveRouting({ provider: "codex", task: "design" }).effort, "xhigh");
  assert.match(resolveRouting({ provider: "codex", task: "design" }).highReason, /Codex design/);
  assert.equal(resolveRouting({ provider: "claude", task: "design" }).model, "claude-opus-5-5");
  assert.equal(resolveRouting({ provider: "claude", task: "design" }).effort, "high");
  const fableDesign = resolveRouting({ provider: "claude", task: "design", model: "fable" });
  assert.equal(fableDesign.effort, "high");
  assert.match(fableDesign.highReason, /Claude design/);
  for (const retired of ["claude-opus-5", "gpt-5.5", "gpt-5.6-luna"]) assert.throws(() => resolveRouting({ model: retired }), /Retired model/);
});

test("Luna runs high through max without a reason; Opus 5.5 never runs low", () => {
  for (const effort of ["high", "xhigh", "max"]) assert.equal(resolveRouting({ task: "simple", effort }).effort, effort);
  assert.equal(resolveRouting({ task: "simple" }).highReason, null);
  for (const effort of ["low", "medium"]) assert.throws(() => resolveRouting({ task: "simple", effort }), /high through max only/);
  assert.throws(() => resolveRouting({ task: "simple", effort: "ultra" }), /Unsupported effort/);
  assert.throws(() => resolveRouting({ task: "simple", model: "astra", effort: "high" }), /High effort requires/);
  assert.throws(() => resolveRouting({ provider: "claude", model: "opus", effort: "low" }), /medium through high only/);
  assert.equal(resolveRouting({ provider: "claude", model: "opus", task: "intense" }).effort, "medium");
  assert.equal(resolveRouting({ provider: "claude", model: "opus", effort: "medium" }).highReason, null);
  assert.equal(resolveRouting({ provider: "claude", task: "review", model: "opus", effort: "medium" }).effort, "medium");
});

test("Claude review defaults to owner-selected Opus high and falls back in declared order", () => {
  const primary = resolveRouting({ provider: "claude", task: "review" });
  assert.equal(primary.model, "claude-opus-5-5");
  assert.equal(primary.effort, "high");
  assert.match(primary.highReason, /Owner-selected/);
  const fable = resolveRouting({ provider: "claude", task: "review", availableModels: ["claude-fable-5-1", "gpt-6.1-sol"] });
  assert.equal(fable.model, "claude-fable-5-1");
  assert.equal(fable.effort, "medium");
  assert.match(fable.fallbackReason, /unavailable/);
  const reviewFallback = { reason: "cli-not-installed", missingProvider: "claude", evidence: "command -v claude: not found" };
  assert.throws(() => resolveRouting({ provider: "claude", task: "review", availableModels: ["gpt-6.1-sol"] }), /fallback requires/);
  const codex = resolveRouting({ provider: "claude", task: "review", availableModels: ["gpt-6.1-sol"], reviewFallback });
  assert.equal(codex.provider, "codex");
  assert.equal(codex.model, "gpt-6.1-sol");
  assert.equal(codex.effort, "high");
  assert.deepEqual(codex.reviewFallback, reviewFallback);
  const unavailableClaude = { reason: "review-models-unavailable", unavailableProvider: "claude", attempts: [
    { model: "claude-opus-5-5", reason: "quota-unavailable", evidence: "Opus quota exhausted" },
    { model: "claude-fable-5-1", reason: "quota-unavailable", evidence: "Fable quota exhausted" }
  ] };
  assert.deepEqual(resolveRouting({ provider: "claude", task: "review", availableModels: ["gpt-6.1-sol"], reviewFallback: unavailableClaude }).reviewFallback, unavailableClaude);
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
  assert.equal(resolveRouting({ task: "review", availableModels: ["gpt-6.1-sol", "claude-opus-5-5"] }).provider, "codex");
  assert.throws(() => resolveRouting({ task: "review", availableModels: ["gpt-6-astra"] }), /incomplete/);
});

test("high needs a reason and unsupported efforts cannot reach a worker", () => {
  for (const effort of ["ultra", "none", "minimal"]) assert.throws(() => resolveRouting({ effort }), /Unsupported effort/);
  assert.throws(() => resolveRouting({ effort: "xhigh" }), /High effort requires/);
  assert.throws(() => resolveRouting({ effort: "max", highReason: "x" }), /low through xhigh only/);
  assert.throws(() => resolveRouting({ provider: "claude", task: "design", effort: "xhigh", highReason: "x" }), /medium through high only/);
  assert.throws(() => resolveRouting({ model: "astra", effort: "high" }), /High effort requires/);
  assert.throws(() => resolveRouting({ model: "astra", effort: "xhigh", highReason: "x" }), /low through high only/);
  const codexOrchestration = resolveRouting({ task: "orchestration" });
  assert.equal(codexOrchestration.effort, "high");
  assert.match(codexOrchestration.highReason, /Codex orchestration/);
  for (const [provider, model, task] of [["codex", "astra", "orchestration"], ["codex", "astra", "intense"], ["claude", "fable", "orchestration"]]) {
    const route = resolveRouting({ provider, model, task });
    assert.equal(route.effort, "medium");
    assert.equal(route.highReason, null);
    assert.equal(resolveRouting({ provider, model, task, effort: "low" }).effort, "low");
    assert.throws(() => resolveRouting({ provider, model, task, effort: "high" }), /High effort requires/);
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
  assert.throws(() => validateExecution({ ...execution, effort: "ultra" }, "codex"), /Unsupported effort/);
  assert.throws(() => validateExecution({ ...execution, effort: "xhigh", highReason: "x" }, "codex"), /low through high only/);
  assert.doesNotThrow(() => validateExecution({ ...execution, requestedModel: "sol", effort: "xhigh", resolvedEffort: "xhigh", highReason: "design" }, "codex"));
  assert.throws(() => validateExecution({ ...execution, resolvedModel: "gpt-6-sol" }, "codex"), /fallbackReason/);
  assert.throws(() => validateExecution(execution, "claude"), /mismatch/);
});
