// Canonical source: derekwelton/workflow-kit.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

export const POLICY_VERSION = "2026-10-05";
// Effort ladder. Each model's minEffort/maxEffort (default low..high) bounds it.
// ultra is always prohibited.
export const ALLOWED_EFFORTS = ["low", "medium", "high", "xhigh", "max"];
export const TASK_CLASSES = ["simple", "coding", "design", "review", "orchestration", "intense"];
// freeHigh: efforts above medium need no recorded reason (owner-approved for the cheap model).
// minEffort/maxEffort: the model never runs outside this range.
// legacy: explicit pin only; never a default.
export const MODELS = {
  sol: { id: "gpt-6.1-sol", provider: "codex", maxEffort: "xhigh" },
  astra: { id: "gpt-6-astra", provider: "codex" },
  sol60: { id: "gpt-6-sol", provider: "codex", legacy: true },
  luna: { id: "gpt-6-luna", provider: "codex", minEffort: "high", maxEffort: "max", freeHigh: true },
  terra: { id: "gpt-5.6-terra", provider: "codex", legacy: true },
  sol56: { id: "gpt-5.6-sol", provider: "codex", legacy: true },
  fable: { id: "claude-fable-5-1", provider: "claude" },
  opus: { id: "claude-opus-5-5", provider: "claude", minEffort: "medium" }
};
export const RETIRED_MODELS = ["claude-opus-5", "gpt-5.5", "gpt-5.6-luna"];

export function resolveModel(value) {
  const model = MODELS[value] ?? Object.values(MODELS).find((entry) => entry.id === value);
  if (!model) {
    if (RETIRED_MODELS.includes(value)) throw new Error(`Retired model "${value}". Choose ${Object.keys(MODELS).join(", ")}.`);
    throw new Error(`Unsupported model "${value}". Choose ${Object.keys(MODELS).join(", ")}.`);
  }
  return model;
}

const rank = effort => ALLOWED_EFFORTS.indexOf(effort);

export function validateEffort(effort, highReason, model = null) {
  if (!ALLOWED_EFFORTS.includes(effort)) {
    throw new Error(`Unsupported effort "${effort}". Only low, medium, high, xhigh and max are recognized; ultra is prohibited.`);
  }
  const selected = typeof model === "string" ? resolveModel(model) : model;
  const [min, max] = [selected?.minEffort ?? "low", selected?.maxEffort ?? "high"];
  if (rank(effort) < rank(min) || rank(effort) > rank(max)) {
    throw new Error(`${selected?.id ?? "An unspecified model"} runs at ${min} through ${max} only; "${effort}" is not permitted.`);
  }
  if (rank(effort) >= rank("high") && !selected?.freeHigh && !String(highReason ?? "").trim()) {
    throw new Error("High effort requires a recorded highReason (as do xhigh and max) for an owner-selected policy, orchestration or intense reasoning.");
  }
  return effort;
}

export function validateReviewAvailability(fallback, unavailableProvider) {
  if (!fallback || !["codex", "claude"].includes(unavailableProvider)) throw new Error("review fallback requires an unavailable provider and evidence");
  if (fallback.reason === "cli-not-installed" && fallback.missingProvider === unavailableProvider &&
      typeof fallback.evidence === "string" && fallback.evidence.trim()) return;
  if (fallback.reason === "review-models-unavailable" && fallback.unavailableProvider === unavailableProvider) {
    const expected = unavailableProvider === "claude" ? [MODELS.opus.id, MODELS.fable.id] : [MODELS.sol.id];
    const attempts = fallback.attempts;
    if (Array.isArray(attempts) && expected.every(model => attempts.some(attempt => attempt?.model === model &&
        ["credentials-unavailable", "quota-unavailable", "model-unavailable"].includes(attempt.reason) &&
        typeof attempt.evidence === "string" && attempt.evidence.trim()))) return;
  }
  throw new Error("same-provider fallback requires missing-CLI evidence or observed credentials/quota/model unavailability for every authorized opposite-provider reviewer");
}

export function validateReviewFallback(fallback, implementationProvider, reviewProvider) {
  if (!["codex", "claude"].includes(implementationProvider) || reviewProvider !== implementationProvider) {
    throw new Error("same-provider fallback requires an implementation provider and a fresh reviewer of that provider");
  }
  validateReviewAvailability(fallback, implementationProvider === "codex" ? "claude" : "codex");
}

function defaultModel(provider, task) {
  if (provider === "codex") return task === "simple" ? "luna" : "sol";
  return ["coding", "design", "review", "orchestration"].includes(task) ? "opus" : "fable";
}

// Owner-selected defaults above medium by model and task; the resolver records each reason.
const owner = (effort, reason) => ({ effort, reason });
const OWNER_DEFAULTS = {
  [MODELS.opus.id]: {
    coding: owner("high", "Owner-selected Opus 5.5 high for Claude coding (2026-09-24)."),
    review: owner("high", "Owner-selected Opus 5.5 high for independent review (2026-09-24)."),
    design: owner("high", "Owner-selected Opus 5.5 high for Claude design (2026-10-05)."),
    orchestration: owner("high", "Owner-selected Opus 5.5 high for Claude orchestration (2026-10-05).")
  },
  [MODELS.fable.id]: {
    design: owner("high", "Owner-selected Fable 5.1 high for Claude design (2026-10-05)."),
    intense: owner("high", "Owner-selected Fable 5.1 high for intense reasoning (2026-10-05).")
  },
  [MODELS.sol.id]: {
    coding: owner("high", "Owner-selected GPT-6.1 Sol high for Codex coding (2026-10-05)."),
    review: owner("high", "Owner-selected GPT-6.1 Sol high for independent review (2026-10-05)."),
    orchestration: owner("high", "Owner-selected GPT-6.1 Sol high for Codex orchestration (2026-10-05)."),
    design: owner("xhigh", "Owner-selected GPT-6.1 Sol xhigh for Codex design (2026-10-05)."),
    intense: owner("xhigh", "Owner-selected GPT-6.1 Sol xhigh for intense reasoning (2026-10-05).")
  }
};

function defaultEffort(task, selected) {
  const policy = OWNER_DEFAULTS[selected.id]?.[task];
  if (policy) return policy.effort;
  const base = ["orchestration", "intense", "review", "design"].includes(task) ? "medium" : "low";
  return rank(base) < rank(selected.minEffort ?? "low") ? selected.minEffort : base;
}

export function resolveRouting({ provider = "codex", task = "coding", model, effort, highReason, availableModels, reviewFallback = null } = {}) {
  if (!["codex", "claude"].includes(provider)) throw new Error(`Unknown provider: ${provider}`);
  if (!TASK_CLASSES.includes(task)) throw new Error(`Unknown task class: ${task}`);
  let requestedModel = model ?? defaultModel(provider, task);
  let fallbackReason = null;
  let usedReviewFallback = null;
  // Only the owner-authorized default review chain may change provider/model.
  // Callers supply verified availability; missing/unknown data is not absence.
  if (task === "review" && !model && availableModels) {
    const candidates = provider === "claude" ? ["opus", "fable", "sol"] : ["sol", "opus", "fable"];
    const candidate = candidates.find(name => availableModels.includes(MODELS[name].id));
    if (!candidate) throw new Error("No authorized review model is available. Independent review remains incomplete.");
    if (candidate !== requestedModel) {
      if (MODELS[candidate].provider !== provider) {
        validateReviewAvailability(reviewFallback, provider);
        usedReviewFallback = reviewFallback;
      }
      fallbackReason = `Preferred review route ${MODELS[requestedModel].id} unavailable; selected ${MODELS[candidate].id} from caller-verified availableModels.`;
      requestedModel = candidate;
      provider = MODELS[candidate].provider;
    }
  }
  const selected = resolveModel(requestedModel);
  if (selected.provider !== provider) throw new Error(`${requestedModel} cannot run through ${provider}.`);
  if (selected.legacy && !model) throw new Error(`${selected.id} is a legacy explicit pin and never a default.`);
  const selectedEffort = effort ?? defaultEffort(task, selected);
  // The owner reason covers any elevated effort up to the owner-selected level.
  const policy = OWNER_DEFAULTS[selected.id]?.[task];
  const ownerReason = policy && rank(selectedEffort) >= rank("high") && rank(selectedEffort) <= rank(policy.effort) ? policy.reason : null;
  const reason = highReason ?? ownerReason;
  validateEffort(selectedEffort, reason, selected);
  if (availableModels && !availableModels.includes(selected.id)) {
    throw new Error(`${selected.id} is unavailable. Report the blocker and select an explicit available fallback; never silently substitute.`);
  }
  return { policyVersion: POLICY_VERSION, provider, task, requestedModel, model: selected.id, effort: selectedEffort, highReason: reason, fallbackReason, reviewFallback: usedReviewFallback };
}

// The coordinator and every nested reviewer consume the same host capacity.
export function workerCapacity({ hostSlots, activeWorkers = 0, coordinatorSlots = 1, requested = 1, nestedPerWorker = 0 }) {
  for (const [key, value] of Object.entries({ hostSlots, activeWorkers, coordinatorSlots, requested, nestedPerWorker })) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${key} must be a nonnegative integer.`);
  }
  return Math.min(requested, Math.max(0, Math.floor((hostSlots - coordinatorSlots - activeWorkers) / (1 + nestedPerWorker))));
}

// Skills resolve routes through this CLI instead of restating the defaults above.
export function resolveFromArgs(args) {
  const { positionals, values } = parseArgs({ args, allowPositionals: true, strict: true, options: {
    provider: { type: "string" }, task: { type: "string" }, model: { type: "string" }, effort: { type: "string" },
    "high-reason": { type: "string" }, available: { type: "string" }, "review-fallback": { type: "string" }
  } });
  if (positionals.join(" ") !== "resolve") {
    throw new Error("Usage: model-policy.mjs resolve --provider <codex|claude> --task <class> [--model <pin>] [--effort <effort>] [--high-reason <text>] [--available <id,id>] [--review-fallback <JSON>]");
  }
  return resolveRouting({
    provider: values.provider, task: values.task, model: values.model, effort: values.effort, highReason: values["high-reason"],
    availableModels: values.available?.split(",").map(id => id.trim()).filter(Boolean),
    reviewFallback: values["review-fallback"] === undefined ? null : JSON.parse(values["review-fallback"])
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(resolveFromArgs(process.argv.slice(2)), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
