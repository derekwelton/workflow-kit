// Canonical source: derekwelton/workflow-kit. Sync into codex-kit with sync-codex-policy.mjs.
export const POLICY_VERSION = "2026-09-10";
export const ALLOWED_EFFORTS = ["low", "medium", "high"];
export const MODELS = {
  astra: { id: "gpt-6-astra", provider: "codex" },
  terra: { id: "gpt-5.6-terra", provider: "codex" },
  sol: { id: "gpt-5.6-sol", provider: "codex" },
  fable: { id: "claude-fable-5-1", provider: "claude" },
  opus: { id: "claude-opus-5", provider: "claude" }
};

export function resolveModel(value) {
  const model = MODELS[value] ?? Object.values(MODELS).find((entry) => entry.id === value);
  if (!model) throw new Error(`Unsupported model "${value}". Choose ${Object.keys(MODELS).join(", ")}.`);
  return model;
}

export function validateEffort(effort, highReason) {
  if (!ALLOWED_EFFORTS.includes(effort)) {
    throw new Error(`Unsupported effort "${effort}". Only low, medium, high are permitted; xhigh, max and ultra are prohibited.`);
  }
  if (effort === "high" && !String(highReason ?? "").trim()) {
    throw new Error("High effort requires a recorded highReason for orchestration or intense reasoning.");
  }
  return effort;
}

export function resolveRouting({ provider = "codex", task = "coding", model, effort, highReason, availableModels } = {}) {
  if (!["codex", "claude"].includes(provider)) throw new Error(`Unknown provider: ${provider}`);
  if (!["simple", "coding", "review", "orchestration", "intense"].includes(task)) throw new Error(`Unknown task class: ${task}`);
  const requestedModel = model ?? (provider === "codex" ? (task === "simple" ? "terra" : "astra") : "fable");
  const selected = resolveModel(requestedModel);
  if (selected.provider !== provider) throw new Error(`${requestedModel} cannot run through ${provider}.`);
  const selectedEffort = effort ?? (["orchestration", "intense", "review"].includes(task) ? "medium" : "low");
  const reason = highReason ?? null;
  validateEffort(selectedEffort, reason);
  if (availableModels && !availableModels.includes(selected.id)) {
    throw new Error(`${selected.id} is unavailable. Report the blocker and select an explicit available fallback; never silently substitute.`);
  }
  return { policyVersion: POLICY_VERSION, provider, task, requestedModel, model: selected.id, effort: selectedEffort, highReason: reason, fallbackReason: null };
}

// The coordinator and every nested reviewer consume the same host capacity.
export function workerCapacity({ hostSlots, activeWorkers = 0, coordinatorSlots = 1, requested = 1, nestedPerWorker = 0 }) {
  for (const [key, value] of Object.entries({ hostSlots, activeWorkers, coordinatorSlots, requested, nestedPerWorker })) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${key} must be a nonnegative integer.`);
  }
  return Math.min(requested, Math.max(0, Math.floor((hostSlots - coordinatorSlots - activeWorkers) / (1 + nestedPerWorker))));
}
