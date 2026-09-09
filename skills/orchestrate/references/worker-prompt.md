# Coordinator dispatch template

Fill only the fields relevant to this leased task. The coordinator remains the
single tracker/manifest/integration writer.

- Task: issue key, goal, acceptance criteria, role (implementation or review).
- Scope: leased worktree, allowed files, fixed base/head, repository instructions.
- Route: explicit provider, model, effort, and high reason only when justified.
  Follow workflow-kit's `model-routing` (the same canonical policy synced to
  `codex:model-routing`). Never use Sonnet/Haiku or xhigh/max/ultra effort.
- Review: round number/limit, adjudication rule, Standards and Spec axes.
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
- Return the workload envelope. Do not mutate tracker status, create/merge PRs,
  assemble integration, or approve your own implementation.
