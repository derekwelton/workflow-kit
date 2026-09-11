<!-- workflow-kit:portable version=0.9.4; generated, do not edit -->

# Portable feature lifecycle

For hosts without the plugin. Repository frontmatter and local overrides in
feature-lifecycle.md still apply. This is generated from canonical source owners.
Read only the task's sections below; do not read the plugin copy as well.
Relative paths below identify bundled source sections, not files to open here.

Use available Git and tracker tools to follow these contracts manually. If an
operation requires an unavailable helper/runtime (especially validated workload
manifest transitions or cross-provider review), report that capability blocker;
do not invent receipts or replace deterministic gates with a prose approval.
Install the package or resume on a capable host for that operation. Single-issue
work and read-only advice remain runnable with Git and the configured tracker.
Optional specialist skills/templates require a capable host only when selected;
ordinary advice does not escalate to them.

Contents (search for Source: followed by the path):
- templates/lifecycle-contract.md
- templates/tracker-write.md
- skills/model-routing/SKILL.md
- skills/linear-mode/SKILL.md
- skills/linear-mode/references/write.md
- skills/linear-mode/references/status.md
- skills/linear-mode/references/intake.md
- skills/github-projects/SKILL.md
- skills/board/SKILL.md
- skills/new-feature/SKILL.md
- skills/implement/SKILL.md
- skills/ponytail/SKILL.md
- skills/tdd/SKILL.md
- skills/code-review/SKILL.md
- skills/code-review/references/providers.md
- skills/code-review/references/standards.md
- skills/code-review/references/queue.md
- skills/code-review/references/workload.md
- skills/orchestrate/SKILL.md
- skills/orchestrate/references/workload-contract.md
- skills/orchestrate/references/worker-envelope.md
- skills/integrate-reviewed/SKILL.md
- skills/wrap-feature/SKILL.md
- skills/update-issue/SKILL.md
- skills/research/SKILL.md

## Source: templates/lifecycle-contract.md

# Lifecycle contract

Canonical owner of task scope, lifecycle routing, instruction reuse, and
checkpoint ownership. Repository configuration and local overrides still apply.
Read the repository's compact feature-lifecycle.md; plugin-equipped hosts use
this contract and the selected action, not the portable fallback as well.

## Select the path

- **Read-only / personal advisory:** status, lookup, review, research, and reports
  default to an answer in chat. Do not create issues, post comments, change
  tracker state, start implementation, or require a feature folder. A requested
  file report authorizes that artifact only. Pass this scope to every nested
  skill/worker; dependencies cannot widen it.
- **Single issue:** implement the named issue; reuse its acceptance criteria.
  A small fix is issue → branch → edit → affected verification → independent
  review → human acceptance. Repository implementation work uses an existing
  issue or authorized minimal intake through new-feature. Create a feature
  folder only for actual artifacts. Interview/spec/ticket decomposition is opt-in.
- **Multi-issue:** only an explicitly requested workload uses orchestrate-queue
  and its workload contract. A worker count is a ceiling, never a target.

Read-only work remains outside issue intake even inside an issue-backed repo.
An existing issue link is context, not authorization to publish a review.
Honor authorization already provided; do not ask again for routine choices.
Commit/push follow repository/user authorization; merge, destructive cleanup,
and sending messages require explicit authorization. Never set Done.

## Canonical owners and conditional reads

| Needed now | Read |
|---|---|
| Tracker query | Configured adapter: ../skills/linear-mode/SKILL.md or ../skills/github-projects/SKILL.md; ordinary GitHub uses gh |
| Authorized tracker write | tracker-write.md, then its selected adapter |
| Implementation | ../skills/implement/SKILL.md; coding principles and TDD only as applicable |
| Independent review | ../skills/code-review/SKILL.md, selected mode only |
| Workload invariants | ../skills/orchestrate/references/workload-contract.md |
| Worker model/effort | ../skills/model-routing/SKILL.md; scripts/lib/model-policy.mjs owns executable defaults |
| Human acceptance/cleanup | ../skills/wrap-feature/SKILL.md |
| HTML requested/useful | ../skills/present/SKILL.md; caller supplies canonical content |

## One checkpoint owner

For authorized issue-backed work the caller publishes one meaningful phase
checkpoint through update-issue: start, result, decision, pause/block, or handoff.
Nested research/renderers return results to that caller; they do not publish
another copy. Recent comments determine whether the checkpoint already exists.
Narrative is canonical Markdown for GitHub, issue body/comments for Linear;
HTML is a derived view. Keep evidence and questions understandable without
local-only files. A file report need not become an issue or HTML presentation.

## Instruction and execution continuity

Retain loaded instruction identity: real path, package version and content hash
(or observed revision), applicable mode, and whether full content remains in
context. Preserve this ledger in compacted handoffs with the relevant rules.
Reuse unchanged, retained content. A path/version alone is not retained content:
reload when missing, changed, truncated, or uncertain; load only needed references.
Mutable issues, comments, statuses, refs and authorization are checked fresh for
writes and completion gates, never cached as instruction content.

Bound each instruction-return batch to the outer tool's output budget (default
at most 12,000 decoded characters per batch; smaller for small limits). Split
large files at headings with explicit continuation ranges. Inspect every result;
truncation is incomplete loading, not evidence a file was read.

Prefer completion notifications. Otherwise wait on supported jobs at useful
intervals (normally 10–60 seconds), retaining job identity and output offsets.
Do useful independent work while waiting. Do not poll every second or reread
unchanged git state/test tails. Repeat checks after changes, failures, or a
specific unresolved concern. Use helper --help and structured errors before
reading helper implementations.

## Source: templates/tracker-write.md

# Tracker writes

Canonical owner of publication authorization, fresh reads, deduplication, and
status races. Read only when an external write is authorized. Read-only scope
stops here without loading a write adapter or performing a mutation.

1. Identify the originating issue, repository, configured tracker and operation.
   Check current user authorization, inherited scope, and local overrides.
   Existing authorization suffices; skill invocation does not grant new scope.
2. Immediately before a write, refetch the current issue body, status and recent
   comments. Apply a minimal delta to that fetched body; preserve unrelated
   text and concurrent edits. If a version/CAS precondition is available, use it.
   Refetch narrows a race; it does not make an unconditional API write atomic.
3. Publish a meaningful checkpoint once. Compare recent comments and any saved
   operation result first, including on resume after uncertain delivery. Do not
   retry a comment blindly or post on both synced providers.
4. Status writes require the expected prior status and satisfied lifecycle gate.
   Resolve exact local status/field IDs. Stop and reconcile unexpected status,
   ambiguous target, incomplete discovery or unknown write outcome. Verify the
   result after mutation. Never overwrite an unexpected status or set Done.
5. Use only the configured adapter:
   - Linear: ../skills/linear-mode/SKILL.md and its write reference.
   - GitHub Projects: ../skills/github-projects/SKILL.md; verify item/field/option
     IDs and preserve local mapping. Missing code-review column stays In Progress.
   - GitHub Issues: gh issue view/edit/comment on the verified repository/issue;
     use structured bodies or --body-file. No synthetic project statuses.
6. Follow the workload contract for batch review handoffs and interrupted
   sequential transitions; the tracker adapter does not own integration gates.

A checkpoint states outcome, completed changes, verification and limitations,
questions with recommendations, and next action. Link only reachable evidence.
Keep private logs/secrets and unrelated information out. Local-only artifacts
are optional conveniences, never the sole evidence or question record.

## Source: skills/model-routing/SKILL.md

# Model routing

Executable defaults: `../../scripts/lib/model-policy.mjs`. Codex-kit receives
generated copies; never maintain a second ranking or infer machine defaults.

## Decide whether to delegate

Keep short lookups, immediate dependencies and tightly coupled edits local.
Launch an authorized bounded independent task only with useful parallel
coordinator work. Independent review needs fresh context even without a speed
benefit. Describe the task class and reason before launch; file count alone
does not determine complexity. Missing requirements/tools need clarification
or access, not higher effort.

| Task class | Codex default | Claude default | Effort |
|---|---|---|---|
| Simple: mechanical, clear acceptance criteria | Terra | chosen session; optional Terra delegation | low; medium on evidence |
| Coding: implementation judgment | Astra | Fable 5.1 | low; medium on evidence |
| Independent review of a fixed diff | Astra | Fable 5.1 | medium; low for small routine diff |
| Orchestration or specific intense reasoning | Astra | Fable 5.1 | medium |

Only low/medium/high are allowed. Never xhigh/max/ultra. Most workers stay
low/medium; high requires an explicit selection and recorded reason, never an
automatic task-class escalation. Preserve explicit
allowed user choices. These are worker defaults, not current-session or global
settings. Fable can delegate ordinary coding/UI to Astra, simple work to Terra;
follow repo design/typography/verification rules without provider quality claims.

## Launch and provenance

Use explicit model/effort on every launch. Supported IDs: gpt-6-astra,
gpt-5.6-terra, gpt-5.6-sol, claude-fable-5-1, claude-opus-5.
Sol/Opus are explicit compatibility choices, not automatic defaults.
No automatic Sonnet/Haiku/Luna routing. Check observable host access; if unknown,
record unverified. An unavailable requested model is a reported blocker;
never silently substitute. Public model listings do not prove account access.

Record task class/delegation reason, requested/resolved model, effort, worker ID,
policy version, escalation evidence and explicit fallback reason. If runtime
does not expose resolved identity, record unknown, not the requested model.
Provider independence is separate from model choice; cross review pairs against
the implementation author. Same-provider review still requires a fresh session.
Workload pairing/gates are owned by its workload contract.

Count coordinator, active workers and nested reviewers against host slots using
workerCapacity in the module. Limits are ceilings. Queue excess; unknown capacity
means one worker and no nesting. Honor host/user delegation restrictions.
Use a fresh bounded brief for model overrides when full-history forks cannot
change models. Coordinator owns tracker writes and final integration.

Claude-to-Codex uses codex-kit's task/reviewer adapters: --model astra --effort low
for ordinary coding, --model terra --effort low for simple work, --model astra
--effort medium for review. High needs --high-reason explaining the actual
orchestration/intense reasoning. No hand-written wrappers or companion polling.

## Source: skills/linear-mode/SKILL.md

# Linear adapter

Read repository tracker configuration first. An explicit tracker/linearTeam
conflict blocks writes. An absent binding means ordinary GitHub; do not infer
Linear from connected tools. Unreadable configuration is unknown, not permission
to silently select a different write destination.

For reads, resolve team and current repository. Fetch issue bodies and relevant
comments; scope candidates using verified GitHub attachment/PR or branch
repository, never titles alone. Report incomplete pagination or sampling.
Resolve exact status names; In Progress, Code Review and In Review share
type started, so type alone cannot select them.

Tool names are logical: get_issue, list_issues, list_comments,
list_issue_statuses, list_issue_labels, save_issue and save_comment. Map to the
current host. If tools are unavailable, report the limitation. An explicitly
authorized GitHub-twin fallback leaves Linear status/relations untouched;
do not silently change provider or double-post uncertain delivery.

Read only for the selected operation:
- Comment or body write: references/write.md.
- Status transition: references/status.md, plus write.md.
- Issue/branch/artifact intake and body templates:
  references/intake.md, plus write.md before publication.
- Optional longer checkpoint examples:
  references/checkpoint-examples.md.

These references replace former numbered sections 3–9. Callers citing an old
section choose its operation here; reads never load write/intake examples.
One team per repository is supported; projects/cycles are not managed.

## Source: skills/linear-mode/references/write.md

# Linear write adapter

Read `../../../templates/tracker-write.md` first. This reference owns sync-root
discovery and Linear body updates, not workload integration invariants.

## 3. The sync-thread rule — get this right or comments go nowhere

**Only replies to one designated comment thread cross over to GitHub.** A new
top-level Linear comment stays Linear-only, silently. This is the single
easiest thing to get wrong in Linear mode.

The designated sync root has `parentId: null` and this sync message:

> This comment thread is synced to a corresponding GitHub issue. All
> replies are displayed in both locations.

**Required procedure for every comment:**

1. `list_comments({ issueId })`. Follow every page/cursor exposed by the active
   tool before concluding discovery is complete. If results are truncated or
   completion cannot be established, sync remains **unverified**.
2. Find top-level comments (`parentId === null`) whose body contains the
   designated sync message and whose linked GitHub issue matches the expected
   repository **and issue number** from the issue's verified attachment/sync
   metadata. Resolve that target first; do not guess it from an unrelated URL.
   **Ignore `author` for selection:** null, omitted, and populated integration
   authors are all valid representations. A reply quoting the message is not a root.
3. Deduplicate repeated results by comment ID. Select only one unique matching
   root. If multiple roots match, report ambiguity and reconcile; never choose
   the first arbitrarily or post an update while the destination is ambiguous.
4. `save_comment({ parentId: <selected root id>, body })`, passing the issue
   identifier too if required by the active tool. The parent ID is the comment's
   ID, not the issue's ID.
5. No match after complete discovery means **sync unverified**, not proof that
   the issue is unsynced. Report the missing root/target and reconcile. If an
   authorized update must be preserved in Linear meanwhile, clearly label a
   top-level fallback as **Linear-only; GitHub delivery unverified**. Do not claim
   cross-posting succeeded or automatically post a second copy through GitHub.

Use the canonical selector in `../../../scripts/lib/linear-sync-root.mjs`
(or equivalent conditions) after collecting every comment page. It does not
fetch pages or perform writes.


**Never** post the same comment to GitHub with `gh` as well. Sync handles the
crossover; duplicating produces two copies on the GitHub side.

### Editing the body safely

`save_issue({ id, description })` replaces the whole description. Always
`get_issue` immediately before writing, apply your edit to the fetched text,
and write it back — otherwise a concurrent edit (the user's, or the GitHub
side's) is clobbered. Tick checkboxes this way; never reconstruct a body from
memory.

Issue descriptions sync bidirectionally with the GitHub twin, so a checklist
ticked in Linear shows ticked on GitHub. Only ever edit the body on **one**
side — Linear's — so the two can't race.

## Source: skills/linear-mode/references/status.md

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

For multi-issue handoff gates read `../../orchestrate/references/workload-contract.md`.
This adapter only maps those phases onto the exact configured statuses.

Non-code work that has no code-review phase (for example, a research or audit
deliverable) may move directly to `In Review` when it needs human review.

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

## Source: skills/linear-mode/references/intake.md

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

## Source: skills/github-projects/SKILL.md

# GitHub Projects contract

Read lifecycle frontmatter and local overrides before any tracker operation.
`tracker: github-projects` enables this contract. It overrides ordinary GitHub
label classification and Linear-specific transitions throughout the workflow.
An existing repository-specific Projects contract also takes precedence; offer
configuration migration without changing its semantics during refresh.

Example opt-in configuration (project owner/number and field/status names must
be verified against the actual project, never copied blindly):

```yaml
tracker: github-projects
githubProject:
  owner: Ironwood-Manufacturing
  number: 1
  title: Ironwood Website Work
  statusField: Status
  priorityField: Priority
  statuses:
    todo: Todo
    inProgress: In Progress
    inReview: In Review
    changesRequested: Changes Requested
  issueTypes: [Bug, Feature, Task]
branchPattern: username/<issue#>-<slug>
```

Keep existing frontmatter exactly during routine refresh. `linearTeam` cannot
coexist with `tracker: github-projects`. Stop conflicting tracker writes and
report the ambiguity. No Linear API calls for this mode.

1. Resolve project and field IDs with `gh project view <number> --owner <owner>
   --format json` and `gh project field-list <number> --owner <owner> --format
   json`, or equivalent connector queries. Match configured names exactly.
   Resolve repository Issue Types separately. Check authenticated capabilities;
   report missing project access rather than altering credentials or configuration.
2. Deduplicate against open and closed repository issues. Create one issue and
   one project item per work unit. Use the configured Issue Type, Assignee, and
   Project Priority; labels carry cross-cutting context only. Where supported,
   use `gh issue create --project <title> --type <type>`; otherwise use the
   available connector/GraphQL mutations. Verify the resulting issue and item.
3. Update status using the resolved project, item, field, and option IDs, via
   `gh project item-edit --id <item-id> --project-id <project-id> --field-id
   <field-id> --single-select-option-id <option-id>`. Re-fetch before changing
   status and verify afterward. Never infer status from open/closed alone.
4. At implementation completion, use the configured `codeReview` status if
   present. Otherwise keep the project `inProgress`, post the AI-review
   checkpoint, and record `code-review` in the workload manifest. Independent
   review still happens. A standalone issue goes to configured `inReview` after
   review; workload issues wait for the combined integration gate and umbrella PR.
5. Use the repository branch convention and link it with `gh issue develop`
   when supported. Add the issue as the project card, not a duplicate PR card.
   Completing standalone PRs may use `Closes`; partial/workload PRs use `Refs`
   until all included work is accepted under the repository's merge policy.
6. Keep decisions, findings, blockers, PR URLs, and verification on the issue.
   Agents never approve their own work or set `Done`. Honor existing user
   authorization for messages; do not post comments when a task is read-only.

The coordinator is the only tracker writer. Workers return structured results.
Use `scripts/lib/tracker-policy.mjs` from the package root to validate parsed
configuration and phase mappings. Do not invent a missing project field,
status, label, or organization Issue Type during a routine workflow run.

## Source: skills/board/SKILL.md

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Load only the tracker operation and mode needed for this request.

# board

After locating the repository's canonical lifecycle doc, run
`node <workflow-kit-root>/scripts/managed-version.mjs --cwd <repo> --lifecycle <canonical-doc>`.
Resolve the package root from this skill's real path, two directories up.
Include a one-line drift warning when needed; do not turn a status request into
an automatic refresh. A newer repository stamp is not permission to downgrade it.

Answers "where does this project stand?" against the tracker, scoped to **this
repository**.

Two modes. **Status is the default** — a fast, read-only orientation report,
which is what almost every question of this shape actually wants:

| The user asks | Mode |
|---|---|
| "what should I work on?" · "what's pending?" · "what's in flight?" · "what did we just finish?" · "where are we?" | **status** (default) |
| "what fell through?" · "what's stale?" · "audit the board" · `/workflow-kit:board audit` | **audit** |

Status **never mutates anything and never asks for approval** — it's a read.
Audit proposes and waits. When genuinely ambiguous, run status and offer audit
in one line.

Distinct from `work-audit`, which sweeps the **repo** for stale folders,
branches, and files. This sweeps the **tracker**.

## Resolving the tracker

Read the lifecycle doc's frontmatter for `linearTeam`
(see `../linear-mode/SKILL.md` §1).

- **Linear mode on** → the repo is bound to that Linear team. Query it with
  `list_issues({ team })`, and read discussion with `list_comments({ issueId })`.
  Statuses are real, so the report can be precise.
- **GitHub Projects configured** → use the local project fields/status mappings;
  read `../github-projects/SKILL.md` without executing its write operations.
- **Ordinary GitHub Issues** → use `gh issue list` against this repo. Everything below
  still works, but status collapses to open/closed: "available" means open and
  unassigned, "in progress" means an open issue with a linked branch or PR, and
  there is no `Code Review` or `In Review`. **Say that limitation once**,
  plainly, rather than implying states the tracker doesn't have.

One scoping caution: a Linear team can span more than one repository. When the
team's issues clearly cover work outside this repo, say so and report the
subset tied to this repo (via the GitHub twin's attachment, branch names, or
project), rather than silently presenting the whole team's board as if it were
this repo's.

## Mode: status (default)

Read-only. Report, in this order — lead with what's actionable, not with
history:

1. **Awaiting you** — `In Review`, plus any issue whose latest comment asks the
   user a question that nothing after it answers. **This is the top of the
   report**, because it's the only category the user alone can unblock. Include
   the actual question, not just a count.
2. **Awaiting AI code review** — `Code Review`, oldest first. Include its
   branch/PR and the implementation-complete checkpoint. Recommend
   `/workflow-kit:code-review queue` when this category is non-empty; do not
   present these as human-review items.
3. **Available to pick up** — `Todo` (or open + unassigned), ordered by
   priority. For each: key, title, one-line summary of what it involves, and
   whether it's specified enough to start cold. Flag anything whose blockers
   are still unresolved as not actually available.
4. **In progress** — `In Progress`, with the branch/PR if one exists and the
   last checkpoint comment's date. Note anything with no activity in ~2 weeks;
   that's a candidate for audit mode rather than a real in-flight item.
5. **Recently completed** — `Done` (or closed) within the last ~2 weeks, one
   line each. Keep this section short; it's context, not the point.
6. **Needs shaping** — anything in `Triage`, with what's unclear about it.

Read the comments, not just the issue list. **Pending work hides in comment
threads**: an unanswered question, a decision the user was asked for, or
follow-up work someone mentioned and never filed. Where a thread reveals
something material that the status field doesn't, say so inline on that issue.
Also check `list_documents` when a team uses Linear documents, and cite any
that bear on an issue in the report.

Reading every comment on every issue is too expensive for a routine orientation
query. Read comments on everything in `In Review`, `Code Review`, and
`In Progress`, plus anything in `Todo` that looks blocked or ambiguous; skip
the rest. **If you
sampled rather than read exhaustively, say so** — a report that looks complete
but isn't is worse than one that states its own limits.

End with a single recommended next action — the one thing worth picking up now,
and why. If the answer is "nothing is ready, three things need your input,"
say that instead of manufacturing a task.

Return the complete report in chat. Do not call update-issue or mutate tracker
state. Render through present only when HTML is requested; pass read-only scope.

For an explicit audit read references/audit.md.

## Source: skills/new-feature/SKILL.md

# Minimal issue intake

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Use for authorized repository implementation. Personal advice, read-only audits
and requested standalone reports do not require issue intake.

1. Resolve the repository and search for an existing matching issue. Reuse it
   rather than filing a duplicate. Derive a short slug from the task.
2. Read the configured adapter and `../../templates/tracker-write.md` before
   publication. Ordinary GitHub: create a sentence-case title, concise goal/
   acceptance criteria and Tasks checklist with configured labels. Projects:
   use its Issue Types, fields, status mappings and branch convention.
   Linear: load `../linear-mode/references/intake.md` for canonical body,
   labels and gitBranchName; use its verified sync thread for comments.
3. Compare the repository lifecycle stamp with
   `../../scripts/managed-version.mjs` using its canonical --lifecycle path.
   Report drift in one line; do not refresh/downgrade implicitly.
4. Create no folder for an issue-only fix. When an artifact actually needs a
   home, use <workDir>/features/<issue#>-<slug>/. GitHub Markdown carries its
   useful spec/notes; Linear narrative stays in the issue. Do not create empty
   spec/plan stubs. Artifact headers identify the issue; in Linear include
   the verified GitHub twin and Linear key.
5. Return issue URL and the next action suited to scope. Small ready work can
   proceed when implementation was requested. Interview/spec/ticket escalation
   remains opt-in; do not start it merely because intake completed.

Templates are examples, not compulsory artifact creation. The caller owns one
meaningful start checkpoint; don't duplicate creation text with an empty update.

## Source: skills/implement/SKILL.md

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Load only the tracker operation and mode needed for this request.

Implement a named issue's acceptance criteria or the feature folder's `spec.md` — or, under
Linear mode, in the issue body plus its spec comment
(`../linear-mode/SKILL.md`) — or in the specific sub-issue ticket the
user names. **One ticket per fresh session** — don't chain tickets in one
context; hand off between them.

- Apply `update-issue` when implementation starts. Name the branch, the ticket
  or checklist slice in progress, and the next verification checkpoint.
- Work on a branch referencing the issue (`feat/<issue#>-<slug>`) unless the
  repo's conventions say otherwise. Under Linear mode, use the issue's
  `gitBranchName` instead (linear-mode §5) — that is what makes Linear
  auto-link the PR and drive its own status transitions.
- **Apply the `ponytail` coding principles to code you write** — the ladder
  governs the implementation: reuse > stdlib > native > installed dep > one
  line > minimum code. Never simplify away what the spec explicitly requires;
  challenge it in a note instead.
- Use the `tdd` skill where possible, **at the seams pre-agreed in the spec**
  (its Testing Decisions section). Existing tests, public interfaces and issue acceptance criteria
  count as agreement; clarify only material unresolved scope/coverage choices. Test depth is tdd's call, not
  ponytail's — its one-check minimum applies only where tdd isn't in play.
- Run affected-area checks and required repository validation at the completed
  change. Broaden on impact, failures or unresolved risk; do not repeat green
  checks without new evidence. Record the tested diff/head and limitations.
- With Linear mode off, run `code-review` on the completed work and address what
  it surfaces, as before. With Linear mode on, do **not** self-review: the
  independent review agent owns the `Code Review` queue.
- Commit only when user/repository authorization permits. Apply `update-issue`: summarize what changed,
  verification results, the exact branch/PR and fixed point for the later
  review, link only pushed/reachable artifacts, and tick the completed
  checklist item. Leave closure to the authorized wrap/human-acceptance gate. Under Linear mode, nothing is closed: use
  `Refs #<gh#>`, never `Closes`, and move the implemented issue to
  `Code Review`. The implementation agent must not run `code-review` on its
  own work; an independent review agent owns the next transition.
- If implementation pauses, blocks, or needs the user's verification or a
  decision, apply `update-issue` before ending the session. Put the exact ask,
  recommendation, current state, and resumption step in the issue comment.
- Keep one canonical checkpoint; create notes/artifact folders only when they
  carry useful information beyond the issue update.

Read `../model-routing/SKILL.md` for model/effort selection. Repository policy
may narrow model choices or task ownership; it cannot raise the high effort
ceiling or silently restore old generation-specific defaults.

Before claiming ready, record proportionate evidence of the issue's core user
task in the intended environment. Explicitly list unresolved runtime, schema,
config, deployment, or human-verification prerequisites. Passing isolated tests
does not prove an unavailable user-facing scenario works.

At the final checkpoint, name the next action in one line: independent
`code-review` while code awaits review, or `wrap-feature` only after the user
has accepted shipped work. Apply `update-issue` directly at meaningful gates;
do not make the user remember a second bookkeeping command.

## Source: skills/ponytail/SKILL.md

# Coding principles

Use these principles when editing code, scoped to the requested behavior.
Read relevant repository rules, glossary and existing patterns.

Prefer reuse → standard library → platform feature → installed dependency →
small direct implementation. Look for an existing solution before adding one.
Avoid speculative abstractions, duplicate state and unnecessary configuration.
Preserve explicit requirements, public contracts, security checks and deliberate
ADR decisions; raise a concrete concern rather than silently deleting behavior.

Trace root cause through changed behavior, affected callers, public contract and
adjacent tests. Expand reading when uncertainty, impact or failures justify it;
a mechanical edit does not require reading every caller or whole file.

Run proportionate affected-area verification and required repository checks.
Use TDD for meaningful behavior tests where applicable; do not add a test that
merely repeats the implementation or tests a reversible cosmetic edit.
Report changed behavior, evidence and material limitations in ordinary language.

## Source: skills/tdd/SKILL.md

# Test-Driven Development

TDD is the red → green loop. This skill is the reference that makes that loop produce tests worth keeping: what a good test is, where tests go, the anti-patterns, and the rules of the loop. Load examples or mocking guidance only when the test needs them.

When exploring the codebase, read `CONTEXT.md` (if it exists) so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you're touching.

## What a good test is

Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't. A good test reads like a specification — "user can checkout with valid cart" tells you exactly what capability exists — and survives refactors because it doesn't care about internal structure.

See tests.md for examples and mocking.md for mocking guidelines.

## Seams — where tests go

A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.

Existing public interfaces, adjacent tests, and issue acceptance criteria count
as routine agreement on seams. State the selected boundary and proceed.
Ask only when choosing a seam changes scope, behavior, or a material coverage
tradeoff that the available requirements do not resolve.

When the public interface or seam is unclear, consult
`../codebase-design/SKILL.md` for module/interface/depth/seam vocabulary.

## Anti-patterns

- **Implementation-coupled** — mocks internal collaborators, tests private methods, or verifies through a side channel (querying the database instead of using the interface). The tell: the test breaks when you refactor but behavior hasn't changed.
- **Tautological** — the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth — a known-good literal, a worked example, the spec.
- **Horizontal slicing** — writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior: you test the _shape_ of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead — one test → one implementation → repeat, each test a **tracer bullet** that responds to what the last cycle taught you.

## Rules of the loop

- **Red before green.** Write the failing test first, then only enough code to pass it. Don't anticipate future tests or add speculative features.
- **One slice at a time.** One seam, one test, one minimal implementation per cycle.
- **Refactoring is not part of the loop.** It belongs to the review stage (see the `code-review` skill), not the red → green implementation cycle.

## Source: skills/code-review/SKILL.md

# Independent code review

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Review a fixed diff along **Standards** (repo rules) and **Spec** (requested
behavior). An advisory review is read-only even if it names an issue.
--fix authorizes fixing, not self-approval or unrelated tracker publication.

Choose one mode:
- Targeted branch/PR/issue/base: continue below.
- Explicit repository queue: read `references/queue.md`.
- --workload <id>: read `references/workload.md`.

## Targeted review

1. Resolve base and head: PR supplies both; a named branch/issue uses default
   branch as base; a base-only argument compares that base to HEAD.
   Pin Git-resolved SHAs, three-dot diff and commit list. Missing refs or empty
   diff are a reported blocker, not a successful review.
2. Use supplied requirements, named issue acceptance criteria, existing spec,
   or sub-issue plus parent spec. For Linear fetch current body and relevant
   decision/spec comments through its read adapter. Use cited research when
   relevant. If no spec exists, state that the Spec axis is unavailable; ask
   only if that prevents a useful requested review.
3. Read changed behavior, affected callers, public contract, adjacent tests,
   relevant repo standards/glossary/ADRs. Expand on uncertainty or material
   impact. For the code-smell baseline read `references/standards.md`;
   repo standards override heuristic smells, and tooling-enforced style is
   not a review finding.
4. A reviewer must be independent of the implementation author. Read
   `../model-routing/SKILL.md` and `references/providers.md` when dispatching;
   one fresh reviewer covers both axes by default. A reviewer already running
   independently performs the review locally. Do not spawn a reviewer merely
   to restate the work of an existing independent reviewer.
5. Report evidence-backed findings separately by axis with severity, path,
   requirement/standard and effect. Re-derive material findings before fixes.
   With --fix, apply accepted changes and affected verification; obtain an
   independent final-head receipt when fixes change the diff. Unresolved
   material findings or missing evidence prevent claiming ready.
6. Return outcome, both axes, tested/reviewed base/head, limitations and next
   action. HTML is optional through pure present. For authorized lifecycle
   publication the caller uses update-issue once and the selected tracker
   write/status reference. Advisory review ends in chat with no mutation.

Workload convergence, final-SHA receipts and integration are owned by its
contract. Standalone completed independent review may hand off to human review
only after fresh expected-status checking; implementation cannot self-promote.
Never set Done or infer merge authorization from a successful review.

## Source: skills/code-review/references/providers.md

### 4. Run an independent reviewer

Read `../../model-routing/SKILL.md`; pass explicit model and effort controls.

Choose the provider before launching review:

- Codex-authored implementation → fresh Claude reviewer selected by model-routing by default.
- Claude-authored implementation → fresh Codex reviewer selected by model-routing by default.
- `codex-only` / `claude-only` workloads → a fresh, context-independent
  session of that provider.

The reviewer covers both axes in one fresh independent session by default.
For Codex from Claude use the dedicated reviewer adapter with exact --cwd,
base/head, standards and issue/spec content. Use separate axis workers only
when their bounded independent work benefits parallel review within capacity.
Never call the low-level companion runtime or poll its state files.

#### Optional separate axis prompts

Only when separate axes were selected, use these brief shapes.

**Standards sub-agent prompt** — include:

- The full diff command and commit list.
- The standards-source files found in step 3, **plus the smell baseline pasted
  in full** — the sub-agent has no other access to it.
- The brief: "Report — per file/hunk where relevant — (a) every place the diff
  violates a documented standard: cite the standard (file + rule); and (b) any
  baseline smell you spot: name it and quote the hunk. Distinguish hard
  violations from judgement calls — documented-standard breaches can be hard,
  but baseline smells are always judgement calls, and a documented repo
  standard overrides the baseline. Skip anything tooling enforces. Under 400
  words."

**Spec sub-agent prompt** — include:

- The diff command and commit list.
- The path or fetched contents of the spec (and ticket, if reviewing one).
  Under Linear mode, **paste the issue body and spec comment in full** — the
  sub-agent may have no Linear tool surface, so a key alone gets it nothing.
- The brief: "Report: (a) requirements the spec asked for that are missing or
  partial; (b) behaviour in the diff that wasn't asked for (scope creep);
  (c) requirements that look implemented but where the implementation looks
  wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the report.

## Source: skills/code-review/references/standards.md

On top of whatever the repo documents, the Standards axis always carries the
**smell baseline** below — a fixed set of Fowler code smells (*Refactoring*,
ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it
  endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible
  Feature Envy"), never a hard violation — and, like any standard here, skip
  anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy** — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality** — abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

## Source: skills/code-review/references/queue.md

# Repository review queue

Only for an explicit queue request. Resolve current repository/default branch,
configured tracker and exact local Code Review mapping. Query that phase;
keep only issues verified through GitHub attachment/PR or branch repository,
never the title alone. Missing status is a blocker, not a substitute In Review.
Resolve each PR head/base or issue branch without changing its worktree.
Read the targeted review procedure for each candidate. A missing/empty diff
leaves that issue blocked; continue independent remaining candidates.
Publish authorized checkpoints through the tracker-write contract.
Report reviewed, blocked, workload-pending, and excluded keys separately.

## Source: skills/code-review/references/workload.md

# Workload review

Read `../../orchestrate/references/workload-contract.md` and show the named
manifest. Review only frozen heads. The coordinator owns worker dispatch,
round reservations, tracker writes and final handoff. A dispatched reviewer
covers assigned axes without nested workers. Return full base/head, tested SHA,
execution identity and provider:full-head-sha:durable-receipt-id.
Fixes invalidate prior tests/receipt. Record reviewed-pending-integration and
keep the tracker in its code-review phase until the combined workload gate.

## Source: skills/orchestrate/SKILL.md

# Orchestrate queue

Explicit multi-issue execution or read-only --plan. Claude uses
/workflow-kit:orchestrate; Codex uses $orchestrate-queue.

Read repository configuration/local overrides, `../../templates/lifecycle-contract.md`,
`references/workload-contract.md`, and `../model-routing/SKILL.md`.
The workload contract owns provider independence, review convergence, final-SHA
receipts, integration gates, single-writer rules and human acceptance.
Read only the configured tracker adapter; writes use
`../../templates/tracker-write.md`. Do not load the portable fallback too.

## Execute

1. Reconcile the repository/default branch, issue selection, existing PRs,
   branches, worktrees and configured tracker. Run managed-version with the
   canonical lifecycle path; report drift without refreshing. Use
   `../workflow-doctor/references/preflight.md` for the selected capabilities.
   A new run needs a name and exactly one selection source: named issues,
   parent children, or a status/label query. Scope to this repository, dedupe,
   then freeze membership. A parent without children may use single implement;
   never manufacture a workload for a small issue.
2. For --resume, show the saved manifest and reconcile refs, recorded SHAs,
   PRs, tracker states, worktrees and worker jobs. Preserve saved policy and
   authorization; continue the first incomplete gate without duplicate workers.
   Reconcile partial batch writes individually before proceeding.
3. Use this skill's scripts/workload-manifest.mjs helper. Read
   `references/commands.md` when creating/changing a run; use --help for schema
   details. --plan uses --dry-run and creates no files, Git or tracker state.
   Report frozen issues, overlap/dependency lanes, routes, round cap and next gates.
4. Serialize dependent/overlapping work; parallelize bounded independent work
   only while the coordinator has useful work. Respect model-routing capacity.
   Lease one worktree per issue, using Linear gitBranchName or local convention.
   For dispatch read `references/worker-prompt.md` and
   `references/worker-envelope.md`. Give each worker relevant repo rules,
   issue acceptance criteria, allowed files, base/head and focused verification.
5. Mark implementation start when a worker actually begins. Validate returned
   envelopes and tracked/untracked changes. Commit/push only as authorized.
   Record code-review with full base/head, execution and head-bound tests;
   publish one implementation checkpoint via update-issue.
6. Dispatch independent review following the workload contract's pairing and
   round reservation rules. Give both Standards and Spec axes. Adjudicate
   findings against evidence, fix, verify, and obtain the final-head receipt.
   Record reviewed-pending-integration. Use the dedicated reviewer adapter for
   cross-host review; no hand-written CLI wrappers or state-file polling.
7. Once the workload contract permits assembly, fetch current default branch,
   combine exact reviewed heads in dependency order on integration/<slug>.
   Record assembling, base/head, combined tests and any conflict-review receipt.
   Create the authorized draft umbrella PR; never merge as part of orchestration.
8. Validate the manifest and perform the contract's reconciled tracker handoff.
   The coordinator publishes each authorized checkpoint once, verifying write
   results. Follow local Projects mappings or ordinary GitHub checkpoints.

## Output and continuity

Derive an outcome-led dashboard from validated envelopes/manifest; do not paste
raw JSON. Use scripts/render-worker-result.mjs as the optional deterministic
renderer. Include verification, blockers, remaining prerequisites and next action.
The final dashboard fields and merge statement are in the workload contract.

Use --resume-context for intended-environment acceptance evidence, owned
processes/jobs, unresolved schema/config/deployment needs and next action.
An optional --handoff-snapshot is derived from the manifest, never a second
canonical record; preserve instruction identity/retained content in handoff.
Research follows `../research/SKILL.md`; cited chat findings suffice unless an
artifact is requested or reusable. Follow lifecycle wait rules.

## Source: skills/orchestrate/references/workload-contract.md

# Workload contract

Canonical owner of multi-issue invariants. Action skills reference these gates;
the manifest helper enforces their durable state/evidence. Standalone issues
use implementation → independent review → human review.

## Membership and ownership

Freeze repository-scoped, deduplicated issue membership for each run. Do not
admit new query matches on resume. Default handoff is all-or-nothing.
--allow-partial requires explicit authorization and a durable explanation
before removing deferred issues from frozen membership.

Only the coordinator changes tracker state/comments, creates/deduplicates
discoveries, creates/merges PRs, assembles integration, changes membership,
or launches workers. Workers edit/test leased worktrees and return envelopes;
review workers cover assigned axes without nested delegation. Audit tracked
and untracked files before committing or integrating. Preserve dirty/active
worktrees. Source edits use structured patches, not shell-built edits.
Follow lifecycle instruction-retention and wait rules; never duplicate a
worker just because a session ended.

## Independent review and routing

Model/effort is owned by ../../model-routing/SKILL.md. Provider pairing uses
the author of each implementation diff, not the coordinator:
- cross: Codex author → fresh Claude reviewer; Claude author → fresh Codex reviewer.
- codex-only / claude-only: fresh independent same-provider session.
Explicit implementer/reviewer choices must obey the selected pair mode.
The same session/agent cannot implement and review an issue.
Manual integration/conflict-resolution edits require a reviewer from the
provider opposite their author, even in a same-provider issue pair mode.
A conflict-free merge needs combined verification, not repeated issue reviews.

## Review convergence

Default maxReviewRounds = 2 is a stop/reconcile threshold, never approval.
Preserve saved policy on resume; absent legacy policy is unverified.
Strict is default. Convergent policy or live changes require a run-scoped
user decision recorded via --policy-decision / set-policy.
Do not infer consent from historical anecdotes or a restarted session.

Reserve each launch with set-issue --state code-review. The first implementation
transition reserves round 1; do not reserve it twice. A new reviewer identity,
another launch on an unchanged head, or failed launch consumes a round;
metadata edits for the same worker do not. One dispatch's axes are one round.
Do not reset counts by reopening implementation. Beyond the cap requires
--allow-extra-round --reason with explicit user authorization.

Strict leaves unresolved findings blocking. Approved convergent policy:
round 1 blocks high/medium; round 2 onward may defer eligible nonblocking
medium/low. Acceptance, correctness, security and data-loss blockers always
block regardless of severity. High is never deferred/downgraded to fit a cap.
Review full scope initially, then fixes/affected behavior; broaden on material
scope change. Coordinator adjudicates and deduplicates follow-ups.
Store --review-findings entries: id, severity, category, blocking, status,
summary, followUp, decision. Stable IDs identify repeats. Fixed = resolved;
remaining = deferred with real issue key/URL and decision reference before
completion. No automatic severity/effort escalation from older issue rules.

## Evidence and state

Dispatch/validate using worker-envelope.md.
code-review requires Git-resolved full base/head, implementation provider/
execution and passing tests containing the exact tested head SHA.
reviewed-pending-integration also requires reviewer/execution and a receipt:
<review-provider>:<full-head-sha>:<durable-receipt-id>.
Head changes invalidate tests and review receipt. Prose completion cannot
substitute for validated Git/manifest evidence.

Record --implementation-execution / --review-execution every launch:
requested/resolved model, effort, worker ID, policy version, high reason and
explicit fallback reason. Unexposed resolved identity is null/unknown.
Schema 2 migration: preview migrate --dry-run then apply; preserve membership,
status, SHAs/receipts and leave historical execution/counters unknown rather
than inventing evidence or consent. New work replaces legacy metadata.

Keep reviewed issues in tracker Code Review (or local mapped phase), with
manifest reviewed-pending-integration. No new tracker status for this state.
GitHub Projects without codeReview keeps inProgress; ordinary GitHub uses
checkpoints with no invented statuses. Tracker writes follow the shared
tracker-write contract and selected adapter.

## Integration gate

After every included issue has a final review receipt, fetch default branch
and create integration/<slug> from its current remote SHA. Combine exact
reviewed heads in dependency order, detecting stacked ancestry to avoid
replaying commits. Audit membership against commits/changed files.
Resolve conflicts only on integration, record affected paths and conflict
history, and independently review the manual resolution diff.
Do not clear recorded conflict history.

Record ordered integration state pending → assembling → ready-for-human-review
→ merged. Combined tests must bind to full integration head SHA; conflicts
require --conflicts-occurred and --conflict-review-receipt
<provider:head-sha:receipt-id>, never a bare boolean.
Run repository integration checks once, serializing shared build outputs.
Create/push the authorized draft umbrella PR against default branch; use Refs,
never Closes under Linear. Keep individual PRs as evidence until acceptance.
Orchestration never merges.

## Human handoff and resume

While assembling, validate every issue receipt and integration gate.
Immediately before batch transition refetch all issues; require each expected
Code Review/mapped status. Unexpected status stops/reconciles, never overwrites.
Publish one workload-ready checkpoint per issue, move eligible statuses to
In Review, record each sequential result, set manifest issues in-review,
then integration ready-for-human-review and validate again.
Never mark ready while tracker and manifest disagree. On interruption reconcile
successful and unknown writes individually, then visibly complete or roll back
the batch; writes are not transactional. Do not blindly repeat comments.
Never set Done.

Before final merge fetch current main again; advancement requires recombination
and combined verification. Manual resolutions/material behavior changes require
fresh human acceptance of the new head. Merge/destructive cleanup require
explicit authorization. Preserve leased worktrees/processes; verify process
command/start-time/ownership, never stop by PID alone.

Manifest is canonical state; tracker is canonical narrative. Optional
--handoff-snapshot is derived and checked against manifest updatedAt on resume.
--resume-context records intended-environment acceptance evidence, owned jobs/
processes, unresolved schema/config/deployment/live-data prerequisites and next
action. Unknown prerequisites remain unknown; passing unit checks is not proof
the unavailable core user task works.

## Final dashboard

Return human-readable outcome plus a table: issue, implementer, reviewer,
branch, receipt, membership, tests, blocker, rounds/limit and linked follow-ups.
Include integration branch/base/main SHA, umbrella PR, whether main advanced,
observed issue transitions, remaining prerequisites and exact checkout/test
action. State **Not merged to main** until a separately authorized merge succeeds.
Never paste raw envelopes unless explicitly requested.

## Source: skills/orchestrate/references/worker-envelope.md

## Worker envelope

Require every implementation and review worker to return:

```json
{
  "issue": "KEY-123",
  "stage": "implementation|review|integration",
  "branch": "owner/key-123-slug",
  "worktree": "absolute path",
  "baseSha": "commit",
  "headSha": "commit",
  "provider": "codex|claude",
  "execution": { "requestedModel": "gpt-6-astra", "resolvedModel": null, "resolutionStatus": "unverified", "effort": "low", "highReason": null, "workerId": "runtime-session-id", "policyVersion": "2026-09-04", "fallbackReason": null },
  "state": "complete|blocked",
  "summary": ["plain-language outcome"],
  "changedFiles": [],
  "untrackedFiles": [],
  "tests": [
    {
      "command": "exact command",
      "status": "passed|failed|blocked|skipped",
      "tests": 0,
      "headSha": "exact tested commit",
      "details": "optional useful result"
    }
  ],
  "reviewReceipt": null,
  "blocker": null,
  "discoveries": []
}
```

The coordinator validates the envelope against Git and the manifest. Do not
trust a prose-only completion claim.

`stage` and `summary` are required so the presentation layer never describes an
independent review as an implementation pass or substitutes a file list for an
outcome. A legacy envelope without `stage` may be rendered generically, but the
coordinator must supply the known stage to the renderer. A completed envelope
without conclusive passing verification is incomplete and cannot advance the
issue. Keep the exact tested SHA in the structured `headSha` test field; the
default renderer omits it while `--technical` exposes exact machine details.

The envelope is an internal protocol, not a user report. Store and validate it
as structured data, but never paste it into chat, a final answer, or a tracker
checkpoint unless the user explicitly requests raw JSON. Render a human
checkpoint with outcome, changes, verification, relevant notes, and next
action. Keep absolute paths, schema fields, and full SHAs in the envelope; show
them only when they are actionable or explicitly requested.

When persisting the envelope, record full Git-resolved base/head commits. The
`tests` evidence must include the exact tested head SHA. A final review receipt
must use `<review-provider>:<full-head-sha>:<durable-receipt-id>`. Changing the
head invalidates both old values. The manifest helper enforces integration
state order (`pending → assembling → ready-for-human-review → merged`) and
requires a head-bound conflict review receipt when conflicts occurred.

## Source: skills/integrate-reviewed/SKILL.md

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Load only the tracker operation and mode needed for this request.

# Integrate reviewed workload

Before integration, reconcile saved acceptance evidence, branch/worktree/head,
in-flight jobs, policy decisions, and remaining runtime/config/deployment gates.
Use proportionate evidence that the core user task works in the intended
environment; do not turn unknown prerequisites into a ready claim. Preserve
dirty/active worktrees and confirm process command/start-time/ownership before
stopping any owned runtime. Keep domain-specific commands in the consuming repo.

Accept `--run <workload-id>` and `--mode merged|local-main`. Resolve a named workload and mode from explicit natural-language authorization
as well as flags ("merge workload X" selects merged). If the target or action is
ambiguous, show the manifest and ask only for what is missing. Acceptance alone
is not merge authorization.
Invocation with `--mode merged` is authorization to merge only the named
workload's umbrella PR after every gate below passes.

Read `../orchestrate/references/workload-contract.md`, the repository lifecycle,
and the run manifest using `../orchestrate/scripts/workload-manifest.mjs`.

## Gates

1. Validate the manifest. Require integration state
   `ready-for-human-review`, every included issue `in-review`, final-SHA review
   receipts, combined tests, and one umbrella PR.
2. Confirm the checked-out/tested integration head still equals the manifest
   head and the remote PR head. Stop on drift.
3. Re-fetch every issue and require the configured human-review status
   (`In Review` for Linear, verified inReview mapping for Projects). Ordinary
   GitHub uses the completed human-review checkpoint and manifest gates rather
   than an invented status. Never overwrite an unexpected status.
4. Fetch the remote default branch. If it advanced after the recorded base,
   combine it into the integration branch, resolve conflicts only there,
   independently review manual resolutions, rerun the repository integration
   gate, push, and update the manifest.
5. If the refresh introduced manual resolutions or materially changed the
   tested behavior, stop with the updated branch at `In Review` and require a
   fresh human acceptance of the new head. Do not treat the earlier acceptance
   as approval of different code.

## Modes

### `local-main`

Verify local main is clean and still points at the expected base. Fast-forward
or merge the exact integration head into local main, run the final smoke gate,
and leave Linear at `In Review`. Do not push main, merge the PR, close issues,
or set `Done`.

### `merged`

Require the umbrella PR to target the default branch and contain every manifest
head. Merge through GitHub using the repository's configured merge method.
Allow GitHub/Linear merge automation to set `Done`; never write `Done`
directly. Verify the default branch contains the integration head and reconcile
individual draft PRs as already integrated/superseded without duplicating
commits.

## Wrap

Update the manifest integration state to `merged` only after verifying the
merge. Publish one final checkpoint per issue through the configured tracker
adapter (verified sync thread only for Linear), with merge commit and
verification. Remove only manifest-leased worktrees/processes and prune only
merged branches after resolving every target path inside the sanctioned
worktree root.

Report the merged/local head, issue transitions observed, individual PR
reconciliation, cleanup, SQL/configuration/deployment/live-data gates, and any
remaining human action.

## Source: skills/wrap-feature/SKILL.md

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.

# Wrap feature

Wrap the named human-accepted issue. Infer an unambiguous target from context,
but acceptance does not prove merge or authorize unrelated cleanup.

1. Verify independent review and human acceptance, then confirm PR merge or
   exact implementation commits on the default branch. For a workload read
   `../orchestrate/references/workload-contract.md` and its manifest. Accepted
   but unmerged work routes to `../integrate-reviewed/SKILL.md` only for the
   explicitly authorized action; do not skip current-main or final-head gates.
2. Verify acceptance criteria/checklist are complete or explicitly dropped.
   Missing review, unmerged changes or unknown prerequisites stop cleanup.
   A request to skip optional cleanup does not waive review/integration gates.
3. Read `../../templates/tracker-write.md` for authorized record publication.
   Keep one outcome record with shipped changes, decisions, checklist
   disposition, verification, remaining limitations and next action.
   GitHub uses existing notes/spec when useful; Linear uses its issue record.
   Update personal memory only when the user explicitly requests it.
4. In Linear, refetch status: In Progress/Code Review stops wrap; In Review/Done
   stays unchanged. Other statuses require reconciliation. Never set Done or
   close the GitHub twin. Ordinary GitHub closure requires completed wrap and
   authorized closure; preserve Projects mappings and human ownership.
5. Clean only explicitly authorized feature-owned ephemera. Verify resolved
   paths stay under the named feature/worktree root. Preserve dirty/active
   worktrees, unrelated files and owned runtime identity. Archive canonical
   Markdown/research using git mv when tracked; a missing folder is normal.
   Prune only verified merged branches/worktrees. Unmerged/force cleanup
   requires separate explicit authorization.
6. Report what shipped, was recorded, archived/deleted/skipped and remains.
   Link only reachable evidence; do not report an issue closed unless verified.

The caller posts one final checkpoint, not one per cleanup operation.

## Source: skills/update-issue/SKILL.md

# Update issue

Publish one authorized phase delta for the caller. Read
`../../templates/lifecycle-contract.md` for scope/checkpoint ownership and
`../../templates/tracker-write.md` before any write. A read-only request or
nested renderer/research worker returns content without publishing.

Meaningful checkpoints: started, phase result, needs decision, paused/blocked,
ready for independent review, ready for human review, completed non-code work.
Do not narrate every tool call or duplicate a checkpoint already published.

Use a short outcome followed by relevant completed work, verification,
limitations, questions with recommendations, reachable evidence, and exact next
action/owner. Larger examples are in
`../linear-mode/references/checkpoint-examples.md`; load only when needed.
Tick only completed acceptance/tasks on the freshly fetched issue body.
A phase result does not close the parent or satisfy human acceptance.

Use the selected tracker adapter for status mapping, body updates, and comment
delivery. For Linear publish only through its verified sync thread, never both
providers. The caller retains write results and reconciles uncertain delivery
before retrying. Final chat identifies the issue URL only if a durable update
was actually published.

## Source: skills/research/SKILL.md

# Research

Read `../../templates/lifecycle-contract.md` for scope and checkpoint ownership.
Default short documentation lookup to local execution and a cited chat answer.

Investigate against primary sources: official docs, source code, specifications,
or first-party APIs. Verify changeable facts live; separate evidence, inference,
and unresolved questions. Follow claims to the source that owns them.

Delegate only an authorized, bounded independent question while the coordinator
has useful parallel work. Read `../model-routing/SKILL.md` before launching.
A lookup that the coordinator needs immediately normally stays local. A worker
returns cited findings; it does not create issues or publish checkpoints.

For an explicit report, deliver the report in the requested format. Persist
Markdown when requested or when substantial reusable evidence warrants it.
For issue-backed artifacts use the existing feature's research/ directory,
creating that directory only when needed. Personal/advisory reports use the
requested path or chat; no compulsory issue intake, commit, or HTML.
Use present only for a requested/useful HTML view of already-supplied findings.

Return answer, sources, confidence/limitations and next action. For authorized
issue-backed work the caller publishes one checkpoint through update-issue.
