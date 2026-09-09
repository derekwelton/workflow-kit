---
name: workflow-doctor
description: Run a read-only workflow-kit health audit for the current repository and machine. Use to diagnose stale workflow versions, broken Linear/GitHub sync, missing review statuses, plugin cache corruption, dead Codex jobs, inconsistent workload manifests, worktree/process leaks, permission conflicts, or why orchestration cannot resume safely.
---

Read the repository lifecycle and local overrides first. When `tracker: github-projects`
or a local GitHub Projects contract is present, read `../github-projects/SKILL.md`;
its field/status/label rules override the GitHub/Linear defaults below.


# Workflow doctor

Use [references/preflight.md](references/preflight.md) for the selected workflow's
lightweight preflight; reserve the full audit below for a doctor request.

Use `node <workflow-kit-root>/scripts/managed-version.mjs --cwd <repo> --lifecycle <canonical-doc>`
for the version comparison after locating the repository contract. The package
root is two directories above this skill's real path. Distinguish missing,
unstamped, stale, current, and newer docs; do not silently refresh or downgrade.

Remain read-only. Do not create issues, change statuses, edit configuration,
kill processes, remove worktrees, reinstall plugins, or repair manifests.

Run `node <workflow-kit-root>/scripts/workflow-doctor.mjs` from the real package
root first. It checks package integrity, CLI capabilities, and fallback links
without mutation. Optionally pass a sanitized JSON capability file containing
`lifecycle`, `routes`, and `availableModels`; never include secrets. Then:

- Inspect native `codex plugin list --help` and list installed plugins; distinguish
  native package discovery from fallback links and flag duplicate skill names.
- Check codex-kit adapter version 2.3.0+, the `codex-reviewer` adapter and its
  explicit model/effort controls. Compare generated policy with workflow-kit
  using `sync-codex-policy.mjs <codex-kit-root> --check` when both sources exist.
- Compare the host's actual available model/effort catalog to requested routes;
  verify every high setting has a reason and no xhigh/max/ultra is selected.
- Distinguish source, installed/cache, and loaded-session versions. Missing
  evidence is unverified, not healthy. Never expose credentials or launch model
  tasks just to check access. Check parent/nested worker capacity before launch.

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
