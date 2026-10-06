# Workload contract

Canonical owner of multi-issue invariants. Action skills reference these gates;
the manifest helper enforces their durable state/evidence. Standalone issues
use implementation → independent review → human review.

## Membership and ownership

Freeze repository-scoped, deduplicated issue membership for each run. Do not
admit new query matches on resume. Default handoff is all-or-nothing.
--allow-partial requires explicit authorization and a durable explanation
before removing deferred issues from frozen membership.

Only the coordinator changes tracker state/comments, creates/deduplicates
discoveries, creates/merges PRs, assembles integration, changes membership,
or launches workers. Workers edit/test leased worktrees and return envelopes;
each review worker covers both Standards and Spec without nested delegation,
unless the user explicitly asked this run for separate axis reviewers. Audit tracked
and untracked files before committing or integrating. Preserve dirty/active
worktrees. Source edits use structured patches, not shell-built edits.
Reuse loaded, unchanged instructions; reload only when changed or lost. Prefer
completion notifications to polling, and never duplicate a worker just because
a session ended.

## Independent review and routing

Model, effort and review-fallback evidence are owned by
`../../../templates/model-routing.md`. Provider pairing uses the author of each
implementation diff, not the coordinator:
- cross: prefer Codex author → fresh Claude reviewer; Claude author → fresh Codex reviewer.
  If that provider or its authorized reviewers are unavailable, use a fresh
  same-provider session with model-routing's --review-fallback evidence, passed to
  init/pair, or to set-issue when the gap is discovered later.
- codex-only / claude-only: fresh independent same-provider session.
Explicit implementer/reviewer choices must obey the selected pair mode.
The same session/agent cannot implement and review an issue.
Manual integration/conflict-resolution edits prefer a reviewer from the provider
opposite their author. The same availability fallback applies; record its evidence
and both session identities in integration review evidence. Explicit same-provider
choices still require a fresh reviewer. Never approve one's own implementation.
A conflict-free merge needs combined verification, not repeated issue reviews.

## Review convergence

Follow `../../../templates/review-policy.md` for independence, findings and changes
after review. Workloads add this accounting. New runs default to bounded:
maxReviewRounds = 2 completed reviews per issue; no automatic second review after
a clean first review. Track logical dispatch IDs, attempt IDs and completed
verdicts separately: reserve with --review-dispatch before launch, update the
same attempt with its outcome and never launch concurrent duplicates. Metadata
updates never reserve another review. Failed arguments, quota interruptions and
stopped launches without a verdict do not consume completed reviews; retain their
evidence and partial findings. Allow at most two infrastructure retries per
dispatch within existing scope and model authorization; exhaustion is an
infrastructure blocker, never approval, and no replacement dispatch may evade it.

When the last budgeted review requires changes, its one focused fix verification
needs no additional allowance. A blocker remains only if that verification fails
or finds a new blocker; then ask once about the concrete blocker and proposed
action. Save the answer with --review-authorization: decision reference,
issue/finding scope, additional allowance and any expiry/model/cost constraints.
Reuse it across resumes and retries; ask again only for changed scope or an
exhausted allowance. Never infer consent from elapsed time or a restart.
See `commands.md` for the protocol. Budget exhaustion never confers approval.

Preserve saved strict/convergent policy and historical launch counters. They retain
their legacy semantics until an explicit set-policy --review-policy bounded
--policy-decision adopts this policy. Do not reinterpret old launches as completed
reviews or invent historical verdicts. Schema migration alone does not change policy.
Existing repository overrides must be reconciled during adoption.

Coordinator adjudicates and deduplicates follow-ups under the shared policy.
Store --review-findings entries: id, severity, category, blocking, status,
summary, followUp, decision. Stable IDs identify repeats. Fixed = resolved;
optional style/simplification/out-of-scope-enhancement findings may remain open
without a deferral approval or mandatory ticket. Real defects always block.
No automatic severity/effort escalation from older issue rules.

## Evidence and state

Dispatch/validate using [worker-envelope.md](worker-envelope.md).
code-review requires Git-resolved full base/head, implementation provider/
execution and passing tests containing the exact tested head SHA.
reviewed-pending-integration also requires reviewer/execution and a receipt:
<review-provider>:<full-head-sha>:<durable-receipt-id>.
Head changes invalidate tests. Review coverage for a changed head requires either
a new independent receipt or --review-attestation for the complete eligible
nonfunctional delta: the exact delta, classification, why behavior is unchanged,
assessor and checks run on the current head. Check callers, argument evaluation
and interface implications before classifying unused-argument removal. Keep the
original receipt attached to the SHA actually reviewed; the attestation is
coordinator evidence, not independent review of the new commit. Prose completion cannot
substitute for validated Git/manifest evidence. Bounded runs also require a
head-bound --completion-guide before reviewed-pending-integration.

Record --implementation-execution / --review-execution every launch:
requested/resolved model, effort, worker ID, policy version, high reason and
explicit fallback reason. Unexposed resolved identity is null/unknown.
Schema 2 migration: preview migrate --dry-run then apply; preserve membership,
status, SHAs/receipts and leave historical execution/counters unknown rather
than inventing evidence or consent. New work replaces legacy metadata.

Keep reviewed issues in tracker Code Review (or local mapped phase), with
manifest reviewed-pending-integration. No new tracker status for this state.
GitHub Projects without codeReview keeps inProgress; ordinary GitHub uses
checkpoints with no invented statuses. Tracker writes follow the shared
tracker-write contract and selected adapter.

## Integration gate

After every included issue has exact-head review coverage, fetch default branch
and create integration/<slug> from its current remote SHA. Combine exact
reviewed heads in dependency order, detecting stacked ancestry to avoid
replaying commits. Audit membership against commits/changed files.
Resolve conflicts only on integration, record affected paths and conflict
history, and independently review the manual resolution diff.
Do not clear recorded conflict history.

Record ordered integration state pending → assembling → ready-for-human-review
→ merged. Combined tests must bind to full integration head SHA; conflicts
require --conflicts-occurred and --conflict-review-receipt
<provider:head-sha:receipt-id>, never a bare boolean.
Run repository integration checks once, serializing shared build outputs.
Create/push the authorized draft umbrella PR against default branch; use Refs,
never Closes under Linear. Keep individual PRs as evidence until acceptance.
Orchestration never merges.

## Human handoff and resume

While assembling, validate every issue receipt and integration gate.
Immediately before batch transition refetch all issues; require each expected
Code Review/mapped status. Unexpected status stops/reconciles, never overwrites.
Publish one workload-ready checkpoint per issue, move eligible statuses to
In Review, record each sequential result, set manifest issues in-review,
then integration ready-for-human-review and validate again.
Never mark ready while tracker and manifest disagree. On interruption reconcile
successful and unknown writes individually, then visibly complete or roll back
the batch; writes are not transactional. Do not blindly repeat comments.
Never set Done.

After the verified PR/handoff, perform the bounded worker-branch cleanup in
`cleanup-integrated.md` as part of completing the run. Keep the integration
branch, review evidence and manifest for human review and resume. Record each
cleanup result in the affected issue's --resume-context, preserving existing
context. A recorded cleanup explains an absent source branch/worktree on resume;
do not recreate it merely because it is absent. Reconcile the saved SHAs against
the retained integration branch and receipt before continuing.

Before final merge fetch current main again; advancement requires recombination
and combined verification. Manual resolutions/material behavior changes require
fresh human acceptance of the new head. Final merge and cleanup beyond the
bounded end-of-run worker cleanup require explicit authorization. Preserve
retained leased worktrees/processes; verify process
command/start-time/ownership, never stop by PID alone.

Manifest is canonical state; tracker is canonical narrative. Optional
--handoff-snapshot is derived and checked against manifest updatedAt on resume.
--resume-context records intended-environment acceptance evidence, owned jobs/
processes, unresolved schema/config/deployment/live-data prerequisites and next
action. Unknown prerequisites remain unknown; passing unit checks is not proof
the unavailable core user task works.

## Final dashboard

Return the feature usage/testing guide and ordered required/optional setup actions
from `../../../templates/completion-guide.md`, then a concise evidence table:
issue, implementer, reviewer, branch, coverage, membership, tests, blocker,
completed reviews/limit, failed attempts and useful linked follow-ups. Distinguish
carried review evidence from an independent review of the current head.
Include integration branch/base/main SHA, umbrella PR, whether main advanced,
observed issue transitions, remaining prerequisites and exact checkout/test
action. State **Not merged to main** until a separately authorized merge succeeds.
Report removed and retained worker branches/worktrees, with reasons for anything
left behind. A cleanup failure does not undo a verified PR/handoff; report partial
cleanup separately and retain its next action for resume.
Never paste raw envelopes unless explicitly requested.
