---
name: to-spec
description: Turn the current conversation into the feature folder's spec.md — no interview, just synthesis of what was already discussed and decided. Use after a grilling session, or whenever accumulated context should crystallize into the canonical spec.
disable-model-invocation: true
---

Take the current conversation context and codebase understanding and produce
the spec. Do NOT interview the user — just synthesize what you already know
(run `grilling` first if the plan is still full of holes).

The spec is written to the feature folder's **`spec.md`** — the canonical,
committed artifact — not published to the tracker. The issue keeps only its
task checklist; sync it if the spec changes the task breakdown. If no feature
folder exists yet, run `new-feature` first (issue-first rule).

## Process

1. Explore the repo to understand the current state of the codebase, if you
   haven't already. Use the project's domain glossary vocabulary throughout
   (see the lifecycle doc's `glossary` config; `CONTEXT.md` by default), and
   respect any ADRs in the area you're touching.

2. Sketch the **seams** at which the feature will be tested. Prefer existing
   seams to new ones; use the highest seam possible; if new seams are needed,
   propose them at the highest point you can. The fewer seams across the
   codebase, the better — the ideal number is one. **Check with the user that
   these seams match their expectations** before writing. Apply `update-issue`
   with the proposed seams, recommendation, and exact decision needed so the
   request is durable outside the current chat.

3. Write `spec.md` using the template below (keep the standard header: title,
   issue link, status line). Update the issue's checklist if the breakdown
   changed, and note the spec update in `notes.md`.

<spec-template>

## Problem Statement

The problem the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories, each in the format:

1. As an <actor>, I want a <feature>, so that <benefit>

This list should be extremely extensive and cover all aspects of the feature.

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
