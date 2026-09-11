---
name: wayfinder
description: Plan an explicitly requested epic as bounded investigation tickets and a shared decision map. Resolve uncertainty before implementation; honor configured tracker semantics.
disable-model-invocation: true
---

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Load only the tracker operation and mode needed for this request.

Plan an explicitly requested epic too large for one context as a map of
bounded investigation tickets. State the destination and resolve decisions
before handing off implementation.

## Plan, don't do

Wayfinder is **planning** by default: each ticket resolves a decision, and the
map is done when the way is clear — nothing left to decide before someone goes
and does the thing. The pull to just do the work is usually the signal you've
reached the edge of the map and it's time to hand off (to `to-spec` /
`to-tickets` / `implement`). An effort can override this in its **Notes** —
carrying execution into the map itself — but absent that, produce decisions,
not deliverables.

## Refer by name

Every map and ticket is an issue, so it has a **name** — its title. In
everything the human reads, refer to it by that name, never by a bare number.
A wall of `#42, #43, #44` is illegible. The number and URL ride *inside* the
name as a link, never stand in for it.

## Tracker ownership

Select the configured tracker adapter before publication. GitHub defaults
below apply only to ordinary GitHub Issues. Linear/Projects own labels,
statuses, relations and write destinations; do not create wayfinder labels or
close Linear issues automatically. Read-only planning may draft the map in
chat; publish only within explicit authorization. Create folders only for
actual artifacts.

## How it lives on GitHub

- The **map** is a single issue labelled `wayfinder:map`. Its tickets are
  **sub-issues** of the map (GraphQL `addSubIssue`; fall back to a
  "Parent: #N" body line if unavailable).
- Each ticket carries a `wayfinder:<type>` label — `research`, `prototype`,
  `grilling`, or `task`. Create the `wayfinder:*` labels lazily on first use.
- **Blocking**: GitHub has no native blocking edge, so each ticket's body
  carries a `## Blocked by` list of ticket references. A ticket is
  **unblocked** when every listed blocker is closed. The **frontier** is the
  open, unblocked, unclaimed tickets.
- A session **claims** a ticket by assigning it to the user, **first**, before
  any work — an open, unassigned ticket is unclaimed; concurrent sessions skip
  claimed ones.
- The wayfinder effort also gets a normal **feature folder**
  (`<workDir>/features/<map#>-<slug>/`) — assets created while resolving
  tickets (research files, prototypes' pointers, review docs) live there and
  are **linked from** the issues, never pasted in.

## The map body

The whole map at low resolution, loaded once per session. Open tickets are
NOT listed — they are open sub-issues, found by query.

```markdown
## Destination

<what reaching the end looks like — the spec, decision, or change this effort
is finding its way to. One or two lines; every session orients to it first.>

## Notes

<domain; skills every session should consult; standing preferences>

## Decisions so far

- [<closed ticket title>](link) — <one-line gist of the answer>

## Not yet specified

<in-scope fog you can't ticket yet; graduates as the frontier advances>

## Out of scope

<work ruled beyond the destination; closed, never graduates>
```

## Tickets

A ticket's body is the question, sized to one fresh-context agent session:

```markdown
## Question

<the decision or investigation this ticket resolves>

## Blocked by

- <ticket link> per blocker, or "None".
```

## Ticket types

Every ticket is either **HITL** — human in the loop, worked *with* a human —
or **AFK**, driven by the agent alone. A HITL ticket only resolves through
that live exchange; the agent never stands in for the human's side (a grilling
agent that answers its own questions has broken this).

- **Research** (AFK): via the `research` skill — findings land in the feature
  folder's `research/`, linked from the ticket.
- **Prototype** (HITL): raise the fidelity of the discussion with a cheap
  concrete artifact via the `prototype` skill; link it as an asset.
  Use when "how should it look/behave" is the key question.
- **Grilling** (HITL): conversation via the `grilling` and `domain-modeling`
  skills — bulk-question rounds. The default case.
- **Task** (HITL or AFK): manual work that must happen before a *decision* can
  be made — signing up for a service, provisioning access, moving data so its
  shape can be seen. The one type that *does* rather than decides; it earns
  its place by unblocking a decision. The resolution records what was done and
  any resulting facts later tickets depend on.

## Fog of war

The map is *deliberately* incomplete: don't chart what you can't yet see.
Beyond the live tickets lies the **fog of war** — decisions you can tell are
coming but can't yet pin down. Resolving a ticket clears the fog ahead of it,
graduating whatever's now specifiable into fresh tickets, until the way to the
destination is clear and no tickets remain.

**Fog or ticket?** The test is whether you can state the question precisely
now — *not* whether you can answer it now. Ticket when the question is sharp
(even if blocked); **Not yet specified** when you can't phrase it that sharply.
Don't pre-slice fog into ticket-sized pieces — one patch may graduate into
several tickets, or none.

## Out of scope

Fog only gathers *toward* the destination; work beyond it is **out of scope**
— its own map section, not fog. When an existing ticket turns out to sit past
the destination, **close it** and leave one line in Out of scope (gist + why,
linking the closed ticket). It stays out of Decisions so far, which records
the route actually walked.

## Invocation

Two modes. Either way, **never resolve more than one ticket per session.**

### Chart the map

User invokes with a loose idea.

1. **Name the destination.** Run a `grilling` (+ `domain-modeling`) session to
   pin down what this map is finding its way to. The destination fixes the
   scope, so it's settled first.
2. **Map the frontier.** Grill again, **breadth-first**: fan out across the
   whole space, surfacing the open decisions and the first steps takeable now.
   **If this surfaces no fog** — the journey fits one session — you don't need
   a map. Stop and ask the user how they'd like to proceed.
3. **Create the map** (label `wayfinder:map`): Destination and Notes filled,
   Decisions-so-far empty, the fog sketched into Not yet specified. Create the
   feature folder.
4. **Create the tickets you can specify now** as sub-issues — then wire the
   Blocked-by lists in a **second pass** (issues need numbers before they can
   reference each other).
5. Stop — charting the map is one session's work; do not also resolve tickets.

### Work through the map

User invokes with a map (URL or number). A ticket is optional — without one,
you pick the next decision, not the user.

1. Load the **map** — the low-res view, not every ticket body.
2. Choose the ticket: the user's named one, else the first frontier ticket.
   **Claim it** (assign) before any work.
3. Resolve it — zoom as needed: fetch full bodies of related/closed tickets on
   demand; invoke the skills the map's Notes name. If in doubt, `grilling` +
   `domain-modeling`.
4. Record the resolution: post the answer as a **resolution comment**,
   **close** the issue, **append a one-line pointer** to the map's Decisions
   so far.
5. Add newly-surfaced tickets (create-then-wire); graduate any fog the answer
   made specifiable, clearing each graduated patch from Not yet specified. If
   the answer reveals a ticket sits beyond the destination, rule it out of
   scope. If the decision invalidates other parts of the map, update or delete
   those tickets.

The user may run unblocked tickets in parallel sessions — expect concurrent
edits to the tracker.
