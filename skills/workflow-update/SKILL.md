---
name: workflow-update
description: Refresh an adopted repository's managed workflow documents while preserving configuration and local overrides. Use --check for read-only drift reporting.
---

Resolve package paths from this skill's real directory, two levels up.

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Load only the tracker operation and mode needed for this request.

# workflow-update

Refresh the current repository from the installed workflow-kit. Optional
argument: `--check` reports drift without editing.

## Preconditions

- Work inside a git repository that already contains a workflow-kit-stamped
  `feature-lifecycle.md`. If none exists, use `workflow-init` instead.
- Treat `<workflow-kit-root>` as the source. If the user has not refreshed
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
2. Use `node <workflow-kit-root>/scripts/refresh-lifecycle.mjs <canonical-doc> --check`
   to preview managed router and portable fallback drift without writing.
   For authorized apply, rerun without --check. The helper preserves content
   outside exactly one managed block and refuses downgrades/ambiguous markers.
   Legacy unmarked documents require the reconciliation in step 5 below.
3. Preserve the project's YAML frontmatter exactly. It owns `workDir`,
   `docsHome`, labels, glossary paths, ADR paths, `linearTeam`, and any future
   repo-specific configuration. **Never add, remove, or change `linearTeam`
   here** — it gates Linear mode, so touching it silently changes how every
   skill behaves. If the repo has it, keep it verbatim; if it doesn't, leave
   it absent and mention in the report that Linear mode is available and
   opt-in.
4. The helper replaces only the managed block and generated portable sibling.
   Inspect the diff, including the preserved frontmatter and local additions.
   Do not manually copy a second full lifecycle into the plugin route.
5. For a legacy stamped document without markers:
   - inspect its git history and current diff to identify changes made after
     the original stamp;
   - when no repo-specific body edits exist, replace the body after the
     frontmatter and add the current managed markers;
   - move clearly repo-specific additions below the managed-end marker;
   - if a body edit cannot be classified safely, show the conflicting section
     and ask before replacing it. Never silently erase it.

   After legacy reconciliation establishes one valid managed block, rerun the
   helper so the generated portable sibling is created/refreshed too.

In `--check` mode, report the installed template version, project version (or
`legacy/unversioned`), and drift; make no edits. Check the reconciliation
items below read-only and report what apply mode would change.

## Reconcile the integration

After the lifecycle document is current, idempotently verify the same seams as
`workflow-init` without recreating the project:

- `work/features/` and `_archive/` exist at the configured `workDir`;
- the workflow-kit gitignore block contains the current required patterns,
  preserving repo exceptions;
- for ordinary GitHub mode, configured classification labels exist; for GitHub
  Projects, verify configured Issue Types, fields and mappings read-only instead
  of creating classification labels; never rename local labels or statuses;
- exactly one canonical agent entrypoint points to the configured lifecycle
  document, and vendor wrappers still point to that canonical entrypoint.

Show the resulting diff. Run the plugin/repo documentation checks available in
the project, plus `git diff --check`. Do not commit or push unless the user or
repo workflow requests it.

**Report three separate refresh states:** local checkout files, instructions
already loaded in the current session, and changes distributed to other machines.
Agents in this checkout can read uncommitted changes immediately; a long-lived
session may retain earlier instructions until it rereads them or restarts.
Commit and push deliver the repository policy to collaborators and other
machines. Machine plugin updates remain separate from repository refresh.

In apply mode, use `update-issue` with the old/new workflow-kit versions, files
changed, preserved local additions, validation results, and any remaining
manual action. Report the issue URL and remind the user that other machines
need their own machine-level plugin update. In `--check` mode, report only in
chat.
