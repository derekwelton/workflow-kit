# workflow-kit cheat sheet

Every skill, how they interact, when they load, and what order to use them in.
(The per-repo `feature-lifecycle.md` carries a condensed version of this; this
is the full reference.)

## The one picture

```
                                ┌──────────────────────────────────────────────┐
                                │  WAYFINDER — foggy epic, > one session?      │
                                │  map issue + decision tickets; each ticket   │
                                │  runs grilling / research / prototype and    │
                                │  ends in a spec or decision, then ↓ as usual │
                                └──────────────────────────────────────────────┘
 IDEA ───── a whole pile of them? ──► plan ── dedupe · classify · prioritize ──┐
  │                                          one approval → many issues        │
  │◄────────────────────────────────────────────────────────────────────────────┘
  ▼
 new-feature ──────── files the ISSUE first; folder only if artifacts will exist
  │                    update-issue mirrors every meaningful lifecycle change
  │                    back to the issue (start/checkpoint/input/pause/done)
  │
  ▼
 grilling ─────────── bulk-question rounds until shared understanding
  │      ▲                │                    │
  │      └── domain-modeling (glossary/ADRs   ├── research   (unknowns → research/)
  │          sharpen as you talk)             └── prototype  (uncertainty → throwaway code)
  ▼
 to-spec ──────────── conversation → spec.md (canonical); seams confirmed
  │
  ├── fits one session? ──────────────► checklist in the issue body
  └── bigger? ── to-tickets ──────────► vertical-slice sub-issues w/ blocking edges
  │
  ▼
 implement ────────── one ticket per fresh session
  │     ├── ponytail (full) governs the code      ── the ladder: reuse > stdlib >
  │     ├── tdd at the spec's pre-agreed seams       native > dep > one line > minimum
  │     └── handoff if the session ends mid-ticket
  ▼
 code-review ──────── two axes in parallel: Standards (+smells) │ Spec fidelity
  │
  ▼
 present ──────────── anything needing the user's eyes → review/*.html
  │
  ▼
 wrap-feature ─────── close issue · notes.md outcomes · delete ephemera ·
                      archive folder · prune branch/worktree
                      (Linear mode: stops at In Review and hands off — never Done)

 MAINTENANCE (own loop, issue-first when acted on):
   board audit ── what fell through on the TRACKER (stale, unanswered, unfiled)
   work-audit ── stale folders/issues/branches      ┐ run in
   ponytail-audit ── what to DELETE (subtraction)   ├ this
   improve-codebase-architecture ── what to DEEPEN  ┘ order
```

## Skill inventory

**Modes & vocabularies** — not steps; they shape how other work is done:

| Skill | Auto-loads? | What it is |
|---|---|---|
| `ponytail` | ✔ auto (any coding, "yagni", "be lazy", bloat complaints) | Persistent lazy-senior-dev mode: the 7-rung ladder, `lite/full/ultra`. Active until "stop ponytail". |
| `codebase-design` | ✔ auto (designing modules/interfaces/seams) | Deep-module vocabulary: module, interface, seam, adapter, depth, leverage, locality. Other skills borrow its language. |
| `tdd` | ✔ auto (test-first work, "red-green") | The red–green loop done right: pre-agreed seams, tracer bullets, anti-patterns. |
| `domain-modeling` | ✔ auto (terms being pinned down, ADR-worthy decisions) | Maintains the glossary + ADRs *during* conversations. |

**Lifecycle steps** — the container of work:

| Skill | Auto-loads? | Use when |
|---|---|---|
| `workflow-init` | ✔ auto (adopting the workflow) | Once per repo. `BOOTSTRAP.md` is the machine-level wrapper around it. |
| `workflow-update` | ✔ auto (refreshing an adopted repo) | Replaces the versioned managed lifecycle block; preserves repo config/additions. `--check` is read-only. |
| `plan` | ✋ manual `/workflow-kit:plan` | A bulk dump, not one unit of work. Dedupes, classifies, prioritizes; ONE approval before creating anything. |
| `new-feature` | ✔ auto (starting any unit of work) | ALWAYS the first step for ONE unit of work. Issue → folder only if artifacts will exist. |
| `update-issue` | ✔ auto (issue-backed work changes state) | Durable progress, decisions, evidence, artifact links, and next action on the issue. |
| `present` | ✔ auto (something needs the user's review) | Renders decisions/evidence as review-doc HTML. |
| `wrap-feature` | ✔ auto (user declares work done) | The only way work ends. Verifies before deleting. Under Linear mode, hands off at `In Review`. |
| `work-audit` | ✔ auto (clutter, migration) | Proposes cleanup of the REPO; never deletes without approval. |
| `board` | ✔ auto ("what should I work on?", "what's pending?", "where are we?") | The daily check-in — reads the TRACKER: awaiting-you, available, in-flight, recently shipped. `board audit` = the stale-work sweep. |

**Build steps** — the craft inside:

| Skill | Auto-loads? | Use when |
|---|---|---|
| `grilling` | ✔ auto ("grill me", stress-testing a plan) | Before building anything non-trivial. Bulk rounds, recommended answers. |
| `research` | ✔ auto (docs/API facts needed) | Background agent → cited findings in `research/`. |
| `prototype` | ✔ auto (design question needs concrete code) | Throwaway code that answers ONE question (logic or UI branch). |
| `to-spec` | ✋ manual `/workflow-kit:to-spec` | Crystallize the conversation into `spec.md`. No interview. |
| `to-tickets` | ✋ manual `/workflow-kit:to-tickets` | Escalate: spec → vertical-slice sub-issues. Only when > one session. |
| `implement` | ✋ manual `/workflow-kit:implement` | Build one ticket/spec. Runs ponytail + tdd, ends in code-review. |
| `code-review` | ✔ auto (reviewing a branch/diff) | Two parallel axes: Standards / Spec. Never merged into one ranking. |
| `handoff` | ✋ manual `/workflow-kit:handoff` | Session ending mid-work → committed `handoff-<date>.md` (syncs machines). |
| `wayfinder` | ✋ manual `/workflow-kit:wayfinder` | Epic too foggy for one session → map + decision tickets. |
| `ponytail-audit` | ✔ auto ("find bloat", "what can I delete") | Repo-wide subtraction report. One-shot, applies nothing. |
| `improve-codebase-architecture` | ✋ manual `/workflow-kit:improve-codebase-architecture` | Repo-wide deepening report → grill through one candidate. |

## Ceremony is opt-in

The one picture is the **escalation path, not a mandatory march**. Three
requirements are universal: the issue at the start, durable issue updates at
meaningful transitions, and the wrap at the end. Everything between scales
with the work — and the heavy steps (`grilling`, `to-spec`,
`to-tickets`, `wayfinder`, `implement` as a formal step) run only when the
user asks or accepts a one-line offer. "Fix this typo" must never spawn a
brainstorming session, a spec, or a subagent fleet. When in doubt: do the
smaller thing, offer the next step in one line.

## Linear mode (optional, per repo)

Set `linearTeam: <KEY>` in the repo's `feature-lifecycle.md` frontmatter.
**Absent → nothing changes anywhere.** Present → Linear is the control plane,
GitHub is the execution surface, and these deltas apply:

| | Default | Linear mode |
|---|---|---|
| Issue created by | `gh issue create` | Linear `save_issue` — the GitHub twin appears via sync |
| Spec | folder's `spec.md` | issue **body** + a spec **comment** (the reasoning) |
| Plan | `plan.md` | `## Tasks` checklist in the issue body |
| Notes | `notes.md` | checkpoint comments on the sync thread |
| Handoff | committed `handoff-<date>.md` | a comment (file only if artifacts must ride along) |
| Research / scratch / qa / review | on disk | **on disk, unchanged** |
| Feature folder | usually created | created only when a real artifact needs it — usually never |
| Branch | `feat/<n>-<slug>` | the issue's `gitBranchName` (Linear auto-links the PR) |
| PR body | `Refs`/`Closes #n` | `Refs #n` only — never `Closes` |
| Agent finishes by | closing the issue | setting **`In Review`** and stopping |
| Sub-issues | GitHub `addSubIssue` | Linear `parentId` + `blockedBy`/`blocks` relations |

Two rules do the heavy lifting:

1. **Comments only reach GitHub if they reply to the sync thread.** Find the
   root comment with `parentId === null` matching `/synced to a corresponding/i`,
   and `save_comment({ parentId: <it>, body })`. A top-level comment is
   silently Linear-only. Never also post it with `gh` — that double-posts.
2. **An agent never sets `Done`.** `In Review` is the terminal agent state.
   `Done` belongs to a merge or the user.

Full contract: `skills/linear-mode/SKILL.md`; the repo-facing version is
stamped into `feature-lifecycle.md` so Codex and Gemini follow the same rules.

## Report templates

Skills that hand you a report render it from a shared template family in
`templates/` — one design system, so reports look related rather than
improvised. All are self-contained (no external requests), responsive,
dark-mode aware, and print cleanly.

| Template | Shape | Used by |
|---|---|---|
| `report-checkin.html` | Where things stand — awaiting-you first, history last | `board` |
| `report-audit.html` | Ranked findings, each a *proposed* action, one approval gate | `board audit`, `work-audit`, `ponytail-audit`, `improve-codebase-architecture` |
| `report-findings.html` | Conclusions with evidence + confidence; optional two axes | `code-review`, `research`, `plan` |
| `review-doc.html` | The general shell — screenshot grid w/ lightbox, comparison columns, decision panel | `prototype`, spec reviews, QA galleries |

`present` picks the template; it never invents a layout. Two rules the
templates enforce: **delete any section with nothing in it** (an empty section
is not proof you looked), and every report ends with a **coverage note** saying
what was actually read versus sampled.

## How loading works

- **Claude Code**: the plugin (user scope) makes every skill available in every
  repo. Skills marked ✔ auto have trigger descriptions the model matches
  against what's happening — you don't have to type anything. Skills marked ✋
  manual are deliberate acts (`disable-model-invocation: true`); type
  `/workflow-kit:<name>`. Any auto skill can also be invoked manually.
- **Codex / Gemini / Cursor / humans**: can't see the plugin. They learn the
  system from the repo itself: `AGENTS.md`/`CLAUDE.md` points at
  `feature-lifecycle.md`, whose catalog names each skill; they follow the
  steps by hand with `gh` + file operations.
- **A repo that hasn't adopted yet**: give the agent
  `BOOTSTRAP.md` (fetch from this repo via `gh`) — it validates/installs the
  plugin, runs `workflow-init`, and wires the entrypoints.
- **A repo that already adopted**: update the plugin once per machine, start a
  new session, then run `/workflow-kit:workflow-update` in each project. The
  command refreshes only managed content and preserves repo additions.

## Who calls whom

```
plan ──creates many issues──► new-feature (or straight to implement)
new-feature ──suggests──► grilling ──uses──► domain-modeling
issue-backed lifecycle transitions ──invoke──► update-issue
                              │ ──may spawn──► research · prototype
to-spec ──feeds──► to-tickets ──feeds──► implement
implement ──runs──► ponytail + tdd ──then──► code-review
wayfinder ──tickets invoke──► grilling · research · prototype · domain-modeling
improve-codebase-architecture ──uses──► codebase-design · present · grilling · domain-modeling
ponytail-audit / work-audit / improve-arch ──approved findings──► new-feature (chore) → the normal loop
everything with evidence or decisions ──presents via──► present
present ──always mirrors actionable summary to──► update-issue
every finished thing ──ends in──► wrap-feature
```

Key boundaries (the ones that prevent fights between skills):

- **ponytail vs tdd**: ponytail governs implementation code; tdd governs test
  depth at pre-agreed seams. Ponytail's "one runnable check" applies only
  where tdd isn't in play.
- **ponytail vs spec**: the spec is "explicitly requested" — ponytail
  challenges requirements out loud, never by silently not building them.
- **ponytail-audit vs improve-codebase-architecture**: subtract first, then
  deepen — no point restructuring code that should be deleted.
- **ponytail-audit vs code-review**: bloat only; correctness/security/perf
  route to code-review's axes.
- **work-audit vs everything**: proposes only; deletion is always a
  human-approved act. Shipped-but-unwrapped folders route to wrap-feature,
  not raw deletion.
- **work-audit vs board**: work-audit sweeps the **repo** (folders, branches,
  stray files); board sweeps the **tracker** (stale status, unanswered
  questions, follow-ups mentioned in comments but never filed). Both propose
  only. Run either alone.
- **plan vs new-feature**: plan is many units of work at once and batches its
  questions to the end; new-feature is one, and can suggest the next step.
  Don't loop new-feature over a list — that's what plan is for.
- **ADRs outrank all audits**: a decision an ADR made deliberately is not a
  finding.

## Ordered walkthroughs

**Tiny bug** (one-file fix):
`new-feature` (issue only, no folder) → fix on a branch (ponytail auto-applies)
→ `update-issue` with verification → PR `Closes #n`. Done — no spec, no
folder, no wrap ceremony.

**Small feature** (fits one session):
`new-feature` → quick `grilling` round if anything's unclear → build (ponytail;
tdd if seams are obvious) → `code-review` → PR → `wrap-feature`.

**Medium feature** (one-to-few sessions, decisions involved):
`new-feature` → `grilling` (+ `research`/`prototype` for the unknowns) →
`to-spec` → checklist in issue → `implement` → `code-review` → `present` if
something needs eyes → `wrap-feature`.

**Big feature** (many sessions):
Same through `to-spec`, then `to-tickets` → repeat per ticket: fresh session →
`implement` (ticket) → `code-review` → close sub-issue → `handoff` if stopping
mid-ticket → … → `present` → `wrap-feature`.

**Foggy epic** (can't even spec it yet):
`wayfinder` (chart) → one ticket per session (each is a grilling/research/
prototype/task) → fog clears → the destination emerges as spec(s) → continue
as Big feature.

**A pile of work at once** (post-meeting brain-dump, bug sweep, leftovers):
`plan` — one pass: dedupe against existing issues, classify, prioritize,
batch the questions, **one approval** → the whole set is filed. Then each
issue runs the normal loop above at whatever size it deserves.

**Maintenance day**:
`board` (what fell through the tracker) → `work-audit` (approve the cleanup) →
`ponytail-audit` (approve the cuts →
chore issue) → `improve-codebase-architecture` (pick a candidate → grill →
chore issue) → each chore runs the normal loop.

**Session ending mid-anything**: `handoff` — the next session (either machine)
picks up from the committed doc.

**Existing repo upgrade**: machine marketplace/plugin update → new session →
`workflow-update` in the repo → review/commit the project integration diff.
