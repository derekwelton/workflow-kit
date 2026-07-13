# workflow-kit

Issue-driven feature workflow for all my repos: **one issue, one folder, one
lifecycle**. A Claude Code plugin.

```
idea → issue ⇄ updates → folder → build → present → wrap
```

- Every unit of work gets a **GitHub issue first** (labels `feature/bug/chore/idea`,
  task checklist in the body).
- All artifacts for one unit of work live in **`work/features/<issue#>-<slug>/`**
  (spec/plan/notes committed; scratch/qa/review gitignored ephemera).
- The **GitHub issue stays current** at start, meaningful checkpoints, review
  or decision requests, pauses/blockers, and completion. Comments stand alone;
  they never rely on a local-only HTML file or screenshot.
- **Markdown is canonical for agents; HTML is presentation for me** — anything
  needing my review renders as a self-contained HTML doc in `review/`, with
  the actionable summary and decisions also posted to the issue.
- **Ephemera dies at wrap-up**; spec/plan/notes archive; git history + the
  closed issue are the permanent record.

## Install (per machine)

```
claude plugin marketplace add derekwelton/workflow-kit
claude plugin install workflow-kit@derekwelton
```

## Keep machines and existing projects current

Update the plugin once on each computer:

```powershell
claude plugin marketplace update derekwelton
claude plugin update workflow-kit@derekwelton
```

Start a new Claude session so the refreshed skills load. Then, inside each
already-adopted project, run:

```
/workflow-kit:workflow-update
```

Use `/workflow-kit:workflow-update --check` to report drift without editing.
The machine update refreshes the executable skills for every project on that
computer; the per-project command refreshes the committed
`feature-lifecycle.md` used by Codex, Gemini, Cursor, and other agents. It
preserves repo-specific frontmatter and additions below the managed marker.

## Adopt in a repo (existing or brand-new)

Tell the agent in that repo:

```
Fetch BOOTSTRAP.md from derekwelton/workflow-kit with gh and follow it.
```

`BOOTSTRAP.md` validates/install-or-updates the plugin on the machine, runs
the repo initialization or managed refresh (even in a session where the
skills aren't loaded yet), verifies the CLAUDE.md/AGENTS.md entrypoints, and
cleans up after itself. It lives only in this repo — don't keep copies in
projects.

## Commands

Lifecycle (the container of work):

| Command | Purpose |
|---|---|
| `/workflow-kit:workflow-init` | One-time repo bootstrap (scaffold, gitignore, labels, lifecycle doc, AGENTS.md pointer) |
| `/workflow-kit:workflow-update [--check]` | Refresh an adopted repo from the installed plugin without overwriting repo-specific configuration |
| `/workflow-kit:new-feature <slug>` | File issue + create feature folder with stub spec/notes |
| `/workflow-kit:update-issue` | Keep the issue current at starts, checkpoints, decisions, pauses, and completion |
| `/workflow-kit:present [topic]` | Generate a self-contained HTML review doc from feature state |
| `/workflow-kit:wrap-feature <issue#>` | Verify shipped → close issue → delete ephemera → archive folder → prune git |
| `/workflow-kit:work-audit` | Propose cleanup of stale work (never deletes without approval) |

Craft (inside the build; adapted from [mattpocock/skills](https://github.com/mattpocock/skills), MIT — see `UPSTREAM.md`):

| Command | Purpose |
|---|---|
| `/workflow-kit:grilling` | Relentless interview in bulk-question rounds, recommended answers, until shared understanding |
| `/workflow-kit:research` | Background agent → primary-source findings in the folder's `research/` |
| `/workflow-kit:prototype` | Throwaway code that answers a design question (logic or UI branch) |
| `/workflow-kit:to-spec` | Crystallize the conversation into the folder's `spec.md` (no interview) |
| `/workflow-kit:to-tickets` | Escalate a big feature into tracer-bullet vertical-slice sub-issues with blocking edges |
| `/workflow-kit:implement` | Build one ticket/spec per fresh session — ponytail + TDD at pre-agreed seams, review, commit |
| `/workflow-kit:ponytail [lite\|full\|ultra]` | Persistent lazy-senior-dev mode: the laziest solution that works (auto-active on coding) |
| `/workflow-kit:tdd` | Test-first reference: seams, red–green tracer bullets, anti-patterns |
| `/workflow-kit:code-review` | Two-axis review (Standards + smell baseline / Spec fidelity) in parallel subagents |
| `/workflow-kit:codebase-design` | Deep-module vocabulary: module, interface, seam, depth, leverage, locality |
| `/workflow-kit:domain-modeling` | Maintain the domain glossary + sparing ADRs as decisions crystallize |
| `/workflow-kit:improve-codebase-architecture` | Scan for deepening opportunities → visual HTML report → grill through one |
| `/workflow-kit:handoff` | Committed session-handoff doc the next session (or other machine) resumes from |
| `/workflow-kit:wayfinder` | Chart a foggy epic as a map issue + decision-ticket sub-issues; resolve one per session |
| `/workflow-kit:ponytail-audit` | Repo-wide over-engineering scan: ranked delete/stdlib/native/yagni/shrink list |

Anti-over-engineering skills adapted from [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) (MIT — see `UPSTREAM.md`).

**See [`CHEATSHEET.md`](CHEATSHEET.md)** for the full map: every skill, how they
interact, when they auto-load vs. need a slash command, and ordered
walkthroughs from tiny bug to foggy epic.

## Layout

- `skills/` — the twenty-two skills above
- `templates/feature-lifecycle.md` — per-repo convention doc stamped by `workflow-init`
  (config frontmatter: `workDir`, `docsHome`, `labels`, `glossary`, `adrDir`; body carries
  the skills catalog so non-Claude agents learn the system from the repo itself)
- `templates/review-doc.html` — visual shell for review documents
- `UPSTREAM.md` — provenance of vendored skills

Designed 2026-07-12 in the Ironwood-Website repo; canonical design spec lives
there at `work/features/6-feature-workflow/spec.md`.
