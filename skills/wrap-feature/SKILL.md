---
name: wrap-feature
description: Close out a finished unit of work — verifies merge + checklist, records outcomes and closes the issue with a summary (under Linear mode, hands off at In Review instead of closing), deletes ephemera (scratch/qa/review), archives any folder, prunes branch and worktree. Use when the user declares a feature/bug/chore done.
---

# wrap-feature

Argument: the issue number (or infer the feature being wrapped from context and
confirm which one in your reply before acting).

## Guardrails

- **Verify before destroying.** Do not delete anything until steps 1–3 pass.
- If verification fails (unmerged PR, unchecked tasks), STOP and report what's
  outstanding instead of wrapping. The user can say "wrap anyway" — then note
  the skipped items in the closing comment.
- **Check the lifecycle doc's frontmatter for `linearTeam` first.** If present,
  the "Linear mode" section at the bottom changes steps 3–4 materially: the
  issue is **not** closed, and a missing feature folder is routine. If absent,
  this skill behaves exactly as written.
- Work that never created a feature folder (a small bug fixed on a branch) has
  nothing to archive: skip the folder steps and say so, rather than creating a
  folder just to archive it.

## Steps

1. **Verify shipped**: the feature's PR(s) are merged (`gh pr list --state
   merged --search <issue#>` or check the issue timeline) — or the work was
   committed directly, in which case confirm the commits exist on the default
   branch.
2. **Verify the checklist**: every task in the issue body is checked (or, for
   features broken down via `to-tickets`, every sub-issue is closed), or
   explicitly acknowledged as dropped.
3. **Write the record** (this is what survives) — whenever the feature has a
   folder, which in the default mode it will unless the work was issue-only:
   - `notes.md`: dated "Wrapped" entry — outcome, key decisions, gotchas
     discovered, anything a future session needs.
   - Ensure `spec.md` status line says shipped/done.
   - If the agent has a persistent memory system and a gotcha is durable
     (not derivable from the repo), record it there too.
4. **Close the issue**: apply `update-issue` and close with a standalone
   **Complete** comment: what shipped, checklist disposition, verification,
   PR/commit links, and a GitHub-reachable pointer to the archived folder.
   Do not link a local-only path as though GitHub can open it.
5. **Delete ephemera** (if a folder exists): remove the folder's `scratch/`,
   `qa/`, and `review/` directories and any `handoff-*.md` files entirely.
6. **Archive** (if a folder exists): move the folder (now spec/plan/notes +
   `research/`) to `<workDir>/features/_archive/<issue#>-<slug>/` (use `git mv`
   for tracked files). If the folder would be empty after step 5, delete it
   rather than archiving an empty shell.
7. **Prune git**: delete the merged local branch; if a worktree exists for it
   (`git worktree list`), remove it. Never force-delete an unmerged branch
   without asking.
8. **Report**: issue closed, folder archived, what was deleted, what was kept.

## Linear mode

When the lifecycle doc's frontmatter carries `linearTeam`, follow
`../linear-mode/SKILL.md`. Steps 1–2 and 5–8 are unchanged. Steps 3–4
change:

**3. Write the record — into the issue, not the folder.** There is no
`notes.md` or `spec.md` to update (linear-mode §6). If a folder exists it
holds only `research/` and ephemera. Durable gotchas still go to the agent's
persistent memory when they aren't derivable from the repo.

**4. Stop at `In Review` and hand off. Do not close the issue, do not set
`Done`.** This is the central behavior change of Linear mode: the terminal
state for an agent is `In Review`, because "finished, awaiting your review" is
a real state and only a human can move past it.

Post a `Done — ready for review` comment on the sync thread (linear-mode
§3 and §9) covering:

- what shipped, with PR/commit links,
- each acceptance criterion and how it was satisfied,
- verification actually run, with real output — distinguish implemented
  behavior from checks that merely passed,
- checklist disposition, including anything explicitly dropped,
- **what still needs a human** and why an agent can't settle it. If nothing
  does, say that plainly — but "nothing" is rarer than it looks.

Then set the status to `In Review` and stop. Report to the user that the issue
is awaiting their review, with its URL, rather than reporting it closed.

Steps 5–7 (delete ephemera, archive any folder that exists, prune branch and
worktree) still run — the disk cleanup is not contingent on the issue closing.
Where the branch came from `gitBranchName`, prune that branch.
