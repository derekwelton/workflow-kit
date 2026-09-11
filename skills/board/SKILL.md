---
name: board
description: Report repository tracker status, pending decisions and review queues without writes. Use board audit for an explicit stale-work sweep and proposed cleanup.
---

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Load only the tracker operation and mode needed for this request.

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
- **GitHub Projects configured** → use the local project fields/status mappings;
  read `../github-projects/SKILL.md` without executing its write operations.
- **Ordinary GitHub Issues** → use `gh issue list` against this repo. Everything below
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

Return the complete report in chat. Do not call update-issue or mutate tracker
state. Render through present only when HTML is requested; pass read-only scope.

For an explicit audit read [references/audit.md](references/audit.md).
