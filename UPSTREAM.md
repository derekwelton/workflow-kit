# Upstream provenance

To pull upstream improvements: diff the paths below against a fresh clone at
the recorded SHA, then review what changed upstream since.

## mattpocock/skills

Vendored from [mattpocock/skills](https://github.com/mattpocock/skills)
(MIT License, © 2026 Matt Pocock) at commit `391a2701dd948f94f56a39f7533f8eea9a859c87`
(2026-07-12).

| workflow-kit skill | upstream path | adaptation |
|---|---|---|
| grilling | skills/productivity/grilling | REWRITTEN — Derek's bulk-question-rounds variant |
| research | skills/engineering/research | findings → feature folder `research/` (committed) |
| to-spec | skills/engineering/to-spec | writes folder `spec.md` instead of publishing to tracker; no triage labels |
| to-tickets | skills/engineering/to-tickets | publishes GitHub sub-issues of the feature issue; escalation not default; no local-files mode; no triage labels |
| implement | skills/engineering/implement | + branch/checklist/notes.md conventions; model routing deferred to repo policy |
| code-review | skills/engineering/code-review | spec source = feature folder spec.md via issue link; standards sources include agent-docs + glossary/ADRs |
| codebase-design | skills/engineering/codebase-design | verbatim (+ DEEPENING.md, DESIGN-IT-TWICE.md) |
| improve-codebase-architecture | skills/engineering/improve-codebase-architecture | report via our review-doc template (no CDNs, no temp dir); issue-first; HTML-REPORT.md not vendored |
| prototype | skills/engineering/prototype | verbatim (+ LOGIC.md, UI.md) |
| handoff | skills/productivity/handoff | saves to feature folder, committed (two-machine sync) instead of OS temp |
| wayfinder | skills/engineering/wayfinder | tracker = GitHub issue + sub-issues; Blocked-by body lists; lazy `wayfinder:*` labels; assets in feature folder |
| domain-modeling | skills/engineering/domain-modeling | verbatim (+ CONTEXT-FORMAT.md, ADR-FORMAT.md); per-repo paths via lifecycle-doc `glossary`/`adrDir` config |
| tdd | skills/engineering/tdd | verbatim (+ tests.md, mocking.md) |

Not vendored (add later if wanted): triage, diagnosing-bugs,
resolving-merge-conflicts, grill-with-docs (ours: run grilling +
domain-modeling together), setup-matt-pocock-skills (merged into
workflow-init), qa (deprecated upstream).

## DietrichGebert/ponytail

Vendored from [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)
(MIT License, © 2026 DietrichGebert) at commit `14a0d79548d4de8fc2de95c1b94bb0de63a739d3`
(2026-07-12).

| workflow-kit skill | upstream path | adaptation |
|---|---|---|
| ponytail | skills/ponytail | body verbatim; Boundaries section extended: implement runs it by default, tdd outranks the one-check rule at agreed seams, never simplify away spec.md requirements, Caveman pairing dropped |
| ponytail-audit | skills/ponytail-audit | tags inlined (self-contained without ponytail-review); long reports via `present`; findings acted on = issue-first chore; ordered before improve-codebase-architecture; ADRs override findings |

Not vendored (add later if wanted): ponytail-review (diff-scoped — our
code-review's Standards axis + ponytail-at-write-time cover most of it),
ponytail-debt, ponytail-gain, ponytail-help.
