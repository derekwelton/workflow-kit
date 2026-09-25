# Coordinator dispatch template

Fill only the fields relevant to this leased task. The coordinator remains the
single tracker/manifest/integration writer.

- Task: issue key, goal, acceptance criteria, role (implementation or review).
- Scope: leased worktree, allowed files, fixed base/head, repository instructions.
- Route: explicit provider, model, effort, and high reason only when justified.
  Follow workflow-kit's `model-routing` (the same canonical policy synced to
  workflow-kit's model-routing reference). Never use Sonnet/Haiku, retired Opus 5,
  or xhigh/max/ultra effort. Luna may take any allowed effort; Opus 5.5 never runs low.
- Review: dispatch/attempt IDs, completed-review budget, saved scoped authorization,
  adjudication rule, Standards and Spec axes. Supply existing fixes/affected behavior
  for verification; never omit the user's authorization record from the prompt.
  Return findings with severity and evidence; do not create follow-up issues.
- Editing: use Edit/Write or structured `apply_patch` for source edits. Bash or
  PowerShell is for build, test, Git, and read-only inspection. No heredoc or
  inline-Python source patching. On `unexpected EOF while looking for matching`,
  stop retrying shell edits and switch to the structured editing tool.
- Delegation: do not spawn subagents. Only the coordinator spawns. If another
  worker is needed, return that request with your evidence. Review both axes
  yourself unless the coordinator explicitly divided them between peers.
- Waiting: blocking `sleep` is forbidden. Use host completion notifications;
  return blockers and stable job IDs rather than repeatedly polling.
- Evidence: focused verification, exact tested head, changed/untracked files,
  requested/resolved model (null when unverified), effort and worker identity.
- Return completed reviews/limit, failed attempts separately, and any required prerequisites as
  `{name, status, remedy}` entries. Unknown runtime or user-task prerequisites
  must stay visible; passing isolated tests is not a ready claim for them.
  Findings include stable id, severity, category, blocking flag, and evidence;
  acceptance/correctness/security/data-loss blockers cannot be deferred just
  because their severity is medium. The coordinator owns approval references.
- Return the workload envelope. Do not mutate tracker status, create/merge PRs,
  assemble integration, or approve your own implementation.
