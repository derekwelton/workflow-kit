---
name: workflow-init
description: One-time repo bootstrap for the workflow-kit feature lifecycle — creates the work/features scaffold, gitignore rules, GitHub labels, and the per-repo feature-lifecycle.md convention doc. Use when adopting the workflow in a new or existing repo.
---

Resolve `<workflow-kit-root>` from this SKILL.md's real filesystem path: two
directories up. Resolve symlinks first. Use that root for templates and scripts
on either host; never assume a Claude environment variable exists in Codex.


Read the repository lifecycle and local overrides first. When `tracker: github-projects`
or a local GitHub Projects contract is present, read `../github-projects/SKILL.md`;
its field/status/label rules override the GitHub/Linear defaults below.


# workflow-init

Bootstrap the current repo for the issue-driven feature workflow. Idempotent:
skip any step whose result already exists, and say so.

## Tracker-aware adoption

Keep an existing GitHub Projects contract. If the user selects Projects, follow
`../github-projects/SKILL.md`, record verified project/field/status mappings in
frontmatter, and skip default classification-label creation below. Never add a
Linear team or project status without an explicit repository configuration choice.

## Prerequisites

- Must be a git repo with a GitHub remote and working `gh` auth (`gh repo view`).
  If not, stop and tell the user what's missing.

## Steps

1. **Detect the agent-docs home** for the lifecycle doc, in priority order:
   `.ai/workflows/` → `docs/` (if it holds agent-facing docs) → repo root.
   If the repo has an agent-instruction entrypoint (`.ai/AGENTS.md`, `AGENTS.md`,
   `CLAUDE.md`), you will add a pointer there in step 5.

2. **Scaffold**: create `work/features/` and `work/features/_archive/` with a
   `.gitkeep` in each if empty.

3. **Gitignore**: append this block to `.gitignore` if the marker line is absent:

   ```gitignore
   # workflow-kit: ephemera under work/ stays out of history
   work/**/*.png
   work/**/*.jpg
   work/**/*.jpeg
   work/**/*.webp
   work/**/*.gif
   work/**/*.mp4
   work/**/*.pdf
   work/**/*.zip
   work/**/*.log
   work/**/node_modules/
   work/features/*/review/
   ```

   If the repo intentionally commits some of these under `work/` already, ask
   before appending.

4. **Labels**: ensure `feature`, `bug`, `chore`, `idea` exist
   (`gh label create <name> --color <hex> --description <text>`; ignore
   "already exists" errors). Colors: feature `1d76db`, bug `d73a4a`,
   chore `c5def5`, idea `fbca04`.

5. **Lifecycle doc**: copy `<workflow-kit-root>/templates/feature-lifecycle.md`
   to the docs home chosen in step 1, filling in the config frontmatter
   (`workDir`, `docsHome`, `labels`, `glossary`, `adrDir`, and optionally
   `linearTeam` — see step 5a) for this repo —
   keep the template's full versioned managed block, including the
   skills-catalog tables and managed markers. Repo-specific additions belong
   below the managed-end marker so `workflow-update` can preserve them. The
   document exists so agents that cannot see this plugin (Codex, Gemini,
   Cursor) still follow the convention. Do NOT create the glossary or ADR dir
   now — they're created lazily by `domain-modeling` when the first
   term/decision lands.

5a. **Linear mode (optional)**: ask the user, in one line, whether this repo is
   backed by a Linear team — offering the default of no. If they name one, set
   `linearTeam: <key>` in the frontmatter; otherwise leave the commented-out
   line as the template ships it. Do not probe Linear or infer a team from a
   connected MCP server: absence is the default, and it means the repo behaves
   exactly as an unbound repo always has.

   If they do bind a team, tell them the GitHub↔Linear sync integration must be
   enabled for this repo on the Linear side — the whole contract (the sync
   comment thread, the twin issues) depends on it. See the plugin's
   `skills/linear-mode/SKILL.md` for the full contract; the managed block
   you just stamped carries the repo-facing version.

6. **Agent-entrypoint pointer**: add a short section to the repo's
   agent-instruction entrypoint (`.ai/AGENTS.md` → `AGENTS.md` → `CLAUDE.md`,
   whichever exists — edit, never create a competing one) so every agent
   discovers the lifecycle:

   ```markdown
   ## Feature workflow

   All feature/bug/chore work follows the issue-driven lifecycle in
   <docsHome>/feature-lifecycle.md — issue first, one folder per unit of work
   under <workDir>/features/, markdown canonical / HTML for the user, cleanup
   at wrap. That doc's skills-catalog table says which skill to use when;
   Claude invokes them as /workflow-kit:<name>, other agents follow the doc
   by hand with gh + file operations. Read it before starting any new work.
   ```

7. **Existing mess detection**: if the repo already has scattered work
   artifacts (`work/specs/`, `work/plans/`, `work/scratch/`, top-level scratch
   piles, TODO trackers), do NOT migrate them now — report what you found and
   recommend running `/workflow-kit:work-audit` as the migration pass.

8. **Report**: list what was created vs. skipped, and remind the user that new
   work starts with `/workflow-kit:new-feature <slug>` and non-trivial plans
   with `/workflow-kit:grilling`. Future template refreshes use
   `/workflow-kit:workflow-update` after the machine plugin is updated.
