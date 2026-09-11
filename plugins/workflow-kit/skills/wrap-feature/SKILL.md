---
name: wrap-feature
description: Wrap human-accepted work after verifying merge and checklist completion. Preserve review gates, record outcomes and clean only authorized feature-owned artifacts.
---

Resolve this skill's real filesystem path; package root is `../..` from its directory.


Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.

# Wrap feature

Wrap the named human-accepted issue. Infer an unambiguous target from context,
but acceptance does not prove merge or authorize unrelated cleanup.

1. Verify independent review and human acceptance, then confirm PR merge or
   exact implementation commits on the default branch. For a workload read
   `../orchestrate/references/workload-contract.md` and its manifest. Accepted
   but unmerged work routes to `../integrate-reviewed/SKILL.md` only for the
   explicitly authorized action; do not skip current-main or final-head gates.
2. Verify acceptance criteria/checklist are complete or explicitly dropped.
   Missing review, unmerged changes or unknown prerequisites stop cleanup.
   A request to skip optional cleanup does not waive review/integration gates.
3. Read `../../templates/tracker-write.md` for authorized record publication.
   Keep one outcome record with shipped changes, decisions, checklist
   disposition, verification, remaining limitations and next action.
   GitHub uses existing notes/spec when useful; Linear uses its issue record.
   Update personal memory only when the user explicitly requests it.
4. In Linear, refetch status: In Progress/Code Review stops wrap; In Review/Done
   stays unchanged. Other statuses require reconciliation. Never set Done or
   close the GitHub twin. Ordinary GitHub closure requires completed wrap and
   authorized closure; preserve Projects mappings and human ownership.
5. Clean only explicitly authorized feature-owned ephemera. Verify resolved
   paths stay under the named feature/worktree root. Preserve dirty/active
   worktrees, unrelated files and owned runtime identity. Archive canonical
   Markdown/research using git mv when tracked; a missing folder is normal.
   Prune only verified merged branches/worktrees. Unmerged/force cleanup
   requires separate explicit authorization.
6. Report what shipped, was recorded, archived/deleted/skipped and remains.
   Link only reachable evidence; do not report an issue closed unless verified.

The caller posts one final checkpoint, not one per cleanup operation.
