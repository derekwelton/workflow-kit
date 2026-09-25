## Worker envelope

Require every implementation and review worker to return:

```json
{
  "issue": "KEY-123",
  "stage": "implementation|review|integration",
  "branch": "owner/key-123-slug",
  "worktree": "absolute path",
  "baseSha": "commit",
  "headSha": "commit",
  "provider": "codex|claude",
  "execution": { "requestedModel": "gpt-6-astra", "resolvedModel": null, "resolutionStatus": "unverified", "effort": "low", "highReason": null, "workerId": "runtime-session-id", "policyVersion": "2026-09-24", "fallbackReason": null },
  "state": "complete|blocked",
  "summary": ["plain-language outcome"],
  "changedFiles": [],
  "untrackedFiles": [],
  "tests": [
    {
      "command": "exact command",
      "status": "passed|failed|blocked|skipped",
      "tests": 0,
      "headSha": "exact tested commit",
      "details": "optional useful result"
    }
  ],
  "reviewReceipt": null,
  "completionGuide": null,
  "blocker": null,
  "discoveries": []
}
```

The coordinator validates the envelope against Git and the manifest. Do not
trust a prose-only completion claim.

`stage` and `summary` are required so the presentation layer never describes an
independent review as an implementation pass or substitutes a file list for an
outcome. A legacy envelope without `stage` may be rendered generically, but the
coordinator must supply the known stage to the renderer. A completed envelope
without conclusive passing verification is incomplete and cannot advance the
issue. Keep the exact tested SHA in the structured `headSha` test field; the
default renderer omits it while `--technical` exposes exact machine details.

The envelope is an internal protocol, not a user report. Store and validate it
as structured data, but never paste it into chat, a final answer, or a tracker
checkpoint unless the user explicitly requests raw JSON. Render a human
checkpoint with outcome, changes, verification, relevant notes, and next
action. Keep absolute paths, schema fields, and full SHAs in the envelope; show
them only when they are actionable or explicitly requested.

When persisting the envelope, record full Git-resolved base/head commits. The
`tests` evidence must include the exact tested head SHA. A final review receipt
must use `<review-provider>:<full-head-sha>:<durable-receipt-id>`. Changing the
head invalidates tests; review carry-forward requires the explicit attestation in
`../../../templates/review-policy.md`. The manifest helper enforces integration
state order (`pending → assembling → ready-for-human-review → merged`) and
requires a head-bound conflict review receipt when conflicts occurred.

Implementation workers populate completionGuide using
`../../../templates/completion-guide.md` and the schema in `commands.md`.
Review workers may leave it null. The coordinator verifies all feature coverage,
merges ordered actions and refreshes instructions for the final integrated head.
