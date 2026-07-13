# GPT-5.6 family (Sol / Terra / Luna) — research findings

Researched 2026-07-12 for issue #3. All claims cited.

## The family

New naming system: the number = generation; **Sol / Terra / Luna = durable
capability tiers** that advance on their own cadence.
[openai.com/index/previewing-gpt-5-6-sol]

| Model | Codex id | Position | API price /1M (in / out) |
|---|---|---|---|
| Sol | `gpt-5.6-sol` | flagship — "detail and polish" | $5 / $30 |
| Terra | `gpt-5.6-terra` | "everyday workhorse" | $2.50 / $15 |
| Luna | `gpt-5.6-luna` | "clear, repeatable work", fastest/cheapest | $1 / $6 |

[pricing: openai.com/index/previewing-gpt-5-6-sol; ids: learn.chatgpt.com/docs/models]
Also still available in Codex: `gpt-5.5`, `gpt-5.3-codex-spark` (near-instant
iteration, Pro plans). Prompt caching: explicit breakpoints, 30-min minimum
cache life; cache writes 1.25x uncached input, reads keep 90% discount.

## Coding capability (independent + OpenAI-published)

- **Sol (max reasoning)**: SOTA 80 on Artificial Analysis Coding Agent Index —
  +2.8 over Claude Fable 5, at <½ output tokens, <½ time, ~⅓ less cost.
- **Terra**: "just above Fable 5" on the same index; "natural starting point
  for work you previously gave GPT-5.5".
- **Luna**: "outperforms Opus 4.8" on the coding index — at ~⅓ time, ~½
  tokens, ~¼ cost.
- Sol claims improved **computer use and design judgment** ("most polished
  collaborator yet") — relevant to the taste axis.
- Qodo (agentic code review): 5.6 beat 5.5 on F1 with ~3x fewer tokens/PR, ~2x
  lower median latency.
[openai.com/index/gpt-5-6]

## Reasoning efforts (Codex CLI ≥0.144.0; Derek has 0.144.1 ✔)

CLI selector for gpt-5.6-sol: **Low → Medium (default) → High → Extra high →
Max → Ultra**. [learn.chatgpt.com/docs/models]

- Guidance: "use the LOWEST effort that produces the result you need".
- No exact mapping from 5.5 efforts — recalibrate downward and adjust.
- **Max** = more time than xhigh on a single task; hardest problems, depth
  over speed. May need enabling in app settings.
- **Ultra** = max reasoning + **automatic task delegation to ~4 parallel
  subagents** (16 configurable via API); higher token use for faster
  time-to-result on divisible tasks. "Most tasks do not need Max or Ultra."
- Old effort vocabulary (none/minimal/low/medium/high/xhigh) was the 5.4-era
  plugin's `--effort` set; config key is `model_reasoning_effort`.
  TODO(verify in build): exact config-toml strings for max/ultra
  ("max"/"ultra" expected).

## Official when-to-use [learn.chatgpt.com/docs/models]

- **Sol** — ambiguous, difficult, high-value: complex code changes, deep
  research, polished documents. "If unsure, start with Sol."
- **Terra** — everyday work needing strong reasoning + tool use without Sol's
  full depth.
- **Luna** — specific, high-volume, known-good-looks-like: extraction,
  classification, transformation, structured summaries.

## Codex availability by plan

Sol/Terra/Luna for Plus/Pro/Business/Enterprise (Terra only for Free/Go).
[help.openai.com/en/articles/20001325]

## Local state (this machine)

- codex-cli 0.144.1; `~/.codex/config.toml`: `model = "gpt-5.6-sol"`,
  `model_reasoning_effort = "high"`, windows sandbox `unelevated`, projects
  trust list covers all F:\Projects repos.
- Installed plugin: `codex@openai-codex` 1.0.3 (user scope) — GPT-5.4-era:
  prompting skill targets 5.4, `spark` mapping only, efforts stop at xhigh,
  no Sol/Terra/Luna routing.

## Upstream plugin architecture (openai/codex-plugin-cc @ main, Apache-2.0)

- **Engine**: `scripts/codex-companion.mjs` (~32KB) + `scripts/lib/*` (args,
  codex invocation, git, app-server broker, session transfer) — subcommands:
  task, review, adversarial-review, status, result, cancel, setup,
  task-resume-candidate. Background = Claude's `run_in_background` Bash.
- **Commands** (all `disable-model-invocation`): review, adversarial-review,
  rescue, transfer, status, result, cancel, setup — thin wrappers; review
  returns Codex output VERBATIM; rescue routes through the `codex-rescue`
  subagent (a pure forwarder: one `task` call, stdout returned unchanged).
- **Skills**: `codex-cli-runtime` (internal contract: forwarder rules, flag
  handling, resume/fresh semantics), `codex-result-handling`,
  `gpt-5-4-prompting` (block-structured XML prompt recipes: task /
  output-contract / follow-through / verification / grounding blocks).
- **Hooks**: SessionStart/SessionEnd lifecycle + optional **Stop review gate**
  (stop-review-gate-hook.mjs, 900s timeout) enabled via
  `/codex:setup --enable-review-gate`.
- Uses AskUserQuestion popups in review/rescue flows (Derek's client hides
  prose around popups — must replace with plain-text asks in our fork).
