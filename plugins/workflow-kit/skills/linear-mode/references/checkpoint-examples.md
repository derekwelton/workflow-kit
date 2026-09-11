## 9. Comment shapes

Optional examples. Publication follows [write.md](write.md); phase gates follow
[status.md](status.md) and the workload contract, not these examples.

**Work started**

```markdown
## Work started

Branch: `<gitBranchName>`

<What's being done first, and what the next checkpoint will be.>
```

**Checkpoint**

```markdown
## Checkpoint — <phase>

<One-sentence state.>

### Done
- <concrete result>

### Still running
- <what's next>
```

**Needs your decision**

```markdown
## Needs your decision

1. **<question>** — Recommendation: <answer and short reason>.

### Evidence
- `<command>` — <result>

### Next
<What happens once answered, and who owns it.>
```

**Implementation complete — ready for code review**

````markdown
## Implementation complete — ready for code review

<What changed.>

### Acceptance criteria
**<criterion>** — <how it was satisfied.>

### Verification
```
<command>   <result>
```

### Review target
- Branch/PR: <reachable link or branch>
- Fixed point: <base branch or commit>
````

Set `Code Review` after posting this shape.

**Code review complete — ready for human review**

````markdown
## Code review complete — ready for human review

<What was reviewed and the overall result.>

### Standards
- <finding count and worst finding, or pass>

### Spec
- <finding count and worst finding, or pass>

### Verification
```
<command>   <result>
```

### Needs your review
1. **<finding or decision to inspect>** — <why it needs a human>.
````

For standalone work, after a complete review with no unresolved material
finding, post the second shape, set `In Review`, and stop. For a workload item,
post a **Code review complete — awaiting workload integration** checkpoint,
keep `Code Review`, and record the final-SHA receipt in the workload manifest.

After the combined workload gate, post this shape to every included issue:

````markdown
## Workload ready — human review

This issue is included in `<integration-branch>` at `<head-sha>`.

### Issue review
- Implementer: <provider>
- Reviewer: <provider>
- Receipt: <base/head and result>

### Combined verification
```
<command>   <result>
```

### Test this workload
- Umbrella PR: <reachable URL>
- Checkout: `<integration-branch>`
- Status: not merged to main
````

Then move every still-`Code Review` included issue to `In Review`. If a status
changed concurrently, stop and reconcile rather than overwriting it. If review
or integration cannot complete, leave the issue in `Code Review`, post a
blocked update, and do not promote it. Never close or set `Done`.
