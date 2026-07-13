---
name: update-issue
description: Keep the originating GitHub issue useful while work is in progress. Use automatically whenever issue-backed work starts, reaches a meaningful checkpoint, needs the user's review or decision, becomes blocked, pauses for a handoff, or finishes.
---

# update-issue

Treat the GitHub issue as the human-facing control plane for the work, not
just the intake form. A user returning to the issue must be able to tell what
happened, inspect reachable evidence, answer any questions, and see what comes
next without reconstructing the agent session.

## Required checkpoints

Post an issue update at each of these transitions:

1. **Started** — once substantive work begins after issue creation. Name the
   branch/worktree when one exists, the scope being worked, and the next
   checkpoint.
2. **Checkpoint** — after a meaningful phase such as research, audit, spec,
   prototype, implementation, verification, or code review. Tick completed
   issue-body tasks at the same time.
3. **Needs input** — immediately before asking the user to review, decide,
   verify, approve, provide access, or do manual work. Never leave the request
   only in chat or a local document.
4. **Paused or blocked** — before ending a session with unfinished work. State
   the blocker/current state and the exact resumption step; link the handoff
   when it is reachable on GitHub.
5. **Finished** — summarize the outcome and verification. Close the issue only
   when the lifecycle says it is done; a completed phase does not close a
   parent feature issue.

Do not post minute-by-minute narration. One comment per meaningful phase or
session is normally enough. Before writing, fetch the issue body and recent
comments so the update does not repeat an existing checkpoint or overwrite
concurrent tracker edits.

## Comment shape

Use only the sections that apply, but make the comment standalone:

```markdown
## Status — <Started | Checkpoint | Needs decision | Blocked | Ready for review | Complete>

<One-sentence outcome/current state.>

### Completed
- <concrete result>

### Needs you
1. **<decision or action>** — Recommendation: <answer and short reason>.

### Evidence
- `<verification command>` — pass (<useful result>)

### Artifacts
- [<descriptive name>](<GitHub-reachable URL>) — <what it contains>

### Next
<Exact next action and who owns it.>
```

For a decision, list each question explicitly and put the recommended answer
beside it. For completed work, distinguish implemented behavior from checks
that merely passed. Keep raw logs and large dumps out of the comment.

## Artifact accessibility

- Prefer a permalink to committed canonical Markdown, source, a PR, a commit,
  or a deployed preview that the issue reader can open. Confirm the target is
  pushed/reachable before calling it a link.
- A gitignored `review/*.html`, `qa/` image, absolute local path, or `file://`
  URL is **not a GitHub artifact**. Never make it the only record or imply the
  issue reader can open it remotely.
- When review HTML is local-only, reproduce its executive summary, every
  requested decision, the recommendation, and the relevant evidence in the
  issue comment. Include the local path only as an optional convenience,
  clearly labelled `local-only`.
- If the repo already has an approved publishing/preview path, publish the
  review artifact there and link it. Do not invent hosting, push a branch, or
  make a deployment solely to obtain a link without authorization.
- When the available GitHub/browser tooling supports image attachments,
  attach the few screenshots that materially support the review. Otherwise
  link images already committed and pushed under repo policy. If neither is
  possible, write enough evidence in the comment to make the request
  actionable without the image.
- Redact secrets, private logs, tokens, customer data, and unrelated work from
  comments and artifacts.

## Tracker synchronization

Update issue-body checkboxes when their work is actually complete, preserving
the rest of the body and any concurrent edits. Reference PRs with `Refs #N`
while work remains and `Closes #N` only when merge should complete the issue.
Use sub-issue comments for ticket-specific work and roll only a one-line
milestone summary up to the parent.

The final chat response may be shorter than the issue comment, but it must
include the issue URL so the user knows the durable update exists.
