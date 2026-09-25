Read repository configuration/local overrides and `../bundled/templates/lifecycle-contract.md`.
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

Read `workload-contract.md`, the repository's tracker configuration,
and the run manifest using `../scripts/workload-manifest.mjs`.

## Gates

For an already-merged target, use the verified resume path under Wrap.

1. Validate the manifest. Require integration state
   `ready-for-human-review`, every included issue `in-review`, exact-head review
   coverage under `../bundled/templates/review-policy.md`, combined tests, and one umbrella PR.
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
head. Apply `../bundled/templates/merge-completion.md` for merge verification and
issue/PR reconciliation. This shared procedure supports squash/rebase delivery
without requiring source-SHA ancestry and preserves tracker automation rules.
If already merged, verify delivery and resume reconciliation without merging again.

## Wrap

Update the manifest integration state to `merged` only after verifying the
merge. For an already-merged resume, retain the saved review/acceptance evidence
and verify the recorded merge and current destination instead of requiring the
old pre-merge status/head gates again. Unmerged or drifted work still requires
all applicable gates above.

Follow `../bundled/templates/cleanup-owned.md` for authorized cleanup, limited to
manifest-leased worktrees/processes and owned artifacts inside sanctioned roots.
Do not invoke an explicit-only cleanup entrypoint from orchestration. The shared
completion procedure owns the single final checkpoint per issue; do not repeat it.
Local-main mode retains its no-push/no-close/no-Done boundaries and does not run
merged-mode record reconciliation.

Report the merged/local head, issue transitions observed, individual PR
reconciliation, cleanup, SQL/configuration/deployment/live-data gates, and any
remaining human action.
Return the updated usage/testing guide from `../bundled/templates/completion-guide.md`.
