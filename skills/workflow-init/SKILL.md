---
name: workflow-init
description: One-time repo bootstrap for the workflow-kit feature lifecycle — creates the work/features scaffold, gitignore rules, GitHub labels, and the per-repo feature-lifecycle.md convention doc. Use when adopting the workflow in a new or existing repo.
---

# workflow-init

Bootstrap the current repo for the issue-driven feature workflow. Idempotent:
skip any step whose result already exists, and say so.

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

5. **Lifecycle doc**: copy `${CLAUDE_PLUGIN_ROOT}/templates/feature-lifecycle.md`
   to the docs home chosen in step 1, filling in the config frontmatter
   (`workDir`, `docsHome`, `labels`) for this repo. Add a one-line pointer to it
   from the repo's agent-instruction entrypoint (e.g. under a "Workflows"
   section). Keep the doc to roughly one page — it exists so that agents that
   cannot see this plugin (Codex, Gemini, Cursor) still follow the convention.

6. **Existing mess detection**: if the repo already has scattered work
   artifacts (`work/specs/`, `work/plans/`, `work/scratch/`, top-level scratch
   piles, TODO trackers), do NOT migrate them now — report what you found and
   recommend running `/workflow-kit:work-audit` as the migration pass.

7. **Report**: list what was created vs. skipped, and remind the user that new
   work starts with `/workflow-kit:new-feature <slug>`.
