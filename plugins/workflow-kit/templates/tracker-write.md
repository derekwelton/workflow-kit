# Tracker writes

Canonical owner of publication authorization, fresh reads, deduplication, and
status races. Read only when an external write is authorized. Read-only scope
stops here without loading a write adapter or performing a mutation.

1. Identify the originating issue, repository, configured tracker and operation.
   Check current user authorization, inherited scope, and local overrides.
   Existing authorization suffices; skill invocation does not grant new scope.
2. Immediately before a write, refetch the current issue body, status and recent
   comments. Apply a minimal delta to that fetched body; preserve unrelated
   text and concurrent edits. If a version/CAS precondition is available, use it.
   Refetch narrows a race; it does not make an unconditional API write atomic.
3. Publish a meaningful checkpoint once. Compare recent comments and any saved
   operation result first, including on resume after uncertain delivery. Do not
   retry a comment blindly or post on both synced providers.
4. Status writes require the expected prior status and satisfied lifecycle gate.
   Resolve exact local status/field IDs. Stop and reconcile unexpected status,
   ambiguous target, incomplete discovery or unknown write outcome. Verify the
   result after mutation. Never overwrite an unexpected status or set Done.
5. Use only the configured adapter:
   - Linear: ../skills/linear-mode/SKILL.md and its write reference.
   - GitHub Projects: ../skills/github-projects/SKILL.md; verify item/field/option
     IDs and preserve local mapping. Missing code-review column stays In Progress.
   - GitHub Issues: gh issue view/edit/comment on the verified repository/issue;
     use structured bodies or --body-file. No synthetic project statuses.
6. Follow the workload contract for batch review handoffs and interrupted
   sequential transitions; the tracker adapter does not own integration gates.

A checkpoint states outcome, completed changes, verification and limitations,
questions with recommendations, and next action. Link only reachable evidence.
Keep private logs/secrets and unrelated information out. Local-only artifacts
are optional conveniences, never the sole evidence or question record.
