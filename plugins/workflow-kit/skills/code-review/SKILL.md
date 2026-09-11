---
name: code-review
description: Independently review a fixed branch, PR or issue against Standards and Spec. Supports targeted, repository queue and workload modes; advisory reviews stay read-only.
---

Resolve this skill's real filesystem path; package root is `../..` from its directory.


# Independent code review

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Review a fixed diff along **Standards** (repo rules) and **Spec** (requested
behavior). An advisory review is read-only even if it names an issue.
--fix authorizes fixing, not self-approval or unrelated tracker publication.

Choose one mode:
- Targeted branch/PR/issue/base: continue below.
- Explicit repository queue: read `references/queue.md`.
- --workload <id>: read `references/workload.md`.

## Targeted review

1. Resolve base and head: PR supplies both; a named branch/issue uses default
   branch as base; a base-only argument compares that base to HEAD.
   Pin Git-resolved SHAs, three-dot diff and commit list. Missing refs or empty
   diff are a reported blocker, not a successful review.
2. Use supplied requirements, named issue acceptance criteria, existing spec,
   or sub-issue plus parent spec. For Linear fetch current body and relevant
   decision/spec comments through its read adapter. Use cited research when
   relevant. If no spec exists, state that the Spec axis is unavailable; ask
   only if that prevents a useful requested review.
3. Read changed behavior, affected callers, public contract, adjacent tests,
   relevant repo standards/glossary/ADRs. Expand on uncertainty or material
   impact. For the code-smell baseline read `references/standards.md`;
   repo standards override heuristic smells, and tooling-enforced style is
   not a review finding.
4. A reviewer must be independent of the implementation author. Read
   `../model-routing/SKILL.md` and `references/providers.md` when dispatching;
   one fresh reviewer covers both axes by default. A reviewer already running
   independently performs the review locally. Do not spawn a reviewer merely
   to restate the work of an existing independent reviewer.
5. Report evidence-backed findings separately by axis with severity, path,
   requirement/standard and effect. Re-derive material findings before fixes.
   With --fix, apply accepted changes and affected verification; obtain an
   independent final-head receipt when fixes change the diff. Unresolved
   material findings or missing evidence prevent claiming ready.
6. Return outcome, both axes, tested/reviewed base/head, limitations and next
   action. HTML is optional through pure present. For authorized lifecycle
   publication the caller uses update-issue once and the selected tracker
   write/status reference. Advisory review ends in chat with no mutation.

Workload convergence, final-SHA receipts and integration are owned by its
contract. Standalone completed independent review may hand off to human review
only after fresh expected-status checking; implementation cannot self-promote.
Never set Done or infer merge authorization from a successful review.
