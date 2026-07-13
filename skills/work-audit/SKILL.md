---
name: work-audit
description: Sweep the repo for stale work — inactive feature folders, open issues with merged PRs, stale branches/worktrees, old QA sweeps, stray scratch files — and present a proposed cleanup list for one-shot approval. Never deletes anything without approval. Use ONLY when the user asks for an audit/cleanup/migration sweep — never spontaneously mid-task (at most, mention clutter in one line and let the user decide).
---

# work-audit

Two phases, always in order: **propose**, then (after approval) **execute**.

## Guardrail

**Never delete, move, or close anything in the propose phase.** The entire
point of this skill is that deletion stays a human-confirmed act. Present one
consolidated list; the user approves/edits it once; then execute exactly the
approved list.

## Phase 1 — Propose

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

Present the findings as a table — item, category, proposed action (delete /
archive / wrap / close / keep), and a one-line reason. If the list is long or
includes visual evidence, use `/workflow-kit:present` to render it as a review
HTML. End by asking for one-shot approval ("approve all", or list exceptions).

## Phase 2 — Execute (only after approval)

Apply exactly the approved actions. Use `git mv`/`git rm` for tracked files so
history stays clean. Close issues with a one-line comment. Report a summary of
what changed, and commit if the user's conventions call for it.
