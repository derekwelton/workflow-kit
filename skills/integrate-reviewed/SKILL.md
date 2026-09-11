---
name: integrate-reviewed
description: Refresh or merge a named human-tested workload after review and integration gates. Requires explicit action authorization; preserves final-head acceptance and cleanup boundaries.
---

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Load only the tracker operation and mode needed for this request.

# Integrate reviewed workload

Before integration, reconcile saved acceptance evidence, branch/worktree/head,
in-flight jobs, policy decisions, and remaining runtime/config/deployment gates.
Use proportionate evidence that the core user task works in the intended
environment; do not turn unknown prerequisites into a ready claim. Preserve
dirty/active worktrees and confirm process command/start-time/ownership before
stopping any owned runtime. Keep domain-specific commands in the consuming repo.

Accept `--run <workload-id>` and `--mode merged|local-main`. Resolve a named workload and mode from explicit natural-language authorization
as well as flags ("merge workload X" selects merged). If the target or action is
ambiguous, show the manifest and ask only for what is missing. Acceptance alone
is not merge authorization.
Invocation with `--mode merged` is authorization to merge only the named
workload's umbrella PR after every gate below passes.

Read `../orchestrate/references/workload-contract.md`, the repository lifecycle,
and the run manifest using `../orchestrate/scripts/workload-manifest.mjs`.

## Gates

1. Validate the manifest. Require integration state
   `ready-for-human-review`, every included issue `in-review`, final-SHA review
   receipts, combined tests, and one umbrella PR.
2. Confirm the checked-out/tested integration head still equals the manifest
   head and the remote PR head. Stop on drift.
3. Re-fetch every issue and require the configured human-review status
   (`In Review` for Linear, verified inReview mapping for Projects). Ordinary
   GitHub uses the completed human-review checkpoint and manifest gates rather
   than an invented status. Never overwrite an unexpected status.
4. Fetch the remote default branch. If it advanced after the recorded base,
   combine it into the integration branch, resolve conflicts only there,
   independently review manual resolutions, rerun the repository integration
   gate, push, and update the manifest.
5. If the refresh introduced manual resolutions or materially changed the
   tested behavior, stop with the updated branch at `In Review` and require a
   fresh human acceptance of the new head. Do not treat the earlier acceptance
   as approval of different code.

## Modes

### `local-main`

Verify local main is clean and still points at the expected base. Fast-forward
or merge the exact integration head into local main, run the final smoke gate,
and leave Linear at `In Review`. Do not push main, merge the PR, close issues,
or set `Done`.

### `merged`

Require the umbrella PR to target the default branch and contain every manifest
head. Merge through GitHub using the repository's configured merge method.
Allow GitHub/Linear merge automation to set `Done`; never write `Done`
directly. Verify the default branch contains the integration head and reconcile
individual draft PRs as already integrated/superseded without duplicating
commits.

## Wrap

Update the manifest integration state to `merged` only after verifying the
merge. Publish one final checkpoint per issue through the configured tracker
adapter (verified sync thread only for Linear), with merge commit and
verification. Remove only manifest-leased worktrees/processes and prune only
merged branches after resolving every target path inside the sanctioned
worktree root.

Report the merged/local head, issue transitions observed, individual PR
reconciliation, cleanup, SQL/configuration/deployment/live-data gates, and any
remaining human action.
