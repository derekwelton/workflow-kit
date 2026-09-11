## 5. Branch naming — overrides lifecycle Rule 5

In Linear mode, branches come from the issue's **`gitBranchName`** field
(e.g. `derekswelton/irp-13-rework-purchase-order-editing-and-fix-rtf-note-rendering`),
not `feat/<issue#>-<slug>`. Read it from `get_issue`.

Linear then auto-links the resulting PR. Configure PR-open automation to use
`Code Review`, not `In Review`; regardless of automation, `implement` explicitly
sets `Code Review` after its final update so an older integration cannot skip
the independent review queue. The code-review agent explicitly sets `In Review`
for standalone work; the workload orchestrator does so after its combined
gate. Merge automation may still set `Done`.

Work folders keep `<gh#>-<slug>` naming so nothing else has to change. Where a
folder exists, its header carries both keys (`IRP-13` / `#40`).

PR bodies still reference the GitHub twin (`Refs #<gh#>`). Never write
`Closes #<gh#>` in Linear mode — closing the GitHub issue would drag the Linear
issue to `Done`, which is the user's call, not an agent's.

## 6. Artifacts live in the issue, not the repo

| Artifact | Linear mode |
|---|---|
| `spec.md` | issue **body** (goal / scope / acceptance criteria) + a spec **comment** recording the reasoning |
| `plan.md` | `## Tasks` checklist in the issue **body** — tickable, renders both sides, drives Linear progress |
| `notes.md` | checkpoint **comments** on the sync thread |
| `research/` | **unchanged, stays on disk** — cited findings `code-review` reads |
| `scratch/`, `qa/`, `review/` | **unchanged, stays on disk** |
| `handoff-<date>.md` | **comment**, unless it needs attached artifacts |

The split is by artifact nature: **narrative and decisions → issue; bulk,
binary, and evidence → disk.** Do not push research dumps, SQL output, or
generated HTML into issue bodies — that trades repo clutter for unskimmable
40k-character issues and costs agents the ability to grep.

**Body = current truth, edited in place. Comments = immutable timeline.**

Consequence: **the feature folder is created only when real artifacts exist.**
Most units of work create none at all. Skills downstream must tolerate a
missing folder rather than treating it as an error.
## 7. Labels

Under Linear mode, **Linear labels are canonical**. The lifecycle doc's
`labels:` frontmatter names GitHub labels and stops being the authority; do not
try to reconcile the two vocabularies. Resolve the real set with
`list_issue_labels({ team })` and pick from it. Sync maps them onto the GitHub
twin as best it can — that mapping is not yours to manage.

## 8. Body templates

**Bug**

```markdown
## Problem
<What's wrong, from the user's perspective.>

## Impact
<Who it hurts and how badly.>

## Reproduction
1. <step>

## Evidence
- `path/to/file.ext:123` — <what's there>

## Fix options
1. <option> — <trade-off>

## Acceptance criteria
- [ ] <observable condition>

## Tasks
- [ ] <first step>
```

**Feature**

```markdown
## Goal
<One or two sentences, from the user's perspective.>

## Why now
<The trigger.>

## In scope
- <item>

## Out of scope
- <item>

## Acceptance criteria
- [ ] <observable condition>

## Open questions
- <question>

## Tasks
- [ ] <first step>
```

Every body carries a `## Tasks` checklist. `update-issue` ticks it.

Markdown must render in **both** Linear and GitHub: tables, checklists, and
fenced code are safe. **Avoid raw HTML.**
