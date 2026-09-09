---
name: orchestrate-queue
description: Orchestrate a filtered or explicit multi-issue workload through isolated implementation, independent model-paired review, one current-main integration branch, combined verification, an umbrella PR, and a batch Linear In Review handoff. Use when the user asks to run a bug, feature, improvement, label, parent, Todo, Code Review, or named issue queue as one testable workload; supports planning, provider-pair overrides, and resuming interrupted runs.
---

Resolve this skill's real filesystem path before following relative references.
The package root is two directories above this SKILL.md; retain its sibling
skills, scripts, and templates together.


Read the repository lifecycle and local overrides first. When `tracker: github-projects`
or a local GitHub Projects contract is present, read `../github-projects/SKILL.md`;
its field/status/label rules override the GitHub/Linear defaults below.


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

Read `../model-routing/SKILL.md` before selecting any worker.

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
--max-review-rounds <n>                        default: 2 per issue
--allow-extra-round --reason <text>            explicit authorization for one extra round
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

Run `node <workflow-kit-root>/scripts/managed-version.mjs --cwd <repo> --lifecycle <canonical-doc>`.
Surface drift in one line; do not refresh or downgrade the repository implicitly.
If `--parent` has no sub-issues, say "Run to-tickets first if this needs a batch;
otherwise use implement on the parent." Do not manufacture issues for a clear small task.

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
  --max-implementers <n> --max-reviewers <n> --max-review-rounds <n>
```

Use `--dry-run` for `--plan`. Report the frozen queue, dependency/file-overlap
lanes, provider pairs, branch name, and terminal behavior; make no tracker,
Git, file, or manifest writes. Include `maxReviewRounds: 2` (or the explicit
limit) and the first-round high/medium versus later-round high convergence rule.

## 3. Plan bounded lanes

Build a dependency graph from tracker relations, PR bases, commit ancestry,
and predicted file overlap. Serialize dependent or heavily overlapping issues.
Use no more than the configured worker limits and available host slots. Count
the coordinator and all active workers in the same budget. Only the coordinator
spawns workers; workers must not spawn subagents, including axis reviewers.
Use `workerCapacity` in `scripts/lib/model-policy.mjs` from the package root.
If capacity is unknown, run one worker. Queue the remainder; a review worker
performs both axes itself, or the coordinator dispatches separate bounded axes.

When planning needs delegated reading or research, use `../research/SKILL.md`
and require a cited findings artifact in the feature's `research/` directory.
The coordinator preserves it in the authorized canonical record before synthesis.

**Waiting:** wait for harness completion notifications, or a supported Monitor
until-condition. Blocking `sleep` is forbidden. Long operations use a background
task and completion delivery, not foreground delay loops or state-file polling.
Keep the coordinator responsive; retain worker output and resume from the saved
job identity if delivery is interrupted. Do not launch duplicate replacement jobs.

Assign one leased worktree per issue from its Linear `gitBranchName` or the
repository branch convention. Record branch, worktree, base SHA, provider, explicit model/effort, and worker
identity before work begins. Pass the routing policy to workers and require the
execution envelope. Never infer a resolved model from the requested model.

## 4. Implement

Move an issue to `In Progress` only when its worker starts. Give the worker the
issue body/spec, fixed base SHA, worktree, repository instructions, focused
verification expectations, and the worker-envelope contract.
Use `references/worker-prompt.md` for both implementation and review dispatch.

The implementation worker must not change Linear, create issues, create or
merge PRs, assemble the integration branch, or review its own work. It returns
discoveries to the coordinator for deduplication.

Treat every worker envelope as private machine-to-machine data. Never paste,
forward, or wrap raw JSON in a user-facing message unless the user explicitly
asks for the envelope. After validation, translate a worker checkpoint into:

1. an outcome-led sentence that names the issue and current stage;
2. `What changed` bullets in plain language;
3. `Verification` with pass/fail, useful counts, and commands;
4. `Notes` only for caveats, warnings, or decisions that matter;
5. `Next` stating exactly what the coordinator will do next.

Do not imply the whole issue or workload is complete when only a worker pass
finished. Omit schema names, absolute worktree paths, and full SHAs from the
main narrative. Include branch and short SHA only when useful. Use
`<skill-dir>/scripts/render-worker-result.mjs --stage <implementation|review|integration>`
as the deterministic fallback for a worker envelope, then tailor its prose to
the actual stage. Always include `Verification`; missing evidence is an
incomplete checkpoint and must not sound ready. `--technical` is opt-in when
the user asks for exact machine details.

After validating its envelope and auditing untracked files, commit/push as the
repository policy allows, post the implementation checkpoint on the sync
thread, and set the issue to `Code Review`. Record `code-review` in the
manifest with `--base-sha`, `--head-sha`, `--implementer`, `--implementation-execution`
(JSON), and `--tests`. The
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

**Convergence:** reserve each review round with `set-issue --state code-review`
before dispatch. The first implementation checkpoint reserves round 1; do not
reserve it twice. Round 1 may block on high and medium findings; from round 2
only high findings block. File every remaining medium/low as a deduplicated
follow-up linked to the parent, using `chore` where the repository contract
allows that label. Pass the adjudicated list through `--review-findings` JSON
(`severity`, `status`, `summary`, `followUp`) and list those links on the dashboard.
Resolved findings have status `resolved`; remaining findings must be `deferred`
with a real follow-up key/URL before completion. Never downgrade a high finding
to fit the budget. At the cap, leave the issue blocked unless the user explicitly
authorizes `--allow-extra-round --reason <text>`. The cap never waives independent
review of the final code. Reopening implementation does not reset the round count.
Review effort remains medium by default; high requires a recorded intense-reasoning
reason. The older issue's blanket high recommendation does not override routing.

For Codex review from Claude, use the dedicated Codex reviewer adapter with the
issue worktree as `--cwd`. Before launching it, write the complete issue/spec,
standards, base/head, and both review axes to a coordinator-owned focus file
below the workload's Git-common state directory; pass only that safe absolute
path to the adapter and remove it after recording the receipt. Do not hand-roll
Codex CLI commands or poll state files. For Claude review, use fresh Claude
reviewers selected by model-routing. Same-provider modes still require a fresh session.

Keep the Linear issue in `Code Review`. Record
`reviewed-pending-integration`, provider, head SHA, tests, `--review-execution` JSON, and review receipt in
the manifest. Format the receipt as
`<review-provider>:<full-head-sha>:<durable-receipt-id>`; the helper rejects a
receipt not bound to the recorded provider and final head. A blocked review
remains `Code Review` with a durable checkpoint.

Every successful manifest mutation writes a dated handoff under the run's
Git-common state directory. On resume, read it together with the manifest and
compare `updatedAt`; JSON remains authoritative if a crash interrupted the
derived handoff. This automatic checkpoint does not require invoking the
user-only `handoff` skill or rely on compaction summaries.

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

For GitHub Projects, replace Linear status names below with the verified local
phase mapping. Without a codeReview column, the pre-handoff tracker status is
the mapped inProgress value. Post to the GitHub issue directly, not a Linear
sync thread. Ordinary GitHub Issues uses durable checkpoints without project
status mutations. Never create new statuses to fit this workflow.

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

The same presentation boundary applies to the final dashboard: derive it from
the manifest and receipts, but never dump manifest JSON or worker envelopes as
the answer. Lead with what is ready for the user, what passed, what remains,
and the exact checkout/test action.
