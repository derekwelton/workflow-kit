---
workDir: work
docsHome: .ai/workflows
labels: [feature, bug, chore, idea]
glossary: CONTEXT.md
adrDir: docs/adr
# tracker: github-projects  # optional; see Tracker configuration below
# linearTeam: ABC    # uncomment + set to bind this repo to a Linear team (see "Linear mode")
---

<!-- workflow-kit:managed-start version=0.9.3 -->

# Feature workflow

This file owns repository configuration and local overrides, not a second copy
of plugin policy. Read its frontmatter and additions below the managed block.
Keep tracker binding, status names, branch conventions and verification
commands local. Read only the selected route below.

## Host route

- **Plugin available:** read the installed workflow-kit's
  templates/lifecycle-contract.md and selected action skill. Do not load
  feature-lifecycle-portable.md too.
- **Plugin unavailable:** read [feature-lifecycle-portable.md](feature-lifecycle-portable.md).
  It is generated from the same policy owners, includes the full fallback
  contract, and supports manual execution with available Git/tracker tools.
  Load its selected-mode sections in bounded chunks; report unavailable tools.
- If plugin identity/version or required files cannot be established, report
  that limitation and use the verified portable fallback. Do not silently mix
  versions. Report drift without automatically refreshing/downgrading.

## Task route

| Request | Entry |
|---|---|
| Status, lookup, personal advice or review report | Read-only; chat or requested artifact, no issue intake or tracker writes |
| One implementation issue | implement; reuse issue acceptance criteria and affected tests |
| New implementation without issue | minimal new-feature intake when authorized |
| Explicit multi-issue run/resume | orchestrate-queue; workload manifest and integration gates |
| Independent review | code-review, selected target/queue/workload mode |
| Accepted work cleanup or named merge | wrap-feature / integrate-reviewed, with explicit action authorization |
| Requested HTML | present, a pure renderer of supplied content |

Claude invokes /workflow-kit:<directory>; Codex uses $<skill-name>
(orchestrate's public name is orchestrate-queue). Planning interviews, specs,
ticket decomposition and epic maps are opt-in.

## Configuration rules

tracker may be github, github-projects or linear. Existing linearTeam without
tracker selects Linear; otherwise default to ordinary GitHub Issues.
Conflicting explicit tracker/linearTeam bindings block writes. Projects owns
verified project/field/status mappings; preserve them on refresh. No automatic
Done, merge, destructive cleanup or unsolicited messages.

Read-only scope propagates through nested skills. Caller owns one authorized
checkpoint per meaningful phase. Retain loaded path/version/content identity
through handoffs, but refresh mutable issue/status state immediately for writes.
Repository verification overrides remain in force.

<!-- workflow-kit:managed-end -->

## Local overrides

Add repository-specific workflow and verification rules here.
