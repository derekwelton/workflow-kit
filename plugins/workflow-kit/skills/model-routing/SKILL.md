---
name: model-routing
description: Choose models and reasoning effort for workflow implementation, orchestration, and independent review. Use before delegating coding or review work; preserve explicit user choices and host limits.
---

Resolve this skill's real filesystem path before following relative references.
The package root is two directories above this SKILL.md; retain its sibling
skills, scripts, and templates together.


# Model routing

The canonical policy is workflow-kit's `scripts/lib/model-policy.mjs`, relative
to the package root. Codex-kit carries a generated copy of this skill and module.
Never maintain a separate model ranking or infer a model from a machine default.

| Work | Codex | Claude | Effort |
|---|---|---|---|
| Simple, mechanical, clear-spec changes | Terra | Keep the chosen session, or delegate to Terra | low; medium if needed |
| Normal coding, including Fable delegating implementation | Astra | Fable 5.1 when Claude is selected | low; medium if needed |
| Independent review | Astra | Fable 5.1 | medium; low for a small routine diff |
| Coordinator or intense reasoning | Astra | Fable 5.1 | high only when justified |

**Only low, medium, and high are permitted. Never select xhigh, max, or ultra.**
Most workers should use low or medium. Record why high is necessary. Complexity
alone is not a reason to start every worker at high. Escalate low to medium on
evidence; reserve high for orchestration or intense reasoning. Do not increase
reasoning to compensate for missing requirements or unavailable tools.

Fable may delegate coding and UI implementation to Astra at low or medium.
Use Terra at low or medium for very simple tasks. Follow repository design
systems, typography locks, and visual verification requirements regardless of
provider. Do not make provider-wide claims about visual quality.

Use explicit model and effort parameters on every worker launch. Supported IDs:
`gpt-6-astra`, `gpt-5.6-terra`, `gpt-5.6-sol`, `claude-fable-5-1`,
`claude-opus-5`. Sol and Opus are explicit compatibility choices, not automatic
defaults. No automatic Sonnet, Haiku, or Luna routing. Honor an explicit allowed
choice; do not silently substitute an unavailable model. Check host model
capabilities/access before launching when observable; otherwise report access
as unverified and treat a launch failure as a blocker. Never claim availability
from a public model listing alone.

Provider pairing stays independent from model choice. Cross-provider review
uses the provider opposite the implementation author, with fresh context; a
same-provider mode still uses a separate session. Record requested/resolved
model, effort, worker/session ID, policy version, and any explicit fallback reason.
If the runtime does not expose the resolved model, record it as unknown rather
than presenting the request as observed execution metadata.

Delegate only when authorized by the user, applicable skill, and host policy.
Count the coordinator, active workers, and nested reviewers against host slots.
Configured worker limits are ceilings. Queue excess work; if host capacity is
unknown, run one worker at a time without nested delegation. Never ask an
unsupported fork to change models; use a fresh task with the minimum necessary
context. The coordinator owns tracker writes and final integration.

For Claude-to-Codex delegation use codex-kit's task/reviewer adapters. Pass
`--model astra --effort low` for ordinary coding, `--model terra --effort low`
for simple work, and `--model astra --effort medium` for normal review. High
requires `--high-reason` explaining orchestration or intense reasoning. Do not
reintroduce hand-written CLI wrappers or manual companion-state polling.
