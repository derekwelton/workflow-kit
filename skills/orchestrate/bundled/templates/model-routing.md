# Model routing

`../scripts/lib/model-policy.mjs` is the executable policy; never keep a second
ranking or infer machine defaults. Resolve every launch with it (resolve the
script path from this file's directory):

`node ../scripts/lib/model-policy.mjs resolve --provider <codex|claude> --task <class>`

Task classes: simple, coding, design, review, orchestration, intense. Add
`--model`, `--effort` or `--high-reason` only for an explicit per-run pin; a
model argument is a pin, never a default. Add `--available <ids>` only from
verified usable routes, never a public catalog or incomplete discovery, and
`--review-fallback <JSON>` when the review provider must change. Launch with the
returned model and effort explicitly and record the returned JSON. An error is a
blocker to report, never a reason to substitute silently.

## Decide whether to delegate

Keep short lookups, immediate dependencies and tightly coupled edits local.
Launch an authorized bounded independent task only with useful parallel
coordinator work. Independent review needs fresh context even without a speed
benefit. Describe the task class and reason before launch; file count alone
does not determine complexity. Missing requirements/tools need clarification
or access, not higher effort.

| Task class | Codex default | Claude default | Effort |
|---|---|---|---|
| Simple: mechanical, clear acceptance criteria | Luna | chosen session; optional Luna delegation | Luna high; xhigh or max freely |
| Coding: implementation judgment | Sol | Opus 5.5 | high; Opus medium for smaller changes |
| Design: UI design and UX generation | Sol | Opus 5.5 (Fable 5.1 alternative) | Sol xhigh; Opus or Fable high |
| Independent review of a fixed diff | Sol | Opus 5.5 | high |
| Orchestration | Sol | Opus 5.5 | high |
| Specific intense reasoning | Sol | Fable 5.1 | Sol xhigh; Fable high |

Elevated defaults are owner-selected; the resolver returns their highReason. It
also enforces each model's effort range (Luna high to max; Sol up to xhigh;
others up to high; Opus 5.5 never low; ultra never) and refuses retired models.
Astra is an explicit pin only. Outside the owner defaults, effort above medium
needs an explicit choice and recorded reason, never an automatic escalation.
Preserve explicit allowed user choices. These are worker defaults, not session
or global settings. No automatic Sonnet/Haiku routing. Follow repository
design/typography/verification rules without provider quality claims.

## Review routing

Prefer the provider opposite the implementation author; pass that provider to
the resolver. With `--available`, it applies the owner fallback chain (Claude:
Opus 5.5, then Fable 5.1, then Codex Sol; Codex: Sol, then Claude). Fable as a
fallback runs medium, or low for a small routine review.

Changing provider needs `--review-fallback` evidence, which the resolver checks:

- `{"reason":"cli-not-installed","missingProvider":"<provider>","evidence":"<lookup>"}`
- `{"reason":"review-models-unavailable","unavailableProvider":"<provider>","attempts":[...]}`
  with `{model, reason, evidence}` attempts covering every authorized reviewer of that provider (Claude: Opus 5.5 and
  Fable 5.1; Codex: Sol), each `credentials-unavailable`, `quota-unavailable`
  or `model-unavailable` with the observed error.

Unknown availability, transient network failures and command errors are not
absence. Explicit same-provider choices remain valid. Every review gets fresh
context: a bounded brief with requirements, standards and the fixed diff, never
the implementer's conversation or session. If no fresh session can be launched,
report the independent review gate as incomplete. Workload pairing and gates
belong to the orchestrate workload contract.

## Provenance and capacity

Record the task class and delegation reason, the resolver JSON (requested and
resolved model, effort, highReason, policy version, fallback), worker ID and any
escalation evidence. If the runtime does not expose the resolved identity,
record unknown, not the requested model.

Count the coordinator, active workers and nested reviewers against host slots
with `workerCapacity` in the module. Limits are ceilings; queue excess. Host
slots come from a `workerCapacity: <n>` entry in the repository's agent
configuration or a saved run answer. Otherwise capacity is unknown, which means
one worker and no nesting. Honor host/user delegation
restrictions. Use a fresh bounded brief when a full-history fork cannot change
models. The coordinator owns tracker writes and final integration.

## Launch transport

Choose one transport per launch and read only its reference:

- T3 Code: when the T3 orchestrator tools (`orchestrator_capabilities`,
  `delegate_task`) are available, read `./t3-delegation.md`. Claude Code may list
  them as deferred `mcp__t3-code__*` tools; load them before deciding.
- Otherwise read `./cli-delegation.md` for direct Codex and Claude CLI launches.

Never load both unless T3 cannot serve a specific launch. The policy above is
transport-independent; receipts stay `<provider>:<full-head-sha>:<worker-id>`.
