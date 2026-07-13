# workflow-kit bootstrap

> **For the human:** to adopt the workflow in any repo, give your agent this
> file. Either paste its contents, copy the file into the repo temporarily, or
> just say:
> `Fetch BOOTSTRAP.md from derekwelton/workflow-kit with gh and follow it.`
>
> **For the agent:** you have been asked to adopt the workflow-kit feature
> workflow in the current repo. Follow the steps below in order. Report what
> each step found/did.

## Step 0 — Preconditions

1. **Git repo with a GitHub remote.** If the directory isn't a git repo,
   `git init -b main` and offer to create a GitHub repo
   (`gh repo create --private --source .`). The workflow is issue-first — it
   needs GitHub Issues. If `gh` isn't authenticated, stop and tell the user.
2. **Already adopted?** If a `feature-lifecycle.md` stamped by workflow-kit
   already exists in this repo, skip to Step 3 (verify + refresh).

## Step 1 — Validate the plugin is installed on this machine

Run `claude plugin list` and look for `workflow-kit@derekwelton`.

- **Missing** → ask the user which scope to install at, recommending user
  level:
  - **User level (recommended)** — available in every repo on this machine;
    install once, done for all current and future projects:
    ```
    claude plugin marketplace add derekwelton/workflow-kit
    claude plugin install workflow-kit@derekwelton
    ```
  - **Project level** — only this repo (e.g. a shared/client machine where
    other projects shouldn't see it): add `--scope project` to both commands.

  If the user isn't reachable, install at user level and say so.
- **Installed** → check it's current:
  ```
  claude plugin marketplace update derekwelton
  claude plugin update workflow-kit@derekwelton
  ```
  (The bare name `workflow-kit` fails — always use `workflow-kit@derekwelton`.)

Tell the user if an install/update happened: skills load at session start, so
`/workflow-kit:*` commands appear next session. **Do not stop** — Step 2 works
without the loaded skills.

## Step 2 — Initialize this repo

If the `workflow-kit:workflow-init` skill is available in this session, invoke
it. If it is NOT available (plugin just installed, or you're not Claude),
fetch the skill's instructions and follow them directly:

```
gh api repos/derekwelton/workflow-kit/contents/skills/workflow-init/SKILL.md \
  --jq .content | base64 -d
```

Fetch the two templates it references the same way
(`templates/feature-lifecycle.md`, `templates/review-doc.html` — the latter
only needs to exist in the plugin, not in the repo).

That skill does the full setup: `work/features/` scaffold, gitignore block,
`feature/bug/chore/idea` labels, the stamped `feature-lifecycle.md` (with this
repo's config frontmatter), and the pointer section in the repo's agent-docs
entrypoint.

## Step 3 — Verify the agent entrypoints

Every agent must be able to *discover* the lifecycle from the repo itself:

1. Exactly one instruction entrypoint carries the "Feature workflow" pointer
   section (from the workflow-init skill): `.ai/AGENTS.md` if the repo has an
   `.ai/` system, else `AGENTS.md`, else `CLAUDE.md`. Add it if missing —
   edit the existing file, never create a competing one.
2. Vendor wrapper files (`CLAUDE.md` when `AGENTS.md` is canonical, etc.)
   point at the canonical entrypoint. Create a 2-line wrapper only if a tool
   the user actually uses needs it (e.g. a root `AGENTS.md` for Codex).
3. The stamped `feature-lifecycle.md` retains its full skills-catalog tables —
   that's how non-Claude agents (Codex, Gemini, Cursor) learn which skill's
   steps to follow by hand.
4. If the repo has pre-existing scattered work artifacts (old `specs/`,
   `plans/`, `scratch/` piles, TODO trackers), do NOT migrate them now —
   report them and recommend `/workflow-kit:work-audit` as the migration pass.

## Step 4 — Codex delegation layer (if the machine uses Codex)

If the `codex` CLI is installed on this machine (`codex --version` succeeds):

1. Ensure the modernized plugin is installed: `claude plugin list` should show
   `codex@derekwelton-codex`.
   - Stale `codex@openai-codex` present -> `claude plugin uninstall codex@openai-codex` first.
   - `codex@derekwelton-codex` missing (fresh machine or after uninstall) ->
     ```
     claude plugin marketplace add derekwelton/codex-kit
     claude plugin install codex@derekwelton-codex
     ```
   - Already installed -> keep it current:
     `claude plugin marketplace update derekwelton-codex && claude plugin update codex@derekwelton-codex`
2. Ensure the repo's `CLAUDE.md` carries the model-routing pointer block —
   fetch `templates/claude-md-block.md` from `derekwelton/codex-kit` via
   `gh api` and stamp it (replacing any older full model-selection section;
   keep repo-specific exceptions below the marker comment).

If `codex` isn't installed, skip this step and say so.

## Step 5 — Clean up and report

- If this file was **copied into the repo**, delete the copy — the stamped
  `feature-lifecycle.md` supersedes it; this file lives only in
  `derekwelton/workflow-kit` (one source, no drift).
- Report: plugin status (installed/updated/current), what workflow-init
  created vs. skipped, which entrypoint got the pointer, any legacy mess
  found. Remind the user: new work starts with `/workflow-kit:new-feature
  <slug>`, non-trivial plans with `/workflow-kit:grilling`, and if the plugin
  was just installed, the commands appear after a session restart.
