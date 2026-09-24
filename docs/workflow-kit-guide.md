# Workflow-kit, without the ceremony

Historical framework guide. The 1.0 project-local collection supersedes this
workflow; see README.md and docs/project-local-migration.md for current usage.
Version 1.1.0 has 31 skills. Counts in the dated September 4/9 overview below
describe that historical snapshot, not the current catalog.

## September 9 update

The September 4 catalog below remains a dated overview. Two additional helper
entry points are now included: `skills/orchestrate/scripts/render-worker-result.mjs`
turns worker envelopes into readable checkpoints; `scripts/managed-version.mjs`
checks repository lifecycle version drift without editing it. There are now ten
executable helper entry points plus two libraries; the skill count remains 30.

Version 0.9.1 uses a two-round non-convergence threshold and strict review for
new runs. Eligible medium/low deferrals require a saved run-scoped decision and
linked follow-ups; acceptance/correctness/security/data-loss blockers always
block. Extra rounds require authorization and a reason. Final-code review and
human acceptance remain required. Canonical tracker handoffs and manifest
evidence survive resume; local snapshots are optional. Workers cannot spawn
subagents, and coordinators wait on completion notifications. Dependency checks
cover installed aliases and sibling references, including Windows checkouts.
Intake, board, orchestration, and doctor share the read-only drift helper.
Planning skills now offer the next proportional step without invoking it silently.
The optional transcript-usage report proposed in issue #6 is not implemented.

Snapshot: 2026-09-04 · local source version 0.9.0 · unpublished changes included. This describes the checkout, not proof of what a running host has loaded.

Workflow-kit gives an AI agent a repeatable way to carry work from a request to an independently reviewed result, while keeping the tracker and handoffs useful. Its strongest value is continuity and review discipline. Its largest usability problem is that everyday actions, specialist workflows, and background instructions all appear in one skill catalog.

## Recommended everyday interface

Keep five everyday actions visible: new-feature, implement, code-review, board, and handoff. Put specialist workflows behind an advanced section, and treat policies as background guidance. This is an editorial recommendation, not a measured usage ranking or a change to the installed commands.

The catalog contains 30 skills: 5 everyday, 14 specialist, 8 background, and 3 setup. These are proposed presentation groups, not package metadata or usage telemetry.

## What the kit actually supplies

- A skill is a set of agent instructions, not a new model or standalone application.
- A command is a way to invoke that skill: Claude uses `/workflow-kit:<directory>`, Codex uses `$<skill-name>` or the host’s surfaced namespace. Orchestration is `/workflow-kit:orchestrate` in Claude and `$orchestrate-queue` in Codex.
- Helpers are deterministic scripts or libraries supporting those instructions. Templates control reports and repository conventions.
- Model access, browser/search tools, tracker connectors, and GitHub/Linear services come from the host or external tools; workflow-kit tells the agent how to use available capabilities.
- Seven skills explicitly disable automatic model invocation: handoff, implement, improve-codebase-architecture, plan, to-spec, to-tickets, wayfinder. Ask to use them by name. Other skills still have their own scope and authorization rules.

## Choose the amount of process

| Situation | Useful path | Process to skip |
| --- | --- | --- |
| A small, understood bug | Reuse or start an issue → implement the fix → relevant verification → independent code-review → human acceptance and authorized closeout. | Skip the interview, prototype, formal spec decomposition, and batch orchestrator unless a real uncertainty appears. |
| A large, uncertain feature | Start an issue → resolve the specific unknown with research, an invited interview, or a prototype → capture decisions with to-spec → split only if needed → implement → independent review. | Planning techniques are choices, not a required sequence. Use wayfinder only when the investigation itself spans substantial work. |
| Several issues that must work together | Select a bounded workload → orchestrate isolated work and independent issue reviews → verify the combined integration branch → human tests and accepts → integrate-reviewed. | This is where manifests, review receipts, worktrees, and integration gates earn their overhead. Do not scale this machinery down to every tiny fix. |

## All 30 skills

### new-feature — Start a piece of work

Group: Everyday. Use only within its described scope.

Give a request a durable home so the goal and decisions do not disappear into chat.

- Use: Use new-feature for the search bug; reuse its existing issue if one exists.
- Result: A tracker issue and, when artifacts need it, a feature folder.
- Limit: The name is misleading: this also starts bugs, chores, and explorations. An existing issue should be reused.
- Claude: `/workflow-kit:new-feature`
- Codex: `$new-feature`
- Source: `skills/new-feature/SKILL.md:1`

### implement — Build the agreed change

Group: Everyday. Explicit invocation required by metadata.

Turn a sufficiently clear issue or spec into working, verified code.

- Use: Use implement for issue #42.
- Result: Implementation, relevant verification, and an updated tracker ready for independent review.
- Limit: Request this skill explicitly. A small fix does not need a separate interview, prototype, and formal spec first. Commits still require authorization.
- Claude: `/workflow-kit:implement`
- Codex: `$implement`
- Source: `skills/implement/SKILL.md:1`

### code-review — Get an independent review

Group: Everyday. Use only within its described scope.

Catch mismatches with the requirements and code standards using a fresh reviewer.

- Use: Use code-review on the current branch.
- Result: Findings along Standards and Spec axes; fixes when requested, followed by review of the resulting code.
- Limit: Keep this separate from authorship. Passing an AI review is not human acceptance; changed code needs review of its final SHA.
- Claude: `/workflow-kit:code-review`
- Codex: `$code-review`
- Source: `skills/code-review/SKILL.md:1`

### board — See what needs attention

Group: Everyday. Use only within its described scope.

Bring scattered work and buried questions into one status view.

- Use: Use board to show what is waiting on me.
- Result: Available work, work in progress, AI review, human review, and recently shipped work.
- Limit: Use board audit only for a deeper stale-work sweep. A normal check-in should not become a cleanup project.
- Claude: `/workflow-kit:board`
- Codex: `$board`
- Source: `skills/board/SKILL.md:1`

### handoff — Continue in another session

Group: Everyday. Explicit invocation required by metadata.

Save the context, exact state, and next action a fresh agent needs.

- Use: Use handoff; the next session will finish verification.
- Result: A concise resumable handoff in the feature artifacts or tracker, according to the repository contract.
- Limit: Request this explicitly when pausing or switching context; it is not a required step after every response.
- Claude: `/workflow-kit:handoff`
- Codex: `$handoff`
- Source: `skills/handoff/SKILL.md:1`

### plan — Triage a whole list

Group: Specialist. Explicit invocation required by metadata.

Turn a messy backlog or brain-dump into deduplicated, prioritized issues.

- Use: Use plan to organize this list of twelve bugs and ideas.
- Result: A proposed issue set for one approval pass, then the approved tracker changes.
- Limit: This means bulk intake, not every kind of planning. For one clear request, start with new-feature.
- Claude: `/workflow-kit:plan`
- Codex: `$plan`
- Source: `skills/plan/SKILL.md:1`

### grilling — Interview me about a decision

Group: Specialist. Use only within its described scope.

Resolve unclear requirements through deliberate rounds of questions.

- Use: Use grilling to stress-test this design with me.
- Result: Shared decisions and clarified requirements for later synthesis.
- Limit: Opt-in only. Do not start an interview merely because a task looks difficult.
- Claude: `/workflow-kit:grilling`
- Codex: `$grilling`
- Source: `skills/grilling/SKILL.md:1`

### research — Investigate an unknown

Group: Specialist. Use only within its described scope.

Replace guesses with source-backed findings before committing to an approach.

- Use: Use research to compare the documented migration options.
- Result: Cited Markdown findings that can inform a spec or decision.
- Limit: Use when an external fact or real uncertainty needs investigation. It is an instruction workflow, not its own search engine.
- Claude: `/workflow-kit:research`
- Codex: `$research`
- Source: `skills/research/SKILL.md:1`

### prototype — Try an idea cheaply

Group: Specialist. Use only within its described scope.

Make a disputed behavior or design tangible before production implementation.

- Use: Use prototype to show two ways this filtering could work.
- Result: A throwaway UI or logic demonstration for discussion.
- Limit: Skip when the behavior is already clear. A prototype is not production code or proof of production readiness.
- Claude: `/workflow-kit:prototype`
- Codex: `$prototype`
- Source: `skills/prototype/SKILL.md:1`

### to-spec — Write down what we decided

Group: Specialist. Explicit invocation required by metadata.

Consolidate an existing conversation into a coherent implementation contract.

- Use: Use to-spec to capture the decisions we just made.
- Result: A spec, or the equivalent tracker issue content in Linear mode.
- Limit: Request explicitly. This synthesizes decisions; it should not restart the interview.
- Claude: `/workflow-kit:to-spec`
- Codex: `$to-spec`
- Source: `skills/to-spec/SKILL.md:1`

### to-tickets — Split work that is too large

Group: Specialist. Explicit invocation required by metadata.

Break a substantial spec into independently useful pieces with dependencies.

- Use: Use to-tickets to split this approved spec into vertical slices.
- Result: Subissues with scoped outcomes, acceptance criteria, and dependencies.
- Limit: Request explicitly. Prefer a checklist when a single issue is enough.
- Claude: `/workflow-kit:to-tickets`
- Codex: `$to-tickets`
- Source: `skills/to-tickets/SKILL.md:1`

### wayfinder — Map a genuinely foggy project

Group: Specialist. Explicit invocation required by metadata.

Turn a large, uncertain destination into a sequence of answerable investigations.

- Use: Use wayfinder to map the unknowns in this platform migration.
- Result: A shared map and investigation or decision tickets.
- Limit: Request explicitly. This adds real coordination overhead; avoid it for ordinary defined features.
- Claude: `/workflow-kit:wayfinder`
- Codex: `$wayfinder`
- Source: `skills/wayfinder/SKILL.md:1`

### present — Show me the result visually

Group: Specialist. Use only within its described scope.

Turn findings or options into a review document a human can scan.

- Use: Use present to make an HTML guide to this project.
- Result: Self-contained HTML with the facts and decisions also preserved in canonical Markdown or the tracker.
- Limit: Treat this as a presentation format, not another mandatory lifecycle stage. This guide is an example.
- Claude: `/workflow-kit:present`
- Codex: `$present`
- Source: `skills/present/SKILL.md:1`

### orchestrate-queue — Run several issues as one workload

Group: Specialist. Use only within its described scope.

Coordinate isolated implementation, independent review, and combined verification across a bounded batch.

- Use: Use orchestrate-queue for issues #42 and #43 as a workload named search-fixes.
- Result: A workload manifest, isolated branches/worktrees, review receipts, and one tested integration branch with an umbrella PR.
- Limit: Advanced and comparatively expensive. Use for a real multi-issue batch, not to make a one-file fix look more organized. Human acceptance remains separate.
- Claude: `/workflow-kit:orchestrate`
- Codex: `$orchestrate-queue`
- Source: `skills/orchestrate/SKILL.md:1`

### integrate-reviewed — Integrate an accepted workload

Group: Specialist. Use only within its described scope.

Complete integration using the exact batch of code the human tested and accepted.

- Use: Accept the named workload and request integrate-reviewed with its run and mode.
- Result: Verified integration with merged or local-main behavior, followed by reconciliation appropriate to the chosen mode.
- Limit: Requires explicit acceptance, a named run, and a mode. local-main does not push, merge a PR, or mark work Done. Drift can require renewed acceptance.
- Claude: `/workflow-kit:integrate-reviewed`
- Codex: `$integrate-reviewed`
- Source: `skills/integrate-reviewed/SKILL.md:1`

### wrap-feature — Close out shipped work

Group: Specialist. Use only within its described scope.

Leave the permanent record useful and remove the temporary work artifacts.

- Use: Use wrap-feature for the change that has been shipped.
- Result: Verified merge/checklist state, an outcome summary, archived durable artifacts, and authorized cleanup.
- Limit: This is closeout, not permission to merge. Preserve the repository status contract; Linear Done stays with the human.
- Claude: `/workflow-kit:wrap-feature`
- Codex: `$wrap-feature`
- Source: `skills/wrap-feature/SKILL.md:1`

### ponytail-audit — Find unnecessary code

Group: Specialist. Use only within its described scope.

Identify code that could be deleted, simplified, or replaced with native features.

- Use: Use ponytail-audit to find overengineering in this repository.
- Result: A ranked, one-shot simplification report.
- Limit: An opt-in audit, not automatic refactoring. Findings propose changes rather than applying them.
- Claude: `/workflow-kit:ponytail-audit`
- Codex: `$ponytail-audit`
- Source: `skills/ponytail-audit/SKILL.md:1`

### improve-codebase-architecture — Find weak module boundaries

Group: Specialist. Explicit invocation required by metadata.

Find places where a smaller interface could hide more complexity and make changes safer.

- Use: Use improve-codebase-architecture to show the best module improvements.
- Result: An HTML findings report; a selected opportunity can then be explored with the user.
- Limit: Request explicitly. Broader than ordinary implementation; do not refactor the whole repository as incidental cleanup.
- Claude: `/workflow-kit:improve-codebase-architecture`
- Codex: `$improve-codebase-architecture`
- Source: `skills/improve-codebase-architecture/SKILL.md:1`

### work-audit — Clean up stale work records

Group: Specialist. Use only within its described scope.

Find abandoned folders, old branches, merged-but-open issues, and scratch clutter.

- Use: Use work-audit to propose cleanup of old work.
- Result: A proposed cleanup list for approval.
- Limit: This audits work artifacts, not code architecture. It does not delete anything without approval.
- Claude: `/workflow-kit:work-audit`
- Codex: `$work-audit`
- Source: `skills/work-audit/SKILL.md:1`

### ponytail — Prefer the simplest working solution

Group: Background. Use only within its described scope.

Reduce unnecessary abstractions, dependencies, and speculative features during coding.

- Use: Applied while coding; explicitly request ponytail when you want a simplification lens.
- Result: Simpler implementation choices, grounded in the actual requirement.
- Limit: The existing lite/full/ultra names describe this skill’s intensity, not model reasoning. The ultra name is confusing and is a candidate for renaming.
- Claude: `/workflow-kit:ponytail`
- Codex: `$ponytail`
- Source: `skills/ponytail/SKILL.md:1`

### tdd — Test at meaningful seams

Group: Background. Use only within its described scope.

Make behavior verifiable through agreed interfaces and focused tests.

- Use: Applied when implementing behavior that benefits from test-first verification.
- Result: Tests that establish the required behavior and support refactoring.
- Limit: Do not make every documentation edit into a testing exercise or write tests that only repeat the implementation.
- Claude: `/workflow-kit:tdd`
- Codex: `$tdd`
- Source: `skills/tdd/SKILL.md:1`

### codebase-design — Keep interfaces small and useful

Group: Background. Use only within its described scope.

Provide a common vocabulary for deep modules, clear seams, and testable boundaries.

- Use: Applied when designing or changing module interfaces.
- Result: Design choices that localize complexity behind a small interface.
- Limit: This is design guidance. It does not need its own user command in an everyday workflow.
- Claude: `/workflow-kit:codebase-design`
- Codex: `$codebase-design`
- Source: `skills/codebase-design/SKILL.md:1`

### domain-modeling — Keep the project language precise

Group: Background. Use only within its described scope.

Resolve ambiguous domain terms and preserve consequential design decisions.

- Use: Applied when terminology or the domain model changes.
- Result: Sharper domain concepts, glossary entries, and occasional architecture decisions.
- Limit: Do not generate a glossary or decision document for every trivial change.
- Claude: `/workflow-kit:domain-modeling`
- Codex: `$domain-modeling`
- Source: `skills/domain-modeling/SKILL.md:1`

### update-issue — Keep the tracker understandable

Group: Background. Use only within its described scope.

Preserve progress, decisions, blockers, and review requests beyond the current chat.

- Use: Applied at meaningful lifecycle checkpoints.
- Result: Standalone readable tracker updates that include what happened and what is needed next.
- Limit: Bookkeeping should follow the task, not require another command to remember. External posting still follows the user’s authorization and repository contract.
- Claude: `/workflow-kit:update-issue`
- Codex: `$update-issue`
- Source: `skills/update-issue/SKILL.md:1`

### linear-mode — Follow this repository’s Linear rules

Group: Background. Use only within its described scope.

Keep implementation, AI Code Review, and human In Review as distinct handoffs.

- Use: Applied only when the repository selects Linear mode.
- Result: Consistent issue bodies, sync-thread comments, status transitions, and review boundaries.
- Limit: Conditional policy, not a separate daily action. Agents never set Done; workload handoffs require the combined gate.
- Claude: `/workflow-kit:linear-mode`
- Codex: `$linear-mode`
- Source: `skills/linear-mode/SKILL.md:1`

### github-projects — Follow this repository’s Projects rules

Group: Background. Use only within its described scope.

Respect the configured board fields, statuses, issue types, and human review boundary.

- Use: Applied only when the repository selects GitHub Projects.
- Result: Tracker operations consistent with the local Projects contract.
- Limit: Conditional alternative to Linear policy. Conflicting tracker settings need reconciliation; do not impose generic status mappings.
- Claude: `/workflow-kit:github-projects`
- Codex: `$github-projects`
- Source: `skills/github-projects/SKILL.md:1`

### model-routing — Choose an appropriate model and effort

Group: Background. Use only within its described scope.

Keep routine work economical while reserving more reasoning for justified complexity.

- Use: Applied before delegating implementation or review.
- Result: An explicit supported model/effort route bounded by host capacity and user choices.
- Limit: Astra low/medium for Codex coding, Opus 5.5 high for Claude coding and review, Luna at any allowed effort for simple work, Opus 5.5 medium/high for UI design, Codex review normally medium. High needs a reason except on Luna and the owner-selected Opus 5.5 defaults; xhigh/max/ultra reasoning are prohibited.
- Claude: `/workflow-kit:model-routing`
- Codex: `$model-routing`
- Source: `skills/model-routing/SKILL.md:1`

### workflow-init — Adopt the kit in a repository

Group: Setup. Use only within its described scope.

Create the initial lifecycle convention and supporting repository scaffold.

- Use: Use workflow-init when this repository first adopts workflow-kit.
- Result: Repository lifecycle configuration, needed work folders, ignore rules, and tracker setup.
- Limit: One-time setup. Preserve existing local tracker contracts and configuration.
- Claude: `/workflow-kit:workflow-init`
- Codex: `$workflow-init`
- Source: `skills/workflow-init/SKILL.md:1`

### workflow-update — Refresh an adopted repository

Group: Setup. Use only within its described scope.

Update managed lifecycle instructions without losing repository-specific additions.

- Use: Use workflow-update --check to inspect repository drift.
- Result: A drift report in check mode, or a refreshed managed lifecycle block when applying.
- Limit: This is the repository refresh. Updating the installed machine plugin is a separate step; it is not replaced by this command.
- Claude: `/workflow-kit:workflow-update`
- Codex: `$workflow-update`
- Source: `skills/workflow-update/SKILL.md:1`

### workflow-doctor — Diagnose a broken workflow

Group: Setup. Use only within its described scope.

Explain version drift, broken links, tracker mismatch, or an unsafe resume state.

- Use: Use workflow-doctor to investigate why the workload will not resume.
- Result: Read-only health findings, evidence, and recommended next actions.
- Limit: A diagnostic, not an automatic repair command. Source, installed package, and already-loaded session can differ.
- Claude: `/workflow-kit:workflow-doctor`
- Codex: `$workflow-doctor`
- Source: `skills/workflow-doctor/SKILL.md:1`

## Where simplification would help

| Overlap | Current distinction | Recommendation |
| --- | --- | --- |
| new-feature / plan / to-spec / to-tickets / wayfinder | One issue / bulk intake / write decisions / split a spec / investigate a foggy epic. | Put them under a single planning entry point, with depth chosen from the request. Rename plan to make its bulk-intake role clear. |
| grilling / research / prototype | Ask the user / investigate evidence / demonstrate an idea. | Optional planning techniques. Keep interviews opt-in; do not run all three by default. |
| board audit / work-audit | Tracker stale-work sweep / broader artifact and branch cleanup. | One cleanup menu with a visible scope choice. Consolidate duplicated reporting before deleting capabilities. |
| ponytail-audit / improve-codebase-architecture | Unnecessary code / weak interfaces and module boundaries. | One improvement menu with two lenses. Keep findings separate from permission to refactor. |
| ponytail / tdd / codebase-design / domain-modeling | Coding and design disciplines with different aims. | Keep the guidance in the background. Stop presenting it as four steps the user must invoke. |
| present / update-issue | Human-friendly formatting / durable tracker communication. | Make them output and bookkeeping behavior of the main actions, subject to authorization. |
| integrate-reviewed / wrap-feature | Integrate a human-accepted batch / close out shipped work. | Keep distinct gates. Hiding complexity must not turn cleanup into implicit merge approval. |
| workflow-init / workflow-update / workflow-doctor | First adoption / refresh / diagnosis. | Group under Setup & help. These are different operations, so merging the implementations has little obvious value. |

The ponytail skill currently calls one simplification intensity ultra. That is not model reasoning effort, but the naming collides with the prohibited ultra reasoning level. Rename or remove that intensity label in a future simplification pass. No rename is implemented by this guide.

## A proposed smaller interface

These five labels describe possible future entry points. They are not newly implemented commands or aliases. Setup/help, batch operations, and accepted-work integration remain available outside the daily path.

| Intention | Existing capabilities behind it | Boundary |
| --- | --- | --- |
| Start / plan | new-feature by default; plan for bulk intake. to-spec, to-tickets, and wayfinder only when scope warrants them. | Grilling stays opt-in; research and prototypes answer specific uncertainties. |
| Build | implement, with coding policies and tracker bookkeeping behind it. | Use a checklist for small work; expose orchestrate only as an advanced batch option. |
| Review | code-review, with present as a report format when useful. | Fresh reviewer, final-SHA verification, and human acceptance remain separate. |
| Status | board, with explicit paths to stale-work and code-quality audits. | Reading status should not trigger cleanup or refactoring. |
| Handoff | handoff for pauses and session changes. | Keep setup/help and accepted-work integration available outside the daily path. |

## Helpers and tools

Eight executable helper entry points and two shared libraries are listed below. The compatibility entry points to the same workload helper. They are maintenance/execution support, not ten additional daily actions.

| Source | Role | What it provides |
| --- | --- | --- |
| scripts/workload-manifest.mjs | Batch state | init, pair, set-issue, set-integration, show, validate, list, migrate. Persists and validates workload state; it does not itself run agents. |
| skills/orchestrate/scripts/workload-manifest.mjs | Compatibility entry | Thin entry point to the root workload helper. The same capability, not a second orchestration engine. |
| scripts/workflow-doctor.mjs | Diagnostic helper | Read-only package/CLI/link checks and optional sanitized capability JSON. Complements the broader workflow-doctor skill; it cannot prove every loaded session or account entitlement. |
| scripts/install-codex-skills.mjs | Fallback installer | Links the complete skill catalog for hosts without native plugin support. --check --json inspects conflicts; --target-dir supports an isolated target. |
| scripts/build-codex-package.mjs | Package maintenance | Generates plugins/workflow-kit from root sources. --check detects drift. Generated copies are not extra skills. |
| scripts/validate-package.mjs | Package validation | Checks package structure, manifests, and skill packaging; accepts a package root. |
| scripts/test-codex-install.py | Isolated install test | Checks native installation in an isolated home without changing the user’s live plugin/model settings or launching model work. |
| scripts/lib/model-policy.mjs | Library, not a command | Model routing, effort validation, and worker capacity calculations shared by callers. |
| scripts/lib/tracker-policy.mjs | Library, not a command | Tracker selection and transition rules used by callers. |

## Templates

| Source | Role | What it provides |
| --- | --- | --- |
| templates/report-checkin.html | Status report | Used by board to show what needs attention. |
| templates/report-audit.html | Cleanup proposal | Ranked proposed actions with a review boundary. |
| templates/report-findings.html | Evidence report | Research, review, and triage conclusions with supporting evidence. |
| templates/review-doc.html | General review document | Panels, comparisons, diagrams, and decision sections. This guide reuses its design. |
| templates/feature-lifecycle.md | Repository convention | The managed lifecycle instructions stamped into adopted repositories. |
| templates/codex-plugin.json | Package metadata | Source template for the generated native Codex manifest. |

## Packaging and companion tools

`.claude-plugin/plugin.json` declares the Claude package; `.agents/plugins/marketplace.json` advertises the native Codex package. `plugins/workflow-kit/` is generated from root sources, including its native manifest. Generated skill copies do not increase the count of 30.

The codex-cli skill invokes the official CLI directly without a companion plugin.
Workflow-kit owns lifecycle, model policy, review receipts and integration rules.
Prefer the other provider for review; Claude reviews use Opus 5.5 high, then Fable
medium/low, then fresh Codex if neither is available. Record availability
evidence. See [migration](codex-cli-migration.md).

Machine refresh and repository refresh are different: update the installed plugin on each machine, then use workflow-update in adopted repositories. An already-loaded session can need a restart or reread.

## Needs your decision

FYI — no decision is required to use this guide. Recommended next simplification: change the visible organization first, then decide which entry points to combine based on actual use. No skills have been removed, renamed, or disabled by this document. Preserve independent review, exact-code verification, and explicit human acceptance.

## Sources and coverage

Inventory verified against all root `skills/*/SKILL.md`, root `scripts/`, `templates/`, `README.md`, and package manifests on 2026-09-04. This is an editorial overview, not an exhaustive CLI flag reference or a telemetry report. Each catalog entry points to its full skill instructions.

Presentation: `docs/workflow-kit-guide.html`. This Markdown is the canonical companion.
