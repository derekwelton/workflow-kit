# workflow-kit

31 engineering and productivity skills you install **inside a project**. Install all of them or
choose a few. Workflow skills activate explicitly; narrowly scoped craft skills
can activate when relevant. Installing everything does not load every skill body.

## Install into a project

Use the standard [skills installer](https://github.com/vercel-labs/skills) from
the project where you want the skills:

```powershell
npx skills@latest add derekwelton/workflow-kit
```

Choose the skills and target agents in the picker. Each selected folder contains
its required references, dependency instructions, helper scripts.
Dependencies are available on demand inside that folder; they do not become extra
entries in your installed skill list.

```powershell
# Browse without installing
npx skills@latest add derekwelton/workflow-kit --list

# Select specific skills for Codex and Claude Code
npx skills@latest add derekwelton/workflow-kit --skill grill-me handoff to-questionnaire writing-for-agents --agent codex claude-code

# Test an unpublished local checkout using the same installer
npx skills@latest add F:/Projects/workflow-kit
```

Use `--copy` if you prefer copied files to the installer's default symlinks.
Keep the generated `skills-lock.json` with the project. Update these installations
with the standard installer; review local edits before updating. Run from each
project's root after the workflow-kit changes have been pushed to GitHub:

```powershell
# Update installed skills; choose Project when prompted
npx skills@latest update

# Or explicitly select the current project
npx skills@latest update --project

# Re-run the original command to reinstall or change the workflow-kit selection
npx skills@latest add derekwelton/workflow-kit
```

Repeat in each project you want to update. `update` also updates installed skills
from other sources; it does not scan other project directories.

Generated native-plugin copies under `plugins/workflow-kit/skills/` carry
`metadata.internal: true` so standard updates discover only the canonical root
skills. Keep `INSTALL_INTERNAL_SKILLS` unset for standard installation/update.

## Alternative managed installer

The existing workflow-kit installer remains available for installations tracked
by `.workflow-skills.json`, with dependency skills installed as separate entries,
file-change previews, and protection for locally edited files. It requires Node.js
22 or newer. Its local picker is `node scripts/select-skills.mjs`.
Use one installer for a given project installation; their ownership records and
update behavior differ.

Or use the existing installer directly:

```powershell
# All skills, for both Codex and Claude Code
node scripts/install-skills.mjs --project F:/Projects/my-project --host both --all

# Or select skills (required skill dependencies are included and reported)
node scripts/install-skills.mjs --project F:/Projects/my-project --host codex --skills ponytail,tdd,wizard
```

To download the collection first:

```powershell
git clone https://github.com/derekwelton/workflow-kit.git workflow-kit
node workflow-kit/scripts/install-skills.mjs --project F:/Projects/my-project --host both --all
```

The project must already exist. `--project` defaults to the current directory;
`--host` defaults to `codex`. The installer writes plain files into:

| Host | Skills | Shared helper/reference files |
|---|---|---|
| Codex | `.agents/skills/` | `.agents/workflow-kit/` |
| Claude Code | `.claude/skills/` | `.claude/workflow-kit/` |

Commit those files and `.workflow-skills.json` with the project when ready.
The source checkout is no longer needed after installation. No global plugin,
user-skill links, credentials, model settings, or repository instructions are changed.
The standard installer above uses the self-contained folders instead of this
shared-file layout.

In a new session, invoke **`$setup-workflow-skills`** in Codex or
**`/setup-workflow-skills`** in Claude to configure the installed skills if needed.
Setup reuses existing tracker, domain-doc and branch conventions. It does not
stamp a full lifecycle framework into the project or read every skill body.

## Catalog and activation

| Explicit invocation | Model- or user-invocable |
|---|---|
| grill-with-docs | code-review |
| grill-me | writing-for-agents |
| handoff | unslop |
| cleanup-audit | |
| merge-cleanup | |
| to-questionnaire | |
| implement | codebase-design |
| improve-codebase-architecture | diagnosing-bugs |
| orchestrate | domain-modeling |
| ponytail-audit | github-projects (configured operations only) |
| setup-workflow-skills | linear-mode (configured operations only) |
| to-spec | ponytail |
| to-tickets | prototype |
| triage | research |
| wayfinder | resolving-merge-conflicts |
| | tdd |
| | update-issue (authorized checkpoints) |
| | wizard |

Cleanup Audit proposes a read-only report before selected execution. Merge Cleanup
finishes a named PR, child branch or workload, including already-merged cleanup.
Invoke `$cleanup-audit` or `$merge-cleanup` in Codex, `/cleanup-audit` or
`/merge-cleanup` in Claude. Neither activates on a casual merge request or ordinary
implementation completion. Unslop can activate automatically for writing.
Selective merge-cleanup installation includes orchestration references and their
dependencies for workload mode; standalone work needs no manifest. Install the
configured tracker adapter separately when needed.

Matt's original invocation policies are preserved. Orchestrate and ponytail-audit
are also explicit-only. Claude uses `disable-model-invocation: true`; Codex uses
`policy.allow_implicit_invocation: false` in `agents/openai.yaml`. Explicit skills
remain available when named by the user or needed within a requested workflow;
their instructions must not be loaded simply because they are installed.
Model-invocable skill descriptions remain discoverable; this is not a claim of
zero catalog overhead or measured token savings.

Standard installs call orchestration **`$orchestrate-queue`** in Codex and
**`/orchestrate-queue`** in Claude. The alternative installer retains Claude's
`/orchestrate` folder alias.
It is optional, with isolated workers, independent final-SHA review, resumable
manifests and combined integration checks. Its separately authorized merge mode
is documented in its references. Tracker adapters remain conditional; install
the configured adapter if you selected orchestration without install-all.

After the combined PR and human-review handoff are verified, orchestration cleans
up its safely integrated worker branches and clean inactive worktrees. It keeps
the combined PR branch for review and reports any worker artifacts retained
because they contain active, changed, unintegrated, or separately referenced work.

## Preview and update managed installations

```powershell
# Preview exact file changes without writing anything
node scripts/install-skills.mjs --project F:/Projects/my-project --host both --diff

# Update the recorded selection after reviewing the diff
node scripts/install-skills.mjs --project F:/Projects/my-project --host both

# Verify installation without writing (exit 1 if changes are needed)
node scripts/install-skills.mjs --project F:/Projects/my-project --host both --check
```

`--dry-run` lists planned files without printing their contents; `--json` provides
a machine-readable report. New `--skills` selections are additive. The record
stores requested/included skills, package version, upstream revision and file
hashes. Updates refuse locally modified, unowned, or linked destination files
before writing. Reconcile custom changes against the proposed source separately;
there is no force-overwrite switch. Existing global installations can still cause
duplicate skills until separately removed; the installer does not change them.

## Existing projects and maintenance

See [migration](docs/project-local-migration.md) before replacing old lifecycle
instructions. No consumer project is migrated merely by updating this repository.
Version 0.9.4 remains recoverable at commit
`8ab784585df2508b462f9e308d680350542585b7`.

Root `skills/` (excluding generated `bundled/` folders), `scripts/`, `templates/`,
and `catalog.json` are the source. `scripts/build-skill-bundles.mjs` assembles each
skill's dependency closure from these owners; `build-codex-package.mjs` runs it
automatically and checks bundle parity with `--check`. Never hand-edit a bundle.
Cross-folder pointers in authored skills use `bundled/<canonical-repo-path>`;
bundled skill entrypoints use `INSTRUCTIONS.md` instead of `SKILL.md` to prevent
nested discovery. After importing canonical upstream paths, run
`node scripts/build-skill-bundles.mjs --prepare` to relocate those pointers.
Only load a bundled dependency when the active workflow needs it.
`plugins/workflow-kit/` remains a generated compatibility artifact; it is not
the recommended installation path. Never hand-edit it.

```powershell
node scripts/build-codex-package.mjs
node scripts/build-codex-package.mjs --check
node scripts/validate-package.mjs
node --test test/*.test.mjs
```

Tests install into temporary projects without model calls or live tracker writes.
For a real CLI smoke test, install `skills@latest` into a temporary tool directory,
then run `node scripts/test-skills-cli.mjs <tool>/node_modules/skills/bin/cli.mjs`.
It checks discovery, selective installs, both hosts, copy and default link modes,
and helper execution in isolated projects and a temporary home.
The optional legacy native-plugin smoke test uses an isolated home:
`python scripts/test-codex-install.py`.
Model policy remains in `scripts/lib/model-policy.mjs` and
`templates/model-routing.md`. The `codex-cli` skill calls the official Codex CLI
directly; no codex-kit companion is needed. Prefer the other provider for review;
Claude reviewers default to Opus 5.5 high, then Fable medium/low, then fresh Codex
if neither is available. Missing CLI, credentials, quota and model access need
recorded evidence. Do not change global policy settings to test this kit.
See [the migration and pilot checklist](docs/codex-cli-migration.md) before retiring
existing companion installations.

Engineering skills are adapted from [mattpocock/skills](https://github.com/mattpocock/skills);
Ponytail skills from [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail).
See [UPSTREAM.md](UPSTREAM.md) for pinned revisions and adaptations.
