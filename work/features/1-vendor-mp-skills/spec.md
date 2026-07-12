# Vendor Matt Pocock's engineering skills into workflow-kit

Issue: [#1](https://github.com/derekwelton/workflow-kit/issues/1)
Status: shipped 0.2.0, 2026-07-12 — all six decisions approved as recommended
Source: [mattpocock/skills](https://github.com/mattpocock/skills) (MIT), studied at depth 2026-07-12

## Goal

Fill the gap in workflow-kit's lifecycle. Today the kit manages the *container*
of work (issue, folder, presentation, cleanup) but says nothing about the
*craft inside* the build phase. Matt's skills are exactly that middle: how to
interview, research, spec, break down, implement, and review. Vendored and
adapted, the pipeline becomes:

```
idea → issue → folder → [ grill → research/prototype → to-spec → to-tickets? ]
     → implement (tdd) → code-review → present → wrap
                    (wayfinder wraps the whole loop for foggy epics)
```

## What we learn from his repo (worth stealing as ideas, not just files)

1. **Small + composable beats framework.** Each skill is one page; they
   reference each other by name. Matches our kit's shape.
2. **Per-repo config doc pattern** (`setup-matt-pocock-skills` →
   `docs/agents/*.md`) — the same move as our `workflow-init` →
   `feature-lifecycle.md`. Merge, don't duplicate.
3. **Tracer-bullet vertical slices with explicit blocking edges** (to-tickets),
   each sized to one fresh context window, worked one at a time.
4. **Wayfinder's map/fog-of-war model** for efforts too big for one session:
   map issue + child decision-tickets + frontier; plan don't do; HITL vs AFK
   ticket types.
5. **Two-axis code review** (Standards vs Spec) in parallel subagents, with a
   Fowler smell baseline, deliberately never merged into one ranking.
6. **Deep-module vocabulary** (codebase-design): module/interface/seam/
   adapter/depth/leverage/locality; the deletion test; "one adapter =
   hypothetical seam, two = real"; design-it-twice.
7. **Domain glossary + ADRs as agent-readable knowledge** (`CONTEXT.md`,
   `docs/adr/`), maintained *during* design conversations, with a 3-part test
   for when an ADR is worth writing.
8. **Prototypes as primary sources**: throwaway by construction, committed to
   a throwaway branch, linked from the issue; the decision folds into the code.

## Skill-by-skill adaptation plan (pending decision round)

| Skill | Verdict | Adaptation |
|---|---|---|
| grilling | Replace body | Derek's variant: bulk-question ROUNDS (not one-at-a-time), recommended answer per question, look up facts in the codebase, decisions are Derek's, plain-text questions (no popup widgets) |
| research | Adapt | Findings → `research/` in the feature folder (committed), background agent, primary sources |
| to-spec | Adapt | Writes/updates the folder's `spec.md` (not the tracker); keep his template (problem/solution/user stories/impl decisions/testing decisions/out of scope) + seam-check step; syncs issue checklist |
| to-tickets | Adapt | Escalation path for big features: checklist stays default; tracer-bullet vertical slices become GitHub sub-issues with blocking edges when work > one session |
| implement | Adapt | Work one ticket/spec with fresh context; TDD at pre-agreed seams; typecheck+tests; then code-review; commit; tick the checklist |
| code-review | Adapt | Two-axis (Standards+smells / Spec-fidelity) parallel subagents; spec source = feature folder spec.md via issue link |
| codebase-design | Near-verbatim | + DEEPENING.md + DESIGN-IT-TWICE.md; vocabulary skill, model-invocable |
| improve-codebase-architecture | Adapt | Report uses OUR review-doc HTML template; output lands in a chore-issue feature folder (issue-first applies) |
| prototype | Near-verbatim | + LOGIC.md + UI.md; capture = throwaway branch + issue pointer; per-repo escape hatches respected (Ironwood `_design/`) |
| handoff | Adapt | Saves to the feature folder (committed) instead of OS temp — handoffs travel between Derek's two machines via git |
| wayfinder | Adapt | Map/tickets = GitHub issue + sub-issues, `wayfinder:*` labels created lazily; ticket types invoke OUR grill/prototype/research; assets land in the effort's feature folder |

Dependencies to vendor too (small, pending Q3/Q6): `domain-modeling`
(+CONTEXT-FORMAT, ADR-FORMAT), `tdd` (+tests.md, mocking.md). Not requested,
recommend skipping for now: triage, diagnosing-bugs, resolving-merge-conflicts,
setup-matt-pocock-skills (merged into workflow-init instead).

## Provenance

MIT license; keep `UPSTREAM.md` recording source repo + commit SHA per vendored
skill so future upstream diffs are possible. Credit Matt in README.

## Open questions → decision round

1. Vendor-and-adapt (recommended) vs install-alongside via skills.sh
2. Sub-issue escalation for to-tickets (recommended yes)
3. Adopt CONTEXT.md + docs/adr + domain-modeling knowledge layer (recommended
   yes, lazily created; Ironwood maps `domainDocs` into `.ai/`)
4. Handoff to feature folder, committed (recommended) vs temp dir
5. Keep his skill names incl. `code-review` (namespaced `/workflow-kit:...`)
   (recommended) vs rename
6. Vendor `tdd` so `implement` keeps its TDD loop (recommended) vs strip
