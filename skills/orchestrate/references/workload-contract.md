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

Select the reviewer from the provider that authored the implementation diff,
not from the provider coordinating the run.

| Pair mode | Implementation | Review |
|---|---|---|
| `cross` | Codex | fresh Claude Opus reviewer |
| `cross` | Claude Opus | fresh Codex Sol reviewer |
| `codex-only` | Codex | fresh independent Codex session |
| `claude-only` | Claude Opus | fresh independent Claude session |

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

## Worker envelope

Require every implementation and review worker to return:

```json
{
  "issue": "KEY-123",
  "branch": "owner/key-123-slug",
  "worktree": "absolute path",
  "baseSha": "commit",
  "headSha": "commit",
  "provider": "codex|claude",
  "state": "complete|blocked",
  "changedFiles": [],
  "untrackedFiles": [],
  "tests": [],
  "reviewReceipt": null,
  "blocker": null,
  "discoveries": []
}
```

The coordinator validates the envelope against Git and the manifest. Do not
trust a prose-only completion claim.

## Final handoff

Show one table with issue, implementer, reviewer, issue branch, review receipt,
integration membership, tests, and blocker. Then state:

- integration branch and exact base/main SHA;
- umbrella PR;
- whether main advanced after the gate;
- workload issues transitioned to `In Review`;
- SQL, configuration, deployment, live-data, and human verification gates;
- explicitly: `Not merged to main`.
