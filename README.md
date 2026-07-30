# workflow-kit

Issue-driven feature workflow for all my repos: **one issue, one folder, one
lifecycle**. A Claude Code plugin with portable Codex orchestration skills.

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

### Optional: Linear mode

Set `linearTeam: <KEY>` in a repo's `feature-lifecycle.md` frontmatter and
**Linear becomes the control plane** — status, priority, triage, planning —
while GitHub stays the execution surface (branches, PRs, diffs). Two things
change that GitHub alone can't do:

- **`Code Review` and `In Review` are distinct.** An implementation agent moves
  finished code from `In Progress` to `Code Review`. A separate review agent
  reviews the final issue SHA. Standalone issues then move to `In Review`; a
  workload issue stays in `Code Review` until every included issue is reviewed,
  the current-main integration branch passes its combined gate, and one
  umbrella PR is ready for the human. Agents never mark their own work `Done`.
- **Specs and plans live in the issue**, not the repo: the body carries goal,
  scope, acceptance criteria, and a tickable `## Tasks` checklist; comments
  carry the reasoning and the running timeline. No `spec.md`/`plan.md`/
  `notes.md`, and usually no feature folder at all. `research/`, `scratch/`,
  `qa/`, and `review/` stay on disk where they belong.

**Without the key, nothing changes** — every skill behaves exactly as it does
today. Linear mode is opt-in per repo, `workflow-init` asks once, and
`workflow-update` never touches the setting.

The contract (including the sync-thread rule that decides whether a comment
reaches GitHub at all) is stamped into the repo's lifecycle doc in logical tool
names, so Codex and Claude follow the same instructions. Full version:
[`skills/linear-mode/SKILL.md`](skills/linear-mode/SKILL.md).

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
If the machine also uses Codex, refresh the three durable Codex entry points:

```powershell
node "$HOME/.claude/plugins/marketplaces/derekwelton/scripts/install-codex-skills.mjs"
```

That exposes `$orchestrate-queue`, `$integrate-reviewed`, and
`$workflow-doctor` without relying on deprecated custom prompts.

### Why there are machine and repository steps

Claude and every other agent learn this workflow through **different
mechanisms**, and updating one does nothing for the other:

| | Claude Code | Codex | Gemini / Cursor |
|---|---|---|---|
| Reads | plugin `SKILL.md` files | three linked user skills + `AGENTS.md` lifecycle | `AGENTS.md` lifecycle |
| Lives | `~/.claude/plugins/` | `~/.agents/skills/` links plus committed repo policy | committed repo policy |
| Refreshed by | plugin update + new session | link installer + new session; repo refresh for policy | repo refresh, then commit |

The orchestration engine, provider pairing, resumable manifest, integration
gate, and diagnostics are portable machine skills. Repository-specific status
names, branch conventions, and test commands remain committed in the repo's
lifecycle document so every agent sees the same local policy.

Full sequence after a new release:

1. **Per machine, once** — update the Claude marketplace/plugin, run the Codex
   skill-link installer, then start new Claude/Codex sessions.
2. **Per repo, once** — run `/workflow-kit:workflow-update`, review the diff,
   and **commit it** so all agents receive the repository contract.

Step 2 is the one that's easy to skip, and it's the only one that helps
non-Claude agents. An uncommitted refresh has updated nothing for them.
`new-feature` flags the mismatch in one line when it notices a repo running an
older managed block than the installed plugin.

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
| `/workflow-kit:plan` | Bulk dump of work → deduped, classified, prioritized issues in one approval-gated pass |
| `/workflow-kit:orchestrate --name <name> ...` | Freeze and run a bounded issue workload through isolated implementation, opposite-provider review, one integration branch, combined verification, umbrella PR, then batch `In Review` |
| `/workflow-kit:integrate-reviewed --run <id> --mode <merged\|local-main>` | After explicit human acceptance, refresh and merge only the named workload; retest/re-review on drift |
| `/workflow-kit:workflow-doctor` | Read-only health check for lifecycle drift, Linear/GitHub sync, workload manifests, Codex jobs, plugins, permissions, and worktrees |
| `/workflow-kit:new-feature <slug>` | File issue + create feature folder with stub spec/notes |
| `/workflow-kit:update-issue` | Keep the issue current at starts, checkpoints, decisions, pauses, and completion |
| `/workflow-kit:present [topic]` | Generate a self-contained HTML review doc from feature state |
| `/workflow-kit:wrap-feature <issue#>` | Verify shipped → close issue (or preserve Linear's `In Review`/`Done` boundary) → delete ephemera → archive folder → prune git |
| `/workflow-kit:work-audit` | Propose cleanup of stale work in the repo (never deletes without approval) |
| `/workflow-kit:board [audit]` | "What should I work on?" — awaiting-you, awaiting AI code review, available, in-flight, recently shipped. `audit` adds the stale-work sweep |

Craft (inside the build; adapted from [mattpocock/skills](https://github.com/mattpocock/skills), MIT — see `UPSTREAM.md`):

| Command | Purpose |
|---|---|
| `/workflow-kit:grilling` | Relentless interview in bulk-question rounds, recommended answers, until shared understanding |
| `/workflow-kit:research` | Background agent → primary-source findings in the folder's `research/` |
| `/workflow-kit:prototype` | Throwaway code that answers a design question (logic or UI branch) |
| `/workflow-kit:to-spec` | Crystallize the conversation into the folder's `spec.md`, or the issue body + spec comment under Linear mode (no interview) |
| `/workflow-kit:to-tickets` | Escalate a big feature into tracer-bullet vertical-slice sub-issues with blocking edges |
| `/workflow-kit:implement` | Build one ticket/spec per fresh session — ponytail + TDD; default mode reviews/commits, Linear mode commits and hands off at `Code Review` |
| `/workflow-kit:ponytail [lite\|full\|ultra]` | Persistent lazy-senior-dev mode: the laziest solution that works (auto-active on coding) |
| `/workflow-kit:tdd` | Test-first reference: seams, red–green tracer bullets, anti-patterns |
| `/workflow-kit:code-review [queue]` | Independent Standards + Spec review; standalone work advances to `In Review`, while workload work records a final-SHA receipt and waits for integration |
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

- `skills/` — twenty-eight skill packages, including the portable workload
  orchestrator, integration finisher, and workflow doctor
- `scripts/workload-manifest.mjs` — deterministic, worktree-shared workload state
- `scripts/install-codex-skills.mjs` — idempotent Codex user-skill links
- `skills/linear-mode/SKILL.md` — the Linear-mode contract every skill defers to
  (gating, sync-thread rule, status contract, templates). Not a skill; a shared reference.
- `templates/feature-lifecycle.md` — per-repo convention doc stamped by `workflow-init`
  (config frontmatter: `workDir`, `docsHome`, `labels`, `glossary`, `adrDir`, optional
  `linearTeam`; body carries the skills catalog so non-Claude agents learn the system
  from the repo itself)
- `templates/report-checkin.html` — `board`'s check-in (awaiting-you first, AI review queue second, history last)
- `templates/report-audit.html` — ranked proposals awaiting one approval (`board audit`, `work-audit`, `ponytail-audit`)
- `templates/report-findings.html` — evidence-and-confidence findings, optional two axes (`code-review`, `research`, `plan`)
- `templates/review-doc.html` — the general visual shell (screenshot grid, comparison columns)

  All four share one design system and are responsive, light-mode, and print-clean.
- `UPSTREAM.md` — provenance of vendored skills

Designed 2026-07-12 in the Ironwood-Website repo; canonical design spec lives
there at `work/features/6-feature-workflow/spec.md`.
