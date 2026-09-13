# Upstream provenance

## Engineering collection (1.0.0)

Imported from [mattpocock/skills](https://github.com/mattpocock/skills),
`skills/engineering/`, at commit
`3cca18b368ae95cdbdebbff572ccafa662551015` (verified September 12, 2026).
MIT, Copyright (c) 2026 Matt Pocock; full notice in
`licenses/mattpocock-skills-MIT.txt`, included in project installations.

All 17 engineering directories other than ask-matt are included, with their
supporting Markdown, Codex metadata and wizard shell template. The setup skill
is renamed from setup-matt-pocock-skills to setup-workflow-skills, including
callers and UI metadata. Original explicit-invocation policies are preserved.

| Area | Local adaptation |
|---|---|
| Setup | Project-local configuration only; preserve .ai/ and existing tracker/status/domain/branch contracts; inspect installed names without loading all skills; no global install or full lifecycle stamp; explicit legacy migration |
| Tracker-facing engineering skills | Small conditional project-context reference; configured adapters, scoped authorization, local issue types/triage vocabulary, independent review/human acceptance |
| implement | Ponytail, proportional verification, authorized commits, fresh final-diff review and coordinator-owned workload handoffs |
| code-review | Dispatched reviewers do not nest workers; final-SHA evidence and separate human In Review; ordinary review does not require setup when sufficient context exists |
| research | Local lookup by default; delegation when useful/permitted; chat or requested artifact without compulsory issue/folder |
| to-spec | Proportional stories/acceptance criteria and reuse of established testing seams |
| domain-modeling | Respect existing glossary/ADR locations and read-only scope |
| wizard | Explicit Bash prerequisite, secret-handling reminder and commit authorization |
| grilling callers | Use a supporting interview reference rather than expose another skill |

`skills/grill-with-docs/references/interview.md` derives from
`skills/productivity/grilling/SKILL.md` at the same pin. Its fact-finding step
allows local lookup or useful permitted delegation. No standalone grilling
entrypoint is installed. Architecture, triage and wayfinder share this reference.

For a fresh vendor comparison, use a clean checkout at the recorded revision.
`node scripts/vendor-engineering.mjs <checkout>` deliberately replaces the 17
imported source folders with the pinned import and basic renaming/interview
adaptations. It does not replay all local adaptations above: use only on a clean
maintenance branch, inspect the diff, reapply intentional local changes, and run
the package and behavioral checks before distributing. Never run it in a
consumer project or treat it as the normal project update command.

## Retained workflow-kit skills

github-projects, linear-mode, update-issue and orchestrate retain their existing
tracker/status and review gates. The model policy, workload manifest helper,
sync-thread selector, worker envelopes and integration contract remain owned by
workflow-kit. Retired integration/preflight/model-routing commands become
non-discoverable references, not extra skills. The generated compatibility
package is built from the same owners as project installations.

## Ponytail

ponytail and ponytail-audit derive from
[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) at
`14a0d79548d4de8fc2de95c1b94bb0de63a739d3` (original July 12 import).
MIT, Copyright (c) 2026 DietrichGebert; full notice in
`licenses/ponytail-MIT.txt`, included in project installations.

Keep the locally simplified reuse/root-cause principles. The audit is now
explicit-only and self-contained: no compulsory lifecycle, issue intake or HTML
renderer. Preserve documented contracts and give evidenced simplification proposals.

## Earlier history

The 0.9.4 framework and its detailed prior adaptation history remain in Git at
`8ab784585df2508b462f9e308d680350542585b7`. It originally imported Matt's collection
at `391a2701dd948f94f56a39f7533f8eea9a859c87`, then selectively refreshed it.
The 1.0 import above supersedes those mixed engineering revisions.
