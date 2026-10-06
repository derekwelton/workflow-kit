# T3 Code delegation

Read only when model-routing selects the T3 transport. Policy, fallback and
receipt rules stay in `./model-routing.md`; this file replaces CLI launch
mechanics, never review independence, round limits or human acceptance.

## Availability

Call `orchestrator_capabilities` before routing. A provider instance with
`canRunChildTask: true` lists the models this host can launch; its
`constraints` are the availability evidence. Record a disabled or missing
executable as `cli-not-installed` and missing authentication as
`credentials-unavailable`. The catalog proves configuration, not quota: a
launch that fails on quota or model access is `review-models-unavailable`
evidence. The catalog also offers ultra, efforts beyond each model's routed range
and retired models; model-routing still refuses them. If `delegate_task` reports that no T3 parent
run is active, record that and use `./cli-delegation.md` for this launch.

## Launch

Use `delegate_task` for every routed worker. A native same-provider subagent is
acceptable only when it can pin both the routed model and effort. Set:

- `target`: the exact `providerInstanceId`, model ID and `options` pinning effort
  (`reasoningEffort` for Codex, `effort` for Claude). Never inherit effort or
  accept a catalog default; Opus 5.5 defaults to medium there.
- `role` (`implementation`, `review`, `research`, `design`, `test`) and a `title`
  naming the issue, role and round.
- `mode: "async"`. Do coordinator work or end the turn; the child's completion
  wakes this thread. Use `wait` only when the next step needs the result.
- `clientRequestId`: unique per launch attempt or review round, reused verbatim
  when retrying that same attempt after a lost response.
- Leave `runtimeMode` inherited; never raise it above the coordinator's mode.

The task prompt is the whole context; no parent history is copied. Children run
in the coordinator's checkout: give the absolute leased worktree path and require
every command and edit there. A sandbox denial there is reported; the coordinator
may relaunch that worker through `./cli-delegation.md`, which pins `-C`.

Review: fill `./codex-adversarial-review.md` exactly as for the CLI and require
the final message to be only JSON matching `./codex-review-output.schema.json`.
T3 has no read-only sandbox or schema enforcement, so the brief states that the
reviewer makes no edits, and the coordinator validates the returned JSON.

Implementation fixes: T3 has no task follow-up API. Launch a new
`delegate_task` with the original brief, prior result, findings to address and
current head, recorded as a new attempt of the same implementation. Never send
review rounds or fixes through `t3_thread_send` on a child thread.

## Completion and recovery

Record `taskId`, `childThreadId`, `providerInstanceId`, returned `model`
(resolved identity; null stays unknown), effort and attempt in the manifest
resumeContext or a standalone run.json, and save the result summary beside them.
After a restart or lost notification, reconcile with one `task_status` per
owned task. Never relaunch while it is queued, running, waiting or has pending
child runs. A `wait` timeout does not cancel the child. Cancel only owned tasks
with `task_cancel`, then confirm a terminal status before replacing a writer.

Accept review only when the task completed, the summary is schema-valid JSON
with matching full base/head and a supported verdict, and the reviewed worktree
and HEAD are unchanged. Receipt: `<reviewer-provider>:<full-head-sha>:<taskId>`
with provider `codex` or `claude` from the instance's `driverKind`. Findings
stay subject to coordinator adjudication; schema validity is not approval.

A failed review may be reissued once as a new attempt within an available review
round (or the standalone retry allowance). Before retrying implementation,
confirm the old task is terminal, inspect partial tracked/untracked edits and
issue a reconciled brief. Never launch a duplicate writer. If ownership or
termination cannot be established, preserve the worktree and report the blocker.
