---
name: code-review
description: Independently review and optionally fix a branch, PR, or repository-scoped Linear Code Review queue along Standards and Spec axes. Supports Codex, Claude, and cross-provider workload review receipts; standalone reviews hand completed work to In Review, while multi-issue workloads remain in Code Review until their integration branch passes.
---

Resolve this skill's real filesystem path before following relative references.
The package root is two directories above this SKILL.md; retain its sibling
skills, scripts, and templates together.


Read the repository lifecycle and local overrides first. When `tracker: github-projects`
or a local GitHub Projects contract is present, read `../github-projects/SKILL.md`;
its field/status/label rules override the GitHub/Linear defaults below.


Two-axis review of a diff between a completed implementation and its fixed
point:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the feature's spec?

Both axes use fresh independent review context. Claude review runs them as
parallel sub-agents; a Codex adapter may cover both in one structured
adversarial pass. This skill aggregates and adjudicates their findings. The
implementation agent must not use this skill to approve its own work under
Linear mode. `Code Review` is an independent queue owned by a later review
agent.

## Process

### 0. Choose targeted, queue, or workload mode

- **Targeted mode** — the user names a branch, PR, issue, review head, or fixed
  point. Review only that change.
- **Linear queue mode** — the user asks for `/workflow-kit:code-review queue`, every item
  awaiting code review, or a repository-wide review pass. Read `linearTeam`
  from the lifecycle doc, resolve the exact `Code Review` status with
  `list_issue_statuses({ team })`, then query the team's issues in that status.
  Scope the results to the **current repository** using the synced GitHub
  attachment/PR repository first, then the issue's branch repository. A Linear
  team can span repos: never treat the whole team as this repo, and never infer
  repo membership from the title alone.
- **Workload mode** — the user passes `--workload <id>` or arrives from
  `orchestrate-queue`. Read the workload manifest with that skill's helper.
  Review only the frozen issue heads. A completed issue review records
  `reviewed-pending-integration` and remains in Linear `Code Review`; the
  workload coordinator owns the later batch transition to `In Review`.
  Follow `../orchestrate/references/workload-contract.md` for the review-round
  cap and severity convergence. In workload mode only the coordinator spawns;
  a dispatched reviewer performs its assigned axes without nested subagents.
  This overrides any parallel sub-agent instructions below for that worker.

Accept `--reviewer auto|codex|claude` and `--fix`. In workload mode, `auto`
means the provider opposite the actual implementation author recorded in the
manifest. Outside a workload, use repo/model-routing policy. `--fix` means a
fresh receiving agent adjudicates findings, applies safe fixes, verifies them,
and obtains a receipt for the final head; it never lets the original
implementer approve its own change.

In workload mode, the `code-review` manifest state requires full Git-resolved
`baseSha`/`headSha`, the implementation provider, and test evidence containing
the tested head SHA. `reviewed-pending-integration` additionally requires the
review provider and a receipt formatted
`<review-provider>:<full-head-sha>:<durable-receipt-id>`. Replace both tests and
receipt whenever a fix changes the head.

For queue mode, identify the current repository and default branch from its git
remote or `gh repo view`. Process every matching issue independently; one
blocked review must not prevent the rest of the queue from being reviewed.
Report both the reviewed and skipped keys at the end. If `Code Review` does not
exist, stop and report the missing status rather than substituting `In Review`.

### 1. Pin the fixed point

In targeted mode, distinguish the review head from the fixed point. If the user
gave only a fixed point (`main`, a SHA, `HEAD~5`), review `<fixed-point>...HEAD`.
If they gave a PR, use its head and base. If they gave only a branch or issue,
use that branch as the review head and the repository default branch as the
fixed point. Ask only when neither side can be resolved safely.

In queue mode, resolve each issue's linked PR or `gitBranchName` without
checking out or mutating the branch. Use the PR base branch as the fixed point;
if there is no PR, use the repository's default branch. Fetch the relevant
remote refs, then compare `<base>...<issue-branch>`. If the branch/ref cannot be
resolved or the diff is empty, post a blocked update and leave that issue in
`Code Review`.

Capture the diff command once per review: `git diff
<fixed-point>...<review-head>` (three-dot, so the comparison is against the
merge-base). Note the commit list via `git log
<fixed-point>..<review-head> --oneline`.

Before going further, confirm both refs resolve (`git rev-parse`) and the diff
is non-empty. A bad ref or empty diff fails here — not inside two parallel
sub-agents.

### 2. Identify the spec source

**Check the lifecycle doc's frontmatter for `linearTeam` first.** If the key is
**absent**, use the default below and do not touch Linear. If it is **present**,
skip the default and use the Linear-mode block instead
(`../linear-mode/SKILL.md`).

**Default — the spec is on disk.** In this order:

1. The **feature folder's `spec.md`** — resolve via issue references in the
   branch name or commit messages (`#123`, `Closes #45`) to
   `<workDir>/features/<issue#>-<slug>/spec.md`, including `_archive/`.
2. A path the user passed as an argument.
3. A sub-issue ticket body, if the branch implements one ticket — review
   against the ticket's acceptance criteria plus the parent spec.
4. If nothing is found, ask the user. If they say there isn't one, the Spec
   sub-agent skips and reports "no spec available".

**Only when `linearTeam` is set — the spec is the issue.** There is no
`spec.md` under Linear mode, so looking only on disk would silently degrade
this axis to nothing. Resolve the issue from the branch name (it's the Linear
`gitBranchName`, e.g. `derekswelton/irp-13-…` → `IRP-13`), a `Refs #<n>` in
the commits, or the user's argument. Then fetch **both**:

1. the **issue body** via `get_issue` — goal, scope, acceptance criteria, and
   the `## Tasks` checklist; this is the current truth, and
2. the **spec comment** via `list_comments` — implementation and testing
   decisions, alternatives rejected, open questions; this is the reasoning the
   body doesn't carry.

Reviewing against the body alone misses the decisions, which is where most spec
infidelity actually shows up. For a sub-issue ticket, use the ticket's own body
plus the parent's.

In either mode, `research/` stays on disk and remains available to both
sub-agents as cited evidence.

### 3. Identify the standards sources

Anything in the repo that documents how code should be written:
`CONTRIBUTING.md`, `CODING_STANDARDS.md`, agent-docs conventions (`.ai/docs/`,
`AGENTS.md`, `CLAUDE.md`), the domain glossary and ADRs (lifecycle-doc
`glossary`/`adrDir` config).

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

### 4. Run an independent reviewer

Read `../model-routing/SKILL.md`; pass explicit model and effort controls.

Choose the provider before launching review:

- Codex-authored implementation → fresh Claude reviewer selected by model-routing by default.
- Claude-authored implementation → fresh Codex reviewer selected by model-routing by default.
- `codex-only` / `claude-only` workloads → a fresh, context-independent
  session of that provider.

The reviewer must cover both axes below. With Claude, run the two axis prompts
as fresh Claude sub-agents, parallel only within host capacity. With Codex, use the dedicated Codex reviewer
adapter once with the exact worktree `--cwd`, fixed base/head SHAs, Standards
sources, issue body/spec comment, and an instruction to report both axes. Do
not call the low-level companion runtime from an ordinary sub-agent, inspect
its state directory, or poll it manually.

#### Claude two-axis prompts

Launch the two axes in fresh contexts using the available host tools; serialize if capacity is insufficient.

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

#### Receiving and fixing findings

Treat reviewer output as evidence, not authority. Re-derive each material
finding against the code and spec. Reject false positives with a short reason.
When `--fix` is active, apply or delegate accepted fixes in the issue worktree,
audit untracked files, run focused verification, and commit/push according to
repo policy. If the head SHA changed, review the final diff or record an
explicit re-review/adjudication receipt keyed to the new head.

Leave work with uncorrected material findings or incomplete verification in
`Code Review`. Non-material findings may remain only when the durable review
receipt explains why they do not block human testing.

### 5. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim
or lightly cleaned. Do **not** merge or rerank findings — the two axes are
deliberately separate. For a long review, render it with `present` using
`templates/report-findings.html`, which has a two-axis layout that keeps the
separation visible.

End with a one-line summary: total findings per axis, and the worst issue
*within each axis*. Don't pick a single winner across axes — that's the
reranking the separation exists to prevent.

When the review resolves to a feature/ticket issue, apply `update-issue` with a
**Code review complete — ready for human review** comment. Preserve the two
axes, include the finding counts and worst finding in each, state what remains
open, link the exact reviewed branch/PR and fixed point, and give the human's
next action. Do not make a local report the only record. Surface intentionally
open non-material findings clearly for human review.

Under Linear mode, re-fetch the issue immediately before any status write. For
a standalone review, if it is still in `Code Review`, both axes completed (or
Spec was explicitly unavailable), and no material finding remains, move it to
`In Review`. For workload mode, do not change its status: record provider,
base/head SHAs, verification, and the final review receipt as
`reviewed-pending-integration` in the workload manifest. If review or required
fixing could not complete, post a **Blocked** update and leave it in
`Code Review`. Never overwrite another status and never set `Done`.

For a standalone review with no originating issue, report in chat without
inventing a tracker item. In queue mode, repeat the full process for every
repository-scoped candidate, then finish with counts for `In Review`, reviewed
pending workload integration, left in `Code Review`, and skipped as
out-of-repo.

## Why two axes

A change can pass one axis and fail the other:

- Follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Does exactly what the issue asked but breaks conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
