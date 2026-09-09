---
name: board
description: Read the tracker for this repo and report what's available, in progress, awaiting AI code review, awaiting human review, and recently shipped — including questions and follow-ups buried in issue comments. Use when the user asks what they should work on, what's pending, what's outstanding, what fell through, what's left, or what was recently finished. `board audit` runs the deeper stale-work sweep that proposes cleanup.
---

Resolve this skill's real filesystem path before following relative references.
The package root is two directories above this SKILL.md; retain its sibling
skills, scripts, and templates together.


Read the repository lifecycle and local overrides first. When `tracker: github-projects`
or a local GitHub Projects contract is present, read `../github-projects/SKILL.md`;
its field/status/label rules override the GitHub/Linear defaults below.


# board

After locating the repository's canonical lifecycle doc, run
`node <workflow-kit-root>/scripts/managed-version.mjs --cwd <repo> --lifecycle <canonical-doc>`.
Resolve the package root from this skill's real path, two directories up.
Include a one-line drift warning when needed; do not turn a status request into
an automatic refresh. A newer repository stamp is not permission to downgrade it.

Answers "where does this project stand?" against the tracker, scoped to **this
repository**.

Two modes. **Status is the default** — a fast, read-only orientation report,
which is what almost every question of this shape actually wants:

| The user asks | Mode |
|---|---|
| "what should I work on?" · "what's pending?" · "what's in flight?" · "what did we just finish?" · "where are we?" | **status** (default) |
| "what fell through?" · "what's stale?" · "audit the board" · `/workflow-kit:board audit` | **audit** |

Status **never mutates anything and never asks for approval** — it's a read.
Audit proposes and waits. When genuinely ambiguous, run status and offer audit
in one line.

Distinct from `work-audit`, which sweeps the **repo** for stale folders,
branches, and files. This sweeps the **tracker**.

## Resolving the tracker

Read the lifecycle doc's frontmatter for `linearTeam`
(see `../linear-mode/SKILL.md` §1).

- **Linear mode on** → the repo is bound to that Linear team. Query it with
  `list_issues({ team })`, and read discussion with `list_comments({ issueId })`.
  Statuses are real, so the report can be precise.
- **Linear mode off** → use `gh issue list` against this repo. Everything below
  still works, but status collapses to open/closed: "available" means open and
  unassigned, "in progress" means an open issue with a linked branch or PR, and
  there is no `Code Review` or `In Review`. **Say that limitation once**,
  plainly, rather than implying states the tracker doesn't have.

One scoping caution: a Linear team can span more than one repository. When the
team's issues clearly cover work outside this repo, say so and report the
subset tied to this repo (via the GitHub twin's attachment, branch names, or
project), rather than silently presenting the whole team's board as if it were
this repo's.

## Mode: status (default)

Read-only. Report, in this order — lead with what's actionable, not with
history:

1. **Awaiting you** — `In Review`, plus any issue whose latest comment asks the
   user a question that nothing after it answers. **This is the top of the
   report**, because it's the only category the user alone can unblock. Include
   the actual question, not just a count.
2. **Awaiting AI code review** — `Code Review`, oldest first. Include its
   branch/PR and the implementation-complete checkpoint. Recommend
   `/workflow-kit:code-review queue` when this category is non-empty; do not
   present these as human-review items.
3. **Available to pick up** — `Todo` (or open + unassigned), ordered by
   priority. For each: key, title, one-line summary of what it involves, and
   whether it's specified enough to start cold. Flag anything whose blockers
   are still unresolved as not actually available.
4. **In progress** — `In Progress`, with the branch/PR if one exists and the
   last checkpoint comment's date. Note anything with no activity in ~2 weeks;
   that's a candidate for audit mode rather than a real in-flight item.
5. **Recently completed** — `Done` (or closed) within the last ~2 weeks, one
   line each. Keep this section short; it's context, not the point.
6. **Needs shaping** — anything in `Triage`, with what's unclear about it.

Read the comments, not just the issue list. **Pending work hides in comment
threads**: an unanswered question, a decision the user was asked for, or
follow-up work someone mentioned and never filed. Where a thread reveals
something material that the status field doesn't, say so inline on that issue.
Also check `list_documents` when a team uses Linear documents, and cite any
that bear on an issue in the report.

Reading every comment on every issue is too expensive for a routine orientation
query. Read comments on everything in `In Review`, `Code Review`, and
`In Progress`, plus anything in `Todo` that looks blocked or ambiguous; skip
the rest. **If you
sampled rather than read exhaustively, say so** — a report that looks complete
but isn't is worse than one that states its own limits.

End with a single recommended next action — the one thing worth picking up now,
and why. If the answer is "nothing is ready, three things need your input,"
say that instead of manufacturing a task.

**Render it.** Chat gets the headline plus the awaiting-you items; the full
report goes to HTML via `/workflow-kit:present` using
`templates/report-checkin.html`, which already encodes this section order.
Skip the HTML for a quick one-or-two-item answer — a full document for "one
thing is waiting on you" is ceremony. When the check-in resolves to a specific
issue, `update-issue` carries the actionable summary so it survives outside
chat.

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

- **New issues** from unfiled follow-ups: use the templates in linear-mode
  §8, and link back to the comment they came from. Start them in `Todo` or
  `Backlog` per the same rules `plan` uses.
- **Comments** go on the sync thread (linear-mode §3).
- **`Done` is the exception.** An agent never sets `Done` (linear-mode §4),
  *including here*. Where the sweep found merged-but-unmarked code, propose
  `Done` for the user; otherwise move `In Progress` to `Code Review`, or move
  `Code Review` to `In Review` only by actually completing the full review.
  Never skip the independent review just to put work in the user's queue.
  `Canceled` and `Duplicate` are triage outcomes and may be applied on explicit
  approval.

Report what was applied and what was skipped.
