# Issue #9: context efficiency and workflow replay

Historical 0.9.4 report. The 1.0 project-local catalog supersedes this architecture;
these measurements do not describe current host context use. See README.md.
The validation results below are historical, including the then-existing policy
sync check. Version 1.1.0 removes that helper and adds direct codex-cli execution.

Implementation base: `db7fde95c5c9832fc8f20c6b547aef838c3592dc` (0.9.2). Working package: 0.9.4.
This report records implementation evidence; live rollout checks remain separate.

## Measured source footprint

Run `node scripts/measure-context.mjs` to reproduce file sets and counts.
Counts are Unicode characters with LF-normalized newlines, once per unique
source file in each explicitly listed profile. They exclude repository overrides,
issue/code contents, HTML templates, repeated worker context and optional specialist
references unless selected by the profile. They are not token/billing measurements.

| Replay profile | Before chars | After chars | Reduction |
|---|---:|---:|---:|
| board status | 40,438 | 12,747 | 68.5% |
| one-line fix through review dispatch | 59,634 | 30,571 | 48.7% |
| short documentation lookup | 38,416 | 8,919 | 76.8% |
| personal research report in chat | 43,113 | 8,919 | 79.3% |
| Linear workload initial reconciliation / resume | 68,318 | 26,493 | 61.2% |
| Linear two-issue run through conflict/handoff policy | 70,454 | 45,134 | 35.9% |
| wrap accepted and merged issue | 31,745 | 13,471 | 57.6% |

The initial Linear orchestration prerequisite closure is **26,493 characters**,
below the issue's approximate 30k target. This is the initial reconciliation
route, not an entire workload's lifetime input: dispatch, intake, write and
conflict/handoff references bring the selected cumulative profile to 45,134.
The actual baseline closure is 68,318, not the older audited 75,716. The full
conflict/handoff profile counts the worker envelope previously embedded in the
workload contract; it is now conditional. Further worker coding instructions
and repeated context are excluded on both sides.

All 30 source descriptions total **8,942 → 4,894 characters** using this script's
counting method. Seven skills remain user-only/discovery-filtered; reducing
their text is not claimed as current exposed-catalog savings. Installed generated
preambles and host display/truncation differ from these source counts.

## Independent behavioral replay

A separate evaluator read committed baseline instructions, then the changed
instructions, for seven realistic requests. These were instruction simulations,
not live GitHub/Linear tasks. Requested evaluator route: Astra medium; resolved
runtime identity unreported. It found the board/present mutation contradiction,
forced research delegation/intake, the standalone-issue spec omission, then two
implementation gaps (portable board/intake omission and unconditional Linear
integration wording). Those gaps were corrected.

| Request | Before simulation | After simulation |
|---|---|---|
| Board status | Read-only promise conflicts with required render/checkpoint | Scoped comments/status reads, complete chat report; no writes/worker/intake |
| Named one-line fix | Broad repeated verification and possible seam/spec questions | Existing criteria/tests suffice; affected checks plus required repo validation; fresh independent review |
| Short docs lookup | Required background worker, issue/folder, Markdown and checkpoint | Local primary-source lookup and cited answer |
| Personal research report | Required tracked artifact and presentation | Requested format/chat or authorized file; no issue intake |
| Interrupted workload | Reconcile saved gates/jobs and preserve policy | Same; retained instruction identity and partial-write reconciliation explicit |
| Two issues with conflicts | Reviewed heads, integration-only resolutions, independent conflict review, combined tests | Same gates; conditional commands/envelope/tracker operations |
| Wrap after acceptance | Requires merge/checklist, special Linear boundary | Same gates; mapped tracker behavior, owned authorized cleanup; no automatic Done |

A worker-free lookup and absence of mandatory presentation are **instruction
outcomes**, not measured model compliance rates. Read-only scope now propagates
to every dependency; a named issue alone does not authorize posting a review.

## Executable validation and limits

Existing regression scenarios exercise actual temporary Git repositories and
the manifest/selector/installer helpers: complete/ambiguous sync discovery,
concurrent writers, head-bound tests/receipts, provider pairing, review caps,
legacy resume without fabricated consent, integration/conflict gates and
independent installed-package execution. New consumer-refresh scenarios verify
exact preservation of custom tracker config, CRLF/local overrides, check-only
no writes, downgrade/ambiguity refusal, and idempotent router/fallback refresh.

Validation completed on Windows:
- Baseline detached checkout: 50 tests passed, 24.190 seconds.
- Changed checkout: 52 passed, 0 failed, 1 skipped, 22.395 seconds. The skipped
  dangling-file-symlink test requires privileges unavailable on this host.
- Generated package check and package validator passed (107 files, 30 skills).
- Native Codex installation/runtime passed in an isolated CODEX_HOME.
- All 30 generated skills passed the generic UTF-8 skill validator; the source
  package validator handles Claude-specific invocation metadata.
- Codex policy sync/check passed against an isolated destination.
- git diff --check passed. Independent working-tree review verified fixes for
  nested markers, dangling links, legacy fallback refresh and installed parity.

The two test runs were not controlled latency benchmarks and briefly overlapped;
their elapsed-time difference is not evidence of workflow performance gains.
These measurements preceded release. Release commits and final-head verification
are recorded in the linked GitHub issue checkpoints, not inferred from timings.

| Measurement | Evidence / limitation |
|---|---|
| Instruction load | Reproducible before/after unique-source counts above |
| Truncation | Replay file sets counted without truncation; no comparative live-session truncation rate measured |
| Tool calls | No valid before/after model-task call count measured. Source-file count is not tool-call count; batching/host adapters differ |
| Workers | Baseline lookup mandates one; changed lookup defaults to zero. Actual production launch reduction unmeasured |
| Waiting | Notifications/useful job waits replace mandated polling behavior; no comparative production wait time measured |
| First useful evidence | Not measured for model task execution |
| Total task time | Not measured for model task execution; test-run timings are not latency savings |
| Outcome parity | Independent instruction simulation plus existing executable safety regression tests; live tracker workflow parity unverified |

The live-task/tool-call/latency portion of the issue's acceptance remains
**unverified**. It requires comparable recorded runs on a configured consumer
repository/host. Do not present synthetic call counts, test timings, cached-input
statistics or chars/4 as evidence of billed savings. Before release, replay the
seven requests on the same host/repo snapshots and record instruction path/hash,
actual tool calls/results, worker launches, wait intervals, first evidence time,
total time, requested/resolved route, side effects and delivered outcome.

## Ownership and distribution

- Lifecycle scope/continuity/checkpoint ownership: templates/lifecycle-contract.md.
- Write authorization/refetch/dedup/status race: templates/tracker-write.md.
- Linear sync delivery: operation references plus scripts/lib/linear-sync-root.mjs.
- Workload gates: skills/orchestrate/references/workload-contract.md.
- Model defaults: scripts/lib/model-policy.mjs. Follow-up user direction lowers
  coordination/intense-reasoning defaults to medium; model choices are unchanged.
- Compact consumer router: templates/feature-lifecycle.md.
- Full fallback: generated templates/feature-lifecycle-portable.md. Plugin hosts
  do not load it too. Missing helper/reviewer capabilities remain explicit
  blockers; the fallback does not waive deterministic workload gates.
- Build generates the Codex package and fallback from root owners.
  refresh-lifecycle preserves consumer configuration/local overrides.

No consumer repository or global model/plugin settings were changed.
Native installation validation uses an isolated home. Direct Codex execution now
uses codex-cli; model policy stays in workflow-kit with no companion sync.

## All-skill disposition

All 30 retained; invocation policies preserved. An asterisk marks the seven
user-only/catalog-absent skills identified in the issue, not a discovery defect.

| Skill | Disposition |
|---|---|
| board | Status stays chat/read-only; audit moved to conditional reference |
| code-review | Compact target flow; separate queue/workload/provider/standards references; named issue criteria accepted |
| codebase-design | Glossary/principles retained; diagrams/examples conditional |
| domain-modeling | Focused glossary/ADR skill retained; description shortened, read/change distinction preserved |
| github-projects | Configured adapter retained; local fields/status ownership preserved |
| grilling | Trigger narrowed to actual interview/stress-test; personal scope and conditional research |
| handoff* | Existing canonical-record/no-duplication behavior retained; shared scope routing |
| implement* | Leaner execution; routine seam agreement and affected validation; commit authorization and review boundary |
| improve-codebase-architecture* | Advisory intake-free report; local exploration; optional deeper interview/design |
| integrate-reviewed | Natural-language named authorization; mapped tracker handoff and existing merge gates |
| linear-mode | Read router; write/status/intake/examples conditional; executable canonical sync selector |
| model-routing | Explicit delegate/classify/launch decisions; follow-up lowers coordination/intense reasoning to medium |
| new-feature | Correct minimal-intake description; folder only for real artifacts; configured tracker |
| orchestrate | Compact steps; workload invariants single owner; commands/envelope conditional |
| plan* | Bulk intake retained; concrete draft, dedupe and existing write authorization respected |
| ponytail | Reuse/root-cause principles; removed persona, forced persistence and exhaustive reading |
| ponytail-audit | Subtraction focus retained; advisory report avoids intake |
| present | Pure renderer; no issue/spec/notes writes; selected template and visual QA retained |
| prototype | Smallest experiment; variant count proportional; persistence/implementation authorized separately |
| research | Local lookup by default; artifacts and bounded workers conditional |
| tdd | Behavior seams/red-green retained; existing tests/interfaces/criteria establish routine agreement |
| to-spec* | Acceptance-driven synthesis; user stories optional; no mandatory routine-seam interview |
| to-tickets* | Explicit escalation/vertical slices/expand-contract retained; shared scope and adapter routing |
| update-issue | One phase delta; shared write adapter owns publication; examples conditional |
| wayfinder* | Explicit epic map retained; shortened introduction and configured-tracker boundary |
| work-audit | Proposal-first cleanup retained; advisory phase no intake; exact approved actions only |
| workflow-doctor | Explicit full read-only audit retained; scoped preflight unchanged |
| workflow-init | Stamps compact router plus generated fallback; preserves local configuration |
| workflow-update | Deterministic managed refresh/check, config/local override preservation and no downgrade |
| wrap-feature | Merge/review/checklist/human acceptance gates; no automatic Done; authorized owned cleanup |

## Pushback on the audit

Splitting files is useful only when the unneeded mode stays unloaded. The report
therefore shows both initial and cumulative routes. Independent review remains
a correctness boundary even when delegation has no latency advantage. Mandatory
repository checks remain mandatory, even for a one-line fix. Refetch reduces
status/body races but cannot make an unconditional tracker API atomic; use CAS
when available and reconcile uncertain delivery. Skill instructions constrain
agents, but they are not a runtime permissions firewall.
