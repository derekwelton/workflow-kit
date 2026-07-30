---
name: to-tickets
description: Break a spec into tracer-bullet vertical-slice tickets published as GitHub sub-issues of the feature issue, each declaring its blocking edges. The escalation path when a feature exceeds one context window — the issue-body checklist stays the default for smaller work.
disable-model-invocation: true
---

# To Tickets

Break a plan, spec, or conversation into **tracer-bullet vertical slices**,
each declaring the tickets that **block** it.

**Escalation, not default.** Small/medium work lives as a checklist in the
feature issue's body. Reach for this skill when the work won't fit a single
fresh context window per checklist item — the tickets become **sub-issues** of
the feature issue.

## Process

### 1. Gather context

Work from the conversation and the feature folder's `spec.md` — or, under
Linear mode (`linearTeam` in the lifecycle doc's frontmatter), from the issue
body and its spec comment, since no `spec.md` exists. If the user passes a
reference (spec path, issue number/URL/key), fetch and read its full body and
comments.

### 2. Explore the codebase (optional)

If you haven't already, explore to understand the current state of the code.
Ticket titles and descriptions use the project's domain glossary vocabulary,
and respect ADRs in the area you're touching.

Look for opportunities to prefactor: "make the change easy, then make the easy
change."

### 3. Draft vertical slices

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API,
  UI, tests) — vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring is its own slice, done first

</vertical-slice-rules>

Give each ticket its **blocking edges** — the tickets that must complete
before it can start. A ticket with no blockers can start immediately.

**Wide refactors are the exception to vertical slicing.** A wide refactor is
one mechanical change — rename a column, retype a shared symbol — whose blast
radius fans across the whole codebase, so no vertical slice can land green.
Sequence it as **expand–contract**: first *expand* (add the new form beside
the old so nothing breaks), then *migrate* call sites in batches sized by
blast radius (per package, per directory), each batch its own ticket blocked
by the expand, then *contract* (delete the old form) in a ticket blocked by
every migrate batch. If even the batches can't stay green alone, keep the
sequence but share an integration branch that all block a final
integrate-and-verify ticket.

### 4. Quiz the user

Present the proposed breakdown as a numbered list — for each ticket: **Title**,
**Blocked by**, **What it delivers** (end-to-end behaviour). Ask: is the
granularity right? Are the blocking edges correct? Merge or split anything?
Iterate until approved.

### 5. Publish as sub-issues

Publish one **sub-issue per ticket** under the feature issue, in dependency
order (blockers first, so edges can reference real numbers). Use `gh` — create
the issue, then attach it as a sub-issue of the parent (GraphQL
`addSubIssue`); if sub-issue linking fails, fall back to a "Parent: #N" line
in the body. Same label as the parent. Replace the parent issue's checklist
with a one-line pointer to the sub-issues (don't duplicate the breakdown).

<issue-template>

## Parent

#<feature issue number>

## What to build

The end-to-end behaviour this ticket makes work, from the user's perspective —
not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

- #<n> per blocking ticket, or "None — can start immediately".

</issue-template>

Avoid file paths and code snippets — they go stale. Exception: decision-rich
prototype snippets, trimmed, with a note of origin.

Work the **frontier** — any ticket whose blockers are all closed — one ticket
per fresh session with `implement`, clearing context between tickets. Do NOT
close the parent issue. Apply `update-issue` to the parent with a checkpoint
summary linking the created sub-issues, naming the current frontier, and
stating the next action; ticket-specific progress stays on each sub-issue.

## Linear mode

When the lifecycle doc's frontmatter carries `linearTeam`, follow
`../linear-mode/SKILL.md`. Steps 1–4 are unchanged; step 5 becomes:

**Publish sub-issues in Linear, not GitHub.** Linear's parent/child model is
the richer one and it syncs, so the GitHub sub-issues appear on their own.

- Create each ticket with `save_issue({ team, title, description, parentId })`,
  where `parentId` is the parent feature issue. Do **not** use `gh` or GraphQL
  `addSubIssue` — that would create a second, unlinked set.
- Set blocking edges with the `blockedBy` / `blocks` relations rather than a
  "Blocked by #n" prose line. Create in dependency order so the edges reference
  real issues. Keep a "Blocked by" section in the body too when it helps a
  reader, but the relation is the authority.
- Sub-issues start in `Todo`. Move the parent to `In Progress` — the breakdown
  itself is the start of work.
- Same labels as the parent, from Linear's set.
- The issue template above still applies, minus the `## Parent` section
  (`parentId` carries that) and minus `## Blocked by` where the relation is
  set. Replace the parent's `## Tasks` checklist with a one-line pointer to
  the sub-issues rather than duplicating the breakdown.

The frontier rule is unchanged, except a standalone ticket's blockers are
"all `Done` or `In Review`" rather than "all closed". Implementation
completion alone leaves a ticket in `Code Review` and does **not** clear the
blocker. In a managed workload, a validated final-SHA
`reviewed-pending-integration` manifest receipt clears the execution dependency
without changing the issue from `Code Review`; the batch reaches `In Review`
only after combined integration. An agent never sets `Done`.
