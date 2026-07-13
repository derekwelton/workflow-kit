# codex-kit: modernized Codex delegation plugin

Issue: [#3](https://github.com/derekwelton/workflow-kit/issues/3)
Status: shipped 2.0.0, 2026-07-12
Repo: [derekwelton/codex-kit](https://github.com/derekwelton/codex-kit) —
fork of openai/codex-plugin-cc @ db52e28f (Apache-2.0)

## Decisions (Derek, 2026-07-12)

- **Fork** upstream (keep the ~1,600-line companion engine unmodified except
  `MODEL_ALIASES`) rather than build thin; plugin keeps the name `codex` so
  `/codex:*` muscle memory and doc references survive; published through the
  existing `derekwelton` marketplace (external github source entry).
- **Routing policy** (canonical in the plugin's `model-routing` skill):
  - Fable 5 = orchestration + **UI design in-session** (Claude models thrive
    at UI; never delegate visual work to Codex).
  - **Sol @ high** = heavy-reasoning workhorse (majority of delegated work);
    xhigh escalation for complex cases. Stays the `config.toml` default.
  - **Terra @ high** = down-and-dirty bulk/mechanical/clear-spec.
  - **Luna: not used** — prefer Sonnet. Opus (Sonnet fallback) for
    user-facing subagent work. Never Haiku.
  - **Max and Ultra efforts banned** (Ultra = ~4-agent token multiplier;
    violates ceremony-opt-in). Allowed: low/medium/high/xhigh.
- **CLAUDE.md diet**: full routing text lives in the skill; each project gets
  the short pointer block (`templates/claude-md-block.md`), stamped by
  BOOTSTRAP Step 4.
- **Popup-free**: all AskUserQuestion flows replaced with plain-text asks.

## Research

`research/gpt-5-6-family.md` — model ids/pricing/efforts/benchmarks, cited;
upstream architecture notes.
