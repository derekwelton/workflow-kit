## 4. Status contract

| Status | Meaning | Set by |
|---|---|---|
| `Triage` | raw idea, needs shaping before anyone can act | authorized triage |
| `Backlog` | real work, not scheduled | authorized triage |
| `Todo` | specified enough for an agent to start cold | `to-spec`, `to-tickets`, authorized triage |
| `In Progress` | actively being worked | auto on branch push; skills also set it explicitly |
| `Code Review` | implementation complete, **awaiting independent AI review**; reviewed workload items remain here until combined integration passes | `implement`; PR automation may also set it when configured |
| `In Review` | AI review complete and, for a workload, its integration branch is ready for human testing | `code-review` for standalone work; Claude `/workflow-kit:orchestrate` or Codex `$orchestrate-queue` for a workload batch |
| `Done` | merged, or human-verified | **never an agent** — merge or the user |
| `Canceled` / `Duplicate` | triage outcomes | proposed by triage, applied when authorized |

**Implementation and review are separate handoffs.** The implementation agent
stops at `Code Review`; it does not review its own work. A later code-review
agent completes the full review. Standalone work moves to `In Review`;
workload work waits for the combined integration gate. An agent never marks
work `Done`; that remains the merge's or the user's decision.

For multi-issue handoff gates read the installed orchestrate skill's
references/workload-contract.md only when running a workload. If orchestration
is not installed, report that prerequisite for the workload operation.
This adapter only maps those phases onto the exact configured statuses.

Non-code work that has no code-review phase (for example, a research or audit
deliverable) may move directly to `In Review` when it needs human review.

### Resolving status names

Status names are not guaranteed across teams. Resolve via
`list_issue_statuses({ team })` and match on `type`, falling back to name:

| `type` | Status |
|---|---|
| `triage` | Triage |
| `backlog` | Backlog |
| `unstarted` | Todo |
| `started` | In Progress, Code Review, **and** In Review — all three share this type |
| `completed` | Done |
| `canceled` | Canceled |
| `duplicate` | Duplicate |

Because all three active/review states share `type: "started"`, disambiguate by
exact name. If a team has no `Code Review` equivalent, **say so rather than
guessing** — leave completed implementation in `In Progress` and tell the user
the AI-review queue has nowhere to live. If it has no `In Review` equivalent,
leave a completed code review in `Code Review` and report that the human-review
handoff could not be represented.
