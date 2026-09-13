# Model routing

Executable defaults: `../scripts/lib/model-policy.mjs`. Codex-kit receives
generated copies; never maintain a second ranking or infer machine defaults.

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
| Independent review of a fixed diff | Astra | Fable 5.1 | medium; low for small routine diff |
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
Sol/Opus are explicit compatibility choices, not automatic defaults.
No automatic Sonnet/Haiku/Luna routing. Check observable host access; if unknown,
record unverified. An unavailable requested model is a reported blocker;
never silently substitute. Public model listings do not prove account access.

Record task class/delegation reason, requested/resolved model, effort, worker ID,
policy version, escalation evidence and explicit fallback reason. If runtime
does not expose resolved identity, record unknown, not the requested model.
Provider independence is separate from model choice; cross review pairs against
the implementation author. Same-provider review still requires a fresh session.
Workload pairing/gates are owned by its workload contract.

Count coordinator, active workers and nested reviewers against host slots using
workerCapacity in the module. Limits are ceilings. Queue excess; unknown capacity
means one worker and no nesting. Honor host/user delegation restrictions.
Use a fresh bounded brief for model overrides when full-history forks cannot
change models. Coordinator owns tracker writes and final integration.

Claude-to-Codex uses codex-kit's task/reviewer adapters: --model astra --effort low
for ordinary coding, --model terra --effort low for simple work, --model astra
--effort medium for review. High needs --high-reason explaining the actual
orchestration/intense reasoning. No hand-written wrappers or companion polling.
