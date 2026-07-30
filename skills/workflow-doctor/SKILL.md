---
name: workflow-doctor
description: Run a read-only workflow-kit health audit for the current repository and machine. Use to diagnose stale workflow versions, broken Linear/GitHub sync, missing review statuses, plugin cache corruption, dead Codex jobs, inconsistent workload manifests, worktree/process leaks, permission conflicts, or why orchestration cannot resume safely.
---

# Workflow doctor

Remain read-only. Do not create issues, change statuses, edit configuration,
kill processes, remove worktrees, reinstall plugins, or repair manifests.

Inspect and report these layers independently:

1. **Repository contract** — locate the lifecycle doc, compare its managed
   version and block to the installed workflow-kit template, verify frontmatter
   and repo-specific additions, and flag competing/stale orchestration docs.
2. **Tracker** — when `linearTeam` exists, verify the Linear tool surface,
   exact `Code Review`/`In Review` statuses, canonical labels, GitHub repository
   scoping, and the sync-root comment on a representative active issue.
3. **Git/GitHub** — verify remote/default branch, PR-open automation semantics,
   active issue branches, integration branches, worktrees, base/head ancestry,
   and duplicate/superseded PRs. Ignore `refs/t3/checkpoints`.
4. **Workloads** — list manifests with
   `../orchestrate/scripts/workload-manifest.mjs list`, validate each active
   manifest, and reconcile issue states, SHAs, PRs, and worktrees without
   writing changes.
5. **Claude/Codex plugins** — report installed and source versions, loaded
   long-lived-session versions when observable, unresolved Git conflict
   markers, source/cache hash drift for critical skills, and model-routing
   conflicts.
6. **Codex jobs** — list active companion jobs, compare recorded PIDs to live
   processes, flag stale heartbeats and cwd/worktree mismatches, and identify
   abandoned reviews without canceling them.
7. **Permissions and resources** — compare user/project allow/deny rules; flag
   contradictory commit/push policy, machine-specific tracked settings,
   unleased worktrees, owned-process leaks, and preview/port contention.

Finish with `healthy`, `degraded`, or `blocked`; a prioritized table of exact
findings and evidence; and commands the user could authorize to repair them.
Never describe a failed check as repaired.
