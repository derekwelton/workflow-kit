# Direct CLI validation — September 13, 2026

Package: workflow-kit 1.1.0. Windows: Codex CLI 0.154.0, Claude Code 2.1.270.
Tests used isolated temporary repositories and committed snapshots; the working
repository was not committed/pushed. Global plugin/model settings were unchanged.
Consumer cutover (IRP is on another machine) is outside this session.

## Verified

| Check | Result |
|---|---|
| Package generation/check and validation | Valid; 31 skills |
| Node suite | 73 passed, 1 Windows file-symlink capability skip |
| Terra low implementation, workspace-write | Passed; 22.06 seconds |
| Exact-thread fix resume, workspace-write | Passed; 19.92 seconds; same thread ID |
| Resume into a linked worktree using exec -C/-s before resume | Passed; 20.87 seconds; only linked-worktree file changed |
| Astra medium read-only review, ephemeral/schema/result | Passed; 36.32 seconds; approve, matching base/head, clean worktree |
| Seeded incorrect implementation review | Passed; 42.90 seconds; needs-attention with typed blocking/category/axis finding |
| Interrupted partial implementation | Six owned processes verified stopped; phase-one edit retained; same thread resumed and appended phase-two once |
| Opus 5 high independent snapshot review | Ran successfully; receipt and evidence findings addressed; this is not a release/merge approval |

Implementation/fix thread: `01a09cb8-f86b-7093-a75e-2850165d50f3`.
Recovery thread: `01a09ccd-8113-7140-9f49-00eb59496bd3` (resumed in 18.42 seconds).
Positive review receipt:
`codex:cd6140af22d53869205a05988316eb3e696550ab:01a09cbb-23dd-75d0-af19-90b727f9a71f`.
Negative review receipt:
`codex:69f9620410d2ac9f85d2052a8010e076f3c39f10:01a09cbd-8c88-7620-aac1-d9f9c8772aa2`.

Each direct implementation/review pass used one coordinator process launch and
zero forwarder agents/tokens. Prompts, JSONL, stderr, final results, process
identities and timings are retained under the local temporary directory
`workflow-kit-issue12-pilot`. Resolved Codex identity was not independently exposed;
requested models/efforts are recorded above. Claude reported Opus 5 for its review.

## Host limitation

A one-shot `claude -p` coordinator launched the delayed review via one background
Bash call, then ended its turn and stopped the task before completion. No polling
or forwarder agent occurred. This is a failed completion-ownership test, not a
successful long review. The skill now requires a live coordinator or a host that
demonstrably retains asynchronous tasks and delivers their completion events.

The live interactive completion test passed in 649.42 seconds (610 seconds of
controlled delay plus a real read-only Codex review). Claude session
`269e8076-aedd-4572-8546-17039354676f` launched task `bfsllkzya` once and received
its exit-0 completion notification. It made no TaskOutput calls, state-file
reads, polling loops or forwarder launches. The result passed the shipped JSON
schema and exact base/head checks; the fixture remained clean. This proves the
live-session path, not the failed one-shot coordinator path above.
Companion uninstall/archive remains gated on consumer cutover; see
[migration](codex-cli-migration.md).
