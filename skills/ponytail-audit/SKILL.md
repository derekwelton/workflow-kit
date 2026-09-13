---
name: ponytail-audit
description: Audit over-engineering and rank concrete deletion or simplification proposals. Read-only by default; apply fixes only when requested.
disable-model-invocation: true
license: MIT
---

Resolve bundled relative file paths from this skill's directory, not the project working directory.


# Ponytail audit

Scan the requested scope for unnecessary complexity. Rank concrete findings
by the value of the proposed cut, with file/line evidence and a replacement:

- delete: dead code, unused flexibility, speculative features; replace with nothing.
- stdlib: hand-rolled behavior the standard library already provides; name it.
- native: a dependency or wrapper for a platform feature; name the feature.
- yagni: one-implementation abstractions, unused options, one-caller layers.
- shrink: equivalent behavior expressed more directly; show the smaller form.

Check usage before proposing deletion. Preserve requirements, public contracts,
security checks and deliberate repository/ADR choices. Do not equate line count
with quality or treat every wrapper as waste. Correctness/security/performance
findings belong in a separate review, not this simplification ranking.

Return the complete ranked proposals in chat or the requested artifact, with
estimated removable lines/dependencies only where evidence supports the estimate.
If nothing is worth cutting, say so. No compulsory issue, HTML report, or folder.
Apply changes or publish findings only within the user's authorized scope.
