---
name: code-review
description: "Review a PR, uncommitted changes, or changes since a commit, branch, tag, or merge-base for Standards and Spec. Uses one independent reviewer for small cohesive changes and separate axis reviewers for complex changes. Use for branch, PR, or work-in-progress reviews."
---

Resolve bundled relative file paths from this skill's directory, not the project working directory.


Two-axis review of the target the user supplies (a ref, a PR, or uncommitted changes):

- **Standards**: does the code conform to this repo's documented coding standards, and could it preserve the required behavior more simply?
- **Spec**: does the code faithfully implement the originating issue / spec?

Reviewers follow `./bundled/templates/review-policy.md`. Prefer the provider
opposite the implementation author: choose its route and launch transport with
`./bundled/templates/model-routing.md`. Native fresh same-provider agents are also
valid; no optional CLI installation is required. Never pass the implementer's
conversation or reuse its session. Run reviewers within host capacity, sequentially
if necessary.

Use the supplied issue/spec and existing repository conventions; a missing setup
file does not block a local diff review. For tracker lookups or writes read
`./bundled/templates/project-context.md`; if a tracker operation lacks
configuration, suggest `/setup-workflow-skills` for that choice. Only an
authorized completed standalone review may advance a configured tracker to human
In Review; never set Done.

If a coordinator dispatched you with a brief, follow it: review the assigned axes
yourself without launching agents, return findings with the exact base/head SHAs,
leave tracker writes to the coordinator, and skip step 6.

## Process

### 1. Pin the target

Resolve what the user named:

- **A ref** (commit SHA, branch, tag, `main`, `HEAD~5`, etc.) is the fixed point.
  The diff is `git diff <fixed-point>...HEAD` (three-dot, against the merge-base)
  and the commits are `git log <fixed-point>..HEAD --oneline`.
- **A PR number or URL**: read its base branch, head branch and head SHA
  (`gh pr view <pr> --json baseRefName,headRefName,headRefOid`). The fixed point
  is the merge-base with the base branch's remote-tracking ref; fetch the base only
  if that ref is missing. When this checkout's current branch is the PR's head
  branch and contains the PR head SHA, review this checkout without fetching the
  head: `git diff <merge-base>` (working tree, so it includes unpushed commits and
  staged and unstaged changes) plus untracked files from
  `git ls-files --others --exclude-standard`. If the current branch is the head
  branch but lacks the PR head SHA, the checkout is behind or diverged; say so
  and ask whether to review local work or the PR head. Otherwise fetch the PR head
  without checking it out and diff the base against the fetched head SHA.
- **"Uncommitted changes"** (or equivalent): `git diff HEAD` plus untracked files
  from `git ls-files --others --exclude-standard`.

If the user named no target, ask for one. Record what the review covers: the PR
head SHA, commits not yet pushed (`git log <PR-head-SHA>..HEAD --oneline`),
uncommitted changes and untracked files.

Before going further, confirm the refs resolve (`git rev-parse`) and the diff is
non-empty. A bad ref or empty diff should fail here, not inside two parallel sub-agents.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. An issue, spec path or link the user passed.
2. The issues linked from the PR, its body, the branch name or the commit
   messages (`#123`, `Closes #45`, `ABC-123`, GitLab `!67`, etc.), fetched through
   the repository's configured tracker as `./bundled/templates/project-context.md` describes.
3. As a last fallback, a spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
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
  This review proposes changes; it does not authorize applying them. Only the
  owner's choice in step 6 does.

### 4. Review the selected axes

For the small-change path, give one independent reviewer both briefs below and
require separate Standards and Spec results. Otherwise launch the two axis
reviewers within host capacity.

**Standards sub-agent prompt** should include:

- The full diff command, commit list and any untracked files to read.
- The list of standards-source files you found in step 3, **plus the smell baseline and simplification check from step 3** pasted in full (the sub-agent has no other access to them).
- The supplied spec or relevant requirements, when available, so proposed simplifications preserve requested behavior.
- The brief: "Report documented-standard violations with the source rule and file/line evidence separately from optional smell or simplification suggestions. For each simplification, identify the change, replacement, usage evidence, and maintenance benefit. Apply the baseline and simplification safeguards; deduplicate overlapping concerns. A documented repo standard overrides the baseline. Skip anything tooling enforces. If no worthwhile simplification is found, say so without implying the whole change is approved. Aim for under 400 words without omitting material findings."

**Spec sub-agent prompt** should include:

- The diff command, commit list and any untracked files to read.
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

State what the review covered (step 1): PR head SHA, unpushed commits,
uncommitted changes and untracked files.

### 6. Finish

For an owner-invoked standalone review that reported findings or suggestions,
end with one structured question (the host's choice prompt when available):

1. **Apply all findings and suggestions, verify, commit, and push to the PR (recommended)**
2. **Apply findings only**: the same flow, leaving optional suggestions out
3. **Stop here**

The choice is the authorization to edit, commit and push; option 1 needs no
further instruction. Without a PR or upstream branch, commit and report that
nothing was pushed. Apply only the reported items, run the affected checks, and
send behavioral fixes through one focused independent verification as
`./bundled/templates/review-policy.md` describes. Report the commit, push and
verification results. A clean review with nothing to apply ends without the
question.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
