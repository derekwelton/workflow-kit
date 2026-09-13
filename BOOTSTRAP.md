# Project-local installation

Install only in the user's target project. Read README.md for the install-all and
selective commands. Use `scripts/install-skills.mjs --project <project> --host
codex|claude|both --all` or `--skills <names>` as requested. If the host is
unspecified, use Codex; reuse an explicitly selected host. Show included dependencies.

Do not install a global plugin, create user-skill links, change global settings,
or stamp lifecycle documents. Installation does not authorize tracker writes,
commits, or migration of repository instructions. If setup was requested, use
the newly installed setup-workflow-skills entrypoint and only relevant references.

For a legacy project, inspect docs/project-local-migration.md and the existing
repository configuration. Preserve local overrides and active workload state.
