---
name: setup-workflow-skills
description: Configure the installed workflow skills for this project, reusing its tracker, triage vocabulary and domain-document conventions. Use for initial setup or an explicitly requested migration.
disable-model-invocation: true
---

Resolve bundled relative file paths from this skill's directory, not the project working directory.


# Setup Workflow Skills

Adapt the per-project setup from Matt's engineering collection to the skills
actually installed. Installation is separate: the workflow-kit repository's
install-skills script supports --all or --skills. Never install globally or
change user plugin/model settings as part of project setup.

## Inspect

Read the project's .ai/AGENTS.md when present, otherwise its existing root
AGENTS.md/CLAUDE.md and routed conventions. Inspect docs/agents, existing
feature-lifecycle configuration, repository remotes, glossary/ADR locations,
and the installed directory names or .workflow-skills.json. Do not read every
installed SKILL.md. Discover whether triage, domain-modeling, linear-mode and
github-projects are installed before configuring their optional behavior.

Existing tracker bindings, status mappings, branch conventions, glossary paths
and local verification rules take precedence over defaults. Remote-host inference
does not override an existing configuration. Conflicts block affected writes.

## Configure only what is needed

- **Tracker:** reuse the existing owner, or write docs/agents/issue-tracker.md.
  GitHub, GitLab and local Markdown seeds are linked below. For GitHub Projects
  or Linear, read only the installed selected adapter and record its verified
  fields/status mappings or team binding. Preserve independent Code Review and
  human In Review phases and never introduce automatic Done. If the adapter
  is missing, report the specific skill to install. Other trackers can use a
  short owner-provided contract. No remote labels, fields, issues or comments
  are created by setup.
- **Triage:** only when installed, reuse existing category/state-role mappings
  or record the agreed defaults in docs/agents/triage-labels.md. Triage roles
  must not replace delivery statuses or organization Issue Types.
- **Domain docs:** only for installed skills that use them, preserve the
  existing glossary/ADR locations or use CONTEXT.md plus docs/adr by default.
  Use multiple contexts only when the repository already warrants them.
  Do not create empty glossaries/ADRs; document where future decisions go.

Show the concrete configuration and minimal entrypoint edit before applying it.
Reuse existing user authorization; ask only for missing material choices. Do
not restart setup questions whose answers are already in the repository.

## Write minimal pointers

Update the existing Agent skills section in its current owner, preserving
surrounding text and custom content. Use short conditional pointers such as
"For tracker operations, read docs/agents/issue-tracker.md." Never instruct a
host to preload the catalog, all references, or a full lifecycle framework.

Use the existing instruction file. If both AGENTS.md and CLAUDE.md already
exist, keep their established routing to the same configuration without
duplicating document bodies. If neither exists, use AGENTS.md unless the user
selected another file. Do not create a second host file just for setup.

Seed templates (adapt to verified project conventions; do not overwrite owner edits):

- [GitHub](issue-tracker-github.md)
- [GitLab](issue-tracker-gitlab.md)
- [Local Markdown](issue-tracker-local.md)
- [Triage vocabulary](triage-labels.md)
- [Domain documentation](domain.md)

## Existing lifecycle migration

Only when migration is requested, show the exact old managed block and pointers
to retire. Preserve frontmatter, local overrides, active manifests, review
receipts and work artifacts. Remove only the selected legacy policy and replace
it with the minimal routing above. Project installation alone does not authorize
this migration or removal of global installations used by other projects.

Report the files changed, selected tracker and skill configuration, and any
unresolved choices. Verify a rerun needs no changes when configuration is current.
