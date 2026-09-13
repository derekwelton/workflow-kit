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
review workers cover assigned axes without nested delegation. Audit tracked
and untracked files before committing or integrating. Preserve dirty/active
worktrees. Source edits use structured patches, not shell-built edits.
Follow lifecycle instruction-retention and wait rules; never duplicate a
worker just because a session ended.

## Independent review and routing

Model/effort is owned by `../../../templates/model-routing.md`. Provider pairing uses
the author of each implementation diff, not the coordinator:
- cross: Codex author → fresh Claude reviewer; Claude author → fresh Codex reviewer.
- codex-only / claude-only: fresh independent same-provider session.
Explicit implementer/reviewer choices must obey the selected pair mode.
The same session/agent cannot implement and review an issue.
Manual integration/conflict-resolution edits require a reviewer from the
provider opposite their author, even in a same-provider issue pair mode.
A conflict-free merge needs combined verification, not repeated issue reviews.

## Review convergence

Default maxReviewRounds = 2 is a stop/reconcile threshold, never approval.
Preserve saved policy on resume; absent legacy policy is unverified.
Strict is default. Convergent policy or live changes require a run-scoped
user decision recorded via --policy-decision / set-policy.
Do not infer consent from historical anecdotes or a restarted session.

Reserve each launch with set-issue --state code-review. The first implementation
transition reserves round 1; do not reserve it twice. A new reviewer identity,
another launch on an unchanged head, or failed launch consumes a round;
metadata edits for the same worker do not. One dispatch's axes are one round.
Do not reset counts by reopening implementation. Beyond the cap requires
--allow-extra-round --reason with explicit user authorization.

Strict leaves unresolved findings blocking. Approved convergent policy:
round 1 blocks high/medium; round 2 onward may defer eligible nonblocking
medium/low. Acceptance, correctness, security and data-loss blockers always
block regardless of severity. High is never deferred/downgraded to fit a cap.
Review full scope initially, then fixes/affected behavior; broaden on material
scope change. Coordinator adjudicates and deduplicates follow-ups.
Store --review-findings entries: id, severity, category, blocking, status,
summary, followUp, decision. Stable IDs identify repeats. Fixed = resolved;
remaining = deferred with real issue key/URL and decision reference before
completion. No automatic severity/effort escalation from older issue rules.

## Evidence and state

Dispatch/validate using [worker-envelope.md](worker-envelope.md).
code-review requires Git-resolved full base/head, implementation provider/
execution and passing tests containing the exact tested head SHA.
reviewed-pending-integration also requires reviewer/execution and a receipt:
<review-provider>:<full-head-sha>:<durable-receipt-id>.
Head changes invalidate tests and review receipt. Prose completion cannot
substitute for validated Git/manifest evidence.

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

After every included issue has a final review receipt, fetch default branch
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

Before final merge fetch current main again; advancement requires recombination
and combined verification. Manual resolutions/material behavior changes require
fresh human acceptance of the new head. Merge/destructive cleanup require
explicit authorization. Preserve leased worktrees/processes; verify process
command/start-time/ownership, never stop by PID alone.

Manifest is canonical state; tracker is canonical narrative. Optional
--handoff-snapshot is derived and checked against manifest updatedAt on resume.
--resume-context records intended-environment acceptance evidence, owned jobs/
processes, unresolved schema/config/deployment/live-data prerequisites and next
action. Unknown prerequisites remain unknown; passing unit checks is not proof
the unavailable core user task works.

## Final dashboard

Return human-readable outcome plus a table: issue, implementer, reviewer,
branch, receipt, membership, tests, blocker, rounds/limit and linked follow-ups.
Include integration branch/base/main SHA, umbrella PR, whether main advanced,
observed issue transitions, remaining prerequisites and exact checkout/test
action. State **Not merged to main** until a separately authorized merge succeeds.
Never paste raw envelopes unless explicitly requested.
