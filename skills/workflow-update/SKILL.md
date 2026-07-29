---
name: workflow-update
description: Refresh an existing project's workflow-kit integration from the currently installed plugin while preserving repository-specific configuration and additions. Use when the user asks to update, upgrade, refresh, or synchronize workflow-kit in a repo that has already run workflow-init.
---

# workflow-update

Refresh the current repository from the installed workflow-kit. Optional
argument: `--check` reports drift without editing.

## Preconditions

- Work inside a git repository that already contains a workflow-kit-stamped
  `feature-lifecycle.md`. If none exists, use `workflow-init` instead.
- Treat `${CLAUDE_PLUGIN_ROOT}` as the source. If the user has not refreshed
  the machine installation yet, remind them to run the marketplace/plugin
  update commands and start a new session before this skill.
- In the default apply mode, follow the repo's issue-first policy: reuse a
  matching chore issue or create a small one. A feature folder is unnecessary
  unless this refresh produces artifacts beyond the issue and changed
  integration files. `--check` is fully read-only and creates no issue,
  comment, label, file, commit, or other external state.
- Never discard unrelated or uncommitted work.

## Refresh the lifecycle document

1. Locate the project document through its agent-entrypoint pointer; fall back
   to a repository search for a workflow-kit-stamped `feature-lifecycle.md`.
   Stop if more than one candidate is genuinely ambiguous.
2. Read the project document and
   `${CLAUDE_PLUGIN_ROOT}/templates/feature-lifecycle.md` completely. Require
   the source template to contain matching `workflow-kit:managed-start` and
   `workflow-kit:managed-end` comments.
3. Preserve the project's YAML frontmatter exactly. It owns `workDir`,
   `docsHome`, labels, glossary paths, ADR paths, `linearTeam`, and any future
   repo-specific configuration. **Never add, remove, or change `linearTeam`
   here** — it gates Linear mode, so touching it silently changes how every
   skill behaves. If the repo has it, keep it verbatim; if it doesn't, leave
   it absent and mention in the report that Linear mode is available and
   opt-in.
4. If the project document already has managed markers, replace only the
   marked block with the source template's marked block. Preserve everything
   below `workflow-kit:managed-end`; that is the repo-specific additions area.
5. For a legacy stamped document without markers:
   - inspect its git history and current diff to identify changes made after
     the original stamp;
   - when no repo-specific body edits exist, replace the body after the
     frontmatter and add the current managed markers;
   - move clearly repo-specific additions below the managed-end marker;
   - if a body edit cannot be classified safely, show the conflicting section
     and ask before replacing it. Never silently erase it.

In `--check` mode, report the installed template version, project version (or
`legacy/unversioned`), and drift; make no edits. Check the reconciliation
items below read-only and report what apply mode would change.

## Reconcile the integration

After the lifecycle document is current, idempotently verify the same seams as
`workflow-init` without recreating the project:

- `work/features/` and `_archive/` exist at the configured `workDir`;
- the workflow-kit gitignore block contains the current required patterns,
  preserving repo exceptions;
- `feature`, `bug`, `chore`, and `idea` labels exist; never delete or rename
  additional labels;
- exactly one canonical agent entrypoint points to the configured lifecycle
  document, and vendor wrappers still point to that canonical entrypoint.

Show the resulting diff. Run the plugin/repo documentation checks available in
the project, plus `git diff --check`. Do not commit or push unless the user or
repo workflow requests it.

**Say plainly that the refresh only reaches other agents once it is committed.**
Claude reads the installed plugin, but Codex, Gemini, Cursor, and every other
machine read *only* the committed lifecycle document. Until this diff is
committed and pushed, they keep following the old contract — so an uncommitted
`workflow-update` has updated nothing for them. Recommend committing it, and
say so even when the user hasn't asked about other agents.

In apply mode, use `update-issue` with the old/new workflow-kit versions, files
changed, preserved local additions, validation results, and any remaining
manual action. Report the issue URL and remind the user that other machines
need their own machine-level plugin update. In `--check` mode, report only in
chat.
