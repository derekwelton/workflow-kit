// Canonical source: derekwelton/workflow-kit.
export const POLICY_VERSION = "2026-09-24";
export const ALLOWED_EFFORTS = ["low", "medium", "high"];
export const CLAUDE_REVIEW_HIGH_REASON = "Owner-selected Opus 5.5 high for independent review (2026-09-24).";
export const CLAUDE_CODING_HIGH_REASON = "Owner-selected Opus 5.5 high for Claude coding (2026-09-24).";
export const TASK_CLASSES = ["simple", "coding", "design", "review", "orchestration", "intense"];
// freeHigh: high needs no recorded reason (owner-approved for the cheap model).
// minEffort: the model never runs below this effort.
// legacy: explicit pin only; never a default.
export const MODELS = {
  astra: { id: "gpt-6-astra", provider: "codex" },
  sol: { id: "gpt-6-sol", provider: "codex" },
  luna: { id: "gpt-6-luna", provider: "codex", freeHigh: true },
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

export function validateEffort(effort, highReason, model = null) {
  if (!ALLOWED_EFFORTS.includes(effort)) {
    throw new Error(`Unsupported effort "${effort}". Only low, medium, high are permitted; xhigh, max and ultra are prohibited.`);
  }
  const selected = typeof model === "string" ? resolveModel(model) : model;
  if (selected?.minEffort && ALLOWED_EFFORTS.indexOf(effort) < ALLOWED_EFFORTS.indexOf(selected.minEffort)) {
    throw new Error(`${selected.id} runs at ${selected.minEffort} or high only; "${effort}" is not permitted.`);
  }
  if (effort === "high" && !selected?.freeHigh && !String(highReason ?? "").trim()) {
    throw new Error("High effort requires a recorded highReason for an owner-selected review policy, orchestration or intense reasoning.");
  }
  return effort;
}

export function validateReviewAvailability(fallback, unavailableProvider) {
  if (!fallback || !["codex", "claude"].includes(unavailableProvider)) throw new Error("review fallback requires an unavailable provider and evidence");
  if (fallback.reason === "cli-not-installed" && fallback.missingProvider === unavailableProvider &&
      typeof fallback.evidence === "string" && fallback.evidence.trim()) return;
  if (fallback.reason === "review-models-unavailable" && fallback.unavailableProvider === unavailableProvider) {
    const expected = unavailableProvider === "claude" ? [MODELS.opus.id, MODELS.fable.id] : [MODELS.astra.id];
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
  if (provider === "codex") return task === "simple" ? "luna" : "astra";
  return ["coding", "design", "review"].includes(task) ? "opus" : "fable";
}

// Owner-selected Opus 5.5 high defaults; the resolver records their reasons.
const OPUS_HIGH_REASONS = { review: CLAUDE_REVIEW_HIGH_REASON, coding: CLAUDE_CODING_HIGH_REASON };

function defaultEffort(task, selected) {
  if (selected.id === MODELS.opus.id && OPUS_HIGH_REASONS[task]) return "high";
  if (["orchestration", "intense", "review", "design"].includes(task)) return "medium";
  return selected.minEffort ?? "low";
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
    const candidates = provider === "claude" ? ["opus", "fable", "astra"] : ["astra", "opus", "fable"];
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
  const ownerReason = selected.id === MODELS.opus.id && selectedEffort === "high" ? OPUS_HIGH_REASONS[task] ?? null : null;
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
