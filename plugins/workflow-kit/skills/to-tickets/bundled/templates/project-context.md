# Project conventions for engineering skills

Read the repository's existing instructions and tracker/domain configuration
only for this operation. Prefer docs/agents/issue-tracker.md when configured;
existing .ai/ contracts, lifecycle frontmatter, tracker/status mappings, branch
rules, glossary and ADR locations still take precedence over default templates.
Conflicting configuration blocks writes; do not silently choose a new tracker.
Missing optional setup files do not block ordinary code review, coding or research
when the user and repository already supply enough context. Setup is needed only
for an unresolved configuration choice, not as a compulsory workflow gate.

For a configured Linear or GitHub Projects operation, read the installed
linear-mode or github-projects adapter for the selected operation. If missing,
report the specific adapter to install; do not route writes to another tracker.
Do not read adapters for ordinary GitHub/GitLab/local-file work. Triage roles
are separate from delivery/review statuses; preserve the project's existing
labels, issue types and board field mappings. Apply default ready-for-agent
labels only if the project's vocabulary uses them.

Respect the user's requested scope. Read-only requests produce findings or
drafts without posting. Existing write authorization persists; another skill
cannot expand it. When publishing checkpoints use installed update-issue if
available, otherwise follow the configured adapter's delivery rules directly.
Never double-post a Linear/GitHub synced comment. Agents never set Done or
approve their own implementation. Independent review and human acceptance
remain separate; workload workers return results to their coordinator.
