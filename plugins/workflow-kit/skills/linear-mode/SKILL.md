---
name: linear-mode
description: Read Linear issues or route authorized sync-thread writes, status transitions and intake. Use only for a configured Linear tracker; load operation references conditionally.
metadata:
  internal: true
---

Resolve bundled relative file paths from this skill's directory, not the project working directory.


# Linear adapter

Read docs/agents/issue-tracker.md or the existing repository tracker configuration
first; no managed lifecycle file is required. An explicit tracker/linearTeam
conflict blocks writes. An absent binding means ordinary GitHub; do not infer
Linear from connected tools. Unreadable configuration is unknown, not permission
to silently select a different write destination.

For reads, resolve team and current repository. Fetch issue bodies and relevant
comments; scope candidates using verified GitHub attachment/PR or branch
repository, never titles alone. Report incomplete pagination or sampling.
Resolve exact status names; In Progress, Code Review and In Review share
type started, so type alone cannot select them.

Tool names are logical: get_issue, list_issues, list_comments,
list_issue_statuses, list_issue_labels, save_issue and save_comment. Map to the
current host. If tools are unavailable, report the limitation. An explicitly
authorized GitHub-twin fallback leaves Linear status/relations untouched;
do not silently change provider or double-post uncertain delivery.

Read only for the selected operation:
- Comment or body write: [references/write.md](references/write.md).
- Status transition: [references/status.md](references/status.md), plus write.md.
- Issue/branch/artifact intake and body templates:
  [references/intake.md](references/intake.md), plus write.md before publication.
- Optional longer checkpoint examples:
  [references/checkpoint-examples.md](references/checkpoint-examples.md).

These references replace former numbered sections 3–9. Callers citing an old
section choose its operation here; reads never load write/intake examples.
One team per repository is supported; projects/cycles are not managed.
