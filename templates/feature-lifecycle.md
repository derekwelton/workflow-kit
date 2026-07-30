---
workDir: work
docsHome: .ai/workflows
labels: [feature, bug, chore, idea]
glossary: CONTEXT.md
adrDir: docs/adr
# linearTeam: ABC    # uncomment + set to bind this repo to a Linear team (see "Linear mode")
---

<!-- workflow-kit:managed-start version=0.8.1 -->

# Feature Lifecycle

How work is planned, built, presented, and cleaned up in this repo. Applies to
every agent (Claude, Codex, Gemini, Cursor) and every human. Managed by the
`workflow-kit` plugin; this doc is the tool-agnostic contract. Claude invokes
the skills as `/workflow-kit:<name>`; agents without plugin access follow the
same steps by hand with `gh` + file operations.

```
(plan: bulk dump → many issues)
        ↓
idea → issue → folder? → grill → research/prototype → to-spec → to-tickets?
                                                         │
      wrap ← present ← code-review ← implement (tdd) ←───┘
         (wayfinder wraps the whole loop for foggy multi-session epics)
```

## Rules

0. **Ceremony is opt-in — match process to size.** The pipeline above is the
   *escalation path*, not a mandatory march. The universal requirements are:
   issue first, durable issue updates at lifecycle transitions, and wrap when
   done. Everything between is proportional:
   a small fix is issue → branch → code → PR, nothing else. `grilling`,
   `to-spec`, `to-tickets`, and `wayfinder` run only when the user explicitly
   asks for a planning/brainstorm/spec session or says yes to a one-line
   offer. Never launch an interview, spec document, ticket breakdown, or
   subagent fleet because a task "seems non-trivial" — when in doubt, do the
   smaller thing and offer the next step in one line.
1. **Issue first, always.** Every unit of work — feature, bug, chore, even
   exploration — gets a GitHub issue before anything else (labels: `feature` /
   `bug` / `chore` / `idea`). Tasks live as a markdown checklist in the issue
   body; big features escalate to sub-issue tickets (see `to-tickets`). Bugs
   discovered mid-session are filed immediately.
2. **The issue stays current.** The issue is the human-facing control plane,
   not just the intake form. Use `update-issue` when substantive work starts,
   after each meaningful phase, whenever the user must review/decide/act, when
   work pauses or blocks, and when it finishes. Tick completed tasks. A comment
   requesting input must reproduce the questions, recommendations, evidence,
   and next action; local-only HTML, screenshots, and `file://` paths are not
   substitutes for a GitHub-readable update.
3. **One folder per unit of work**, created only when artifacts start existing:

   ```
   work/features/<issue#>-<slug>/
     spec.md            what & why (canonical, committed)
     plan.md            how (committed; optional for small work)
     notes.md           running decision log + wrap-up outcomes (committed)
     research/          research findings, cited (committed)
     handoff-<date>.md  session handoff for the next agent/machine (committed)
     scratch/           scripts, dumps, logs (text committed)
     qa/                screenshots, evidence (gitignored)
     review/            generated HTML docs for the user (gitignored, ephemeral)
   ```

   A small bug is issue + fix branch only — no folder. Never create work
   artifacts outside a feature folder.
4. **Markdown is canonical, HTML is presentation.** Agents read/write `.md`.
   Anything presented to the user for review or decision is a self-contained
   HTML file in `review/` (openable via `file://`). Decisions a review doc
   produces are written back into `spec.md`/`notes.md` and summarized on the
   issue. Link only artifacts that are pushed or otherwise reachable from
   GitHub; when HTML remains local-only, the issue comment must stand alone.
5. **Branches/PRs reference the issue**: branch `feat/<issue#>-<slug>`; PR body
   `Refs #<n>` while open-ended, `Closes #<n>` when the merge should close it.
6. **Ephemera dies at wrap.** When work ships: outcomes written to `notes.md`,
   issue closed with a summary, `scratch/`+`qa/`+`review/`+handoffs deleted,
   the folder (spec/plan/notes/research) moved to `work/features/_archive/`,
   merged branches and worktrees pruned. Git history plus the closed issue are
   the permanent record.
7. **Nothing rots silently.** Periodic audit proposes cleanup of stale
   folders, mergeable issues, dead branches — deletions always get human
   approval first.
8. **Domain knowledge lives in the glossary and ADRs** (paths in this doc's
   frontmatter, created lazily): the glossary defines the project's canonical
   terms — use them exactly; ADRs record hard-to-reverse decisions — don't
   re-litigate them.

## Linear mode — active only when `linearTeam` is set

**If this doc's frontmatter has no `linearTeam` key, skip this entire section.**
Everything above applies unchanged, GitHub is the only tracker, and no Linear
tool should ever be called. Absence is the default and the safe state.

When `linearTeam` **is** set, the repo is bound to that Linear team: **Linear
becomes the control plane** (status, priority, triage, planning) and **GitHub
stays the execution surface** (branches, PRs, diffs). Sync is bidirectional and
automatic — create an issue on either side and the twin appears. The rules
below override the corresponding rules above.

Tool names differ per harness, so this doc names them **logically** — Linear
`save_issue`, `get_issue`, `list_issues`, `list_comments`, `save_comment`,
`list_issue_statuses`, `list_issue_labels`. Map them to whatever your harness
exposes. Claude has these via the Linear MCP connector. Codex should use the
installed Linear app/OAuth tool surface first; explicit MCP configuration is a
fallback (see the plugin's `BOOTSTRAP.md`). Without a Linear tool surface, fall
back to `gh` against the GitHub twin and tell the user the Linear side was not
touched.

### L1. The sync-thread rule — only replies to one thread reach GitHub

Get this wrong and every agent comment is silently Linear-only.

When Linear syncs an issue it plants a root comment with `parentId: null` and
`author: null`:

> This comment thread is synced to a corresponding [GitHub issue](…). All
> replies are displayed in both locations.

**Required procedure for every comment:**

1. `list_comments({ issueId })`
2. Find the comment with `parentId === null` whose body matches
   `/synced to a corresponding/i` (author is `null`)
3. `save_comment({ parentId: <that id>, body })`
4. If no such root exists, the issue is not synced — post top-level and warn
   the user

**Never** post the same comment to GitHub with `gh` as well. Sync handles it;
duplicating produces two copies on the GitHub side.

### L2. Status contract — implementation and review are separate handoffs

| Status | Meaning | Set by |
|---|---|---|
| `Triage` | raw idea, needs shaping before anyone can act | `plan`, when it can't infer enough |
| `Backlog` | real work, not scheduled | `plan` |
| `Todo` | specified enough for an agent to start cold | `plan`, `to-spec`, `to-tickets` |
| `In Progress` | actively being worked | auto on branch push; skills also set it explicitly |
| `Code Review` | implementation complete, **awaiting independent AI review**; reviewed workload items remain here until combined integration passes | `implement`; PR automation may set it when configured |
| `In Review` | AI review complete and, for a workload, its integration branch is ready for human testing | `code-review` for standalone work; `orchestrate-queue` for a workload batch |
| `Done` | merged, or human-verified | **never an agent** — merge or the user |
| `Canceled` / `Duplicate` | triage outcomes | proposed by `board`, applied on approval |

The implementation agent stops at `Code Review` and does not review its own
work. A later `code-review` agent sweeps this repo's queue and performs the
full two-axis review. Completed standalone reviews move to `In Review`;
workload reviews wait at `Code Review` for the combined integration gate.
Non-code work with no code-review phase can go directly to `In Review`. An
agent never sets `Done`; that belongs to a merge or the user.

For a multi-issue `orchestrate-queue` workload, individual review completion
is a manifest-only `reviewed-pending-integration` state. Keep every included
issue in `Code Review` until the integration branch is created from current
main, all reviewed heads are combined, conflict resolutions are independently
reviewed, combined verification passes, and one umbrella PR exists. The
coordinator then moves the included issues to `In Review` as one reconciled
batch. It never sets `Done` or merges the umbrella PR.

`/workflow-kit:code-review queue` resolves the current repository from git,
lists the Linear team's exact `Code Review` status, and filters to issues whose
synced GitHub attachment/PR or branch belongs to this repository. It performs
the full Standards + Spec review for every match. Completed standalone reviews
move to `In Review`; workload reviews stay in `Code Review` as
`reviewed-pending-integration`. Blocked reviews stay in `Code Review` with a
durable comment and do not prevent the rest of the queue from running.

Status names vary by team. Resolve via `list_issue_statuses({ team })` and
match on `type` (`triage` / `backlog` / `unstarted` / `started` / `completed` /
`canceled` / `duplicate`), falling back to name. `In Progress`, `Code Review`,
and `In Review` all have `type: "started"` — disambiguate by exact name. If a
team lacks either review status, say so and leave the issue in its prior state
rather than guessing.

### L3. Branch naming — overrides Rule 5

Branches come from the issue's **`gitBranchName`** field (e.g.
`derekswelton/irp-13-rework-purchase-order-editing…`), **not**
`feat/<issue#>-<slug>`. Linear auto-links the PR. Configure PR-open automation
to use `Code Review`, not `In Review`; `implement` still sets `Code Review`
explicitly so older automation cannot skip the independent review queue.
`code-review` sets `In Review` after a standalone pass; for a workload,
`orchestrate-queue` sets it only after the combined integration gate. Merge
automation may set `Done`.

PR bodies use `Refs #<gh#>`. **Never `Closes`** — closing the GitHub twin drags
the Linear issue to `Done`, which is the user's call.

Work folders keep `<gh#>-<slug>` naming. Where a folder exists, its header
carries both keys (`IRP-13` / `#40`).

### L4. Artifacts live in the issue — overrides Rule 3

| Artifact | Under Linear mode |
|---|---|
| `spec.md` | issue **body** (goal / scope / acceptance criteria) + a spec **comment** recording the reasoning |
| `plan.md` | `## Tasks` checklist in the issue **body** — tickable, renders both sides |
| `notes.md` | checkpoint **comments** on the sync thread |
| `research/` | **unchanged, stays on disk** |
| `scratch/`, `qa/`, `review/` | **unchanged, stays on disk** |
| `handoff-<date>.md` | **comment**, unless it needs attached artifacts |

Narrative and decisions → issue; bulk, binary, and evidence → disk. Never push
research dumps, SQL output, or generated HTML into an issue body.

**Body = current truth, edited in place. Comments = immutable timeline.**
`save_issue({ id, description })` replaces the whole description, so always
`get_issue` immediately before editing. Edit the body on the Linear side only,
so the two sides can't race.

**The feature folder is created only when real artifacts exist** — most units
of work create none. Skills must tolerate a missing folder.

### L5. Labels

Linear labels are canonical under Linear mode; the `labels:` frontmatter above
names GitHub labels and stops being the authority. Resolve the real set with
`list_issue_labels({ team })`. Sync maps them onto the twin; that mapping is
not yours to manage.

### L6. Limits

`linearTeam` is a scalar — one team per repo. Projects and cycles are
deliberately unused.

## The skills — what to use when

Lifecycle (container of work):

| Skill | Use when |
|---|---|
| `workflow-init` | Bootstrapping a repo into this system (once) |
| `workflow-update` | Refreshing an adopted repo from the installed plugin while preserving repo-specific configuration |
| `plan` | A bulk dump of things that need doing → deduped, classified, prioritized issues in one approval-gated pass |
| `new-feature` | Starting ONE unit of work — files the issue, creates the folder if artifacts need one |
| `update-issue` | Any issue-backed work starts/checkpoints/needs input/pauses/finishes → durable tracker comment + checklist sync |
| `present` | Anything needs the user's review/decision → self-contained HTML in `review/` |
| `wrap-feature` | Work shipped → close (or preserve Linear's human-review boundary), clean, archive, prune; never bypass `Code Review` |
| `work-audit` | Repo clutter check / migration sweep — proposes, never auto-deletes |
| `board` | "What should I work on / what's pending?" — tracker read: awaiting-you, awaiting AI code review, available, in-flight, recently shipped. `board audit` sweeps for stale work and unfiled follow-ups |
| `orchestrate-queue` | A filtered or explicit multi-issue workload → bounded implementation, opposite-provider review, one current-main integration branch, combined verification, and batch `In Review` handoff |
| `integrate-reviewed` | A human-tested workload branch is accepted → refresh main, reverify, merge the umbrella PR only with explicit authorization, reconcile tracker/PRs, and clean leases |
| `workflow-doctor` | Read-only health check for workflow/plugin versions, tracker statuses/sync, stale jobs, run manifests, worktrees, and configuration drift |

Craft (inside the build):

| Skill | Use when |
|---|---|
| `grilling` | Stress-testing a plan BEFORE building — bulk-question rounds, recommended answers, facts from the codebase, decisions from the user |
| `research` | A question needs primary-source legwork → cited findings in `research/` |
| `prototype` | "Does this logic feel right?" / "What should this look like?" → throwaway code that answers the question |
| `to-spec` | Conversation is ready to crystallize → writes the folder's `spec.md`, or the issue body + spec comment under Linear mode (no interview) |
| `to-tickets` | Feature exceeds one context window → tracer-bullet vertical-slice sub-issues with blocking edges |
| `implement` | A spec/ticket is ready to build — one ticket per fresh session, ponytail + TDD; default mode reviews/commits, Linear mode commits and hands off at `Code Review` |
| `ponytail` | ALL code writing (auto-active): laziest solution that works — reuse > stdlib > native > installed dep > one line > minimum code; never simplifies away spec requirements |
| `tdd` | Building test-first: seams confirmed up front, red–green tracer bullets, no implementation-coupled or tautological tests (outranks ponytail's one-check minimum at agreed seams) |
| `code-review` | Independently review/fix one branch/PR or sweep this repo's `Code Review` queue; standalone work hands off at `In Review`, workload items wait for combined integration |
| `codebase-design` | Designing or restructuring modules — the deep-module vocabulary (module/interface/seam/depth/leverage/locality) |
| `domain-modeling` | Terms are being sharpened or hard-to-reverse decisions made → glossary updates + sparing ADRs |
| `ponytail-audit` | Repo-wide bloat scan → ranked delete/stdlib/native/yagni/shrink list; run BEFORE improve-codebase-architecture (subtract, then deepen) |
| `improve-codebase-architecture` | Periodic architecture health check → visual HTML report of deepening opportunities, then grill through one |
| `handoff` | Ending a session mid-work → committed handoff doc the next session (or other machine) resumes from |
| `wayfinder` | An epic too big/foggy for one session → map issue + decision-ticket sub-issues, worked one per session |

<!-- workflow-kit:managed-end -->
<!-- Repo-specific additions belong below this line and survive /workflow-kit:workflow-update. -->
