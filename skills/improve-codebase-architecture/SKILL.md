---
name: improve-codebase-architecture
description: Scan a codebase for deepening opportunities, present them as a visual HTML review doc, then grill through whichever one the user picks.
disable-model-invocation: true
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** —
refactors that turn shallow modules into deep ones. The aim is testability and
AI-navigability.

Built on the shared design vocabulary:

- Run the `codebase-design` skill for the vocabulary (**module**, **interface**,
  **depth**, **seam**, **adapter**, **leverage**, **locality**) and its
  principles (the deletion test, "the interface is the test surface", "one
  adapter = hypothetical seam, two = real"). Use these terms exactly — don't
  drift into "component," "service," "API," or "boundary."
- The domain glossary (lifecycle-doc `glossary` config; `CONTEXT.md` by
  default) names good seams; ADRs (`adrDir`) record decisions this skill
  should not re-litigate.

**Issue-first applies to audits too**: file a `chore` issue for the
architecture review (via `new-feature`) so the report and subsequent
refactor work have a tracking handle and folder. Apply `update-issue` with a
Started comment before exploring.

## Process

### 1. Explore

Read the domain glossary and ADRs in the area first. Then use an Explore
subagent to walk the codebase. Don't follow rigid heuristics — explore
organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real
  bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting
it concentrate complexity, or just move it? "Yes, concentrates" is the signal.

### 2. Present candidates as an HTML review doc

Generate the report via the `present` skill — use `templates/report-audit.html`
(each deepening candidate is a proposed change awaiting your pick); the general review-doc template
in the feature folder's `review/`, self-contained, no CDNs. Hand-build the
visuals with inline CSS/SVG (mass diagrams, before/after cross-sections);
be visual.

For each candidate, render a card with:

- **Files** — which files/modules are involved
- **Problem** — why the current architecture causes friction
- **Solution** — plain-English description of what would change
- **Benefits** — in terms of locality and leverage, and how tests improve
- **Before / After diagram** — side by side, illustrating the shallowness and the deepening
- **Recommendation strength** — `Strong` / `Worth exploring` / `Speculative`, as a badge

End with a **Top recommendation** section: which candidate to tackle first and
why. Use the domain glossary's vocabulary for the domain and the
`codebase-design` vocabulary for the architecture.

**ADR conflicts**: if a candidate contradicts an existing ADR, surface it only
when the friction is real enough to warrant revisiting the ADR — marked
clearly ("contradicts ADR-0007 — but worth reopening because…"). Don't list
every theoretical refactor an ADR forbids.

Do NOT propose interfaces yet. After the doc is written, ask the user:
"Which of these would you like to explore?" The `present` step must also apply
`update-issue`: post the candidates, top recommendation, exact choice needed,
and reachable evidence to the architecture-review issue. The request must be
answerable there even when the HTML report is local-only.

### 3. Grilling loop

Once the user picks a candidate, run the `grilling` skill to walk the design
tree — constraints, dependencies, the shape of the deepened module, what sits
behind the seam, what tests survive.

Side effects happen inline as decisions crystallize — run `domain-modeling` to
keep the domain model current:

- **Naming a deepened module after a concept not in the glossary?** Add the
  term (create the glossary lazily).
- **Sharpening a fuzzy term?** Update it right there.
- **User rejects a candidate with a load-bearing reason?** Offer an ADR so
  future reviews don't re-suggest it — only when the reason would actually be
  needed by a future explorer; skip ephemeral or self-evident reasons.
- **Exploring alternative interfaces for the deepened module?** Use
  `codebase-design`'s design-it-twice parallel sub-agent pattern.

Refactors that come out of this land as tickets (`to-tickets`) or a spec
(`to-spec`) on the chore issue — the review doc itself stays ephemeral.
