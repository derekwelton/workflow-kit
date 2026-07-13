---
name: wrap-feature
description: Close out a finished unit of work — verifies merge + checklist, closes the issue with a summary, writes outcomes to notes.md, deletes ephemera (scratch/qa/review), archives the folder, prunes branch and worktree. Use when the user declares a feature/bug/chore done.
---

# wrap-feature

Argument: the issue number (or infer the feature being wrapped from context and
confirm which one in your reply before acting).

## Guardrails

- **Verify before destroying.** Do not delete anything until steps 1–3 pass.
- If verification fails (unmerged PR, unchecked tasks), STOP and report what's
  outstanding instead of wrapping. The user can say "wrap anyway" — then note
  the skipped items in the closing comment.

## Steps

1. **Verify shipped**: the feature's PR(s) are merged (`gh pr list --state
   merged --search <issue#>` or check the issue timeline) — or the work was
   committed directly, in which case confirm the commits exist on the default
   branch.
2. **Verify the checklist**: every task in the issue body is checked (or, for
   features broken down via `to-tickets`, every sub-issue is closed), or
   explicitly acknowledged as dropped.
3. **Write the record** (this is what survives):
   - `notes.md`: dated "Wrapped" entry — outcome, key decisions, gotchas
     discovered, anything a future session needs.
   - Ensure `spec.md` status line says shipped/done.
   - If the agent has a persistent memory system and a gotcha is durable
     (not derivable from the repo), record it there too.
4. **Close the issue**: apply `update-issue` and close with a standalone
   **Complete** comment: what shipped, checklist disposition, verification,
   PR/commit links, and a GitHub-reachable pointer to the archived folder.
   Do not link a local-only path as though GitHub can open it.
5. **Delete ephemera**: remove the folder's `scratch/`, `qa/`, and `review/`
   directories and any `handoff-*.md` files entirely.
6. **Archive**: move the folder (now spec/plan/notes + `research/`) to
   `<workDir>/features/_archive/<issue#>-<slug>/` (use `git mv` for tracked
   files).
7. **Prune git**: delete the merged local branch; if a worktree exists for it
   (`git worktree list`), remove it. Never force-delete an unmerged branch
   without asking.
8. **Report**: issue closed, folder archived, what was deleted, what was kept.
