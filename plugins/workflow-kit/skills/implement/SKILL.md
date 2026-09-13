---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
---

Resolve bundled relative file paths from this skill's directory, not the project working directory.


Read `./bundled/templates/project-context.md` for this project's conventions and tracker scope.

Implement the work described by the user in the spec or tickets.

Use /ponytail and /tdd where useful. Existing criteria, interfaces and tests can
establish the seams; don't require a new planning interview for routine work.

Run affected checks and all required repository verification. Repeat checks after
changes or failures, not on a fixed cadence unrelated to the work.

Once done, use /code-review with a fresh independent reviewer of the final diff.
Commit/push only as authorized by the user or repository. If commits are authorized,
review the final commit SHA; subsequent changes invalidate the review evidence.

For configured Linear/Projects work, read the selected adapter only: implementation
hands off to Code Review (or its local mapping), independent review hands off to
human In Review. Use /update-issue for authorized checkpoints. Workload workers
return results to the coordinator and never launch nested reviewers or write trackers.
Agents never approve their own implementation or set Done.

When this workflow calls for a required skill that is not separately installed, read its instructions from `bundled/dependencies.md`. Load only the dependency needed for the current step; bundled instructions do not authorize additional work.
