## Mode: audit

Everything below runs only in audit mode.

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
   `In Progress` / `Code Review` / `In Review` — or, in non-Linear mode, that
   are still open.
4. **Stale `In Progress`.** No comment, commit, or status change in ~2 weeks.
   Either abandoned or someone forgot to update it.
5. **Stale `Code Review`.** The implementation is waiting for the independent
   agent review beyond the repo's normal review cadence. This is agent-actionable;
   propose a `/workflow-kit:code-review queue` pass, not a user ping.
6. **`In Review` sitting past a threshold.** ~1 week with no human response.
   These are waiting on the user specifically — call them out as such, since
   they're the ones an agent cannot unblock.
7. **Triage backlog.** Anything sitting in `Triage` — it was parked pending a
   decision that may never have been made.

Adjust thresholds if the repo's lifecycle doc overrides them.

## Phase 2 — Propose

Present one consolidated table: item, category, proposed action, one-line
reason.

Proposed actions are things like: file a new issue for an unfiled follow-up;
answer or re-ask a stale question; run `/workflow-kit:code-review queue` for stale
`Code Review` work; move a merged item to `Done` (**the user does this — see
below**); ping on a long-sitting `In Review`; move an abandoned `In Progress`
back to `Backlog`; `Cancel` or mark `Duplicate` after triage.

If the list is long, render it with `/workflow-kit:present` using
`templates/report-audit.html` — but the chat/issue summary must stand alone,
since the HTML is local-only.

End by asking for one-shot approval: "approve all", or list exceptions.

## Phase 3 — Execute (only after approval)

Apply exactly the approved actions, nothing beyond them.

- **New issues** from unfiled follow-ups: use the templates in the Linear intake reference, and link back to the comment they came from. Start them in `Todo` or
  `Backlog` per the same rules `plan` uses.
- **Comments** go on the sync thread (the Linear write reference).
- **`Done` is the exception.** An agent never sets `Done` (the Linear status reference),
  *including here*. Where the sweep found merged-but-unmarked code, propose
  `Done` for the user; otherwise move `In Progress` to `Code Review`, or move
  `Code Review` to `In Review` only by actually completing the full review.
  Never skip the independent review just to put work in the user's queue.
  `Canceled` and `Duplicate` are triage outcomes and may be applied on explicit
  approval.

Report what was applied and what was skipped.

Before approved execution read `../../../templates/tracker-write.md` and the
selected adapter; existing explicit action authorization need not be requested again.
