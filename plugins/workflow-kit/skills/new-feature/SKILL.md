---
name: new-feature
description: Create or reuse minimal issue intake for authorized repository implementation. Follow the configured tracker; create a feature folder only when real artifacts exist.
---

Resolve this skill's real filesystem path; package root is `../..` from its directory.


# Minimal issue intake

Read repository configuration/local overrides and `../../templates/lifecycle-contract.md`.
Use for authorized repository implementation. Personal advice, read-only audits
and requested standalone reports do not require issue intake.

1. Resolve the repository and search for an existing matching issue. Reuse it
   rather than filing a duplicate. Derive a short slug from the task.
2. Read the configured adapter and `../../templates/tracker-write.md` before
   publication. Ordinary GitHub: create a sentence-case title, concise goal/
   acceptance criteria and Tasks checklist with configured labels. Projects:
   use its Issue Types, fields, status mappings and branch convention.
   Linear: load `../linear-mode/references/intake.md` for canonical body,
   labels and gitBranchName; use its verified sync thread for comments.
3. Compare the repository lifecycle stamp with
   `../../scripts/managed-version.mjs` using its canonical --lifecycle path.
   Report drift in one line; do not refresh/downgrade implicitly.
4. Create no folder for an issue-only fix. When an artifact actually needs a
   home, use <workDir>/features/<issue#>-<slug>/. GitHub Markdown carries its
   useful spec/notes; Linear narrative stays in the issue. Do not create empty
   spec/plan stubs. Artifact headers identify the issue; in Linear include
   the verified GitHub twin and Linear key.
5. Return issue URL and the next action suited to scope. Small ready work can
   proceed when implementation was requested. Interview/spec/ticket escalation
   remains opt-in; do not start it merely because intake completed.

Templates are examples, not compulsory artifact creation. The caller owns one
meaningful start checkpoint; don't duplicate creation text with an empty update.
