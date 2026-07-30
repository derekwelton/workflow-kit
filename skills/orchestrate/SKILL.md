---
name: orchestrate-queue
description: Orchestrate a filtered or explicit multi-issue workload through isolated implementation, independent model-paired review, one current-main integration branch, combined verification, an umbrella PR, and a batch Linear In Review handoff. Use when the user asks to run a bug, feature, improvement, label, parent, Todo, Code Review, or named issue queue as one testable workload; supports planning, provider-pair overrides, and resuming interrupted runs.
---

# Orchestrate queue

Run a bounded multi-issue workload. Keep one coordinator as the tracker,
manifest, and integration writer. Use fresh workers for implementation and
independent review.

Surface names intentionally differ: Claude invokes the plugin directory as
`/workflow-kit:orchestrate`; Codex invokes this portable skill by its manifest
name as `$orchestrate-queue`.

Read `references/workload-contract.md` before execution. Read the repository's
workflow lifecycle completely. If `linearTeam` is set, also read
`../linear-mode/SKILL.md`.

## Arguments

Accept:

```text
--name <workload-name>                         required for a new run
--status <status>                              default: Todo
--labels <comma-separated labels>
--issues <comma-separated issue keys>
--parent <issue key>
--pair <cross|codex-only|claude-only>          default: cross
--implementer <auto|codex|claude>              default: auto
--reviewer <auto|codex|claude>                 default: auto
--max-implementers <n>                         default: 4
--max-reviewers <n>                            default: 2
--allow-partial                                default: false
--plan                                         read-only plan; create nothing
--resume <workload-id>
```

Reject a new run without a name or without exactly one selection source:
`--issues`, `--parent`, or a tracker query (`--status` plus optional labels).
Treat bare label/name text conservatively as `--labels`/`--name`; show the
normalized interpretation before mutating anything.

## 1. Reconcile before spawning

Resolve the repository, default branch, lifecycle configuration, tracker team,
exact statuses, canonical labels, synced GitHub twins, existing PRs, issue
branches, and active worktrees. Query Linear first when `linearTeam` is set.
Scope every result to the current GitHub repository.

For a new run, freeze the issue keys once. Do not admit newly created or newly
matching issues later. Deduplicate exact and semantic matches before freezing.

For `--resume`, run the manifest `show` command, reconcile every recorded SHA,
branch, PR, tracker status, worktree, and worker job, then continue from the
first incomplete gate. Never spawn a replacement merely because a previous
session ended.

## 2. Create the manifest

Use this skill's `scripts/workload-manifest.mjs` helper. It stores state below
Git's common directory, shared by all worktrees and excluded from commits.

```bash
node <skill-dir>/scripts/workload-manifest.mjs init \
  --name "<name>" --issues "<frozen keys>" \
  --status "<status>" --labels "<labels>" \
  --pair "<pair>" --implementer "<provider>" --reviewer "<provider>" \
  --max-implementers <n> --max-reviewers <n>
```

Use `--dry-run` for `--plan`. Report the frozen queue, dependency/file-overlap
lanes, provider pairs, branch name, and terminal behavior; make no tracker,
Git, file, or manifest writes.

## 3. Plan bounded lanes

Build a dependency graph from tracker relations, PR bases, commit ancestry,
and predicted file overlap. Serialize dependent or heavily overlapping issues.
Use no more than the configured worker limits; queue the remainder and launch
the next worker when a slot completes.

Assign one leased worktree per issue from its Linear `gitBranchName` or the
repository branch convention. Record branch, worktree, base SHA, and actual
implementation provider before work begins.

## 4. Implement

Move an issue to `In Progress` only when its worker starts. Give the worker the
issue body/spec, fixed base SHA, worktree, repository instructions, focused
verification expectations, and the worker-envelope contract.

The implementation worker must not change Linear, create issues, create or
merge PRs, assemble the integration branch, or review its own work. It returns
discoveries to the coordinator for deduplication.

After validating its envelope and auditing untracked files, commit/push as the
repository policy allows, post the implementation checkpoint on the sync
thread, and set the issue to `Code Review`. Record `code-review` in the
manifest with `--base-sha`, `--head-sha`, `--implementer`, and `--tests`. The
helper resolves both SHAs through Git. Test evidence must include the exact
tested head SHA so a later head change invalidates the old evidence.

## 5. Review and fix

Select the reviewer from the provider that authored the implementation. Use
the pairing table in the workload contract. A coordinator's provider is not
the implementation provider unless it wrote the diff.

Give a fresh reviewer the exact base/head SHAs, issue body/spec reasoning,
repository standards, and tests. Require Standards and Spec findings. The
coordinator independently adjudicates findings, applies or delegates safe
fixes, reruns focused tests, and obtains a receipt for the final head SHA.

For Codex review from Claude, use the dedicated Codex reviewer adapter with the
issue worktree as `--cwd`. Before launching it, write the complete issue/spec,
standards, base/head, and both review axes to a coordinator-owned focus file
below the workload's Git-common state directory; pass only that safe absolute
path to the adapter and remove it after recording the receipt. Do not hand-roll
Codex CLI commands or poll state files. For Claude review, use fresh Opus
reviewers. Same-provider modes still require a fresh session.

Keep the Linear issue in `Code Review`. Record
`reviewed-pending-integration`, provider, head SHA, tests, and review receipt in
the manifest. Format the receipt as
`<review-provider>:<full-head-sha>:<durable-receipt-id>`; the helper rejects a
receipt not bound to the recorded provider and final head. A blocked review
remains `Code Review` with a durable checkpoint.

## 6. Assemble the workload branch

Proceed only when every included issue is `reviewed-pending-integration`,
unless the user explicitly selected `--allow-partial` and deferred issues were
durably removed.

Fetch the default branch. Create the manifest's `integration/<workload-slug>`
branch from the latest remote default-branch SHA. Combine the exact reviewed
heads in dependency order. Resolve conflicts only here. Audit the combined
commit set and changed files against manifest membership.

Review any manual merge-resolution diff with the provider opposite its author.
Run the repository's integration verification commands once, serially where
build outputs can lock. Move integration from `pending` to `assembling`, then
record base SHA, head SHA, tests containing that head SHA, and PR. If conflicts
occurred, pass `--conflicts-occurred` plus
`--conflict-review-receipt <provider:head-sha:receipt-id>`; a bare completion
boolean is not accepted and recorded conflict history cannot be cleared.

Push the integration branch and open one draft umbrella PR to the default
branch. Reference every issue with `Refs`; never use `Closes` under Linear
mode. Do not merge it.

## 7. Hand off for human review

Validate the manifest. Re-fetch every issue immediately before writing. Post a
workload-ready checkpoint to each sync thread with the integration branch,
umbrella PR, exact head, issue review receipt, combined verification, and the
user's checkout/test action.

Move every still-`Code Review` included issue to `In Review`. If any issue has
changed status unexpectedly, stop the batch transition, report the mismatch,
and reconcile rather than overwriting it. After the tracker batch succeeds,
set each manifest issue to `in-review`, set integration to
`ready-for-human-review`, and run final manifest validation. Never mark the
integration ready while manifest and tracker disagree.

Finish with the workload dashboard required by the contract and state plainly:
`Not merged to main.` Never set `Done`.
