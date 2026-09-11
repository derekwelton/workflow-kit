# workflow-kit bootstrap

Portable installs must retain the complete package. Resolve the exposed skill's
real path before following relative references; `orchestrate-queue` is an alias
for the package's `skills/orchestrate` directory. The fallback installer's
`--check --json` now validates dependency closure as well as links, without
mutating them. That result does not prove provider/account readiness.

After updating a machine plugin or linked checkout, start a fresh session. Then
run `workflow-update --check` in adopted repositories, review the lifecycle diff,
and apply/commit the repository refresh separately. Version 0.9.1 preserves
local frontmatter and model settings; it does not roll out changes to other
machines or consumer repositories merely because the library was pushed.

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

## Step 1 — Install or refresh on the current host

Choose the host actually running this task. Do not require Claude on Codex-only
machines. Preserve existing install scope and never remove another plugin.

- **Claude Code:** install or update `workflow-kit@derekwelton` from
  `derekwelton/workflow-kit` with the Claude plugin commands in README.md.
- **Codex native:** with CLI 0.153.0+, run `codex plugin marketplace add
  derekwelton/workflow-kit` then `codex plugin add
  workflow-kit@derekwelton-workflow`. For local development use the checkout's
  absolute path as the marketplace source. For an existing marketplace inspect
  the CLI's `marketplace upgrade --help` and upgrade before reinstalling.
- **Other Codex surfaces:** use a complete checkout and run
  `node <checkout>/scripts/install-codex-skills.mjs`; no Claude dependency.
  Preserve conflicts and report them. Native and fallback catalogs should not
  both expose duplicate names.

Resolve the package root from the real loaded skill path, or the verified
checkout. Keep all scripts/templates/references together. Report source,
installed, and loaded versions separately. New skills may require a new session;
continue initialization using the files directly when necessary.

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
$file = gh api repos/derekwelton/workflow-kit/contents/skills/<skill>/SKILL.md | ConvertFrom-Json
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($file.content))
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
3. `feature-lifecycle.md` is the compact configuration/router, with generated
   `feature-lifecycle-portable.md` beside it. Plugin hosts read the selected
   package contract; hosts without the plugin read the fallback, never both.
4. If the repo has pre-existing scattered work artifacts (old `specs/`,
   `plans/`, `scratch/` piles, TODO trackers), do NOT migrate them now —
   report them and recommend `/workflow-kit:work-audit` as the migration pass.

## Step 4 — Codex delegation layer (if the machine uses Codex)

Only for Claude-to-Codex delegation, when both CLIs are installed:

1. Ensure the adapter version 2.3.0 or newer is installed: `claude plugin list` should show
   `codex@derekwelton-codex`.
   - Stale `codex@openai-codex` present -> report the duplicate and preserve it;
     remove it only when the user has authorized that removal.
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

For a Codex-only workflow, the Claude-to-Codex adapter is unnecessary. Skip it.
Do not change the global model or effort configuration; workers pass explicit
controls from the shared model-routing policy.

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
- Report: plugin status (installed/updated/current), Codex native-plugin or fallback skill-link status,
  whether the repo was
  initialized or refreshed, files changed vs. preserved, which entrypoint has
  the pointer, and any legacy mess found. Remind the user: new work starts
  with `/workflow-kit:new-feature <slug>`, future repo refreshes use
  `/workflow-kit:workflow-update`; multi-issue work starts with
  `/workflow-kit:orchestrate --name <name> ...` in Claude or
  `$orchestrate-queue` in Codex, and newly installed skills appear after a
  session restart.
