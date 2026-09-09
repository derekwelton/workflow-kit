---
name: wrap-feature
description: Close out a finished unit of work — verifies merge + checklist, records outcomes and closes the issue with a summary (under Linear mode, preserves the human-review boundary and never sets Done), deletes ephemera, archives any folder, and prunes git. Use when the user declares a feature/bug/chore done.
---

Resolve this skill's real filesystem path before following relative references.
The package root is two directories above this SKILL.md; retain its sibling
skills, scripts, and templates together.


Read the repository lifecycle and local overrides first. When `tracker: github-projects`
or a local GitHub Projects contract is present, read `../github-projects/SKILL.md`;
its field/status/label rules override the GitHub/Linear defaults below.


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

**4. Preserve the human-review boundary. Do not close the issue and do not set
`Done`.** Code must already have completed the independent AI review before
wrap can proceed. Re-fetch the current status:

- `In Progress` or `Code Review` → stop without cleanup; implementation or code
  review is still unfinished.
- `In Review` → write the wrap record and leave the status unchanged for the
  human.
- `Done` → write the wrap record and leave the status unchanged; never regress
  it to `In Review`.

For `In Review` or `Done`, post a `Wrap complete` comment on the sync thread
(linear-mode §3) covering:

- what shipped, with PR/commit links,
- each acceptance criterion and how it was satisfied,
- verification actually run, with real output — distinguish implemented
  behavior from checks that merely passed,
- checklist disposition, including anything explicitly dropped,
- what still needs the human if the status is `In Review`, or that human review
  is already complete if the status is `Done`.

If the issue remains `In Review`, report that it is awaiting the human's
review, with its URL, rather than reporting it closed.

After the status gate permits wrap, steps 5–7 (delete ephemera, archive any
folder that exists, prune branch and worktree) still run — cleanup is not
contingent on the issue closing. Where the branch came from `gitBranchName`,
prune that branch.
