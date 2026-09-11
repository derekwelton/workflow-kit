---
name: to-spec
description: Synthesize agreed scope, acceptance criteria and decisions into the configured canonical spec. Use when requested; clarify only unresolved material choices.
---

Resolve this skill's real filesystem path; package root is `../..` from its directory.


Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Load only the tracker operation and mode needed for this request.

Take the current conversation context and codebase understanding and produce
the spec. Do NOT interview the user — just synthesize what you already know
(run `grilling` first if the plan is still full of holes).

Where the spec lands depends on the mode — check the lifecycle doc's
frontmatter for `linearTeam` before writing anything.

**Without `linearTeam` (default):** the spec is written to the feature folder's
**`spec.md`** — the canonical, committed artifact — not published to the
tracker. The issue keeps only its task checklist; sync it if the spec changes
the task breakdown. If no feature folder exists yet, run `new-feature` first
(issue-first rule).

**With `linearTeam`:** the spec is published to the issue and **no `spec.md` is
written**. See "Linear mode" at the bottom of this file.

## Process

1. Explore the repo to understand the current state of the codebase, if you
   haven't already. Use the project's domain glossary vocabulary throughout
   (see the lifecycle doc's `glossary` config; `CONTEXT.md` by default), and
   respect any ADRs in the area you're touching.

2. Sketch the **seams** at which the feature will be tested. Prefer existing
   seams to new ones; use the highest seam possible; if new seams are needed,
   propose them at the highest point you can. Existing public interfaces, tests and issue acceptance criteria are routine
   agreement. Clarify only a material unresolved scope/coverage choice.

3. Write `spec.md` using the template below (keep the standard header: title,
   issue link, status line). Update the issue's checklist if the breakdown
   changed, and note the spec update in `notes.md`.

<spec-template>

## Problem Statement

The problem the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## Acceptance Criteria

A concise checklist of observable outcomes. Add user stories only when they
convey information the acceptance criteria do not already capture.

## Implementation Decisions

A list of implementation decisions that were made: modules built/modified,
the interfaces of those modules, technical clarifications, architectural
decisions, schema changes, API contracts, specific interactions.

Do NOT include specific file paths or code snippets — they go stale fast.
Exception: if a prototype produced a snippet that encodes a decision more
precisely than prose can (state machine, reducer, schema, type shape), inline
it within the relevant decision and note it came from a prototype. Trim to the
decision-rich parts.

## Testing Decisions

What makes a good test here (external behavior only, never implementation
details), which modules will be tested, and prior art for the tests (similar
tests already in the codebase).

## Out of Scope

The things consciously excluded from this spec.

## Further Notes

Anything else future sessions need.

</spec-template>

If the spec is big enough that implementation won't fit one session, follow up
with `to-tickets`. Apply `update-issue` after writing the spec: summarize the
locked scope and testing decisions, sync the issue checklist, and link the
spec only when its branch/commit is reachable from GitHub.

## Linear mode

When the lifecycle doc's frontmatter carries `linearTeam`, follow
`../linear-mode/SKILL.md`. The process above is unchanged — explore,
sketch the agreed seams, clarify material unknowns — but step 3 becomes:

**Stop writing `spec.md`.** The spec is split between the issue body and one
comment, by the rule in linear-mode §6: body = current truth, comments =
immutable timeline.

1. **Body** (`get_issue`, edit the fetched description, `save_issue`) carries
   the durable shape of the work — what a reader needs to know *now*:
   Goal / Why now / In scope / Out of scope / Acceptance criteria / Open
   questions, plus the `## Tasks` checklist. Use the feature template in
   linear-mode §8. This replaces both `spec.md` and `plan.md`. Re-fetch
   immediately before writing; the call replaces the whole description.

2. **A spec comment** on the sync thread (linear-mode §3) records the
   *reasoning* — the part that would be misleading to edit later: the
   Implementation Decisions and Testing Decisions from the template above,
   the alternatives considered and why they were rejected, and the open
   questions with your recommended answers. This is the durable record of why
   the spec is what it is, and it is why a bare body is not enough.

   The User Stories section is optional here — write it into the comment only
   when the feature is big enough that the list earns its length. For most
   work, acceptance criteria in the body cover it.

3. **Status**: if the spec makes the issue startable cold, move it to `Todo`
   (linear-mode §4). If the spec surfaced blocking open questions instead,
   leave the status alone and make the comment a `Needs your decision`.

Do not create a feature folder just to hold a spec — under Linear mode there is
nothing to put in one. Folders appear only when research or evidence does.

End with one next-step line. If the spec exceeds one practical agent context or
needs several independently deliverable slices, offer `to-tickets`
(`/workflow-kit:to-tickets` / `$to-tickets`). Otherwise suggest `implement` with
the existing checklist. These user-only skills require the user's request.
