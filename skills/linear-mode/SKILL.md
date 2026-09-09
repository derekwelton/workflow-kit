---
name: linear-mode
description: The Linear-mode contract every lifecycle skill defers to — gating on linearTeam, sync-thread comments, standalone and workload Code Review to In Review handoffs, branch naming from gitBranchName, and issue body/comment templates. Read when working in a repo whose feature-lifecycle.md sets linearTeam, or when another skill points here.
---

If `tracker: github-projects` or a local Projects contract is present, use
`../github-projects/SKILL.md` instead. An explicit conflicting `linearTeam`
blocks tracker writes until reconciled.


# Linear mode

The tracker contract for repos bound to a Linear team. **Optional.** A repo
without the binding behaves exactly as it always has; nothing in this file
applies to it.

Other skills point here rather than restating the contract. If you arrived from
one of them, the section it named is what you need — but §1 (gating) and §3
(the sync-thread rule) apply to everything.

This file is the single source for Linear behavior across every skill. Skills
point here rather than restating it, so there is one place to get the
sync-thread rule right.

## 1. Gating — how to tell whether Linear mode is on

Read the repo's lifecycle doc (`feature-lifecycle.md`) frontmatter:

```yaml
---
workDir: work
docsHome: .ai/workflows
labels: [feature, bug, chore, idea]
glossary: CONTEXT.md
adrDir: docs/adr
linearTeam: IRP        # presence enables Linear mode
---
```

- **`linearTeam` absent** → Linear mode is OFF. Every skill behaves exactly as
  documented in its own body: `gh` for issues, `spec.md`/`plan.md`/`notes.md`
  on disk, `feat/<issue#>-<slug>` branches, wrap closes the issue. Do not
  probe for Linear, do not call Linear tools, do not mention Linear.
- **`linearTeam` present** → Linear mode is ON. Follow this document; where it
  contradicts a skill's default, this document wins.

If the frontmatter is unreadable or the key is missing, mode is OFF. Absence is
the safe default — never infer Linear mode from a Linear MCP server merely
being connected.

## 2. Tool names are logical

Tool names differ per harness — `mcp__claude_ai_Linear__save_issue` in Claude
Code, the bare name in Codex, something else elsewhere. This document and every
skill refer to **logical names only**: Linear `save_issue`, `get_issue`,
`list_issues`, `list_comments`, `save_comment`, `list_issue_statuses`,
`list_issue_labels`. Map them to whatever your harness exposes.

If no Linear tool surface is available in the current harness, say so and fall
back to `gh` against the GitHub twin rather than silently skipping the update —
then tell the user the Linear side (status, sub-issue edges) was not touched.

## 3. The sync-thread rule — get this right or comments go nowhere

**Only replies to one designated comment thread cross over to GitHub.** A new
top-level Linear comment stays Linear-only, silently. This is the single
easiest thing to get wrong in Linear mode.

When Linear syncs an issue it plants a root comment with `parentId: null` and
`author: null`:

> This comment thread is synced to a corresponding [GitHub issue](…). All
> replies are displayed in both locations.

**Required procedure for every comment:**

1. `list_comments({ issueId })`
2. Find the comment with `parentId === null` whose body matches
   `/synced to a corresponding/i` (its `author` is `null`)
3. `save_comment({ parentId: <that id>, body })`
4. If no such root exists, the issue is not synced — post top-level and **warn
   the user** that the comment is Linear-only

**Never** post the same comment to GitHub with `gh` as well. Sync handles the
crossover; duplicating produces two copies on the GitHub side.

## 4. Status contract

| Status | Meaning | Set by |
|---|---|---|
| `Triage` | raw idea, needs shaping before anyone can act | `plan`, when it can't infer enough |
| `Backlog` | real work, not scheduled | `plan` |
| `Todo` | specified enough for an agent to start cold | `plan`, `to-spec`, `to-tickets` |
| `In Progress` | actively being worked | auto on branch push; skills also set it explicitly |
| `Code Review` | implementation complete, **awaiting independent AI review**; reviewed workload items remain here until combined integration passes | `implement`; PR automation may also set it when configured |
| `In Review` | AI review complete and, for a workload, its integration branch is ready for human testing | `code-review` for standalone work; Claude `/workflow-kit:orchestrate` or Codex `$orchestrate-queue` for a workload batch |
| `Done` | merged, or human-verified | **never an agent** — merge or the user |
| `Canceled` / `Duplicate` | triage outcomes | proposed by `board`, applied on approval |

**Implementation and review are separate handoffs.** The implementation agent
stops at `Code Review`; it does not review its own work. A later code-review
agent completes the full review. Standalone work moves to `In Review`;
workload work waits for the combined integration gate. An agent never marks
work `Done`; that remains the merge's or the user's decision.

For a multi-issue Claude `/workflow-kit:orchestrate` or Codex
`$orchestrate-queue` workload, individual review completion
is a manifest-only `reviewed-pending-integration` state. Keep every included
issue in `Code Review` until the integration branch is created from current
main, all reviewed heads are combined, conflict resolutions are independently
reviewed, combined verification passes, and one umbrella PR exists. The
coordinator then moves the included issues to `In Review` as one reconciled
batch. It never sets `Done` or merges the umbrella PR.

Non-code work that has no code-review phase (for example, a research or audit
deliverable) may move directly to `In Review` when it needs human review.

### Code-review queue ownership

`/workflow-kit:code-review queue` is the repository-scoped worker for this
handoff. It resolves the current repository from git, lists the team's issues
in the exact `Code Review` status, and keeps only issues whose synced GitHub
attachment/PR or branch belongs to this repository. It performs the full
Standards + Spec review for every match. A completed review moves to
`In Review` unless it belongs to an active workload; workload reviews stay in
`Code Review` and record `reviewed-pending-integration`. A review blocked by a
missing or inaccessible diff stays in `Code Review` with a durable blocked
comment. One blocked issue does not stop the rest of the queue.

### Resolving status names

Status names are not guaranteed across teams. Resolve via
`list_issue_statuses({ team })` and match on `type`, falling back to name:

| `type` | Status |
|---|---|
| `triage` | Triage |
| `backlog` | Backlog |
| `unstarted` | Todo |
| `started` | In Progress, Code Review, **and** In Review — all three share this type |
| `completed` | Done |
| `canceled` | Canceled |
| `duplicate` | Duplicate |

Because all three active/review states share `type: "started"`, disambiguate by
exact name. If a team has no `Code Review` equivalent, **say so rather than
guessing** — leave completed implementation in `In Progress` and tell the user
the AI-review queue has nowhere to live. If it has no `In Review` equivalent,
leave a completed code review in `Code Review` and report that the human-review
handoff could not be represented.

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

### Editing the body safely

`save_issue({ id, description })` replaces the whole description. Always
`get_issue` immediately before writing, apply your edit to the fetched text,
and write it back — otherwise a concurrent edit (the user's, or the GitHub
side's) is clobbered. Tick checkboxes this way; never reconstruct a body from
memory.

Issue descriptions sync bidirectionally with the GitHub twin, so a checklist
ticked in Linear shows ticked on GitHub. Only ever edit the body on **one**
side — Linear's — so the two can't race.

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

## 9. Comment shapes

Four shapes cover nearly everything. All go on the sync thread (§3).

**Work started**

```markdown
## Work started

Branch: `<gitBranchName>`

<What's being done first, and what the next checkpoint will be.>
```

**Checkpoint**

```markdown
## Checkpoint — <phase>

<One-sentence state.>

### Done
- <concrete result>

### Still running
- <what's next>
```

**Needs your decision**

```markdown
## Needs your decision

1. **<question>** — Recommendation: <answer and short reason>.

### Evidence
- `<command>` — <result>

### Next
<What happens once answered, and who owns it.>
```

**Implementation complete — ready for code review**

````markdown
## Implementation complete — ready for code review

<What changed.>

### Acceptance criteria
**<criterion>** — <how it was satisfied.>

### Verification
```
<command>   <result>
```

### Review target
- Branch/PR: <reachable link or branch>
- Fixed point: <base branch or commit>
````

Set `Code Review` after posting this shape.

**Code review complete — ready for human review**

````markdown
## Code review complete — ready for human review

<What was reviewed and the overall result.>

### Standards
- <finding count and worst finding, or pass>

### Spec
- <finding count and worst finding, or pass>

### Verification
```
<command>   <result>
```

### Needs your review
1. **<finding or decision to inspect>** — <why it needs a human>.
````

For standalone work, after a complete review with no unresolved material
finding, post the second shape, set `In Review`, and stop. For a workload item,
post a **Code review complete — awaiting workload integration** checkpoint,
keep `Code Review`, and record the final-SHA receipt in the workload manifest.

After the combined workload gate, post this shape to every included issue:

````markdown
## Workload ready — human review

This issue is included in `<integration-branch>` at `<head-sha>`.

### Issue review
- Implementer: <provider>
- Reviewer: <provider>
- Receipt: <base/head and result>

### Combined verification
```
<command>   <result>
```

### Test this workload
- Umbrella PR: <reachable URL>
- Checkout: `<integration-branch>`
- Status: not merged to main
````

Then move every still-`Code Review` included issue to `In Review`. If a status
changed concurrently, stop and reconcile rather than overwriting it. If review
or integration cannot complete, leave the issue in `Code Review`, post a
blocked update, and do not promote it. Never close or set `Done`.

## 10. Known limitations

- **One team per repo.** `linearTeam` is a scalar. A repo spanning multiple
  Linear teams is not supported; say so rather than guessing a team.
- **Projects and cycles** exist in Linear and are deliberately unused here.
