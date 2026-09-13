# Linear write adapter

Read `../bundled/templates/tracker-write.md` first. This reference owns sync-root
discovery and Linear body updates, not workload integration invariants.

## 3. The sync-thread rule — get this right or comments go nowhere

**Only replies to one designated comment thread cross over to GitHub.** A new
top-level Linear comment stays Linear-only, silently. This is the single
easiest thing to get wrong in Linear mode.

The designated sync root has `parentId: null` and this sync message:

> This comment thread is synced to a corresponding [GitHub issue](…). All
> replies are displayed in both locations.

**Required procedure for every comment:**

1. `list_comments({ issueId })`. Follow every page/cursor exposed by the active
   tool before concluding discovery is complete. If results are truncated or
   completion cannot be established, sync remains **unverified**.
2. Find top-level comments (`parentId === null`) whose body contains the
   designated sync message and whose linked GitHub issue matches the expected
   repository **and issue number** from the issue's verified attachment/sync
   metadata. Resolve that target first; do not guess it from an unrelated URL.
   **Ignore `author` for selection:** null, omitted, and populated integration
   authors are all valid representations. A reply quoting the message is not a root.
3. Deduplicate repeated results by comment ID. Select only one unique matching
   root. If multiple roots match, report ambiguity and reconcile; never choose
   the first arbitrarily or post an update while the destination is ambiguous.
4. `save_comment({ parentId: <selected root id>, body })`, passing the issue
   identifier too if required by the active tool. The parent ID is the comment's
   ID, not the issue's ID.
5. No match after complete discovery means **sync unverified**, not proof that
   the issue is unsynced. Report the missing root/target and reconcile. If an
   authorized update must be preserved in Linear meanwhile, clearly label a
   top-level fallback as **Linear-only; GitHub delivery unverified**. Do not claim
   cross-posting succeeded or automatically post a second copy through GitHub.

Use the canonical selector in `../bundled/scripts/lib/linear-sync-root.mjs`
(or equivalent conditions) after collecting every comment page. It does not
fetch pages or perform writes.


**Never** post the same comment to GitHub with `gh` as well. Sync handles the
crossover; duplicating produces two copies on the GitHub side.

### Editing the body safely

`save_issue({ id, description })` replaces the whole description. Always
`get_issue` immediately before writing, apply your edit to the fetched text,
and write it back — otherwise a concurrent edit (the user's, or the GitHub
side's) is clobbered. Tick checkboxes this way; never reconstruct a body from
memory.

Issue descriptions sync bidirectionally with the GitHub twin, so a checklist
ticked in Linear shows ticked on GitHub. Only ever edit the body on **one**
side — Linear's — so the two can't race.
