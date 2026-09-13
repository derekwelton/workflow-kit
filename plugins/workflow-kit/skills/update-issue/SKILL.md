---
name: update-issue
description: Publish one authorized phase checkpoint on the originating issue. Use at meaningful lifecycle gates; deduplicate recent updates and preserve read-only scope.
---

Resolve bundled relative file paths from this skill's directory, not the project working directory.


# Update issue

Publish one authorized phase delta for the caller. Read
`../../templates/lifecycle-contract.md` for scope/checkpoint ownership and
`../../templates/tracker-write.md` before any write. A read-only request or
nested renderer/research worker returns content without publishing.

Meaningful checkpoints: started, phase result, needs decision, paused/blocked,
ready for independent review, ready for human review, completed non-code work.
Do not narrate every tool call or duplicate a checkpoint already published.

Use a short outcome followed by relevant completed work, verification,
limitations, questions with recommendations, reachable evidence, and exact next
action/owner. Optional larger examples are in the installed linear-mode skill's
references/checkpoint-examples.md; use only if available and needed.
Tick only completed acceptance/tasks on the freshly fetched issue body.
A phase result does not close the parent or satisfy human acceptance.

Use the selected tracker adapter for status mapping, body updates, and comment
delivery. For Linear publish only through its verified sync thread, never both
providers. The caller retains write results and reconciles uncertain delivery
before retrying. Final chat identifies the issue URL only if a durable update
was actually published.
