---
name: present
description: Generate a self-contained HTML review document for the user from the current feature's state — spec reviews, design comparisons, QA galleries, research findings, wrap-up reports. Use whenever something needs the user's review or decision (markdown stays the format for agent-to-agent handoffs).
---

# present

Render the thing that needs the user's eyes as a polished, self-contained HTML
document. Optional argument: a topic (e.g. `qa`, `spec-review`, `variants`);
otherwise infer from what the current session produced.

## Rules

- **HTML is presentation, markdown is canonical.** Never put information ONLY
  in the HTML — decisions and facts it presents must exist in (or be written
  back to) `spec.md` / `notes.md`.
- Output path: `<feature-folder>/review/<YYYY-MM-DD>-<topic>.html`. Review docs
  are ephemeral and gitignored; they die at wrap-up.
- **Self-contained**: inline all CSS, no external requests, opens via `file://`.
  Reference screenshots relatively from the sibling `qa/` folder (they're
  local-only, same as the review doc).

## Steps

1. Identify the feature folder (the one being worked on this session; ask only
   if genuinely ambiguous).
2. Start from `${CLAUDE_PLUGIN_ROOT}/templates/review-doc.html` — it provides
   the visual shell (masthead with issue link, section grammar, decision panel,
   screenshot grid with lightbox, comparison columns). Keep its look; replace
   its placeholder content. Freeform layout is allowed only for design-variant
   explorations where the content IS the design.
3. Structure the content for a reviewer, not a log: lead with what's being
   asked of them, then the evidence. Always include:
   - masthead: title, date, feature name + issue link,
   - a **"Needs your decision"** panel listing the concrete questions
     (or "FYI — no decisions needed"),
   - sections of findings/comparisons/screenshots as appropriate.
4. If a browser tool is available (Playwright), screenshot the rendered doc
   once to verify nothing is broken; delete the check screenshot after.
5. Log a dated line in `notes.md` (`presented: <file> — <topic>`), then give
   the user the absolute path to open, plus a 2–3 sentence summary of what it
   asks of them.
