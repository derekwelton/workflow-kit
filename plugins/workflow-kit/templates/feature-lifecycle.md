---
tracker: github
---

<!-- workflow-kit:managed-start version=1.2.0 -->

# Project workflow configuration

This compatibility block preserves existing repository configuration and local
overrides during an explicitly requested legacy refresh. New installations do
not create a lifecycle file. Configure only installed skills through
setup-workflow-skills and project-owned docs/agents files as needed.

Read only the skill selected for the task. Do not load the entire catalog,
portable fallback, tracker adapters, or orchestration rules on startup.
Existing tracker/status mappings and branch conventions remain authoritative.
Independent implementation/review, final-SHA verification and human acceptance
remain separate. Agents never mark their own work Done.

<!-- workflow-kit:managed-end -->

## Local overrides

Keep repository-specific tracker and verification rules here.
