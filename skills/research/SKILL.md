---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a committed Markdown file in the feature folder. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---

Spin up a **background agent** to do the research, so you keep working while it
reads.

Its job:

1. Investigate the question against **primary sources** — official docs,
   source code, specs, first-party APIs — not a secondary write-up of them.
   Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it to the current feature folder as
   `<workDir>/features/<issue#>-<slug>/research/<topic>.md` (create the
   `research/` directory on first use — it's committed text, so findings
   travel between machines and sessions). If no feature folder exists yet for
   this work, that's the signal to file the issue first (`new-feature`), not
   to save the file somewhere loose. Research is the main reason a feature
   folder gets created — create the folder here if the issue exists but the
   folder doesn't.

When the findings resolve a decision, record the decision in `spec.md` /
`notes.md` and let the research file carry the evidence. Under Linear mode
(`../linear-mode/SKILL.md`) those files don't exist: the decision goes
into the issue — the body if it changes scope or acceptance criteria, a sync-
thread comment if it's reasoning — while `research/` stays on disk exactly as
described above. Do not paste research dumps into the issue.

When the findings are long or the user will read them directly, render them
with `present` using `templates/report-findings.html` — it carries the
per-claim evidence and confidence markers this skill's output depends on. The
committed Markdown in `research/` stays canonical either way.

When research finishes, apply `update-issue` to the originating issue with a
checkpoint summary, the answer, confidence/limitations, and a permalink to
the findings only when the file is committed and pushed. If the findings need
a user decision, make it a **Needs decision** comment with the recommendation
and exact next action; never leave the ask only in the research file or chat.
