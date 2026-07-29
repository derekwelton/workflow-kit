---
name: update-issue
description: Keep the originating GitHub issue useful while work is in progress. Use automatically whenever issue-backed work starts, reaches a meaningful checkpoint, needs the user's review or decision, becomes blocked, pauses for a handoff, or finishes.
---

# update-issue

Treat the GitHub issue as the human-facing control plane for the work, not
just the intake form. A user returning to the issue must be able to tell what
happened, inspect reachable evidence, answer any questions, and see what comes
next without reconstructing the agent session.

**First, check the mode.** Read the lifecycle doc's frontmatter. If it carries
`linearTeam`, Linear is the control plane instead — see "Linear mode" at the
bottom of this file before posting anything. If it does not, everything below
applies as written and Linear is not involved at all.

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
   parent feature issue. (In Linear mode an agent never closes: it sets
   `In Review` and hands off.)

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

## Linear mode

When the lifecycle doc's frontmatter carries `linearTeam`, follow
`../linear-mode/SKILL.md`. The checkpoints, comment shape, artifact
rules, and redaction rules above all still apply — what changes is *where* the
update goes and that status now carries meaning.

**Comments — the part that is easy to get wrong.** Every comment goes on the
sync thread, per linear-mode §3: `list_comments({ issueId })`, find the root
comment with `parentId === null` whose body matches
`/synced to a corresponding/i`, then `save_comment({ parentId: <that id>, body })`.
A top-level comment does **not** reach GitHub. If no such root exists, post
top-level and warn the user the comment is Linear-only.

**Never post the same comment to GitHub with `gh` as well** — sync crosses it
over, and duplicating produces two copies on the GitHub side.

**Checklists** live in the issue **body**, not a `plan.md`. To tick one:
`get_issue` to fetch the current description, apply the edit to that fetched
text, then `save_issue({ id, description })`. Always re-fetch immediately
before writing — the call replaces the whole description, so a stale copy
clobbers concurrent edits from the user or the GitHub side.

**Status at the documented transitions** (linear-mode §4, which also covers
resolving status names per team):

| Checkpoint | Status |
|---|---|
| Started | `In Progress` |
| Checkpoint | leave as-is |
| Needs input | leave as-is — the comment is the signal |
| Paused or blocked | leave as-is; say so in the comment |
| Finished | `In Review` |

**Never set `Done`.** `In Review` is where an agent stops; `Done` is the
user's, or a merge's. A finished-work comment says what was verified and what
still needs a human — it does not close anything.
