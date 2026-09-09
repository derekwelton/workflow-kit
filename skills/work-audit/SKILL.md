---
name: work-audit
description: Sweep the repo for stale work — inactive feature folders, open issues with merged PRs, stale branches/worktrees, old QA sweeps, stray scratch files — and present a proposed cleanup list for one-shot approval. Never deletes anything without approval. Use ONLY when the user asks for an audit/cleanup/migration sweep — never spontaneously mid-task (at most, mention clutter in one line and let the user decide).
---

Read the repository lifecycle and local overrides first. When `tracker: github-projects`
or a local GitHub Projects contract is present, read `../github-projects/SKILL.md`;
its field/status/label rules override the GitHub/Linear defaults below.


# work-audit

Two phases, always in order: **propose**, then (after approval) **execute**.

## Guardrail

**Never delete, move, or close anything in the propose phase.** The entire
point of this skill is that deletion stays a human-confirmed act. Present one
consolidated list; the user approves/edits it once; then execute exactly the
approved list.

## Phase 1 — Propose

Resolve the audit's `chore` issue and feature folder first (`new-feature` if
this audit does not have one), then apply `update-issue` with a Started comment.
The audit issue is the single review/control point; do not scatter proposal
comments across every issue being audited.

Scan (thresholds: feature folders stale after ~3 weeks of no file mtime/commit
activity; dated QA-sweep folders stale after ~2 weeks; adjust if the repo's
lifecycle doc overrides):

1. **Feature folders** in `<workDir>/features/` — stale (no recent activity) or
   already shipped (issue closed / PR merged but folder never wrapped →
   recommend `/workflow-kit:wrap-feature` instead of raw deletion).
2. **Issues**: open issues whose linked PRs are all merged.
3. **Git**: local branches fully merged into the default branch; worktrees
   whose branches are merged or gone (`git worktree list`).
4. **Legacy piles** (repos predating the workflow): `work/specs/`,
   `work/plans/`, `work/scratch/`, top-level stray files, old TODO/tracker
   files, dated QA-sweep folders. Classify each item: belongs-to-a-feature
   (move to that folder or `_archive`), historical-text-worth-keeping (move to
   `<workDir>/features/_archive/_legacy/`), or ephemera (delete).
5. **Ephemera by extension** anywhere under `<workDir>`: logs, old screenshots,
   build outputs.

**Linear mode** (`linearTeam` in the lifecycle doc's frontmatter — see
`../linear-mode/SKILL.md`): audit the **board** as well as the repo.
Item 2 above becomes richer than open-vs-closed — add stale `In Progress` (no
activity in ~2 weeks), stale `Code Review` items awaiting the independent AI
review, issues whose PR merged but whose status never moved, and `In Review`
items sitting past ~1 week awaiting the user. Expect most units of
work to have **no** feature folder; a missing folder is not a finding.
`/workflow-kit:board` goes deeper on the tracker — unanswered questions and
unfiled follow-ups buried in comments — and pairs with this sweep.

Present the findings as a table — item, category, proposed action (delete /
archive / wrap / close / keep), and a one-line reason. If the list is long or
includes visual evidence, use `/workflow-kit:present` with
`templates/report-audit.html` to render it. Apply `update-issue` with a **Needs decision** comment containing the
proposal summary, exact approval request, recommendations, and any
GitHub-reachable artifact links. The comment must remain actionable when the
HTML is local-only. End by asking for one-shot approval ("approve all", or
list exceptions).

## Phase 2 — Execute (only after approval)

Apply exactly the approved actions. Use `git mv`/`git rm` for tracked files so
history stays clean. Close issues with a one-line comment. Report a summary of
what changed, and commit if the user's conventions call for it. Apply
`update-issue` to the audit issue with the executed/skipped actions and
verification, then wrap the audit issue when complete.

In Linear mode, status changes are subject to the same approval as deletions,
and an agent still never sets `Done` (linear-mode §4) — propose it and leave
it to the user. Wrapping the audit issue means handing it off at `In Review`.
