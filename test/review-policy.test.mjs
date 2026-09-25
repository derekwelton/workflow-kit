import assert from "node:assert/strict";
import test from "node:test";
import { updateReviewDispatch, reviewPolicyErrors, completionGuideErrors } from "../scripts/lib/review-policy.mjs";

const sha = "a".repeat(40);
const fixture = () => ({ headSha: sha, implementationExecution: { workerId: "author" }, reviewExecution: { workerId: "reviewer" }, reviewFindings: [] });
const request = (id, attemptId, status, extra = {}) => ({ dispatch: {
  id, scope: "fix F-1", kind: "fix-verification", ...extra,
  attempt: { id: attemptId, status, ...(status === "failed" ? { reason: "CLI argument rejected", partialFindings: [] } : {}),
    ...(status === "completed" ? { receipt: `claude:${sha}:${id}`, verdict: "pass" } : {}) }
} });

test("failed launch and duplicate updates do not spend a completed review", () => {
  const issue = fixture();
  updateReviewDispatch(issue, request("r1", "a1", "running"), 2);
  updateReviewDispatch(issue, request("r1", "a1", "running"), 2);
  assert.equal(issue.reviewDispatches.length, 1);
  assert.equal(issue.reviewDispatches[0].attempts.length, 1);
  updateReviewDispatch(issue, request("r1", "a1", "failed"), 2);
  updateReviewDispatch(issue, request("r1", "a2", "completed"), 2);
  updateReviewDispatch(issue, request("r1", "a2", "completed"), 2);
  assert.equal(issue.reviewDispatches.filter(item => item.status === "completed").length, 1);
  assert.deepEqual(reviewPolicyErrors(issue, 2), []);
});

test("retry bound and concurrent dispatch protection", () => {
  const issue = fixture();
  updateReviewDispatch(issue, request("r1", "a1", "running"), 2);
  assert.throws(() => updateReviewDispatch(structuredClone(issue), request("r2", "b1", "running"), 2), /already active/);
  assert.throws(() => updateReviewDispatch(structuredClone(issue), request("r1", "a2", "running"), 2), /already running/);
  updateReviewDispatch(issue, request("r1", "a1", "failed"), 2);
  updateReviewDispatch(issue, request("r1", "a2", "failed"), 2);
  updateReviewDispatch(issue, request("r1", "a3", "failed"), 2);
  assert.throws(() => updateReviewDispatch(issue, request("r1", "a4", "running"), 2), /retry limit/);
  updateReviewDispatch(issue, { authorization: { id: "retry-grant", reference: "owner-approved-retry", scope: "fix F-1", findings: ["infrastructure"], allowance: 1, retryDispatchId: "r1", retryAllowance: 1 } }, 2);
  updateReviewDispatch(issue, request("r1", "a4", "running", { retryAuthorizationId: "retry-grant" }), 2);
  updateReviewDispatch(issue, request("r1", "a4", "completed", { retryAuthorizationId: "retry-grant" }), 2);
  updateReviewDispatch(issue, request("r1", "a4", "completed", { retryAuthorizationId: "retry-grant" }), 2);
  assert.deepEqual(reviewPolicyErrors(issue, 2), []);
});

test("scoped allowance survives serialization and failed attempts but cannot be spent twice", () => {
  let issue = fixture();
  updateReviewDispatch(issue, request("r1", "a1", "completed"), 2);
  updateReviewDispatch(issue, request("r2", "a2", "completed"), 2);
  assert.throws(() => updateReviewDispatch(structuredClone(issue), request("r3", "a3", "running"), 2), /budget exhausted/);
  const authorization = { id: "grant", reference: "user-message-123", scope: "fix F-1", findings: ["F-1"], allowance: 1 };
  updateReviewDispatch(issue, { authorization }, 2);
  issue = JSON.parse(JSON.stringify(issue));
  assert.throws(() => updateReviewDispatch(structuredClone(issue), request("r3", "a3", "running", { authorizationId: "grant", scope: "different" }), 2), /matching/);
  updateReviewDispatch(issue, request("r3", "a3", "failed", { authorizationId: "grant" }), 2);
  issue = JSON.parse(JSON.stringify(issue));
  updateReviewDispatch(issue, request("r3", "a4", "completed", { authorizationId: "grant" }), 2);
  assert.deepEqual(reviewPolicyErrors(issue, 2), []);
  assert.throws(() => updateReviewDispatch(issue, request("r4", "a5", "running", { authorizationId: "grant" }), 2), /allowance exhausted/);
});

test("dispatch identity cannot be reused for changed code or changed scope", () => {
  const issue = fixture();
  updateReviewDispatch(issue, request("r1", "a1", "completed"), 2);
  assert.throws(() => updateReviewDispatch(issue, request("r1", "a1", "completed", { scope: "other" }), 2), /different code/);
  issue.headSha = "b".repeat(40);
  assert.throws(() => updateReviewDispatch(issue, request("r1", "a1", "completed"), 2), /different code/);
});

test("guide rejects stale head and incomplete usage/setup instructions", () => {
  const guide = { headSha: sha, features: [{ name: "Export", outcome: "Download CSV", access: "/export", prerequisites: "Editor", steps: ["Choose Export"], expected: "CSV downloads" }], actions: [], verification: "Unit suite passed", limitations: "Live data unverified", delivery: "Draft PR, not deployed" };
  assert.deepEqual(completionGuideErrors(guide, sha), []);
  assert.match(completionGuideErrors(guide, "b".repeat(40)).join(), /current head/);
  guide.features[0].steps = [];
  assert.match(completionGuideErrors(guide, sha).join(), /steps/);
  guide.actions.push({ name: "Migrate", command: "npm run migrate" });
  assert.match(completionGuideErrors(guide, sha).join(), /actions/);
});
