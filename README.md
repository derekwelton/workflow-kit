# workflow-kit

Issue-driven feature workflow for all my repos: **one issue, one folder, one
lifecycle**. A Claude Code plugin.

```
idea → issue → folder → build → present → wrap
```

- Every unit of work gets a **GitHub issue first** (labels `feature/bug/chore/idea`,
  task checklist in the body).
- All artifacts for one unit of work live in **`work/features/<issue#>-<slug>/`**
  (spec/plan/notes committed; scratch/qa/review gitignored ephemera).
- **Markdown is canonical for agents; HTML is presentation for me** — anything
  needing my review renders as a self-contained HTML doc in `review/`.
- **Ephemera dies at wrap-up**; spec/plan/notes archive; git history + the
  closed issue are the permanent record.

## Install (per machine)

```
claude plugin marketplace add derekwelton/workflow-kit
claude plugin install workflow-kit@derekwelton
```

## Commands

| Command | Purpose |
|---|---|
| `/workflow-kit:workflow-init` | One-time repo bootstrap (scaffold, gitignore, labels, lifecycle doc) |
| `/workflow-kit:new-feature <slug>` | File issue + create feature folder with stub spec/notes |
| `/workflow-kit:present [topic]` | Generate a self-contained HTML review doc from feature state |
| `/workflow-kit:wrap-feature <issue#>` | Verify shipped → close issue → delete ephemera → archive folder → prune git |
| `/workflow-kit:work-audit` | Propose cleanup of stale work (never deletes without approval) |

## Layout

- `skills/` — the five skills above
- `templates/feature-lifecycle.md` — per-repo convention doc stamped by `workflow-init`
  (config frontmatter: `workDir`, `docsHome`, `labels`)
- `templates/review-doc.html` — visual shell for review documents

Designed 2026-07-12 in the Ironwood-Website repo; canonical design spec lives
there at `work/features/6-feature-workflow/spec.md`.
