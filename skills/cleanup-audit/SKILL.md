---
name: cleanup-audit
description: Explicitly audit repository clutter and propose evidenced cleanup; execute only subsequently selected recommendations.
disable-model-invocation: true
---

Resolve bundled relative file paths from this skill's directory, not the project working directory.


# Cleanup Audit

Use only when explicitly invoked. Ordinary implementation completion or a casual
merge request does not activate this skill.

Read repository ownership/retention rules and `./bundled/templates/lifecycle-contract.md`.
The initial phase is read-only, including tracker state and comments. Inspect
repository-scoped local/remote branches, worktrees, associated PRs/issues,
completed feature folders, and obsolete planning documents. Missing feature
folders are normal. Do not fetch with pruning or modify local refs during audit;
use read-only remote queries when local information may be stale.

Read `./bundled/templates/cleanup-owned.md` for eligibility evidence. Map each
branch to its actual destination, PR, issues and owned paths. Explain overlapping
branches using commit/diff relationships and remaining scope. Age, file extension,
similar names or a closed issue alone do not establish disposability. Inspect the
configured tracker read-only; report incomplete discovery rather than guessing.

Return one concrete report grouped as **Ready to remove**, **Keep**, and
**Needs a decision**. For each item give its exact branch/path/record, proposed
action, relationship evidence and reason. Include retained durable docs and
historical references. No merge, deletion, issue/PR closure or status changes.

An explicit instruction to execute the concrete recommendations authorizes only
the selected actions. Preserve exceptions. Refresh each item's mutable evidence
and follow `./bundled/templates/cleanup-owned.md` before removal. If merge or tracker
reconciliation was selected, use `./bundled/templates/merge-completion.md` for those
operations without implicitly invoking merge-cleanup. Newly active or changed
items are retained. Report executed, retained and unresolved actions, including
partial failures. Do not request authorization again for unchanged selected work.
