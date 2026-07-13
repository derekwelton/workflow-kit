---
name: handoff
description: "Compact the current conversation into a handoff document in the feature folder so a fresh agent — on this machine or the other one — can pick up the work. Argument: what the next session will be used for."
disable-model-invocation: true
---

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
- If the user passed arguments, treat them as a description of what the next
  session will focus on and tailor the doc accordingly.
- Delete superseded handoff files when writing a new one — one live handoff
  per feature. (All of them die at wrap anyway.)

After committing the handoff, apply `update-issue` with a **Paused** or
**Blocked** comment: current state, completed checkpoint, blocker/unfinished
work, and exact resumption step. Link the handoff only if it has been pushed
and is reachable on GitHub; otherwise label its path local-only and keep the
comment sufficient for the next human to understand the pause.
