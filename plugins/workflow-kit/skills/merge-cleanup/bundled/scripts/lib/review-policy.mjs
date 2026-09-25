// Durable review accounting for the bounded policy. Legacy launch histories stay intact.
import { isDeepStrictEqual } from "node:util";
const text = value => typeof value === "string" && value.trim().length > 0;
const required = (condition, message) => { if (!condition) throw new Error(message); };
const equal = isDeepStrictEqual;

export function updateReviewDispatch(issue, input, limit) {
  issue.reviewDispatches ??= [];
  issue.reviewAuthorizations ??= [];
  const authorization = input.authorization;
  if (authorization) {
    required(text(authorization.id) && text(authorization.reference) && text(authorization.scope) &&
      Array.isArray(authorization.findings) && authorization.findings.length > 0 && authorization.findings.every(text) &&
      Number.isSafeInteger(authorization.allowance) && authorization.allowance > 0,
    "Review authorization requires id, reference, scope, findings and a positive allowance.");
    required(!authorization.expiresAt || Number.isFinite(Date.parse(authorization.expiresAt)), "Authorization expiry must be a valid date.");
    if (authorization.retryDispatchId !== undefined) required(text(authorization.retryDispatchId) && Number.isSafeInteger(authorization.retryAllowance) && authorization.retryAllowance > 0, "Retry authorization requires retryDispatchId and positive retryAllowance.");
    const old = issue.reviewAuthorizations.find(item => item.id === authorization.id);
    required(!old || equal(old, authorization), "An authorization ID cannot be rewritten.");
    if (!old) issue.reviewAuthorizations.push(authorization);
  }
  if (!input.dispatch) return;
  const request = input.dispatch;
  required(text(request.id) && text(request.scope) && ["initial", "fix-verification"].includes(request.kind),
    "Review dispatch requires id, scope and kind initial|fix-verification.");
  let dispatch = issue.reviewDispatches.find(item => item.id === request.id);
  if (!dispatch) {
    required(!issue.reviewDispatches.some(item => item.status === "active"), "A review dispatch is already active; reconcile it first.");
    const completed = issue.reviewDispatches.filter(item => item.status === "completed").length;
    if (completed >= limit) {
      const grant = issue.reviewAuthorizations.find(item => item.id === request.authorizationId);
      required(grant && grant.scope === request.scope &&
        (!grant.expiresAt || Date.parse(grant.expiresAt) > Date.now()), "Review budget exhausted; a matching unexpired authorization is required.");
      const used = issue.reviewDispatches.filter(item => item.authorizationId === grant.id && ["active", "completed"].includes(item.status)).length;
      required(used < grant.allowance, "Review authorization allowance exhausted.");
    }
    dispatch = { ...request, headSha: issue.headSha, status: "active", attempts: [] };
    delete dispatch.attempt;
    issue.reviewDispatches.push(dispatch);
    issue.reviewReceipt = null;
    issue.reviewAttestation = null;
  }
  required(dispatch.headSha === issue.headSha && dispatch.scope === request.scope && dispatch.kind === request.kind &&
    dispatch.authorizationId === request.authorizationId, "A dispatch ID cannot be reused for different code, scope or authorization.");
  const attempt = request.attempt;
  if (!attempt) return;
  required(text(attempt.id) && ["running", "failed", "completed"].includes(attempt.status), "Attempt requires id and running|failed|completed status.");
  const old = dispatch.attempts.find(item => item.id === attempt.id);
  if (old?.retryAuthorizationId) {
    required(!request.retryAuthorizationId || request.retryAuthorizationId === old.retryAuthorizationId, "Attempt retry authorization cannot change.");
    attempt.retryAuthorizationId = old.retryAuthorizationId;
  }
  if (old?.execution?.workerId) required(old.execution.workerId === attempt.execution?.workerId, "A replacement reviewer requires a new attempt ID.");
  if (old && equal(old, attempt)) return;
  required(dispatch.status === "active", "A completed dispatch is immutable.");
  if (!old) {
    required(!dispatch.attempts.some(item => item.status === "running"), "A review attempt is already running.");
    if (dispatch.attempts.length >= 3) {
      const grant = issue.reviewAuthorizations.find(item => item.id === request.retryAuthorizationId);
      const used = dispatch.attempts.filter(item => item.retryAuthorizationId === grant?.id).length;
      required(grant && grant.retryDispatchId === dispatch.id && grant.scope === dispatch.scope &&
        (!grant.expiresAt || Date.parse(grant.expiresAt) > Date.now()) && used < grant.retryAllowance,
      "Infrastructure retry limit exhausted; report the infrastructure blocker or supply a saved retry authorization.");
      attempt.retryAuthorizationId = grant.id;
    }
    dispatch.attempts.push(attempt);
  } else {
    required(old.status === "running", "A terminal attempt cannot be rewritten.");
    Object.assign(old, attempt);
  }
  if (attempt.status === "failed") required(text(attempt.reason), "Failed attempts require failure evidence.");
  if (attempt.status === "completed") {
    required(text(attempt.receipt) && ["pass", "changes-required"].includes(attempt.verdict), "Completed review requires a receipt and verdict.");
    dispatch.status = "completed";
    dispatch.receipt = attempt.receipt;
    dispatch.verdict = attempt.verdict;
    dispatch.execution = issue.reviewExecution;
    dispatch.findings = issue.reviewFindings;
    issue.reviewReceipt = attempt.receipt;
  }
}

export function reviewPolicyErrors(issue, limit) {
  const errors = [];
  const dispatches = issue.reviewDispatches ?? [];
  const ids = new Set();
  for (const dispatch of dispatches) {
    if (!text(dispatch.id) || ids.has(dispatch.id)) errors.push("invalid or duplicate review dispatch ID");
    ids.add(dispatch.id);
    if (!text(dispatch.scope) || !["initial", "fix-verification"].includes(dispatch.kind) ||
      !["active", "completed"].includes(dispatch.status) || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(dispatch.headSha ?? "")) errors.push("invalid review dispatch metadata");
    if (!Array.isArray(dispatch.attempts)) errors.push("invalid review attempts");
    const attempts = dispatch.attempts ?? [];
    const retryUsage = new Map();
    for (const attempt of attempts.slice(3)) {
      const grant = issue.reviewAuthorizations?.find(item => item.id === attempt.retryAuthorizationId);
      if (!grant || grant.retryDispatchId !== dispatch.id || grant.scope !== dispatch.scope || !text(grant.reference)) errors.push("extra infrastructure attempt lacks scoped authorization");
      else {
        retryUsage.set(grant.id, (retryUsage.get(grant.id) ?? 0) + 1);
        if (retryUsage.get(grant.id) > grant.retryAllowance) errors.push("infrastructure retry allowance exceeded");
      }
    }
    for (const attempt of attempts) {
      if (!text(attempt.id) || !["running", "failed", "completed"].includes(attempt.status)) errors.push("invalid review attempt");
      if (attempt.status === "failed" && !text(attempt.reason)) errors.push("failed attempt lacks evidence");
    }
    if (attempts.filter(item => item.status === "running").length > 1) errors.push("multiple running attempts");
    if (new Set(attempts.map(item => item.id)).size !== attempts.length) errors.push("duplicate review attempt ID");
    if (dispatch.status === "completed" && !attempts.some(item => item.status === "completed" && item.receipt === dispatch.receipt)) errors.push("completed dispatch requires completed attempt evidence");
    if (dispatch.status === "completed" && (!new RegExp(`^(codex|claude):${dispatch.headSha}:[^:\\s]+$`).test(dispatch.receipt ?? "") || !["pass", "changes-required"].includes(dispatch.verdict))) errors.push("completed dispatch requires a head-bound receipt and verdict");
    if (dispatch.execution?.workerId === issue.implementationExecution?.workerId) errors.push("review must be independent of implementation");
  }
  if (dispatches.filter(item => item.status === "active").length > 1) errors.push("multiple active review dispatches");
  const completed = dispatches.filter(item => item.status === "completed");
  const usage = new Map();
  for (const dispatch of completed.slice(limit)) {
    const grant = issue.reviewAuthorizations?.find(item => item.id === dispatch.authorizationId);
    if (!grant || grant.scope !== dispatch.scope || !text(grant.reference)) errors.push("extra completed review lacks scoped authorization");
    else {
      usage.set(grant.id, (usage.get(grant.id) ?? 0) + 1);
      if (usage.get(grant.id) > grant.allowance) errors.push("review authorization allowance exceeded");
    }
  }
  return errors;
}

export function completionGuideErrors(guide, headSha) {
  if (!guide || guide.headSha !== headSha) return ["completion guide must bind to the current head"];
  const errors = [];
  if (!Array.isArray(guide.features) || !guide.features.length || guide.features.some(feature =>
    !text(feature.name) || !text(feature.outcome) || !text(feature.access) || !text(feature.prerequisites) ||
    !Array.isArray(feature.steps) || !feature.steps.length || !feature.steps.every(text) || !text(feature.expected))) {
    errors.push("completion guide requires feature outcomes, access, prerequisites, steps and expected results");
  }
  if (!Array.isArray(guide.actions) || guide.actions.some(action =>
    !text(action.name) || typeof action.required !== "boolean" || !text(action.cwd) || !text(action.command) ||
    !text(action.purpose) || !text(action.prerequisites) || !text(action.expected) || !text(action.dataImpact) ||
    !["pending", "completed", "blocked", "unknown"].includes(action.status))) errors.push("completion guide actions require ordered executable instructions and status");
  if (!text(guide.verification) || !text(guide.limitations) || !text(guide.delivery)) errors.push("completion guide requires verification, limitations and delivery state");
  return errors;
}
