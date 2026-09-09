---
name: plan
description: Bulk intake and triage — turn an unstructured brain-dump of bugs, ideas, and leftover work into structured, deduped, prioritized issues in one approval-gated pass. Use when the user arrives with a list of things that need doing rather than a single unit of work.
disable-model-invocation: true
---

Read the repository lifecycle and local overrides first. When `tracker: github-projects`
or a local GitHub Projects contract is present, read `../github-projects/SKILL.md`;
its field/status/label rules override the GitHub/Linear defaults below.


# plan

The entry point for "here's a list of things that need doing." Takes an
unstructured dump — bugs, half-ideas, leftover work, things noticed in
passing — and turns it into a structured, deduped, prioritized set of issues in
**one** approval-gated pass.

`new-feature` is for a single unit of work. This is for ten of them at once,
and the whole point is low friction: the user should not be interviewed item by
item.

## Mode

Read the lifecycle doc's frontmatter for `linearTeam`
(see `../linear-mode/SKILL.md` §1).

- **Linear mode on** → issues are created in Linear; the GitHub twins appear
  via sync. Statuses, labels, and templates follow the linear-mode skill.
- **GitHub Projects selected** → follow `../github-projects/SKILL.md`, including
  project statuses and Issue Types; do not apply ordinary GitHub defaults.
- **Ordinary GitHub mode** → issues are created with `gh issue create` using the
  lifecycle doc's `labels:`. There are no statuses; skip every status step and
  report GitHub numbers only.

## Process

### 1. Split the dump

Break the input into discrete units of work. One issue per thing that could be
finished and verified on its own. When two items are the same work seen from
two angles, merge them and say so.

### 2. Dedupe against what exists

For each item, search existing issues (Linear `list_issues` with a query, or
`gh issue list --search`). Include closed/`Done` issues — a recurrence is worth
knowing about.

When something matches, **report the match instead of creating a duplicate**.
The user can still ask for a new issue; that's their call.

### 3. Classify and draft

For each surviving item:

- **Type/label** — against the team's real label set (Linear
  `list_issue_labels`, or the lifecycle doc's `labels:`). Never invent labels.
- **Body** — use the bug or feature template in linear-mode §8, including
  the `## Tasks` checklist. In non-Linear mode use the same shapes; they're
  good GitHub issue bodies regardless.
- **Priority** — Linear's `priority` (1 urgent … 4 low), inferred from impact
  and the user's language. Skip in non-Linear mode.
- **Starting status** (Linear mode):
  - `Todo` — specified enough for an agent to start cold
  - `Backlog` — real work, not scheduled
  - `Triage` — genuinely ambiguous; **do not guess**. Create it in `Triage`
    with a comment stating exactly what's unclear.

Explore the codebase where a few minutes of reading turns a vague item into a
specific one — a `file:line` in the Evidence section is worth more than
paragraphs of speculation. Use the project's glossary vocabulary.

### 4. Batch the questions

Collect clarifying questions and ask them **all at once, at the end** — never
one question per item. If a question only affects one item's body, prefer
routing that item to `Triage` over blocking the whole batch on it.

### 5. One approval before any write

**Show the full drafted set and get a single approval before creating
anything.** Creating issues is an outward-facing write, and a batch of them is
hard to undo.

Present a table: proposed title, type/label, priority, starting status, and
either "new" or the existing issue it duplicates. Below the table, show the
drafted bodies — or, if the set is large, the bodies for anything non-obvious
plus a note that the rest follow the template. For a big batch, render it with
`/workflow-kit:present` using `templates/report-findings.html` (its summary
table plus per-item detail fits the proposed-issue set).

Ask for one-shot approval: "approve all", or list changes/exceptions. Iterate
until approved, then create.

### 6. Create and report

Create in dependency order where items block each other, so edges reference
real keys. In Linear mode set `parentId` for anything that is genuinely a
sub-item of another (see `to-tickets` for the full breakdown flow).

Report a table:

| Linear | GitHub | Title | Status |
|---|---|---|---|
| `IRP-31` | `#58` | … | Todo |

In non-Linear mode the Linear column is dropped and the Status column with it.

For anything routed to `Triage`, post the question comment (sync thread, per
linear-mode §3) and flag it in the report — those are the items still
needing the user.

End with the recommended next step in one line: usually
`/workflow-kit:new-feature` against the highest-priority `Todo` item, or
`/workflow-kit:to-spec` if one item needs shaping before it can be built.

## Guardrails

- **Never create without the one approval.** Not even "obvious" items.
- **Never mark anything `Done`** — see linear-mode §4.
- Do not create feature folders here. Folders come later, and only when real
  artifacts exist.
- Do not open a GitHub issue *and* a Linear issue for the same item. In Linear
  mode, sync produces the twin.
