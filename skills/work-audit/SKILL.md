---
name: work-audit
description: Audit stale repository artifacts, branches and worktrees and propose cleanup. Advisory phase is read-only; execute only the approved concrete actions.
---

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Load only the tracker operation and mode needed for this request.

# work-audit

Two phases, always in order: **propose**, then (after approval) **execute**.

## Guardrail

**Never delete, move, or close anything in the propose phase.** The entire
point of this skill is that deletion stays a human-confirmed act. Present one
consolidated list; the user approves/edits it once; then execute exactly the
approved list.

## Phase 1 — Propose

Advisory audit is read-only by default: no issue, folder or comment is required.
Reuse an existing issue only for explicitly authorized issue-backed publication.
After the proposal is approved, implementation cleanup follows the lifecycle
single-issue path; do not scatter comments across audited items.

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
`templates/report-audit.html` to render it. If issue publication is authorized, the caller uses update-issue once with
this same self-contained proposal; present never publishes. End by asking for one-shot approval ("approve all", or
list exceptions).

## Phase 2 — Execute (only after approval)

Apply exactly the approved actions. Use `git mv`/`git rm` for tracked files so
history stays clean. Close issues with a one-line comment. Report a summary of
what changed, and commit if the user's conventions call for it. Apply
`update-issue` to the audit issue with the executed/skipped actions and
verification, then hand off for human acceptance; wrap only after its gates hold.

In Linear mode, status changes are subject to the same approval as deletions,
and an agent still never sets `Done` (linear-mode §4) — propose it and leave
it to the user. Wrapping the audit issue means handing it off at `In Review`.
