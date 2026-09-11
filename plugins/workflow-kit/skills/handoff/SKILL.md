---
name: handoff
description: Record a compact resumption checkpoint for ongoing work when requested. Use the configured canonical issue or artifact and avoid duplicate handoff records.
---

Resolve this skill's real filesystem path; package root is `../..` from its directory.


# Handoff

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Record only information needed to resume that is absent from canonical sources.

Choose the destination before writing:
- Personal/read-only work: chat or the requested artifact path, no intake.
- Authorized Linear handoff: one sync-thread checkpoint via update-issue,
  not a file followed by a duplicate comment.
- GitHub issue-backed work: one issue checkpoint, or an existing feature
  handoff artifact when substantial evidence requires it. Create folders only
  for actual artifacts; commit/push only as authorized.
- Workload: manifest is state, issue thread is narrative; local snapshot is
  optional and derived. Do not automatically invoke this user-only skill.

Include outcome/current state, unresolved decisions, suggested next skill,
exact next action and relevant issue/spec/commit references. Retain loaded
instruction real paths, versions/hashes and applicable rules still available
after compaction; a filename alone does not preserve content.

For workloads include saved policy/decisions, branch/worktree/base/head,
review/test evidence, in-flight worker/job identities and owned runtime
command/start-time. Preserve dirty/active worktrees and unresolved prerequisites.
On resume reconcile actual Git/provider/tracker state before continuing.
Redact secrets, PII and unrelated data.

The caller publishes once if authorized. Leave status unchanged for a pause.
Reference prior records rather than duplicating them. Never delete immutable
comments; label superseded records. Delete local handoffs only with authorized
owned-artifact cleanup, not merely because a newer handoff exists.
