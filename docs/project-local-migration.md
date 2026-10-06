# Moving an existing project to local skills

The current catalog has 30 skills. Installation and migration are separate operations.
The installer copies skills; it does not rewrite AGENTS.md, CLAUDE.md, .ai/ rules,
feature-lifecycle.md, tracker settings, existing work folders, or global plugins.

1. Finish or explicitly hand off active workloads. Preserve manifests, review
   receipts, worktrees, tracker bindings and any unresolved acceptance gates.
   A package update is not permission to restart workers or discard state.
2. Install all or selected skills into the project, previewing first if desired.
   Keep the current global installation until you have a concrete removal plan;
   avoid running duplicate old/new skills in the same session.
3. Invoke setup-workflow-skills with an explicit migration request. Read the
   existing repository entrypoints, managed lifecycle block, frontmatter and
   owner additions. Show the proposed edits and preserve exact tracker/status,
   branch, glossary, ADR and verification semantics. Point to existing config
   where possible; do not copy all lifecycle text into a new always-read file.
4. Remove only the legacy managed block and entrypoint links selected for this
   migration. Keep owner-authored material. An entirely generated portable
   fallback can be removed after its incoming links are retired. Do not delete
   feature artifacts or historical records merely because the new setup doesn't
   create them. For ambiguous ownership, report the exact remaining material.
5. Separately remove the user's old global workflow-kit installation/owned links
   only when requested. Changes here affect every project using that installation;
   never infer that authorization from a project-local install.
6. Restart a session and verify the intended skill selection. Exercise a small
   coding task, an explicitly invoked workflow and the configured tracker in
   read-only mode. Exercise orchestration only with an authorized workload.

## Retired commands

board, grilling, integrate-reviewed, model-routing, new-feature, plan,
present, work-audit, workflow-doctor, workflow-init, workflow-update, wrap-feature.

The interview primitive is now an ordinary reference under grill-with-docs.
Reviewed-workload integration and capability preflight live under orchestrate.
Model routing is a supporting reference plus the existing executable policy.
Independent review, final-SHA verification, existing tracker/status mappings and
human acceptance still apply. Retiring commands does not retire those gates.

The old refresh/managed-version helpers remain for explicitly requested legacy
maintenance, with regression tests for preserving local configuration. Their
new compatibility output contains no expanded skill bodies. They are not part
of the new project installation and are not mandatory workflow steps.

The old implementation is preserved in Git at
8ab784585df2508b462f9e308d680350542585b7 (0.9.4); no global rollback or tag is created
by the migration. Earlier guides and context measurements describe that version,
not the current installation model.

Cleanup Audit (`cleanup-audit`) replaces the retired work-audit capability with
a read-only proposal followed by explicitly selected execution. Merge Cleanup
(`merge-cleanup`) shares integration and cleanup procedures with orchestration
and supports standalone and child-to-parent work without a workload manifest.
Both new entrypoints are explicit-only on Claude and Codex; no consumer activation
rules or retention policies change. Historical wrap-feature archival defaults
do not override consumer retention rules. Handoff has returned as a productivity
skill. Unslop is model-invocable, with the upstream invocation restriction removed.
