# Orchestration command reference

Use the helper's --help and structured errors for exact command arguments.
Do not read its implementation in ordinary execution.

## Arguments

Accept:

```text
--name <workload-name>                         optional user override; otherwise inferred
--status <status>                              default: Todo
--labels <comma-separated labels>
--issues <comma-separated issue keys>
--parent <issue key>
--pair <cross|codex-only|claude-only>          default: cross
--implementer <auto|codex|claude>              default: auto
--reviewer <auto|codex|claude>                 default: auto
--max-implementers <n>                         default: 4
--max-reviewers <n>                            default: 2
--max-review-rounds <n>                        default: 2 per issue
--review-policy <strict|convergent>             default: strict
--policy-decision <reference>                   required for convergent policy or live policy changes
--routing <JSON>                               effective implementation/review routes
--handoff-snapshot                             optional local derived handoff; off by default
--allow-extra-round --reason <text>            explicit authorization for one extra round
--allow-partial                                default: false
--plan                                         read-only plan; create nothing
--resume <workload-id>
```

Reject a new run without exactly one selection source:
`--issues`, `--parent`, or a tracker query (`--status` plus optional labels).
Treat bare label/name text conservatively as `--labels`/`--name`; show the
normalized interpretation before mutating anything.

For a new run, preserve an explicit workload name. Otherwise choose a short,
descriptive name from the selected issue titles, parent title, or shared
objective; do not ask the user to supply or approve a name. Use a lowercase
hyphenated slug, such as `simplify-shop-scheduling`, and pass it to the helper
as --name (the helper still requires this argument). Its integration branch is
`integration/<slug>`. If there is no clear shared theme, use the repository
name plus a concise selection label or issue key. Check existing workload IDs
and local/remote branch names; for an unrelated collision, append an issue key
or short numeric suffix. Never overwrite or reuse an unrelated run or branch.
Report the chosen name and branch with the normalized plan; naming alone does
not require confirmation. On --resume, retain the saved workload and branch
names. Issue worktree branches follow the repository/tracker convention; derive
a descriptive branch name when that convention leaves the choice to the agent.


## Creating a manifest

```bash
node <skill-dir>/scripts/workload-manifest.mjs init \
  --name "<name>" --issues "<frozen keys>" \
  --status "<status>" --labels "<labels>" \
  --pair "<pair>" --implementer "<provider>" --reviewer "<provider>" \
  --max-implementers <n> --max-reviewers <n> --max-review-rounds <n> \
  --review-policy <strict|convergent> --routing '<implementation/review JSON>'
```

Use `--dry-run` for `--plan`. Report the frozen queue, dependency/file-overlap
lanes, provider pairs, branch name, and terminal behavior; make no tracker,
Git, file, or manifest writes. Include `maxReviewRounds: 2` (or the explicit
threshold), the effective review policy, routing, and the decision source/scope.
Strict review is default. Convergent deferral requires a run-scoped user decision
passed through `--policy-decision`; a threshold means stop and reconcile, never
automatic approval. Preserve saved policy on resume. Change live policy only
with `set-policy --run <id> --policy-decision <reference>` and explicit settings.
Do not infer consent or a new route from a historical anecdote or session restart.
