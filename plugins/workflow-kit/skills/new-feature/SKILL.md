---
name: new-feature
description: Start a unit of work — files the GitHub issue first (issue-first rule), then creates the work/features/<issue#>-<slug>/ folder with stub spec.md and notes.md. Use when beginning any feature, bug with artifacts, chore, or exploration.
---

Resolve this skill's real filesystem path before following relative references.
The package root is two directories above this SKILL.md; retain its sibling
skills, scripts, and templates together.


Read the repository lifecycle and local overrides first. When `tracker: github-projects`
or a local GitHub Projects contract is present, read `../github-projects/SKILL.md`;
its field/status/label rules override the GitHub/Linear defaults below.


# new-feature

Start tracked work. Argument: a short kebab-case slug (and optionally a
one-line description). If no slug given, derive one from the conversation and
confirm it in your reply.

## Rules

- **Issue first, always.** Nothing gets a folder without an issue number.
- **Folder only if artifacts will exist.** For a small bug that's just
  issue + fix branch, create the issue and stop — say the folder was skipped
  and why.
- Read the repo's lifecycle doc (see its config frontmatter for `workDir`;
  default `work`) to respect per-repo paths and labels.
- **Notice a stale repo, in one line.** While reading that doc, compare its
  stamp using `node <workflow-kit-root>/scripts/managed-version.mjs --cwd <repo> --lifecycle <canonical-doc>`.
  Resolve the package root from this skill's real path, two directories up.
  The helper compares the
  `workflow-kit:managed-start version=` stamp to the installed plugin's
  version. If the repo's is older, or the markers are missing entirely
  (a pre-0.4.0 stamp), add one line to your report: the repo is on version X,
  the plugin is on Y, `/workflow-kit:workflow-update` refreshes it. This
  matters on every host: local agents read checkout files, loaded sessions may
  retain earlier instructions, and commit/push distribute updates to other
  machines. Do **not** run the update, and do not derail the task the user
  actually asked for.
- **Check the same frontmatter for `linearTeam`.** If present, follow
  "Linear mode" below instead of steps 1–2. If absent, this skill behaves
  exactly as written — do not touch Linear.

## Steps

1. **File the issue**:
   `gh issue create --title "<Sentence-case title>" --label <type> --body ...`
   - Type: `feature` | `bug` | `chore` | `idea` — infer from context, default
     `feature`.
   - Body: 1–3 sentence goal, then a `## Tasks` markdown checklist with the
     known first steps (specs/plan/build/QA/wrap as applicable). Tasks live in
     the issue body — GitHub sub-issues only if a sub-task later grows its own
     PR and folder.

2. **Create the folder** `<workDir>/features/<issue#>-<slug>/` with:
   - `spec.md` — title, issue link, `Status: draft`, and headings for
     Goal / Requirements / Out of scope / Open questions. Fill in whatever is
     already known from the conversation rather than leaving pure boilerplate.
   - `notes.md` — issue link + dated "Started" entry. This is the running
     decision log; every meaningful decision gets a dated line here.

3. **Report**: issue URL, folder path, and the immediate next step —
   **suggested in one line, never started unprompted**. Match the suggestion
   to the size: small/clear work → "ready to build"; genuinely decision-heavy
   work → offer a `grilling` round (then `to-spec`); bigger than one session →
   `to-tickets` after the spec; foggy epic → `wayfinder`. The user picks;
   proportionality is theirs to decide, not yours.

## Linear mode

When the lifecycle doc's frontmatter carries `linearTeam`, follow
`../linear-mode/SKILL.md` — in particular §4 (status), §5 (branch
naming), §6 (artifacts), and §8 (body templates). Steps 1–2 above become:

1. **File the issue in Linear**, not with `gh`:
   `save_issue({ team, title, description, labels, state, priority })`.
   - Body: use the bug or feature template in linear-mode §8, including the
     `## Tasks` checklist. That checklist is the plan — there is no `plan.md`.
   - Labels: from Linear's own set (`list_issue_labels`), not the lifecycle
     doc's `labels:`.
   - Starting status: `Todo` if it's specified enough to start cold, else
     `Backlog`.
   - **Do not also run `gh issue create`.** Sync produces the GitHub twin
     automatically; creating both yields two issues for one unit of work.

2. **No folder.** Do not create the feature folder here — create it later, only
   when a real artifact needs somewhere to live (research findings, scratch
   scripts, QA evidence). Most units of work never need one.

3. **Report both keys and the branch name**: the Linear key and URL
   (`IRP-13`), the GitHub twin (`#40` — read it from the issue's attachments,
   or say sync hasn't produced it yet), and the issue's `gitBranchName`, which
   is the branch to use.

## Conventions downstream of this skill

- Once substantive work begins, apply `update-issue` at every meaningful
  lifecycle transition; issue creation itself is the initial tracker record.
- Branch names should reference the issue (e.g. `feat/<issue#>-<slug>`) — in
  Linear mode, use the issue's `gitBranchName` instead (linear-mode §5).
- PRs use `Refs #<n>` while work continues, `Closes #<n>` only when the merge
  should close the issue.
- Screenshots/evidence go in the folder's `qa/`, scratch scripts in `scratch/`,
  research findings in `research/`, session handoffs as `handoff-<date>.md`,
  documents for the user in `review/` (via `present`).

End with one next-step line: small/clear → `implement`, branch and PR;
decision-heavy → an opt-in `grilling` then `to-spec`; large agreed spec →
`to-tickets`; shipped and accepted → `wrap-feature`. Reuse an existing issue
when present. Once implementation starts, apply `update-issue` at meaningful
checkpoints and offer closeout only after the review and acceptance gates.
