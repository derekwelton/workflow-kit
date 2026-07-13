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
 IDEA
  │
  ▼
 new-feature ──────── files the ISSUE first, creates work/features/<n>-<slug>/
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

 MAINTENANCE (own loop, issue-first when acted on):
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
| `new-feature` | ✔ auto (starting any unit of work) | ALWAYS the first step. Issue → folder. |
| `present` | ✔ auto (something needs the user's review) | Renders decisions/evidence as review-doc HTML. |
| `wrap-feature` | ✔ auto (user declares work done) | The only way work ends. Verifies before deleting. |
| `work-audit` | ✔ auto (clutter, migration) | Proposes cleanup; never deletes without approval. |

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

## Who calls whom

```
new-feature ──suggests──► grilling ──uses──► domain-modeling
                              │ ──may spawn──► research · prototype
to-spec ──feeds──► to-tickets ──feeds──► implement
implement ──runs──► ponytail + tdd ──then──► code-review
wayfinder ──tickets invoke──► grilling · research · prototype · domain-modeling
improve-codebase-architecture ──uses──► codebase-design · present · grilling · domain-modeling
ponytail-audit / work-audit / improve-arch ──approved findings──► new-feature (chore) → the normal loop
everything with evidence or decisions ──presents via──► present
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
- **ADRs outrank all audits**: a decision an ADR made deliberately is not a
  finding.

## Ordered walkthroughs

**Tiny bug** (one-file fix):
`new-feature` (issue only, no folder) → fix on a branch (ponytail auto-applies)
→ PR `Closes #n`. Done — no spec, no folder, no wrap ceremony.

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

**Maintenance day**:
`work-audit` (approve the cleanup) → `ponytail-audit` (approve the cuts →
chore issue) → `improve-codebase-architecture` (pick a candidate → grill →
chore issue) → each chore runs the normal loop.

**Session ending mid-anything**: `handoff` — the next session (either machine)
picks up from the committed doc.
