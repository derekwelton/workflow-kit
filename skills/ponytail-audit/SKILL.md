---
name: ponytail-audit
description: >
  Whole-repo audit for over-engineering: a ranked list of what to delete,
  simplify, or replace with stdlib/native equivalents. Use when the user says
  "audit this codebase", "audit for over-engineering", "what can I delete from
  this repo", "find bloat", "ponytail-audit", or "/ponytail-audit". One-shot
  report, does not apply fixes.
license: MIT
---

# Ponytail Audit

Repo-wide over-engineering scan. Rank findings biggest cut first.

## Tags

- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled thing the standard library ships. Name the function.
- `native:` dependency or code doing what the platform already does. Name the feature.
- `yagni:` abstraction with one implementation, config nobody sets, layer with one caller.
- `shrink:` same logic, fewer lines. Show the shorter form.

## Hunt

Deps the stdlib or platform already ships, single-implementation interfaces,
factories with one product, wrappers that only delegate, files exporting one
thing, dead flags and config, hand-rolled stdlib.

## Output

One line per finding, ranked: `<tag> <what to cut>. <replacement>. [path]`.
End with `net: -<N> lines, -<M> deps possible.` Nothing to cut:
`Lean already. Ship.`

For a long report the user will review, render it via `present` (review-doc
HTML, findings as a ranked table) — the chat gets the top cuts + the net line.

## Boundaries

Scope: over-engineering and complexity only. Correctness bugs, security holes,
and performance are explicitly out of scope — route them to `code-review`.
Lists findings, applies nothing. One-shot.
"stop ponytail-audit" or "normal mode" to revert.

In this workflow specifically:

- **Acting on findings is issue-first**: cuts the user approves become a
  `chore` issue (`new-feature`; `to-tickets` if the cutting exceeds one
  session — expand–contract applies to wide deletions too). The audit itself
  needs no issue.
- **Division of labor with `improve-codebase-architecture`**: ponytail-audit
  finds what to *subtract* (delete/shrink/replace); improve-codebase-
  architecture finds what to *restructure* (deepen shallow modules). Run the
  subtraction pass first — no point deepening code that should be deleted.
- Documented repo standards and ADRs override a finding: something an ADR
  chose deliberately isn't bloat, drop it from the list.
