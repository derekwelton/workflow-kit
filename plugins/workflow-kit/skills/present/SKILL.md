---
name: present
description: Render supplied canonical content into a self-contained HTML report and verify its appearance. Pure presentation; the caller owns persistence and any tracker checkpoint.
---

Resolve this skill's real filesystem path; package root is `../..` from its directory.


# Present

Pure renderer of supplied canonical content into a self-contained HTML report.
Read repository visual rules when applicable. Resolve the package root from this
skill's real path (two directories up). Do not load lifecycle/tracker adapters.

The caller owns canonical facts, requested decisions, persistence, and any
authorized checkpoint exactly once. Rendering never creates an issue, edits a
spec/notes file, posts comments, or changes tracker state. Inherited read-only
scope permits only an explicitly requested report artifact.

1. Use the caller's output path; otherwise an existing feature review/ directory
   or a task-local temporary report path. Do not create a feature folder/intake
   merely to render. Return the chosen path.
2. Load one template from the package templates/ directory:
   report-checkin.html for status; report-audit.html for proposed changes;
   report-findings.html for evidence/review; review-doc.html for comparisons/QA.
3. Fill the template from supplied content; omit empty sections. Lead with the
   outcome or decision, cite evidence, and mark uncertainty. An issue link is
   optional. Preserve the template design; inline CSS, no remote requests.
   Keep screenshots relative and report any external local asset dependencies.
4. Open/render and screenshot once when a browser is available; fix visible
   defects and recheck only the changed result. Otherwise state visual QA missing.
5. Return the artifact and concise summary to the caller. Do not call update-issue.
