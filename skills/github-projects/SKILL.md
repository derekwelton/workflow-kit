---
name: github-projects
description: Apply a repository's GitHub Projects tracker contract, issue types and status mappings. Use only when Projects is configured; distinguish reads from authorized writes.
---

# GitHub Projects contract

Read docs/agents/issue-tracker.md or the existing repository tracker contract,
including lifecycle frontmatter and local overrides, before tracker operations.
`tracker: github-projects` enables this contract. It overrides ordinary GitHub
label classification and Linear-specific transitions throughout the workflow.
An existing repository-specific Projects contract also takes precedence; offer
configuration migration without changing its semantics during refresh.

Example opt-in configuration (project owner/number and field/status names must
be verified against the actual project, never copied blindly):

```yaml
tracker: github-projects
githubProject:
  owner: Ironwood-Manufacturing
  number: 1
  title: Ironwood Website Work
  statusField: Status
  priorityField: Priority
  statuses:
    todo: Todo
    inProgress: In Progress
    inReview: In Review
    changesRequested: Changes Requested
  issueTypes: [Bug, Feature, Task]
branchPattern: username/<issue#>-<slug>
```

Keep existing frontmatter exactly during routine refresh. `linearTeam` cannot
coexist with `tracker: github-projects`. Stop conflicting tracker writes and
report the ambiguity. No Linear API calls for this mode.

1. Resolve project and field IDs with `gh project view <number> --owner <owner>
   --format json` and `gh project field-list <number> --owner <owner> --format
   json`, or equivalent connector queries. Match configured names exactly.
   Resolve repository Issue Types separately. Check authenticated capabilities;
   report missing project access rather than altering credentials or configuration.
2. Deduplicate against open and closed repository issues. Create one issue and
   one project item per work unit. Use the configured Issue Type, Assignee, and
   Project Priority; labels carry cross-cutting context only. Where supported,
   use `gh issue create --project <title> --type <type>`; otherwise use the
   available connector/GraphQL mutations. Verify the resulting issue and item.
3. Update status using the resolved project, item, field, and option IDs, via
   `gh project item-edit --id <item-id> --project-id <project-id> --field-id
   <field-id> --single-select-option-id <option-id>`. Re-fetch before changing
   status and verify afterward. Never infer status from open/closed alone.
4. At implementation completion, use the configured `codeReview` status if
   present. Otherwise keep the project `inProgress`, post the AI-review
   checkpoint, and record `code-review` in the workload manifest. Independent
   review still happens. A standalone issue goes to configured `inReview` after
   review; workload issues wait for the combined integration gate and umbrella PR.
5. Use the repository branch convention and link it with `gh issue develop`
   when supported. Add the issue as the project card, not a duplicate PR card.
   Completing standalone PRs may use `Closes`; partial/workload PRs use `Refs`
   until all included work is accepted under the repository's merge policy.
6. Keep decisions, findings, blockers, PR URLs, and verification on the issue.
   Agents never approve their own work or set `Done`. Honor existing user
   authorization for messages; do not post comments when a task is read-only.

The coordinator is the only tracker writer. Workers return structured results.
Use `../../scripts/lib/tracker-policy.mjs` to validate parsed
configuration and phase mappings. Do not invent a missing project field,
status, label, or organization Issue Type during a routine workflow run.
