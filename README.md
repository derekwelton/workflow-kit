# workflow-kit

30 engineering and productivity skills you install **inside a project**. Install all of them or
choose a few. Workflow skills activate explicitly; narrowly scoped craft skills
can activate when relevant. Installing everything does not load every skill body.

## Install into a project

Requires Node.js 22 or newer. Once these changes are pushed to GitHub, run this
from the project where you want the skills:

```powershell
npx --yes --package github:derekwelton/workflow-kit workflow-kit
```

Pick skills by number or name (or `all`), then choose Codex, Claude Code, or both.
Required dependencies are included automatically. This uses the kit's installer,
which also bundles shared references and helpers. The generic `npx skills add`
folder-copy flow does not resolve those dependencies.

From this checkout, the same picker is available now:

```powershell
node scripts/select-skills.mjs
```

Pass `--interactive --project F:/Projects/my-project` to pick for another project.
Explicit flags work without a terminal, for example:

```powershell
npx --yes --package github:derekwelton/workflow-kit workflow-kit --host both --skills grill-me,handoff,to-questionnaire,writing-for-agents
```

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
Use this installer for selective installs; copying arbitrary folders with other
installers does not resolve this collection's shared helpers and dependencies.

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

Codex calls orchestration **`$orchestrate-queue`**; Claude uses **`/orchestrate`**.
It is optional, with isolated workers, independent final-SHA review, resumable
manifests and combined integration checks. Its separately authorized merge mode
is documented in its references. Tracker adapters remain conditional; install
the configured adapter if you selected orchestration without install-all.

## Preview and update

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

Root `skills/`, `scripts/`, `templates/`, and `catalog.json` are the source.
`plugins/workflow-kit/` remains a generated compatibility artifact; it is not
the recommended installation path. Never hand-edit it.

```powershell
node scripts/build-codex-package.mjs
node scripts/build-codex-package.mjs --check
node scripts/validate-package.mjs
node --test test/*.test.mjs
```

Tests install into temporary projects without model calls or live tracker writes.
The optional legacy native-plugin smoke test uses an isolated home:
`python scripts/test-codex-install.py`.
Model policy remains in `scripts/lib/model-policy.mjs` and
`templates/model-routing.md`; `scripts/sync-codex-policy.mjs` can produce the
compatible codex-kit copies. Do not change global policy settings to test this kit.

Engineering skills are adapted from [mattpocock/skills](https://github.com/mattpocock/skills);
Ponytail skills from [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail).
See [UPSTREAM.md](UPSTREAM.md) and `licenses/` for pinned revisions and adaptations.
