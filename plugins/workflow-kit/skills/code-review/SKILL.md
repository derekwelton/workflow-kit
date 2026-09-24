---
name: code-review
description: "Review changes since a commit, branch, tag, or merge-base along two axes: Standards (repository conventions and concrete simplification opportunities) and Spec (matches the originating issue/spec). Runs both reviews in parallel sub-agents and reports them side by side. Use for branch, PR, or work-in-progress reviews, or requests to review since a fixed point."
metadata:
  internal: true
---

Resolve bundled relative file paths from this skill's directory, not the project working directory.


Prefer the provider opposite the implementation author, following
`./bundled/templates/model-routing.md`. Claude review defaults to Opus 5.5 high,
with Fable medium/low as the alternative, then fresh Codex if neither is usable.
Opus 5 is retired; never launch it.
If the other provider's CLI or authorized reviewers are unavailable, use a fresh
same-provider session and record the availability evidence.
No optional CLI installation is required. For a direct Codex launch follow
`./bundled/skills/codex-cli/INSTRUCTIONS.md`. Native fresh same-provider agents
are also valid; never pass the implementer's conversation or reuse its session.

Two-axis review of the diff between `HEAD` and a fixed point the user supplies:

- **Standards**: does the code conform to this repo's documented coding standards, and could it preserve the required behavior more simply?
- **Spec**: does the code faithfully implement the originating issue / spec?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings.

Read `./bundled/templates/project-context.md` for repository conventions and tracker
scope. For a dispatched workload review, the coordinator already owns dispatch:
review the assigned axes yourself without nested agents, return findings and
the exact base/head SHA plus durable review evidence, and leave tracker writes
to the coordinator. Fixes invalidate prior receipts. Standalone review uses
fresh reviewers within host capacity (sequential if necessary); implementation
authors cannot approve their own changes. If independent review is unavailable,
report that gate as incomplete. Only an authorized completed standalone review
may advance a configured tracker to human In Review; never set Done.

Use the supplied issue/spec and existing repository conventions. If a tracker
operation lacks configuration, suggest `/setup-workflow-skills` for that missing
choice; a missing setup file does not block a local diff review.

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point (a commit SHA, branch name, tag, `main`, `HEAD~5`, etc.). If they didn't specify one, ask for it.

Capture the diff command once: `git diff <fixed-point>...HEAD` (three-dot, so the comparison is against the merge-base). Also note the list of commits via `git log <fixed-point>..HEAD --oneline`.

Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the diff is non-empty. A bad ref or empty diff should fail here, not inside two parallel sub-agents.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.), fetched via the workflow in `docs/agents/issue-tracker.md`.
2. A path the user passed as an argument.
3. A spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

### 3. Identify the standards sources

Anything in the repo that documents how code should be written, such as `CODING_STANDARDS.md` or `CONTRIBUTING.md`.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below: a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation. Like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *a possible remedy*; match it against the diff.
Recommend a remedy only when it reduces maintenance burden in this context.
Small duplication can be clearer than a shared abstraction; types, extraction,
and polymorphism are options, not automatic improvements.

- **Mysterious Name**: a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code**: the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy**: a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps**: the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession**: a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches**: the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery**: one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change**: one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality**: abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains**: long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man**: a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest**: a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

#### Simplification check

The Standards reviewer also checks the diff for concrete simplification
opportunities; no additional reviewer or review stage is needed. Read the
affected behavior and enough surrounding usage to assess the replacement.
Keep broader cleanup outside this review; use `ponytail-audit` only when requested.

- Look for existing helpers or patterns to reuse, standard-library or supported
  platform equivalents, unused options or state, speculative layers, and logic
  that can be expressed more directly. Prefer already-installed dependencies
  over new ones when they meet the requirements.
- Check callers and public usage before proposing deletion. One caller or one
  implementation alone does not make a wrapper or interface unnecessary.
  Preserve explicit requirements, public contracts, deliberate ADR choices,
  security checks, data-loss protection, accessibility, and meaningful tests.
  Check compatibility and edge cases before claiming equivalent behavior.
- Each proposal must cite a file/line, name what to remove or change and its
  replacement (or nothing), and explain the evidence that required behavior is
  preserved and maintenance becomes easier. If equivalence is uncertain, state
  what needs checking instead of presenting the cut as ready to apply.
- Report each underlying concern once, combining a smell and its simpler
  alternative. Prefer clarity over fewer lines; do not require savings estimates
  or manufacture suggestions when the code is already straightforward.
- Simplification suggestions are optional and do not block approval by
  themselves. If the same code has a demonstrated defect or violates a documented
  requirement, report that underlying problem as the reason action is required.
  This review proposes changes; it does not authorize applying them.

### 4. Spawn both sub-agents in parallel

**Standards sub-agent prompt** should include:

- The full diff command and commit list.
- The list of standards-source files you found in step 3, **plus the smell baseline and simplification check from step 3** pasted in full (the sub-agent has no other access to them).
- The supplied spec or relevant requirements, when available, so proposed simplifications preserve requested behavior.
- The brief: "Report documented-standard violations with the source rule and file/line evidence separately from optional smell or simplification suggestions. For each simplification, identify the change, replacement, usage evidence, and maintenance benefit. Apply the baseline and simplification safeguards; deduplicate overlapping concerns. A documented repo standard overrides the baseline. Skip anything tooling enforces. If no worthwhile simplification is found, say so without implying the whole change is approved. Aim for under 400 words without omitting material findings."

**Spec sub-agent prompt** should include:

- The diff command and commit list.
- The path or fetched contents of the spec.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

### 5. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings, because the two axes are deliberately separate (see _Why two axes_).

Within Standards, keep documented violations separate from optional suggestions.
Optional suggestions alone do not make Standards fail. End with a one-line
summary: findings per axis, distinguishing Standards violations from optional
suggestions, and the worst issue within each axis (if any). Do not pick a single
winner across axes or treat an absence of simplification findings as approval.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
