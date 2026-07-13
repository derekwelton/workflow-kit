---
name: implement
description: Implement a piece of work from the feature spec or a sub-issue ticket — TDD at pre-agreed seams, verify, review, commit, and update the tracker. Use when a spec or ticket is ready to build.
disable-model-invocation: true
---

Implement the work described in the feature folder's `spec.md`, or in the
specific sub-issue ticket the user names. **One ticket per fresh session** —
don't chain tickets in one context; hand off between them.

- Work on a branch referencing the issue (`feat/<issue#>-<slug>`) unless the
  repo's conventions say otherwise.
- **Apply the `ponytail` skill (full) to all code you write** — the ladder
  governs the implementation: reuse > stdlib > native > installed dep > one
  line > minimum code. Never simplify away what the spec explicitly requires;
  challenge it in a note instead.
- Use the `tdd` skill where possible, **at the seams pre-agreed in the spec**
  (its Testing Decisions section). If the spec never agreed seams, confirm
  them with the user before writing tests. Test depth is tdd's call, not
  ponytail's — its one-check minimum applies only where tdd isn't in play.
- Run typechecking regularly, single test files regularly, and the full test
  suite once at the end.
- Once done, run the `code-review` skill on the work and address what it
  surfaces.
- Commit to the current branch. Update the tracker: tick the checklist item,
  or close the sub-issue (`Closes #n` in the PR/commit, or `gh issue close`)
  — never the parent feature issue.
- Log a dated line in the feature's `notes.md` (what shipped, gotchas hit).

Model/agent routing (e.g. delegating bulk implementation to another model) is
per-repo policy — follow the repo's CLAUDE.md/AGENTS.md, not this skill.
