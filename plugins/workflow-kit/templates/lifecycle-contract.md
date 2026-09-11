# Lifecycle contract

Canonical owner of task scope, lifecycle routing, instruction reuse, and
checkpoint ownership. Repository configuration and local overrides still apply.
Read the repository's compact feature-lifecycle.md; plugin-equipped hosts use
this contract and the selected action, not the portable fallback as well.

## Select the path

- **Read-only / personal advisory:** status, lookup, review, research, and reports
  default to an answer in chat. Do not create issues, post comments, change
  tracker state, start implementation, or require a feature folder. A requested
  file report authorizes that artifact only. Pass this scope to every nested
  skill/worker; dependencies cannot widen it.
- **Single issue:** implement the named issue; reuse its acceptance criteria.
  A small fix is issue → branch → edit → affected verification → independent
  review → human acceptance. Repository implementation work uses an existing
  issue or authorized minimal intake through new-feature. Create a feature
  folder only for actual artifacts. Interview/spec/ticket decomposition is opt-in.
- **Multi-issue:** only an explicitly requested workload uses orchestrate-queue
  and its workload contract. A worker count is a ceiling, never a target.

Read-only work remains outside issue intake even inside an issue-backed repo.
An existing issue link is context, not authorization to publish a review.
Honor authorization already provided; do not ask again for routine choices.
Commit/push follow repository/user authorization; merge, destructive cleanup,
and sending messages require explicit authorization. Never set Done.

## Canonical owners and conditional reads

| Needed now | Read |
|---|---|
| Tracker query | Configured adapter: ../skills/linear-mode/SKILL.md or ../skills/github-projects/SKILL.md; ordinary GitHub uses gh |
| Authorized tracker write | [tracker-write.md](tracker-write.md), then its selected adapter |
| Implementation | ../skills/implement/SKILL.md; coding principles and TDD only as applicable |
| Independent review | ../skills/code-review/SKILL.md, selected mode only |
| Workload invariants | ../skills/orchestrate/references/workload-contract.md |
| Worker model/effort | ../skills/model-routing/SKILL.md; scripts/lib/model-policy.mjs owns executable defaults |
| Human acceptance/cleanup | ../skills/wrap-feature/SKILL.md |
| HTML requested/useful | ../skills/present/SKILL.md; caller supplies canonical content |

## One checkpoint owner

For authorized issue-backed work the caller publishes one meaningful phase
checkpoint through update-issue: start, result, decision, pause/block, or handoff.
Nested research/renderers return results to that caller; they do not publish
another copy. Recent comments determine whether the checkpoint already exists.
Narrative is canonical Markdown for GitHub, issue body/comments for Linear;
HTML is a derived view. Keep evidence and questions understandable without
local-only files. A file report need not become an issue or HTML presentation.

## Instruction and execution continuity

Retain loaded instruction identity: real path, package version and content hash
(or observed revision), applicable mode, and whether full content remains in
context. Preserve this ledger in compacted handoffs with the relevant rules.
Reuse unchanged, retained content. A path/version alone is not retained content:
reload when missing, changed, truncated, or uncertain; load only needed references.
Mutable issues, comments, statuses, refs and authorization are checked fresh for
writes and completion gates, never cached as instruction content.

Bound each instruction-return batch to the outer tool's output budget (default
at most 12,000 decoded characters per batch; smaller for small limits). Split
large files at headings with explicit continuation ranges. Inspect every result;
truncation is incomplete loading, not evidence a file was read.

Prefer completion notifications. Otherwise wait on supported jobs at useful
intervals (normally 10–60 seconds), retaining job identity and output offsets.
Do useful independent work while waiting. Do not poll every second or reread
unchanged git state/test tails. Repeat checks after changes, failures, or a
specific unresolved concern. Use helper --help and structured errors before
reading helper implementations.
