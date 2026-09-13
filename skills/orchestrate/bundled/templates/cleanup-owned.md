# Owned cleanup procedure

Use repository ownership and retention rules. Audit callers inspect this evidence
read-only; execution requires selected recommendations or scoped merge-cleanup
authorization. A completed merge does not authorize repository-wide cleanup.

For each candidate record the exact identity, owner, source head, destination,
merge/diff evidence, worktree status, retention rule and selected action. Verify
delivery using `./merge-completion.md` when needed. Check unique commits even when
a PR was squash-merged. Keep uncommitted, untracked, undelivered unique or active work and
explicitly retained worktrees. A clean worktree may still have an active worker.
Check worktree locks, leases and running work before removing it. Stop an owned
runtime only with authorization and verified process command/start-time/ownership.

Refresh immediately before each mutation. If a branch head, status, lease, path
or ownership changed since the proposal, preserve the item and explain why.
Resolve final absolute paths, including symlink/junction targets, and verify each
is within the specifically sanctioned feature/worktree root. Reject linked paths
escaping that root. Never recursively delete a computed unchecked path or the
repository root. Use native path-safe operations; no blanket git clean/reset,
force worktree removal, wildcard branch deletion or remote pruning.

Remove only clean inactive owned worktrees, then eligible local branches from a
safe checkout. Retain a local branch checked out by a retained or active worktree.
Delete a remote branch only after verifying the remote identity
and expected head; use an expected-old-value lease where supported and verify the
result. Git's normal branch deletion may reject a squash-merged source: explicit
scoped cleanup plus verified full delivery and no unique work permits deleting
that exact branch, never treating the rejection itself as evidence of delivery.

Remove completed disposable feature records only under consumer retention rules.
Keep durable documentation and selected historical references, including retained
DOCS/archive entries where applicable. Do not invent a permanent work archive.
Use tracked-file operations for tracked disposable artifacts; preserve unrelated
edits, and commit only when authorized. Unclear ownership goes to Needs a decision.

An already absent artifact is a successful no-op after verifying its identity.
Verify removals individually. Continue independent eligible items after a failure;
do not retry an uncertain destructive action blindly. Report cleaned, retained
and unresolved items with reasons and any required human action.
