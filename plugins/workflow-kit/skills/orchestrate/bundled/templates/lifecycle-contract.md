# Optional workflow contract

Read repository rules and the configured tracker contract, normally
docs/agents/issue-tracker.md. Existing feature-lifecycle.md configuration and
local overrides remain valid; no managed document is required for new projects.
Conflicting bindings block tracker writes rather than selecting a new tracker.

Ordinary coding, research and advice do not require an issue, feature folder,
spec, report, or orchestration. Use only the skills relevant to the request.
Read-only work returns the answer or requested artifact without tracker writes.
An issue link supplies context, not permission to publish. Respect existing
authorization; commit/push follow repository/user instructions. Merge and
destructive cleanup need explicit authorization. Agents never set Done.

For authorized tracker work, the caller owns one meaningful checkpoint through
the installed update-issue skill. Workers return evidence to the caller;
do not duplicate comments. Before writing read [tracker-write.md](tracker-write.md)
and only the configured tracker adapter. Fetch mutable issues/statuses fresh,
verify writes and reconcile uncertain delivery before retrying.

For explicitly selected workloads read the orchestrate skill and its selected
references. Preserve independent implementation/review, final-SHA receipts,
combined integration verification and human acceptance. No ordinary task is
automatically promoted to a workload. Missing runtime capabilities are blockers
for that operation, not reasons to invent evidence.

Reuse already loaded, unchanged instructions while their contents remain in
context. Reload when changed, truncated or lost; never read every installed
skill or reference on startup. Prefer completion notifications and useful
independent work to polling. Run affected checks and required repository gates.
