# Workload contract

Use this reference for a multi-issue workload. A standalone issue keeps the
normal implementation → independent review → `In Review` path.

## State boundary

Keep workload issues in `Code Review` after their independent issue review.
Record `reviewed-pending-integration` in the workload manifest. Move the
workload's issues to `In Review` only after the integration branch is complete,
current with its recorded main base, reviewed, verified, pushed, and represented
by one umbrella PR.

Do not introduce a tracker status for the manifest-only intermediate state.

## Model pairing

Read `../../model-routing/SKILL.md`. Model/effort choices come from that policy;
this contract owns provider independence, not a fixed generation of models.

Select the reviewer from the provider that authored the implementation diff,
not from the provider coordinating the run.

| Pair mode | Implementation | Review |
|---|---|---|
| `cross` | Codex | fresh Claude reviewer from model-routing |
| `cross` | Claude | fresh Codex reviewer from model-routing |
| `codex-only` | Codex | fresh independent Codex session |
| `claude-only` | Claude | fresh independent Claude session |

When providers are mixed, resolve the pair independently for every issue. The
same session or agent must never implement and review an issue. Explicit
`--implementer` and `--reviewer` arguments must still obey the selected pair
mode; choose `codex-only` or `claude-only` explicitly for same-provider work.

Review manual integration/conflict-resolution edits with a provider different
from the provider that authored those edits. A conflict-free merge still needs
the combined integration verification gate, but not a repetition of every
issue review.

## Integration branch

Create `integration/<workload-slug>` from the freshly fetched default branch
after every included issue has a review receipt. Combine exact reviewed heads
in dependency order. Detect stacked branches and avoid replaying commits twice.

Never resolve conflicts on the issue branches. Resolve them only on the
integration branch, record the affected paths, and independently review the
resolution diff.

Create one draft umbrella PR from the integration branch to the default branch.
Reference every GitHub twin with `Refs`; never use `Closes` under Linear mode.
Keep individual PRs available as issue-level review evidence until the workload
is accepted.

Before final merge, refresh the integration branch from current main and rerun
the repository integration gate if main has advanced.

## All-or-nothing behavior

Default to an atomic human-review handoff: if any issue is blocked, keep the
whole workload out of `In Review`. Use `--allow-partial` only when the user
explicitly requests it. Remove deferred issues from the frozen manifest with a
durable tracker explanation before continuing; never silently omit one.

The Linear writes are sequential rather than transactional. After each write,
record the result. On interruption, resume by reconciling the manifest against
the tracker and complete or roll back the handoff visibly.

Keep integration state `assembling` while validating all review receipts and
the complete branch receipt. Immediately before the batch transition, re-fetch
every issue. If every expected issue is still `Code Review`, move them to
`In Review`, set their manifest states to `in-review`, then set integration
state `ready-for-human-review` and run final manifest validation. If one changed
unexpectedly, stop rather than overwriting it; do not mark integration ready
while tracker and manifest disagree.

## Single writer

Only the workload coordinator may:

- create or deduplicate discovered issues;
- change tracker statuses or post sync-thread comments;
- create or merge PRs;
- assemble the integration branch;
- change workload manifest membership.

Workers edit and test their leased worktrees, then return a structured envelope.
The coordinator audits tracked and untracked files before committing or
integrating them.

Only the coordinator spawns workers. Workers must not spawn their own subagents;
review workers evaluate both axes themselves or return the need for a separate
axis to the coordinator. Wait on harness completion notifications or supported
Monitor conditions. Blocking `sleep` is forbidden; long waits belong in background
tasks with completion delivery, not polling loops.

Source edits use Edit/Write or the host's structured patch tool (`apply_patch`).
Bash/PowerShell is for build, test, Git, and read-only inspection. Do not patch
source through heredocs or inline Python. The failure signature
`unexpected EOF while looking for matching` is a reason to switch to structured
edits, not retry an increasingly escaped command. Use [worker-prompt.md](worker-prompt.md).

## Review convergence and checkpoints

Default `maxReviewRounds` is 2 per issue. `set-issue --state code-review` reserves
each launch, including another review of an unchanged head. The first transition
from implementation reserves round 1. A new review worker identity also consumes
a round; metadata updates for the same worker do not. Extra rounds require the
user's authorization and `--allow-extra-round --reason <text>`. Record all review
axes from one dispatch as one round. A failed launch consumes its reserved round;
report it rather than silently retrying. Never reset the count by reopening work.

Round 1 blocks on high/medium; later rounds block only on high. Remaining
medium/low findings become linked follow-ups, deduplicated by the coordinator,
with `chore` where supported by the local tracker contract. Store the adjudicated
findings via `--review-findings` as `{severity, status, summary, followUp}` entries.
High findings cannot be deferred; medium findings cannot be deferred in round 1.
Use `resolved` for fixed findings and `deferred` with a real issue link/key for
the remainder. The final-SHA review and human acceptance gates remain mandatory.
Review defaults to medium; high needs a reason from canonical model-routing.
Sonnet/Haiku are not allowed worker routes; preserve the actual requested and
resolved model evidence, including explicit unknown identity when not exposed.

Successful mutations also write `<git-common>/workflow-kit/runs/<id>/handoff-<date>.md`
with issue gates, rounds, evidence, follow-ups, blockers, and integration state.
It is a derived checkpoint: reconcile its timestamp against the authoritative
manifest before resume. Migration initializes counters without inventing past
rounds and marks unknown historical review counts explicitly.

## Worker envelope

Require every implementation and review worker to return:

```json
{
  "issue": "KEY-123",
  "stage": "implementation|review|integration",
  "branch": "owner/key-123-slug",
  "worktree": "absolute path",
  "baseSha": "commit",
  "headSha": "commit",
  "provider": "codex|claude",
  "execution": { "requestedModel": "gpt-6-astra", "resolvedModel": null, "resolutionStatus": "unverified", "effort": "low", "highReason": null, "workerId": "runtime-session-id", "policyVersion": "2026-09-04", "fallbackReason": null },
  "state": "complete|blocked",
  "summary": ["plain-language outcome"],
  "changedFiles": [],
  "untrackedFiles": [],
  "tests": [
    {
      "command": "exact command",
      "status": "passed|failed|blocked|skipped",
      "tests": 0,
      "headSha": "exact tested commit",
      "details": "optional useful result"
    }
  ],
  "reviewReceipt": null,
  "blocker": null,
  "discoveries": []
}
```

The coordinator validates the envelope against Git and the manifest. Do not
trust a prose-only completion claim.

`stage` and `summary` are required so the presentation layer never describes an
independent review as an implementation pass or substitutes a file list for an
outcome. A legacy envelope without `stage` may be rendered generically, but the
coordinator must supply the known stage to the renderer. A completed envelope
without conclusive passing verification is incomplete and cannot advance the
issue. Keep the exact tested SHA in the structured `headSha` test field; the
default renderer omits it while `--technical` exposes exact machine details.

The envelope is an internal protocol, not a user report. Store and validate it
as structured data, but never paste it into chat, a final answer, or a tracker
checkpoint unless the user explicitly requests raw JSON. Render a human
checkpoint with outcome, changes, verification, relevant notes, and next
action. Keep absolute paths, schema fields, and full SHAs in the envelope; show
them only when they are actionable or explicitly requested.

When persisting the envelope, record full Git-resolved base/head commits. The
`tests` evidence must include the exact tested head SHA. A final review receipt
must use `<review-provider>:<full-head-sha>:<durable-receipt-id>`. Changing the
head invalidates both old values. The manifest helper enforces integration
state order (`pending → assembling → ready-for-human-review → merged`) and
requires a head-bound conflict review receipt when conflicts occurred.

## Final handoff

Show one table with issue, implementer, reviewer, issue branch, review receipt,
integration membership, tests, blocker, review rounds/limit, and linked follow-ups. Then state:

- integration branch and exact base/main SHA;
- umbrella PR;
- whether main advanced after the gate;
- workload issues transitioned to `In Review`;
- SQL, configuration, deployment, live-data, and human verification gates;
- explicitly: `Not merged to main`.

## Execution metadata and migration

Record each worker envelope's `execution` through `set-issue` using
`--implementation-execution` or `--review-execution` with JSON. Schema 3 requires
these records at completed gates. A null resolvedModel means the host did not
expose it; never fabricate observed model identity. Replace execution metadata
on every new worker launch. A high effort record must explain why it was needed.

Schema 2 remains readable. Before continuing an older run, preview
`migrate --run <id> --dry-run`, then apply `migrate --run <id>`. Migration preserves
all issue membership, status, SHAs, and receipts; historical model/effort/worker
identity stays explicitly unknown. New work must replace legacy metadata.
