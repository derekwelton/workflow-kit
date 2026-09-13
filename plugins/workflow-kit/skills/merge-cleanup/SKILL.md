---
name: merge-cleanup
description: Explicitly finish a named PR, branch or workload through merge, issue reconciliation and owned cleanup.
---

Resolve bundled relative file paths from this skill's directory, not the project working directory.


# Merge Cleanup

Use only when explicitly invoked, never on ordinary implementation completion
or a casual merge request. Explicit invocation requests the combined merge,
issue reconciliation and cleanup workflow for the resolved target. Preserve
exceptions such as keeping a worktree or leaving issues in review. Ask only for
genuinely missing target/action information, not repeated authorization.

Read repository rules and `./bundled/templates/lifecycle-contract.md`. Resolve the
target, destination, associated PRs/issues and owned artifacts from conversation
and verified repository/tracker evidence. A child branch may return to its parent;
do not assume the default branch or require a manifest for standalone work.

- For a standalone PR/branch, follow `./bundled/templates/merge-completion.md`, then
  `./bundled/templates/cleanup-owned.md` for eligible finished artifacts.
- For a named orchestrated workload, load
  `./bundled/skills/orchestrate/references/integrate-reviewed.md` and its workload gates first.
  This invocation authorizes merged mode for that named workload, subject to
  those gates. Follow its shared procedures without duplicating checkpoints.
- If already merged, verify the recorded merge and current destination, then
  resume reconciliation and cleanup. Do not attempt another merge.

Return a short receipt with **merged, issue/PR outcomes, cleaned, retained, and
unresolved actions**. Verify every claimed outcome. Continue independent eligible
cleanup when one item is blocked, and distinguish partial completion from success.

When this workflow calls for a required skill that is not separately installed, read its instructions from `bundled/dependencies.md`. Load only the dependency needed for the current step; bundled instructions do not authorize additional work.
