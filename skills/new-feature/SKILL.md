---
name: new-feature
description: Start a unit of work — files the GitHub issue first (issue-first rule), then creates the work/features/<issue#>-<slug>/ folder with stub spec.md and notes.md. Use when beginning any feature, bug with artifacts, chore, or exploration.
---

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

3. **Report**: issue URL, folder path, and the immediate next step.

## Conventions downstream of this skill

- Branch names should reference the issue (e.g. `feat/<issue#>-<slug>`).
- PRs use `Refs #<n>` while work continues, `Closes #<n>` only when the merge
  should close the issue.
- Screenshots/evidence go in the folder's `qa/`, scratch scripts in `scratch/`,
  documents for the user in `review/` (via `/workflow-kit:present`).
