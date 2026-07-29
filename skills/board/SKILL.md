---
name: board
description: What's-left sweep over the tracker — surfaces stale In Progress work, work merged but never marked, unanswered questions buried in comments, and follow-up work mentioned in comments but never filed. Proposes actions; applies only on approval. Use when the user asks what's outstanding, what fell through, or wants a board review.
disable-model-invocation: true
---

# board

A sweep over the tracker answering "what's actually left, and what fell through
the cracks?"

Distinct from `work-audit`, which sweeps the **repo** for stale folders,
branches, and files. This sweeps the **board**. They complement each other; run
either alone.

## Mode

Read the lifecycle doc's frontmatter for `linearTeam`
(see `../linear-mode/SKILL.md` §1).

- **Linear mode on** → sweep the Linear board (`list_issues` by status), and
  read comments via `list_comments`.
- **Linear mode off** → sweep GitHub issues with `gh`. The status-based checks
  degrade to open/closed, and that's expected — say so once rather than
  pretending the board has states it doesn't.

## Phase 1 — Sweep (read-only)

**Never mutate anything in this phase.** Not a status, not a comment, not a
close. The output is a proposal.

Look for, in rough order of value:

1. **Follow-up work mentioned in comments but never filed.** *This is the
   highest-value check — it's how work gets lost.* Read the comment threads on
   recently active issues for phrases like "worth its own issue", "needs a
   follow-up", "I did not touch", "out of scope for this", "someone should",
   "TODO". Each is a candidate issue that exists only as prose.
2. **Unanswered questions buried in comments.** A `Needs your decision` comment
   with no reply after it, or any direct question to the user that the
   subsequent timeline never addressed. These block work silently.
3. **Work merged but not marked.** Issues whose linked PR is merged (or whose
   commits are on the default branch) but whose status never moved off
   `In Progress` / `In Review` — or, in non-Linear mode, that are still open.
4. **Stale `In Progress`.** No comment, commit, or status change in ~2 weeks.
   Either abandoned or someone forgot to update it.
5. **`In Review` sitting past a threshold.** ~1 week with no human response.
   These are waiting on the user specifically — call them out as such, since
   they're the ones an agent cannot unblock.
6. **Triage backlog.** Anything sitting in `Triage` — it was parked pending a
   decision that may never have been made.

Adjust thresholds if the repo's lifecycle doc overrides them.

## Phase 2 — Propose

Present one consolidated table: item, category, proposed action, one-line
reason.

Proposed actions are things like: file a new issue for an unfiled follow-up;
answer or re-ask a stale question; move a merged item to `Done` (**the user
does this — see below**); ping on a long-sitting `In Review`; move an abandoned
`In Progress` back to `Backlog`; `Cancel` or mark `Duplicate` after triage.

If the list is long, `/workflow-kit:present` renders it as a review HTML — but
the chat/issue summary must stand alone, since the HTML is local-only.

End by asking for one-shot approval: "approve all", or list exceptions.

## Phase 3 — Execute (only after approval)

Apply exactly the approved actions, nothing beyond them.

- **New issues** from unfiled follow-ups: use the templates in linear-mode
  §8, and link back to the comment they came from. Start them in `Todo` or
  `Backlog` per the same rules `plan` uses.
- **Comments** go on the sync thread (linear-mode §3).
- **`Done` is the exception.** An agent never sets `Done` (linear-mode §4),
  *including here*. Where the sweep found merged-but-unmarked work, propose it
  and let the user apply it — or move it to `In Review` so it lands in the
  user's queue with the evidence attached. `Canceled` and `Duplicate` are
  triage outcomes and may be applied on explicit approval.

Report what was applied and what was skipped.
