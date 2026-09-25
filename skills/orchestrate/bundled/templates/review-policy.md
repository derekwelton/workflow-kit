# Proportionate independent review

New workloads use bounded review. Preserve explicit user choices and saved legacy
strict/convergent policies; migrating an existing run requires a recorded decision.
Implementation, independent review, exact-head verification and human acceptance
remain separate. This policy does not authorize commits, publication or merging.

## Reviews and attempts

Review meaningful changes once with a fresh independent reviewer covering Standards
and Spec. A clean first review proceeds directly to the remaining gates. After
behavioral fixes, use one focused independent verification of fixes and affected
behavior. Broaden only when material changes or new evidence justify it.

The default budget is two completed reviews per issue. Track logical dispatch IDs,
attempt IDs and completed verdicts separately. Reserve a dispatch before launching;
do not launch concurrent duplicates. Repeating its update is idempotent. Failed
arguments, quota interruptions and stopped launches without a completed verdict do
not consume completed reviews. Retain failure evidence and any partial findings.
Allow at most two infrastructure retries per dispatch within existing scope and
model authorization. Exhaustion is an infrastructure blocker, never approval.
Do not create a replacement dispatch to evade the retry limit.

If a substantive blocker remains after the budget, ask once about the concrete
blocker and proposed action. Save the decision reference, issue/finding scope,
additional allowance and any expiry/model/cost constraints. Reuse that allowance
across resumes and infrastructure retries. Ask again only for changed scope or an
exhausted allowance. Never infer consent from elapsed time or a session restart.

## Findings

Correctness, security, data integrity, acceptance failures and mandatory repository
requirements block regardless of severity. Optional style, simplification and
out-of-scope enhancements do not block or require a deferral decision. Explain
evidence-based rejection of disputed findings; never downgrade a real defect to
fit the budget. Track useful follow-ups within existing tracker authorization;
creating an optional ticket is not a completion gate.

## Nonfunctional changes after review

Carry forward an existing independent receipt only after inspecting the complete
delta from its reviewed SHA to the current SHA. Record the exact delta, classification,
reason behavior is unchanged, assessor and relevant checks on the current head.
Keep the receipt attached to the SHA actually reviewed; the attestation is coordinator
evidence, not a claim of independent review of the new commit. Do not carry test
results forward as if they ran on the new head.

Ordinary wording, comments, formatting and demonstrated mechanical cleanup may
qualify. Check callers, argument evaluation and interface implications before
classifying unused-argument removal. Executable examples, operating instructions,
acceptance criteria, runtime configuration and permissions require material-impact
assessment. A small diff or documentation extension is not proof. Uncertainty or
behavioral changes require independent focused review. Outstanding substantive
findings remain blocking; an attestation cannot override them.

For small cohesive standalone changes, one fresh reviewer may cover both axes and
report each separately. Use separate Standards and Spec reviewers for complex or
explicitly requested reviews, respecting host capacity. Workload reviewers never
spawn nested reviewers. Conflict-free integration needs combined checks; manual
conflict resolutions require independent review.
