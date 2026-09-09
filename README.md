# workflow-kit

Issue-driven feature workflow for all my repos: **one issue, one folder, one
lifecycle**. A native Claude Code and Codex plugin with one shared skill catalog.

For a visual overview of what the kit provides and where it could be simpler,
open [the HTML field guide](docs/workflow-kit-guide.html)
([Markdown companion](docs/workflow-kit-guide.md)).

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

## Install and refresh

Claude Code:

```powershell
claude plugin marketplace add derekwelton/workflow-kit
claude plugin install workflow-kit@derekwelton
```

Codex CLI 0.153.0 or newer (after this release is published):

```powershell
codex plugin marketplace add derekwelton/workflow-kit
codex plugin add workflow-kit@derekwelton-workflow
```

For an unpublished local checkout, pass its absolute path to `codex plugin
marketplace add` instead. The native package exposes the full skill catalog.
Claude uses `/workflow-kit:<name>`; Codex uses `$<skill-name>` (or its surfaced
plugin namespace). Orchestration retains `$orchestrate-queue`.

For hosts without native plugin support, keep a complete workflow-kit checkout
and run `node scripts/install-codex-skills.mjs` from it. This exposes the full
catalog through user-skill links without requiring Claude. `--check --json`
reports missing/conflicting links without changing them. Do not combine native
installation and fallback links in the same skill catalog; diagnose duplicate
names before removing only the links you own. Keep the linked source checkout
in place: scripts, templates, and sibling references are package dependencies.

Update Claude with `claude plugin marketplace update derekwelton` followed by
`claude plugin update workflow-kit@derekwelton`. For Codex, inspect
`codex plugin marketplace upgrade --help`, upgrade the configured marketplace,
and reinstall the plugin using `codex plugin add workflow-kit@derekwelton-workflow`.
Refresh fallback links by rerunning their installer after updating the checkout.
Restart sessions to load refreshed plugin instructions.

Then run `workflow-update` in each adopted repository (`--check` for a read-only
preview). It preserves configuration and local overrides. Local agents can read
uncommitted policy edits; already-loaded sessions may need a reread or restart.
Commit/push distribute repository changes to other machines. Each machine also
needs its own plugin update. Neither step substitutes for the other.

## Routing and tracker configuration

`skills/model-routing/SKILL.md` and `scripts/lib/model-policy.mjs` own model
selection. Coding defaults to Astra low (medium when needed), simple tasks to
Terra low/medium, and review to medium. Fable 5.1 can delegate coding and UI work
to Astra. High requires a reason tied to orchestration or intense reasoning.
Xhigh, max, and ultra are prohibited. Model access is checked independently of
public availability; no silent fallbacks or inherited machine defaults.

Codex-kit 2.3.0 consumes a generated policy copy. After changing policy, run
`node scripts/sync-codex-policy.mjs <codex-kit-root>` and validate with `--check`.
Release both packages together. Runtime adapters belong to codex-kit; lifecycle
and provider independence belong here.

Ordinary GitHub Issues remains the default; `linearTeam` still enables Linear.
For GitHub Projects opt in with `tracker: github-projects`; see
`skills/github-projects/SKILL.md` for configuration and verified field/status
mapping. Local repository overrides always take precedence. Refresh never
silently changes trackers, adds statuses, or rewrites branch conventions.

## Validation

```powershell
node scripts/build-codex-package.mjs --check
node scripts/validate-package.mjs
node --test test/*.test.mjs
node scripts/sync-codex-policy.mjs ../codex-kit --check
```

Schema 3 records worker model/effort/session provenance. Older schema 2 manifests
remain readable. Preview `node scripts/workload-manifest.mjs migrate --run <id>
--dry-run` before applying migration; historical execution data remains unknown.

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

- `skills/` — the complete portable skill catalog, including the portable workload
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

Native Codex files in `plugins/workflow-kit/` are generated. Edit root skills,
templates, or scripts, then run `node scripts/build-codex-package.mjs`.

Run `python scripts/test-codex-install.py` to verify actual Codex CLI installation
and packaged script execution in an isolated temporary home, without model calls.
