# Model routing

Executable defaults: `../scripts/lib/model-policy.mjs`. Never maintain a
second ranking or infer machine defaults.

## Decide whether to delegate

Keep short lookups, immediate dependencies and tightly coupled edits local.
Launch an authorized bounded independent task only with useful parallel
coordinator work. Independent review needs fresh context even without a speed
benefit. Describe the task class and reason before launch; file count alone
does not determine complexity. Missing requirements/tools need clarification
or access, not higher effort.

| Task class | Codex default | Claude default | Effort |
|---|---|---|---|
| Simple: mechanical, clear acceptance criteria | Terra | chosen session; optional Terra delegation | low; medium on evidence |
| Coding: implementation judgment | Astra | Fable 5.1 | low; medium on evidence |
| Independent review of a fixed diff | Astra | Opus 5 | Codex medium; Opus high (owner-selected policy) |
| Orchestration or specific intense reasoning | Astra | Fable 5.1 | medium |

Only low/medium/high are allowed. Never xhigh/max/ultra. Most workers stay
low/medium; high requires an explicit selection and recorded reason, never an
automatic task-class escalation. Preserve explicit
allowed user choices. These are worker defaults, not current-session or global
settings. Fable can delegate ordinary coding/UI to Astra, simple work to Terra;
follow repo design/typography/verification rules without provider quality claims.

## Launch and provenance

Use explicit model/effort on every launch. Supported IDs: gpt-6-astra,
gpt-5.6-terra, gpt-5.6-sol, claude-fable-5-1, claude-opus-5.
Sol is an explicit compatibility choice. Claude reviews default to Opus 5 high,
with recorded highReason `Owner-selected Opus 5 high for independent review (2026-09-13).`
If Opus is unavailable, use Fable 5.1 medium (low for a small routine review).
If neither Claude reviewer is available, use a fresh Codex Astra medium session.
Keep other-provider preference: Claude-authored work tries Codex first, then the
Claude chain if Codex is unavailable. Record each fallback; explicit per-run
model/effort choices override defaults and are never silently substituted.
No automatic Sonnet/Haiku/Luna routing. Check observable host access; if unknown,
record unverified. An unavailable explicitly pinned model is a reported blocker;
default review routes use the recorded fallback chain above. Public model listings
do not prove account access. When calling resolveRouting, omit model for package
defaults; a model argument means a per-run pin. Pass availableModels only from
verified usable routes, not a public catalog or an incomplete discovery result.
The resolver's provider is the preferred reviewer provider, not the implementation
author. Choose the opposite author first. Provider-changing resolution requires
reviewFallback evidence and returns it with the route; the coordinator passes it
to set-issue --review-fallback alongside the selected reviewer and execution.

Record task class/delegation reason, requested/resolved model, effort, worker ID,
policy version, escalation evidence and explicit fallback reason. If runtime
does not expose resolved identity, record unknown, not the requested model.
Prefer the provider opposite the implementation author for review. Check whether
its CLI is installed and its authorized review models are usable. If the CLI is
not installed or the authorized models have unavailable credentials, quota or
model access, use a fresh same-provider review; do not require installation.
Record reviewFallback with reason `cli-not-installed`, missingProvider and the
lookup evidence. For installed but unusable reviewers, use reason
`review-models-unavailable`, unavailableProvider and attempts containing each
model, reason (`credentials-unavailable`, `quota-unavailable`, `model-unavailable`)
and observed error evidence. Exhaust Opus and Fable before falling back from
Claude, or Astra before falling back from Codex. Unknown availability, transient
network failures and command errors are not absence. Explicit same-provider
choices remain valid. Every review requires fresh context: a bounded brief,
requirements, standards and fixed diff, never the implementer's conversation.
Workload pairing/gates are owned by its workload contract. If no fresh session
can be launched, report the independent review gate as incomplete.

Count coordinator, active workers and nested reviewers against host slots using
workerCapacity in the module. Limits are ceilings. Queue excess; unknown capacity
means one worker and no nesting. Honor host/user delegation restrictions.
Use a fresh bounded brief for model overrides when full-history forks cannot
change models. Coordinator owns tracker writes and final integration.

Claude-to-Codex implementation and review use the codex-cli skill directly.
The coordinator launches the CLI without a forwarder agent. Follow its explicit
sandbox, file-based prompts, background completion and durable receipt contract.
The same recipe can launch a fresh Codex review when Claude review is unavailable.

Codex-to-Claude review uses a fresh Claude CLI process directly; no Claude
reviewer adapter is required. Run from the issue worktree with a bounded prompt
containing the issue requirements, repository standards, Standards and Spec
axes, and exact base/head SHAs. Select explicit model/effort using the policy
above; use noninteractive read-only review permissions, JSON output, and no
session persistence. The coordinator reads the result, adjudicates findings,
and obtains a fresh review after fixes as the workload contract requires.
Record the returned session ID and final reviewed head in the receipt
`claude:<head-sha>:<claude-session-id>`; retain launch provenance and round limits.
