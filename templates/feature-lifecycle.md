---
workDir: work
docsHome: .ai/workflows
labels: [feature, bug, chore, idea]
glossary: CONTEXT.md
adrDir: docs/adr
---

<!-- workflow-kit:managed-start version=0.4.0 -->

# Feature Lifecycle

How work is planned, built, presented, and cleaned up in this repo. Applies to
every agent (Claude, Codex, Gemini, Cursor) and every human. Managed by the
`workflow-kit` plugin; this doc is the tool-agnostic contract. Claude invokes
the skills as `/workflow-kit:<name>`; agents without plugin access follow the
same steps by hand with `gh` + file operations.

```
idea → issue → folder → grill → research/prototype → to-spec → to-tickets?
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

## The skills — what to use when

Lifecycle (container of work):

| Skill | Use when |
|---|---|
| `workflow-init` | Bootstrapping a repo into this system (once) |
| `workflow-update` | Refreshing an adopted repo from the installed plugin while preserving repo-specific configuration |
| `new-feature` | Starting ANY unit of work — files the issue, creates the folder |
| `update-issue` | Any issue-backed work starts/checkpoints/needs input/pauses/finishes → durable GitHub comment + checklist sync |
| `present` | Anything needs the user's review/decision → self-contained HTML in `review/` |
| `wrap-feature` | Work shipped → close, clean, archive, prune |
| `work-audit` | Clutter check / migration sweep — proposes, never auto-deletes |

Craft (inside the build):

| Skill | Use when |
|---|---|
| `grilling` | Stress-testing a plan BEFORE building — bulk-question rounds, recommended answers, facts from the codebase, decisions from the user |
| `research` | A question needs primary-source legwork → cited findings in `research/` |
| `prototype` | "Does this logic feel right?" / "What should this look like?" → throwaway code that answers the question |
| `to-spec` | Conversation is ready to crystallize → writes the folder's `spec.md` (no interview) |
| `to-tickets` | Feature exceeds one context window → tracer-bullet vertical-slice sub-issues with blocking edges |
| `implement` | A spec/ticket is ready to build — one ticket per fresh session, ponytail governs the code, TDD at pre-agreed seams, then code-review, commit |
| `ponytail` | ALL code writing (auto-active): laziest solution that works — reuse > stdlib > native > installed dep > one line > minimum code; never simplifies away spec requirements |
| `tdd` | Building test-first: seams confirmed up front, red–green tracer bullets, no implementation-coupled or tautological tests (outranks ponytail's one-check minimum at agreed seams) |
| `code-review` | Before wrap / on any branch: two-axis review — Standards (+ smell baseline) and Spec fidelity — in parallel subagents |
| `codebase-design` | Designing or restructuring modules — the deep-module vocabulary (module/interface/seam/depth/leverage/locality) |
| `domain-modeling` | Terms are being sharpened or hard-to-reverse decisions made → glossary updates + sparing ADRs |
| `ponytail-audit` | Repo-wide bloat scan → ranked delete/stdlib/native/yagni/shrink list; run BEFORE improve-codebase-architecture (subtract, then deepen) |
| `improve-codebase-architecture` | Periodic architecture health check → visual HTML report of deepening opportunities, then grill through one |
| `handoff` | Ending a session mid-work → committed handoff doc the next session (or other machine) resumes from |
| `wayfinder` | An epic too big/foggy for one session → map issue + decision-ticket sub-issues, worked one per session |

<!-- workflow-kit:managed-end -->
<!-- Repo-specific additions belong below this line and survive /workflow-kit:workflow-update. -->
