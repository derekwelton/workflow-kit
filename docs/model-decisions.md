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
| Simple mechanical change | Luna | low; medium or high freely |
| Ordinary implementation | GPT-6.1 Sol | high (owner-selected) |
| UI design and UX generation | GPT-6.1 Sol | high (owner-selected) |
| Independent review | GPT-6.1 Sol | high (owner-selected) |
| Coordinator/orchestration | GPT-6.1 Sol | high (owner-selected) |
| Intense reasoning | GPT-6.1 Sol | medium |

GPT-6.1 Sol replaced Astra as the Codex default by owner decision (2026-10-05):
it is close in capability at about half the cost. Astra remains an explicit pin.
Codex coding, design, review and orchestration default to Sol high, with each
decision recorded as highReason.

Claude implementation defaults to Opus 5.5 high by explicit owner policy, with
that decision recorded as highReason; Opus 5.5 medium is fine for smaller
coding changes. Fable 5.1 remains an explicit coding pin
and the default for orchestration and intense reasoning. Claude UI design and
UX generation defaults to Opus 5.5 high, with Fable 5.1 high as the alternative;
both record the owner design policy as highReason. Claude review defaults to Opus 5.5 high by explicit
owner policy, with that decision recorded as highReason. Opus 5.5 never runs at
low. Fable medium (low for a small routine diff) is the review alternative; fresh
Codex Sol high is permitted if neither Claude reviewer is available. Prefer
the other provider first; record CLI, credentials, quota or model-access evidence.
A Claude session can delegate ordinary coding to Opus 5.5 high or Sol high,
simple work to Luna, and UI design to Opus 5.5 high or Fable 5.1 high.
Opus 5, GPT-5.5 and GPT-5.6 Luna are retired and refused; GPT-6 Sol, GPT-5.6
Terra and GPT-5.6 Sol remain explicit legacy pins only.
The package permits low, medium and high only. Raising effort outside the
owner-selected defaults should follow evidence; missing requirements or tools do
not justify higher effort.
Luna is cheap enough that any allowed effort may be chosen without a reason.
Intense reasoning defaults to medium for both providers; Claude orchestration
(Fable) defaults to medium.
High remains an explicit choice requiring a recorded reason; the resolver does
not manufacture one from the task class. The owner-selected Opus 5.5 coding/design/review,
Fable design, Sol coding/design/review/orchestration policies and Luna are the
explicit exceptions. Global settings are unchanged.

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
change may use Luna at any allowed effort if useful parallel work exists. A review of a complex
routing change can use a fresh Sol high reviewer. A conflict-resolution
review follows the same preference and availability fallback regardless of which
provider coordinated the run, and always requires a fresh independent session.

Official OpenAI documentation describes reasoning effort as a tunable resource
and recommends tuning delegation to the harness. The stricter low/medium/high
ceiling and specific task-to-model table here are repository policy, not a
universal OpenAI requirement. See [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model).
