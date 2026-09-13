# Clean up integrated worker branches

Run after the umbrella PR is pushed and verified, combined tests/reviews bind to
its current head, the tracker handoff is reconciled, and the manifest validates
as ready-for-human-review. This bounded cleanup is part of normal orchestration
completion and needs no separate approval. Honor explicit retention requests and
repository rules. --plan, incomplete runs and deferred issues do not qualify.
Do not invoke a separate cleanup skill or merge the PR.

## Establish eligibility

Limit candidates to exact local/remote worker branches and worktrees created by
this run, recorded at creation in the issue's --resume-context. Preserve reused
or uncertain-ownership artifacts, the integration branch/worktree, the default
branch and unrelated work. A matching name alone does not establish ownership.

For each included issue, verify its saved full reviewed head, current branch
tips, worktree path, finished worker/lease state and any PR references. Fetch and
verify the umbrella PR head equals the recorded, tested integration head and
the remote integration branch. Require the reviewed source head to be an
ancestor of that pushed integration head, and every candidate branch tip to
equal the reviewed source head. This retains the actual commits and review
evidence after deleting source refs. A squash/cherry-pick or similar-looking diff
alone is insufficient for this automatic cleanup; retain the source if ancestry
cannot be proven. Retain branches used by another open PR or workload until its
separate reconciliation/acceptance permits removal.

Keep dirty, untracked, locked or active worktrees and their branches. A clean
worktree can still host an active worker or runtime; verify leases and running
work, never stop a process merely to make cleanup eligible. Never remove the
user's active checkout. Continue with independent eligible candidates when one
item must be retained.

## Remove and record

Record the intended identities, expected source tips and verified integration
head in the issue's --resume-context before removing anything; merge this record
with existing context rather than replacing acceptance or runtime evidence.
Refresh eligibility immediately before each mutation. If anything changed,
retain it and report the reason.

Remove clean inactive owned worktrees with normal Git worktree removal first.
Resolve their absolute paths and symlink/junction targets and verify containment
within the recorded sanctioned worktree root. Never force removal, recursively
delete an unchecked path, or remove a repository root. Retain any branch still
checked out in a remaining worktree. From a safe coordinator checkout, remove
only the exact eligible local refs using expected-old-SHA protection. Remove
owned remote refs only on the verified remote with an explicit expected-old-SHA
lease; never issue wildcard deletion or broad remote pruning.

Verify each removal and record cleaned/retained/failed, exact ref/path, source
SHA, integration SHA and reason in --resume-context. An already absent candidate
is a no-op only after reconciling the saved cleanup intent/result and delivery
evidence. Do not recreate deleted branches on resume, erase historical issue
branch/worktree fields, drop review receipts, or repeat tracker handoff comments.
Keep the manifest and the integration branch for acceptance and later merge.
Report cleanup failures separately from the completed PR/handoff and resume only
unfinished eligible items.
