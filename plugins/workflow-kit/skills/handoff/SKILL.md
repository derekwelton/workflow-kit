---
name: handoff
description: "Compact the current conversation into a handoff document in the feature folder so a fresh agent — on this machine or the other one — can pick up the work. Argument: what the next session will be used for."
---

Resolve this skill's real filesystem path before following relative references.
The package root is two directories above this SKILL.md; retain its sibling
skills, scripts, and templates together.


Read the repository lifecycle and local overrides first. When `tracker: github-projects`
or a local GitHub Projects contract is present, read `../github-projects/SKILL.md`;
its field/status/label rules override the GitHub/Linear defaults below.


Write a handoff document summarising the current conversation so a fresh agent
can continue the work.

Save it to the current feature folder as
`<workDir>/features/<issue#>-<slug>/handoff-<YYYY-MM-DD>.md` — **committed**,
so it syncs between machines via git (commit it; push only if the repo's
conventions allow). If the work has no feature folder, file the issue first
(`new-feature`) rather than saving somewhere loose.

Rules:

- Include a **"Suggested skills"** section naming the skills the next agent
  should invoke (e.g. "resume with `implement` on ticket #12; run
  `code-review` before wrap").
- Do **not** duplicate content already captured in other artifacts — the spec,
  plan, notes, ADRs, issues, commits, diffs. Reference them by path or URL.
  The handoff carries only what exists nowhere else: conversation state,
  in-flight reasoning, next-step intent.
- **Redact sensitive information** — API keys, passwords, PII.
- For workloads, reference saved policy/decisions, actual branch/worktree,
  reviewed/tested head, worker/job IDs, and the exact next action. Include owned
  runtime/process identity and prerequisites when relevant. On resume reconcile
  actual state; preserve dirty/active worktrees and do not stop a process on PID
  alone. Keep narrative on the canonical surface; local snapshots are derived.
- If the user passed arguments, treat them as a description of what the next
  session will focus on and tailor the doc accordingly.
- Delete superseded handoff files when writing a new one — one live handoff
  per feature. (All of them die at wrap anyway.)

After committing the handoff, apply `update-issue` with a **Paused** or
**Blocked** comment: current state, completed checkpoint, blocker/unfinished
work, and exact resumption step. Link the handoff only if it has been pushed
and is reachable on GitHub; otherwise label its path local-only and keep the
comment sufficient for the next human to understand the pause.

## Linear mode

When the lifecycle doc's frontmatter carries `linearTeam`
(`../linear-mode/SKILL.md`), **the handoff is a comment, not a file.**

Write the same document — same rules on suggested skills, no duplication, and
redaction — as a comment on the sync thread (linear-mode §3), headed
`## Handoff — <YYYY-MM-DD>`. That way the next session reads it from either
side, on any machine, without a pull, and it can't go stale in a folder nobody
opens.

Keep a committed `handoff-<date>.md` **only** when the handoff needs attached
artifacts that don't belong in an issue body — a large dump, a log, evidence
files. Then the comment carries the narrative and points at the folder path,
labelled local-only unless it's pushed.

Leave the status where it is: a pause isn't a transition. Say in the comment
that work is paused and what unblocks it.

The one-live-handoff rule still holds — but comments are an immutable timeline,
so don't try to delete superseded ones. The newest comment wins; say so
explicitly if an earlier handoff comment is now stale.
