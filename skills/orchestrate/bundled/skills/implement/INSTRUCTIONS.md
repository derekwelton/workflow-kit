
Resolve this document's relative file paths from the directory containing it, not the project working directory.


Implement the work described by the user in the spec or tickets.

Use /ponytail and /tdd where useful. Existing criteria, interfaces and tests can
establish the seams; don't require a new planning interview for routine work.

Run affected checks and all required repository verification. Repeat checks after
changes or failures, not on a fixed cadence unrelated to the work.

Once done, use /code-review with a fresh independent reviewer of the final diff.
Commit/push only as authorized by the user or repository. Changes after review
follow `../../templates/review-policy.md`. Finish with the usage and setup
guide in `../../templates/completion-guide.md`.

For tracker-linked work, read `../../templates/project-context.md` and use
/update-issue for authorized checkpoints: implementation hands off to Code Review
(or its local mapping), independent review hands off to human In Review. Agents
never approve their own implementation or set Done.

If a coordinator dispatched you with a brief, follow it: return results to the
coordinator without launching reviewers or writing trackers.

When this workflow calls for a required skill that is not separately installed, read its instructions from `../../dependencies.md`. Load only the dependency needed for the current step; bundled instructions do not authorize additional work.
