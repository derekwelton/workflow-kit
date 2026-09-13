# How worker decisions are made

Delegation, model choice and effort are separate decisions. These are
workflow-kit defaults, not claims about which model is objectively best.

1. **Does a separate worker help?** Short lookups, immediate dependencies and
   tightly coupled edits stay local. A bounded independent task can run in
   parallel while the coordinator does useful work. Independent code review
   uses a fresh session for correctness even without a speed benefit.
2. **What kind of task is it?** A mechanical edit with clear criteria is simple;
   ordinary implementation needs coding judgment; review checks a fixed diff;
   orchestration coordinates a workload; intense reasoning needs a specific
   explanation. File count alone does not classify the task.
3. **What did the user choose, and what can this host run?** Preserve explicit
   allowed choices. Verify observable access and slot limits. Report an
   unavailable model instead of silently substituting one.
4. **Which defaults apply?** The executable owner is
   `scripts/lib/model-policy.mjs`; `templates/model-routing.md` explains its
   use. There is no companion policy copy or independent ranking.

| Work | Default Codex worker | Default effort |
|---|---|---|
| Simple mechanical change | Terra | low |
| Ordinary implementation | Astra | low |
| Independent review | Astra | medium |
| Coordinator/intense reasoning | Astra | medium |

Claude implementation defaults to Fable 5.1. Claude review defaults to Opus 5
high by explicit owner policy, with that decision recorded as highReason.
Fable medium (low for a small routine diff) is the alternative; fresh Codex
Astra medium is permitted if neither Claude reviewer is available. Prefer the
other provider first; record CLI, credentials, quota or model-access evidence.
Fable can delegate ordinary coding to Astra or simple work to Terra.
Sol remains an explicit compatibility choice.
The package permits low, medium and high only. Raising low to medium should
follow evidence; missing requirements or tools do not justify higher effort.
Coordination and intense reasoning default to medium for both providers.
High remains an explicit choice requiring a recorded reason; the resolver does
not manufacture one from the task class. The owner-selected Opus review policy
is the explicit exception. Global settings are unchanged.

The host creates a worker with explicit model and effort. Those requests do not
change the already-running coordinator's model. A full-history fork may not
support overrides; use a fresh bounded brief where the host requires it.
Requested identity is not observed identity: save null/unknown when the runtime
does not report which model actually executed.

Provider pairing is independent of model ranking. Cross review uses the provider
opposite the implementation author when that review route is usable. A verified missing
CLI or unavailable authorized reviewers permit a fresh same-provider reviewer with recorded evidence;
installation is optional. Explicit same-provider modes still need a
fresh reviewer. The coordinator and every active/nested worker share the host
slot limit; configured concurrency is a ceiling, not a target.

For example, a docs lookup stays local. A clearly specified isolated mechanical
change may use Terra low if useful parallel work exists. A review of a complex
routing change can use a fresh Astra medium reviewer. A conflict-resolution
review follows the same preference and availability fallback regardless of which
provider coordinated the run, and always requires a fresh independent session.

Official OpenAI documentation describes reasoning effort as a tunable resource
and recommends tuning delegation to the harness. The stricter low/medium/high
ceiling and specific task-to-model table here are repository policy, not a
universal OpenAI requirement. See [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model).
