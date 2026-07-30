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
   already exists, record its path and continue. Step 1 refreshes the machine
   plugin; Step 2 refreshes the repo's stamped integration.

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

If Codex is installed, expose the portable workload entry points too. Run the
installer from this marketplace checkout:

```powershell
node "$HOME/.claude/plugins/marketplaces/derekwelton/scripts/install-codex-skills.mjs"
```

It creates or verifies user-skill links for `$orchestrate-queue`,
`$integrate-reviewed`, and `$workflow-doctor`. It never overwrites a conflicting
directory; report a conflict and leave it untouched. Restart Codex after an
install so its skill catalog refreshes.

## Step 2 — Initialize or refresh this repo

Choose by repo state:

- Existing workflow-kit-stamped `feature-lifecycle.md` → invoke
  `/workflow-kit:workflow-update`.
- No stamped lifecycle document → invoke `/workflow-kit:workflow-init`.

If the needed skill is NOT available (plugin just installed/updated, or you're
not Claude), fetch its instructions and follow them directly. Use
`skills/workflow-update/SKILL.md` for an adopted repo or
`skills/workflow-init/SKILL.md` for a new one:

```
gh api repos/derekwelton/workflow-kit/contents/skills/<skill>/SKILL.md \
  --jq .content | base64 -d
```

Fetch `templates/feature-lifecycle.md` the same way. `workflow-init` also
references `templates/review-doc.html`, which only needs to exist in the
plugin, not in the project.

`workflow-init` does the full first-time setup. `workflow-update` replaces only
the lifecycle document's versioned managed block, preserves repo frontmatter
and additions, then reconciles the scaffold, gitignore block, labels, and
agent-entrypoint pointer. In either case, show and validate the resulting diff.

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

## Step 4a — Linear mode (only if the repo binds a Linear team)

Skip this step entirely unless the stamped `feature-lifecycle.md` frontmatter
carries a `linearTeam` key. Linear mode is opt-in; an unbound repo must keep
behaving exactly as it always has.

If it is bound:

1. **Sync integration.** The whole contract depends on Linear's GitHub sync
   being enabled for this repo — that's what creates the twin issue and the
   synced comment thread. Verify with the user; nothing else in Linear mode
   works without it.
2. **Claude** reaches Linear through its Linear MCP connector. If it isn't
   authorized, say so — the capability is unavailable until the user connects
   it in their claude.ai connector settings or via `/mcp`.
3. **Codex** should use its installed Linear app/connector and OAuth flow when
   that tool surface is available. Only when the harness has no Linear app,
   use this explicit remote-MCP fallback in `~/.codex/config.toml` and complete
   its one-time OAuth login:

   ```toml
   [mcp_servers.linear]
   url = "https://mcp.linear.app/mcp"
   ```

4. The stamped lifecycle doc's "Linear mode" section is the contract every
   agent follows. It names Linear tools **logically** (`save_comment`, not a
   harness-prefixed name) precisely so Codex and Claude can follow the same
   doc — keep it that way.

## Step 5 — Clean up and report

- If this file was **copied into the repo**, delete the copy — the stamped
  `feature-lifecycle.md` supersedes it; this file lives only in
  `derekwelton/workflow-kit` (one source, no drift).
- Report: plugin status (installed/updated/current), Codex skill-link status,
  whether the repo was
  initialized or refreshed, files changed vs. preserved, which entrypoint has
  the pointer, and any legacy mess found. Remind the user: new work starts
  with `/workflow-kit:new-feature <slug>`, future repo refreshes use
  `/workflow-kit:workflow-update`; multi-issue work starts with
  `/workflow-kit:orchestrate --name <name> ...` in Claude or
  `$orchestrate-queue` in Codex, and newly installed skills appear after a
  session restart.
