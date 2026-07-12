---
workDir: work
docsHome: .ai/workflows
labels: [feature, bug, chore, idea]
---

# Feature Lifecycle

How work is planned, built, presented, and cleaned up in this repo. Applies to
every agent (Claude, Codex, Gemini, Cursor) and every human. Managed by the
`workflow-kit` plugin; this doc is the tool-agnostic contract.

```
idea → issue → folder → build → present → wrap
```

## Rules

1. **Issue first, always.** Every unit of work — feature, bug, chore, even
   exploration — gets a GitHub issue before anything else (labels: `feature` /
   `bug` / `chore` / `idea`). Tasks live as a markdown checklist in the issue
   body. Bugs discovered mid-session are filed immediately.
2. **One folder per unit of work**, created only when artifacts start existing:

   ```
   work/features/<issue#>-<slug>/
     spec.md      what & why (canonical, committed)
     plan.md      how, file-by-file (committed; optional for small work)
     notes.md     running decision log + wrap-up outcomes (committed)
     scratch/     scripts, dumps, logs (text committed)
     qa/          screenshots, evidence (gitignored)
     review/      generated HTML docs for the user (gitignored, ephemeral)
   ```

   A small bug is issue + fix branch only — no folder. Never create work
   artifacts outside a feature folder.
3. **Markdown is canonical, HTML is presentation.** Agents read/write `.md`.
   Anything presented to the user for review or decision is a self-contained
   HTML file in `review/` (openable via `file://`). Decisions a review doc
   produces are written back into `spec.md`/`notes.md`.
4. **Branches/PRs reference the issue**: branch `feat/<issue#>-<slug>`; PR body
   `Refs #<n>` while open-ended, `Closes #<n>` when the merge should close it.
5. **Ephemera dies at wrap.** When work ships: outcomes written to `notes.md`,
   issue closed with a summary, `scratch/`+`qa/`+`review/` deleted, the folder
   moved to `work/features/_archive/`, merged branches and worktrees pruned.
   Git history plus the closed issue are the permanent record.
6. **Nothing rots silently.** Periodic audit proposes cleanup of stale
   folders, mergeable issues, dead branches, old QA sweeps — deletions always
   get human approval first.

## Commands (Claude Code, via the workflow-kit plugin)

`/workflow-kit:new-feature <slug>` · `/workflow-kit:present [topic]` ·
`/workflow-kit:wrap-feature <issue#>` · `/workflow-kit:work-audit` ·
`/workflow-kit:workflow-init` (bootstrap only)

Agents without plugin access follow this document by hand with `gh` + file
operations.
