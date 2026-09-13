# Merge and completion procedure

Shared by explicitly authorized integration callers. This reference does not
activate a skill or grant authorization. Read repository policy and
`./lifecycle-contract.md`. Apply workload-specific gates only for a workload.

## Verify and merge

Resolve repository, exact source head, intended destination and PR base from
fresh evidence. Preserve child-to-parent integration; resolve conflicting target
evidence before mutation. Reuse valid independent review, final-SHA tests and
human acceptance. Check applicable branch protection, runtime/config/deployment
gates and required checks. Unknown evidence is not a passing gate. Do not impose
unconditional new review rounds on unchanged, already reviewed work.

Refresh the destination before integration. Resolve conflicts on the source or
an isolated integration branch, preserving unrelated changes. Apply required
independent review and tests to changed code/manual resolutions. If behavior or
manual resolutions invalidate human acceptance, obtain acceptance of the updated
head under repository policy before merging. Recheck source/PR head for races.

For unmerged work, use the configured merge method and destination. Respect PR
requirements; direct branch integration is allowed only where repository policy
permits it. Do not bundle automatic branch deletion with merge, since cleanup
eligibility is checked separately. For an already merged PR, skip merge.

Verify the provider's merged record, actual base, final reviewed source head and
resulting merge commit against a fresh destination. Normal merges may use source
ancestry. For squash/rebase, verify the provider's resulting commit(s) reached
the destination and compare the delivered diff/patches to the reviewed scope;
source-SHA ancestry alone is insufficient. Inspect conflict resolutions and
subsequent source commits for unique work. A closed, unmerged PR is not proof.
If delivery cannot be established, retain the source and report the uncertainty.
For overlapping PRs, verify their entire diff was delivered before reconciling
as integrated/superseded; preserve PRs with remaining changes.

## Reconcile records

For authorized writes, read `./tracker-write.md` and use only the configured
installed adapter. Install the configured linear-mode or github-projects adapter
when needed; if unavailable report the prerequisite, never switch providers.

Refetch associated issues, acceptance criteria, child scope, status and recent
comments. Completion requires all criteria and intended delivery scope to be
satisfied. Child-to-parent integration normally leaves final-delivery issues
open. Do not close a parent/epic with unfinished children, unrelated records,
or partial issues. Keep partial issues open with a clear remaining-work checkpoint.
Explicit leave-in-review instructions govern both merge automation and manual
actions: if automation would violate them, resolve that conflict before merge.

Honor merge automation; verify observed transitions before considering any
manual write. Ordinary GitHub issue closure is allowed for completed scoped work
when authorized. GitHub Projects preserves configured status mappings. Linear
uses its configured canonical sync thread and adapter; never directly set Done
or close the GitHub twin to force completion. Under the kit's no-Done rule, report
an unperformed completed-status transition for automation or human action.
Unexpected status or uncertain write outcome requires reconciliation, not overwrite.

Publish one concise completion checkpoint per issue through the canonical channel
with merge/result commit, acceptance disposition, verification and remaining work.
Check recent comments and saved results before writing, including after an
uncertain delivery or repeated invocation. Do not post duplicate GitHub/Linear
updates. Verify issue/PR outcomes; do not infer closure from merge alone.
