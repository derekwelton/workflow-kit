---
name: codex-cli
description: Launch bounded implementation or independent review work directly through Codex CLI, with explicit permissions and durable results. Use when workflow routing selects a Codex CLI worker.
---

Resolve bundled relative file paths from this skill's directory, not the project working directory.

Read `./bundled/templates/model-routing.md` for model/effort and reviewer fallback.
CLI baseline: 0.154.0 on Windows; inspect `codex --version`, `codex exec --help`
and `codex exec resume --help` if flags differ. A newer version alone does not
prove compatibility. Use the authenticated CLI; do not change global settings.

## Launch

The coordinator launches directly, without a forwarder subagent. In Claude Code
use Bash `run_in_background: true` in a live coordinator session and wait for its completion notification;
do useful coordinator work meanwhile. In other hosts use their owned background
process/completion mechanism. A one-shot `claude -p` coordinator can exit after
launch and stop pending tasks; do not use it to own asynchronous workers unless
the host demonstrably keeps it alive and delivers completion events. Missing
completion ownership blocks dispatch. No foreground ten-minute wait or routine polling.
Honor host capacity and delegation restrictions. Check CLI presence first; a
missing CLI or unavailable authorized reviewers permit a fresh same-provider
review with recorded evidence, following model-routing; never self-review.

Create a unique absolute run directory outside the reviewed diff, with separate
files per attempt/round. Write the bounded prompt as a file using structured file
tools. Quote every path; never interpolate issue text into shell code. The Bash
recipes below use stdin, not an inline prompt. Pin `-C`, `-m`, effort, `-s` and
`--json` on every launch/resume; user config may otherwise grant full access.
Pin `-c approval_policy=never` for noninteractive runs; sandbox denial is reported,
never a reason to retry with danger-full-access. Coordinator owns commits, tracker
writes and tests denied by the sandbox; workers never merge or change trackers.

Review: fill `./bundled/templates/codex-adversarial-review.md` with exact full
base/head SHAs, requirements, Standards and Spec axes and the workload's round
policy when attached. Standalone review is one strict pass with at most one
failed-run retry; findings do not authorize an implementation/fix loop.
Resolve the schema from `./bundled/templates/codex-review-output.schema.json`.
Set quoted absolute shell variables `wt`, `model`, `effort`, `schema`, `focus`,
`result`, `events`, `stderr` before launching:

```bash
codex exec -C "$wt" -m "$model" -c "model_reasoning_effort=$effort" \
  -c approval_policy=never -s read-only --ephemeral --json \
  --output-schema "$schema" -o "$result" - < "$focus" > "$events" 2> "$stderr"
```

Implementation: use the authorized file lease, requirements and verification
brief as `brief`; keep session persistence so fixes can resume its thread:

```bash
codex exec -C "$wt" -m "$model" -c "model_reasoning_effort=$effort" \
  -c approval_policy=never -s workspace-write --json \
  -o "$result" - < "$brief" > "$events" 2> "$stderr"
```

Fixes resume only the implementation thread by its exact ID, never `--last`.
Use new output paths per pass. Exec-only flags belong BEFORE `resume`:

```bash
codex exec -C "$wt" -s workspace-write resume "$thread_id" \
  -m "$model" -c "model_reasoning_effort=$effort" -c approval_policy=never \
  --json -o "$result" - < "$brief" > "$events" 2> "$stderr"
```

## Completion and recovery

For workload dispatch, reserve the review round and record paths/worktree/attempt
in the existing manifest's resumeContext. Standalone work needs no workload:
keep the same small launch/completion record in run.json beside its artifacts.
Record background task ID immediately after
launch. After completion read the `thread.started` event by type (not line number),
save its thread_id as workerId, exit status and completed/failed state. Preserve
prompts, stderr, JSONL and final results, especially for ephemeral reviews.
Record requested/resolved model (null when unobservable), effort, sandbox and
policy version. Retain attempt history; these files and the manifest replace a
separate job ledger. A thread ID proves identity, not a successful review.

Accept review only after zero exit, nonempty schema-valid result, matching full
base/head, unchanged reviewed worktree and a supported verdict. Receipt:
`codex:<full-head-sha>:<thread_id>`. Findings remain subject to coordinator
adjudication and convergence gates; never turn schema validity into approval.
Map critical severity to high and preserve blocking categories in manifest findings.
Obtain a fresh ephemeral review after fixes; never resume an implementation as reviewer.

On failure inspect stderr and artifacts. A read-only review may be reissued once
after confirming termination, using a new attempt and an available workload review round
(or the standalone retry allowance);
the retry does not bypass round limits. Before retrying implementation, confirm
the old worker stopped, inspect partial tracked/untracked edits and continue that
thread or issue a reconciled brief. Never launch a duplicate writer.
After a lost notification/session restart or suspected stuck run, allow a bounded
task-status/artifact check to reconcile ownership; no tight wait loops. Cancel only
the owned task (Claude TaskStop where available), then verify child termination
before replacing it. If ownership/termination cannot be established, preserve the
worktree and report the blocker. Never kill a PID based on its number alone.
