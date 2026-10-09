# Coordinator dispatch template

Fill only the fields relevant to this leased task. The coordinator remains the
single tracker/manifest/integration writer. Write the brief as these labeled
fields, one per line, in plain sentences with normal spacing.

A worker's wall time grows with its steps and its context, so bound both. One
dispatch is one reviewable slice: one feature area, its acceptance items and the
checks that prove them. Split an issue spanning several areas into sequential
dispatches on the same leased worktree and review once after the last slice.

- Task: issue key, goal, acceptance criteria, role (implementation or review).
- Spec: quote the parent and issue sections this slice needs. Name other spec
  files by path for on-demand reads; never ask for the whole parent spec.
- Scope: leased worktree, allowed files, fixed base/head, repository instructions.
- Route: the explicit provider, model, effort and highReason returned by the
  model-routing resolver. Workers never change their own route.
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
  yourself; the coordinator divides them between reviewers only when the user
  explicitly asked for separate axis reviewers in this run.
- Waiting: blocking `sleep` is forbidden. Use host completion notifications;
  return blockers and stable job IDs rather than repeatedly polling.
- Evidence: focused verification, exact tested head, changed/untracked files,
  requested/resolved model (null when unverified), effort and worker identity.
  Request screenshots, theme or viewport captures, measurements or browser suites
  only for the acceptance item that needs them, and name that item. Run each
  gate once in the foreground and report its result line (command, pass/fail,
  counts, failing tests, log path); open the full log only to diagnose a
  failure. Write captures and logs under the run's evidence directory,
  `<git-common-dir>/workflow-kit/runs/<run-slug>/`.
- Return completed reviews/limit, failed attempts separately, and any required prerequisites as
  `{name, status, remedy}` entries. Unknown runtime or user-task prerequisites
  must stay visible; passing isolated tests is not a ready claim for them.
  Findings include stable id, severity, category, blocking flag, and evidence;
  acceptance/correctness/security/data-loss blockers cannot be deferred just
  because their severity is medium. The coordinator owns approval references.
- Return the workload envelope. Do not mutate tracker status, create/merge PRs,
  assemble integration, or approve your own implementation.
