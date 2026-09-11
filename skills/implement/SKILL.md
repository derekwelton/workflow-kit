---
name: implement
description: Implement a ready issue or spec with affected verification and an independent review handoff. Use existing acceptance criteria and tests; keep small fixes proportional.
disable-model-invocation: true
---

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Load only the tracker operation and mode needed for this request.

Implement a named issue's acceptance criteria or the feature folder's `spec.md` — or, under
Linear mode, in the issue body plus its spec comment
(`../linear-mode/SKILL.md`) — or in the specific sub-issue ticket the
user names. **One ticket per fresh session** — don't chain tickets in one
context; hand off between them.

- Apply `update-issue` when implementation starts. Name the branch, the ticket
  or checklist slice in progress, and the next verification checkpoint.
- Work on a branch referencing the issue (`feat/<issue#>-<slug>`) unless the
  repo's conventions say otherwise. Under Linear mode, use the issue's
  `gitBranchName` instead (linear-mode §5) — that is what makes Linear
  auto-link the PR and drive its own status transitions.
- **Apply the `ponytail` coding principles to code you write** — the ladder
  governs the implementation: reuse > stdlib > native > installed dep > one
  line > minimum code. Never simplify away what the spec explicitly requires;
  challenge it in a note instead.
- Use the `tdd` skill where possible, **at the seams pre-agreed in the spec**
  (its Testing Decisions section). Existing tests, public interfaces and issue acceptance criteria
  count as agreement; clarify only material unresolved scope/coverage choices. Test depth is tdd's call, not
  ponytail's — its one-check minimum applies only where tdd isn't in play.
- Run affected-area checks and required repository validation at the completed
  change. Broaden on impact, failures or unresolved risk; do not repeat green
  checks without new evidence. Record the tested diff/head and limitations.
- With Linear mode off, run `code-review` on the completed work and address what
  it surfaces, as before. With Linear mode on, do **not** self-review: the
  independent review agent owns the `Code Review` queue.
- Commit only when user/repository authorization permits. Apply `update-issue`: summarize what changed,
  verification results, the exact branch/PR and fixed point for the later
  review, link only pushed/reachable artifacts, and tick the completed
  checklist item. Leave closure to the authorized wrap/human-acceptance gate. Under Linear mode, nothing is closed: use
  `Refs #<gh#>`, never `Closes`, and move the implemented issue to
  `Code Review`. The implementation agent must not run `code-review` on its
  own work; an independent review agent owns the next transition.
- If implementation pauses, blocks, or needs the user's verification or a
  decision, apply `update-issue` before ending the session. Put the exact ask,
  recommendation, current state, and resumption step in the issue comment.
- Keep one canonical checkpoint; create notes/artifact folders only when they
  carry useful information beyond the issue update.

Read `../model-routing/SKILL.md` for model/effort selection. Repository policy
may narrow model choices or task ownership; it cannot raise the high effort
ceiling or silently restore old generation-specific defaults.

Before claiming ready, record proportionate evidence of the issue's core user
task in the intended environment. Explicitly list unresolved runtime, schema,
config, deployment, or human-verification prerequisites. Passing isolated tests
does not prove an unavailable user-facing scenario works.

At the final checkpoint, name the next action in one line: independent
`code-review` while code awaits review, or `wrap-feature` only after the user
has accepted shipped work. Apply `update-issue` directly at meaningful gates;
do not make the user remember a second bookkeeping command.
