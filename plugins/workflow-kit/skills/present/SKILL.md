---
name: present
description: Generate a self-contained HTML review document for the user from the current feature's state — spec reviews, design comparisons, QA galleries, research findings, wrap-up reports. Use whenever something needs the user's review or decision (markdown stays the format for agent-to-agent handoffs).
---

Resolve this skill's real filesystem path before following relative references.
The package root is two directories above this SKILL.md; retain its sibling
skills, scripts, and templates together.


Resolve `<workflow-kit-root>` from this SKILL.md's real filesystem path: two
directories up. Resolve symlinks first. Use that root for templates and scripts
on either host; never assume a Claude environment variable exists in Codex.


Read the repository lifecycle and local overrides first. When `tracker: github-projects`
or a local GitHub Projects contract is present, read `../github-projects/SKILL.md`;
its field/status/label rules override the GitHub/Linear defaults below.


# present

Render the thing that needs the user's eyes as a polished, self-contained HTML
document. Optional argument: a topic (e.g. `qa`, `spec-review`, `variants`);
otherwise infer from what the current session produced.

## Rules

- **HTML is presentation, markdown is canonical.** Never put information ONLY
  in the HTML — decisions and facts it presents must exist in (or be written
  back to) `spec.md` / `notes.md`. Under Linear mode
  (`../linear-mode/SKILL.md`) those files don't exist; the issue is the
  canonical surface, so decisions are written back to the issue body and a
  sync-thread comment instead.
- Output path: `<feature-folder>/review/<YYYY-MM-DD>-<topic>.html`. Review docs
  are ephemeral and gitignored; they die at wrap-up.
- **Self-contained**: inline all CSS, no external requests, opens via `file://`.
  Reference screenshots relatively from the sibling `qa/` folder (they're
  local-only, same as the review doc).
- **The issue comment is the remote review surface.** Apply `update-issue` for
  every presentation. A local review doc may add polish and depth, but the
  user must be able to understand and answer the request from GitHub alone.

## Steps

1. Identify the feature folder (the one being worked on this session; ask only
   if genuinely ambiguous). Review docs need somewhere to live, so if the work
   has an issue but no folder yet — normal under Linear mode — create it now.
2. **Pick the template that matches the report's shape**, from
   `<workflow-kit-root>/templates/`. Each is self-contained, responsive,
   light-mode, and print-aware; they share one design system, so reports look like a
   family rather than five unrelated documents.

   | Template | Shape | Used by |
   |---|---|---|
   | `report-checkin.html` | Where things stand — awaiting-you first, history last | `board` |
   | `report-audit.html` | Ranked findings, each a *proposed* action, one approval gate | `board audit`, `work-audit`, `ponytail-audit`, `improve-codebase-architecture` |
   | `report-findings.html` | Conclusions with evidence and confidence; optional two axes | `code-review`, `research`, `plan` |
   | `review-doc.html` | Anything else — the general shell (screenshot grid + lightbox, comparison columns, decision panel) | `prototype`, spec reviews, QA galleries |

   Fill the placeholders, repeat or delete the example blocks, and **delete any
   section with nothing in it** — an empty section is not proof you looked, and
   the coverage note is where you say what was skipped. Keep the template's
   look; freeform layout is allowed only for design-variant explorations where
   the content IS the design.
3. Structure the content for a reviewer, not a log: lead with what's being
   asked of them, then the evidence. Always include:
   - masthead: title, date, feature name + issue link,
   - a **"Needs your decision"** panel listing the concrete questions
     (or "FYI — no decisions needed"),
   - sections of findings/comparisons/screenshots as appropriate.
4. If a browser tool is available (Playwright), screenshot the rendered doc
   once to verify nothing is broken; delete the check screenshot after.
5. Log a dated line in `notes.md` (`presented: <file> — <topic>`) — under
   Linear mode, that line is part of the issue comment in step 6 instead.
6. Apply `update-issue` and post a **Ready for review** or **Needs decision**
   comment. Include the executive summary, every concrete question with its
   recommendation, the material evidence, and the next action. Link canonical
   Markdown, a deployed preview, PR, commit, or screenshots only when they are
   actually reachable from GitHub. If the HTML is local-only, label its path
   as such and do not make opening it necessary to respond.
7. Give the user the issue URL, the absolute local HTML path when useful, and
   a 2–3 sentence summary of what it asks of them.
