# Direct CLI migration and retirement

Workflow-kit 1.1.0 owns direct Codex execution through codex-cli. The official
Codex CLI remains installed where used; the codex-kit plugin is no longer a
runtime dependency. Prefer the other provider for review. If its CLI or authorized
reviewers are unavailable, record evidence and use a fresh same-provider session.
Claude review uses Opus 5 high, then Fable medium/low, then Codex if neither has
usable credentials/quota/model access. Unknown availability and transient
execution failures do not authorize substitution.

## Pilot before retirement

Use an isolated project/home; keep live global settings unchanged. Record the
CLI and host versions, exact worktree/base/head, requested and resolved identity
(unknown if unobservable), effort, sandbox, background task ID, thread ID,
receipt, artifact paths, exit status, wall time and coordinator tool-call count.
Forwarder agent launches and tokens must be zero.

- Run a real committed-diff workload review with the shipped schema and prompt.
  Validate JSON, base/head binding, durable receipt and unchanged reviewed files.
- Run an implementation and a fix via its exact thread ID. Verify effective cwd
  and workspace-write sandbox on both initial and resumed runs. Coordinator
  commits and runs sandbox-denied tests. Shared Git-directory write access is
  unnecessary; do not broaden permissions just to enable worker commits.
- Exercise a review lasting more than ten minutes through Claude background
  completion notification, without routine polling.
- Exercise cancellation and verify no child writer survives; simulate lost
  notification/coordinator restart and reconcile the recorded task/artifacts.
- Exercise partial implementation failure: preserve edits, verify termination,
  then resume without a duplicate writer. Failed reviews still consume rounds.
- Exercise missing Codex and missing Claude routes, keeping fresh session IDs
  and recorded fallback evidence. Unknown availability remains unverified.
- Run package generation/check, package validation and the test suite.

## Consumer cutover

After the pilot passes, update IRP first, then each explicitly selected consumer.
Save the previous workflow-kit version and exact existing routing block for rollback.
Install the updated selected skills using that project's established installer.
Replace only the old codex-kit managed routing block with:

> Claude-to-Codex: follow codex-cli. Prefer the other provider for review;
> follow model-routing's Opus high, Fable medium/low, then Codex availability fallback.

Preserve custom instructions, tracker/status mappings, active job artifacts and
receipts. Verify the new instructions in a fresh host session before proceeding
to the next consumer. A package build does not prove consumer cutover.

Only after all selected consumers pass and active companion jobs finish, uninstall
`codex@derekwelton-codex` under the owner's authorization. Update the companion
README with a pointer to workflow-kit and issue #12, then archive the repository.
Do not uninstall the official Codex CLI. Do not archive on a partial pilot.

Rollback restores the compatible workflow-kit version, saved routing blocks and
the codex-kit plugin version, then verifies a fresh session. Reinstallation alone
does not restore routing. Keep the old versions available until cutover is accepted.
