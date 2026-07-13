# Vendor ponytail + ponytail-audit; skills cheat sheet

Issue: [#2](https://github.com/derekwelton/workflow-kit/issues/2)
Status: shipped 0.3.0, 2026-07-12
Source: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) (MIT) @ 14a0d795

## Goal
Anti-over-engineering layer: ponytail (persistent lazy-mode, the 7-rung
ladder, lite/full/ultra) governs all code writing; ponytail-audit is the
repo-wide subtraction scan. Plus CHEATSHEET.md — the full skill map.

## Integration decisions
- ponytail body verbatim; Boundaries extended: implement runs it (full) by
  default; tdd outranks its one-check rule at pre-agreed seams; spec.md
  requirements are "explicitly requested" (challenge out loud, never silently
  skip); Caveman pairing dropped.
- ponytail-audit: tags inlined (standalone without ponytail-review); long
  reports via present; approved cuts → chore issue (issue-first); ordered
  BEFORE improve-codebase-architecture (subtract, then deepen); ADRs override
  findings; correctness/security/perf route to code-review.
- Not vendored: ponytail-review (code-review Standards axis + write-time
  ponytail cover it), -debt, -gain, -help.
- CHEATSHEET.md at repo root: inventory (modes vs lifecycle vs build steps),
  auto-load vs manual table, who-calls-whom, boundary rules, six ordered
  walkthroughs (tiny bug → foggy epic → maintenance day).
