# Workflow skills quick reference

Choose skills interactively from this checkout with `node scripts/select-skills.mjs`.
After publication, use `npx --yes --package github:derekwelton/workflow-kit workflow-kit`
from the target project.

Install everything in a project:

```powershell
node scripts/install-skills.mjs --project F:/Projects/my-project --host both --all
```

Or select a few: replace `--all` with `--skills ponytail,tdd,wizard`.
Then invoke setup-workflow-skills if the project needs configuration.

| Task | Skill |
|---|---|
| Simplify coding decisions / audit existing complexity | ponytail / ponytail-audit |
| Diagnose a hard bug / implement behavior test-first | diagnosing-bugs / tdd |
| Investigate documentation | research |
| Interview a plan with recommendations for each decision | grill-me |
| Prepare a fresh-agent continuation document | handoff |
| Draft questions for another person | to-questionnaire |
| Write skills and agent instructions | writing-for-agents |
| Interview and record terminology / decisions | grill-with-docs / domain-modeling |
| Explore interfaces / architecture opportunities | codebase-design / improve-codebase-architecture |
| Try a throwaway design | prototype |
| Synthesize a spec / split work into vertical slices | to-spec / to-tickets |
| Triage incoming work / map a large uncertain effort | triage / wayfinder |
| Implement a ticket / review a diff independently | implement / code-review |
| Run a bounded multi-issue workload | orchestrate (Codex: orchestrate-queue) |
| Use the configured tracker / publish an authorized checkpoint | github-projects or linear-mode / update-issue |
| Audit clutter without changing it | cleanup-audit (explicit only) |
| Merge named work, reconcile issues and clean owned artifacts | merge-cleanup (explicit only) |
| Remove AI writing patterns | unslop |
| Resolve an active merge conflict | resolving-merge-conflicts |
| Generate a procedure requiring human interaction | wizard |

Use the task's skill, not a compulsory sequence. Ordinary fixes need no issue
intake, spec, feature folder, or orchestrator unless the project itself requires it.
See README.md for activation policies, previews and updates.
