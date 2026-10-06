# Independent review

Implementation, independent review, exact-head verification and human acceptance
remain separate. This policy does not authorize commits, publication or merging.
Preserve explicit user choices. Workloads add dispatch accounting, review budgets
and attestation records in the orchestrate workload contract.

## Reviews

Review a meaningful change once with a fresh reviewer that has no implementer
context. That one reviewer covers both Standards and Spec and reports each axis
separately, whatever the size of the change. Use separate axis reviewers only
when the user explicitly asks for them in that run, within host capacity. A clean review
proceeds directly to the remaining gates. If no fresh reviewer can be launched,
report the review gate as incomplete; never approve your own implementation.

After behavioral fixes, run one focused independent verification of the fixes and
affected behavior. It belongs to the review that found them and needs no new
approval. Broaden only when material changes or new evidence justify it. Ask the
user only when that verification fails or finds a new blocker.

## Findings

Correctness, security, data integrity, acceptance failures and mandatory repository
requirements block regardless of severity. Optional style, simplification and
out-of-scope enhancements do not block or require a deferral decision. Explain
evidence-based rejection of disputed findings; never downgrade a real defect.
Track useful follow-ups within existing tracker authorization; creating an
optional ticket is not a completion gate.

## Changes after review

A review covers the head it saw. A later behavioral change needs focused
independent review. A nonfunctional delta (wording, comments, formatting,
demonstrated mechanical cleanup) may keep the earlier review only after you
inspect the complete delta, state why behavior is unchanged and rerun the relevant
checks on the new head; test results never carry forward. Executable examples,
operating instructions, acceptance criteria, runtime configuration and permissions
need a material-impact assessment, and a small diff is not proof. When unsure,
re-review. Outstanding blocking findings still block.
