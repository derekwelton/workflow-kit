# Upstream provenance

## Direct Codex review (1.1.0)

`templates/codex-adversarial-review.md` and `templates/codex-review-output.schema.json`
derive from `prompts/adversarial-review.md` and `schemas/review-output.schema.json`
in [derekwelton/codex-kit](https://github.com/derekwelton/codex-kit) at
`e5c69dcf6b55f0b3435e119e497ece810abd70a9`. That fork derives from
[openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc) at
`db52e28f4d9ded852ab3942cea316258ae4ef346` (Apache-2.0, Copyright 2026 OpenAI).
Full LICENSE and NOTICE are retained in `licenses/codex-plugin-cc-Apache-2.0.txt`
and `licenses/codex-plugin-cc-NOTICE.txt` and shipped in generated installations.
Local adaptations add base/head binding, Standards/Spec axes, fresh review and
coordinator-owned convergence/tracker rules. No runtime, broker or hooks are imported.

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
allows local lookup or useful permitted delegation. The standalone `grill-me` entrypoint now reads this same reference. Architecture, triage and wayfinder share this reference.

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

## Productivity additions

Imported `grill-me`, `handoff`, `to-questionnaire`, and `writing-for-agents`
from `skills/productivity/` at the same `3cca18b368ae95cdbdebbff572ccafa662551015`
revision above, including Codex metadata and the writing mechanics reference.
The existing MIT notice covers these imports. `grill-me` reuses the bundled
interview reference; its declared dependency installs the reference owner and
its dependencies without invoking their workflows. Handoff uses host-neutral
skill invocation and preserves verification and authorization boundaries.
Questionnaires reuse known context, respect output locations, and require
separate authorization for sending. Writing mechanics reflect this kit's
host metadata, dependency catalog, and invocation policies rather than the
upstream Claude-only assumptions. The engineering vendor script does not
refresh these four productivity additions.

## Unslop

Imported from [cursor/plugins](https://github.com/cursor/plugins/blob/e8d856f0273b42ebafe0ec3546bd645709e7c1b0/pstack/skills/unslop/SKILL.md),
`pstack/skills/unslop/SKILL.md`, at `e8d856f0273b42ebafe0ec3546bd645709e7c1b0`.
The only body/frontmatter adaptation removes `disable-model-invocation: true`
as requested; added Codex metadata allows implicit invocation. The upstream
license is preserved in `licenses/pstack-LICENSE.txt` and shipped by both installers.

## Standard skills installer distribution

Root skill folders are self-contained for `npx skills@latest add derekwelton/workflow-kit`.
Generated `bundled/` trees carry the declared dependency instructions, shared
references, executable helpers and license notices. Canonical files remain in
root skills, scripts and templates; no upstream behavior or review gate changes
merely because a dependency is bundled. Dependency entrypoints are renamed to
INSTRUCTIONS.md in these copies so they are not independently discovered.
