---
name: orchestrate-queue
description: Run or resume an explicitly selected multi-issue workload with isolated workers, independent review and combined integration verification. Supports read-only planning.
---

# Orchestrate queue

Explicit multi-issue execution or read-only --plan. Claude uses
/workflow-kit:orchestrate; Codex uses $orchestrate-queue.

Read repository configuration/local overrides, `../../templates/lifecycle-contract.md`,
`references/workload-contract.md`, and `../model-routing/SKILL.md`.
The workload contract owns provider independence, review convergence, final-SHA
receipts, integration gates, single-writer rules and human acceptance.
Read only the configured tracker adapter; writes use
`../../templates/tracker-write.md`. Do not load the portable fallback too.

## Execute

1. Reconcile the repository/default branch, issue selection, existing PRs,
   branches, worktrees and configured tracker. Run managed-version with the
   canonical lifecycle path; report drift without refreshing. Use
   `../workflow-doctor/references/preflight.md` for the selected capabilities.
   A new run needs a name and exactly one selection source: named issues,
   parent children, or a status/label query. Scope to this repository, dedupe,
   then freeze membership. A parent without children may use single implement;
   never manufacture a workload for a small issue.
2. For --resume, show the saved manifest and reconcile refs, recorded SHAs,
   PRs, tracker states, worktrees and worker jobs. Preserve saved policy and
   authorization; continue the first incomplete gate without duplicate workers.
   Reconcile partial batch writes individually before proceeding.
3. Use this skill's scripts/workload-manifest.mjs helper. Read
   `references/commands.md` when creating/changing a run; use --help for schema
   details. --plan uses --dry-run and creates no files, Git or tracker state.
   Report frozen issues, overlap/dependency lanes, routes, round cap and next gates.
4. Serialize dependent/overlapping work; parallelize bounded independent work
   only while the coordinator has useful work. Respect model-routing capacity.
   Lease one worktree per issue, using Linear gitBranchName or local convention.
   For dispatch read `references/worker-prompt.md` and
   `references/worker-envelope.md`. Give each worker relevant repo rules,
   issue acceptance criteria, allowed files, base/head and focused verification.
5. Mark implementation start when a worker actually begins. Validate returned
   envelopes and tracked/untracked changes. Commit/push only as authorized.
   Record code-review with full base/head, execution and head-bound tests;
   publish one implementation checkpoint via update-issue.
6. Dispatch independent review following the workload contract's pairing and
   round reservation rules. Give both Standards and Spec axes. Adjudicate
   findings against evidence, fix, verify, and obtain the final-head receipt.
   Record reviewed-pending-integration. Use the dedicated reviewer adapter for
   cross-host review; no hand-written CLI wrappers or state-file polling.
7. Once the workload contract permits assembly, fetch current default branch,
   combine exact reviewed heads in dependency order on integration/<slug>.
   Record assembling, base/head, combined tests and any conflict-review receipt.
   Create the authorized draft umbrella PR; never merge as part of orchestration.
8. Validate the manifest and perform the contract's reconciled tracker handoff.
   The coordinator publishes each authorized checkpoint once, verifying write
   results. Follow local Projects mappings or ordinary GitHub checkpoints.

## Output and continuity

Derive an outcome-led dashboard from validated envelopes/manifest; do not paste
raw JSON. Use scripts/render-worker-result.mjs as the optional deterministic
renderer. Include verification, blockers, remaining prerequisites and next action.
The final dashboard fields and merge statement are in the workload contract.

Use --resume-context for intended-environment acceptance evidence, owned
processes/jobs, unresolved schema/config/deployment needs and next action.
An optional --handoff-snapshot is derived from the manifest, never a second
canonical record; preserve instruction identity/retained content in handoff.
Research follows `../research/SKILL.md`; cited chat findings suffice unless an
artifact is requested or reusable. Follow lifecycle wait rules.
