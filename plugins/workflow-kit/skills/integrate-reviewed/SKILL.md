---
name: integrate-reviewed
description: Integrate or merge a human-tested workflow-kit workload branch after its issues reached In Review. Use when the user explicitly accepts a named workload, wants its umbrella PR merged, wants reviewed work refreshed from main, or wants the workload reconciled and cleaned; never use for unreviewed issue branches.
---

Resolve this skill's real filesystem path before following relative references.
The package root is two directories above this SKILL.md; retain its sibling
skills, scripts, and templates together.


Read the repository lifecycle and local overrides first. When `tracker: github-projects`
or a local GitHub Projects contract is present, read `../github-projects/SKILL.md`;
its field/status/label rules override the GitHub/Linear defaults below.


# Integrate reviewed workload

Before integration, reconcile saved acceptance evidence, branch/worktree/head,
in-flight jobs, policy decisions, and remaining runtime/config/deployment gates.
Use proportionate evidence that the core user task works in the intended
environment; do not turn unknown prerequisites into a ready claim. Preserve
dirty/active worktrees and confirm process command/start-time/ownership before
stopping any owned runtime. Keep domain-specific commands in the consuming repo.

Accept `--run <workload-id>` and `--mode merged|local-main`. Default to no
action when either is missing; show the manifest and ask for the explicit mode.
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
3. Re-fetch every issue and require `In Review`. Never overwrite another
   status.
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
merge. Post one final sync-thread reply per issue with the merge commit and
verification. Remove only manifest-leased worktrees/processes and prune only
merged branches after resolving every target path inside the sanctioned
worktree root.

Report the merged/local head, issue transitions observed, individual PR
reconciliation, cleanup, SQL/configuration/deployment/live-data gates, and any
remaining human action.
