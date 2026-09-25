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
--review-fallback <JSON>                     verified unavailable review route; init/pair/set-issue
--implementer <auto|codex|claude>              default: auto
--reviewer <auto|codex|claude>                 default: auto
--max-implementers <n>                         default: 4
--max-reviewers <n>                            default: 2
--max-review-rounds <n>                        default: 2 per issue
--review-policy <bounded|strict|convergent>     default: bounded
--policy-decision <reference>                   required for convergent policy or live policy changes
--routing <JSON>                               effective implementation/review routes
--handoff-snapshot                             optional local derived handoff; off by default
--review-dispatch <JSON>                       bounded dispatch/attempt update
--review-authorization <JSON>                  durable scoped additional allowance
--review-attestation <JSON>                    eligible nonfunctional delta evidence
--completion-guide <JSON>                      head-bound usage/setup/test instructions
--allow-extra-round --reason <text>            legacy policies only
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
  --review-policy <bounded|strict|convergent> --routing '<implementation/review JSON>'
```

Use `--dry-run` for `--plan`. Report the frozen queue, dependency/file-overlap
lanes, provider pairs, branch name, and terminal behavior; make no tracker,
Git, file, or manifest writes. Include `maxReviewRounds: 2` (or the explicit
threshold), the effective review policy, routing, and the decision source/scope.
Bounded review is default. Legacy convergent deferral requires a run-scoped user decision
passed through `--policy-decision`; a threshold means stop and reconcile, never
automatic approval. Preserve saved policy on resume. Change live policy only
with `set-policy --run <id> --policy-decision <reference>` and explicit settings.
Do not infer consent or a new route from a historical anecdote or session restart.

## Bounded review protocol

Pass JSON as structured arguments with proper shell quoting. Before launch use
set-issue --state code-review --review-dispatch with:

```json
{"id":"review-1","scope":"full issue","kind":"initial","attempt":{"id":"attempt-1","status":"running"}}
```

Repeat the same dispatch metadata and attempt ID to report failed (with reason and
partial findings) or completed (with receipt and verdict pass|changes-required).
Record --review-execution for each attempt. A retry uses a new attempt ID in the
same dispatch; at most three attempts are allowed. A focused verification uses a
new dispatch ID and kind fix-verification. Repeating an identical update is safe.
Do not change the scope/head of an existing dispatch or launch a concurrent one.

Beyond the completed-review budget, save --review-authorization:

```json
{"id":"decision-1","reference":"user message reference","scope":"verify stale-write fix","findings":["F-1"],"allowance":1}
```

Use its authorizationId and exact scope in the dispatch. Preserve any user limits
in constraints and optional expiresAt; the coordinator must enforce model/cost
constraints before dispatch. Infrastructure exhaustion requires reconciliation and
a concrete user decision; never create a new ID to evade retry bounds. If the user
authorizes more infrastructure attempts, add retryDispatchId and retryAllowance to
a new authorization record and pass its retryAuthorizationId in the same dispatch.
The helper bounds those extra attempts separately and preserves previous failures.

For an eligible complete nonfunctional delta, use --review-attestation:

```json
{"reviewedSha":"<full independently reviewed SHA>","classification":"wording","reason":"Exact wording corrections; no operating instructions or acceptance changes","assessor":"coordinator session ID","checks":"<current SHA>: relevant checks passed"}
```

The helper records current head, changed paths and the binary diff hash. It cannot
prove semantic equivalence; the coordinator must inspect the full delta. Supported
classifications: wording, comments, formatting, mechanical-cleanup.

Before handoff pass --completion-guide (actions are in execution order):

```json
{"headSha":"<current SHA>","features":[{"name":"Feature","outcome":"What changed","access":"Route or command","prerequisites":"Role and data, or none","steps":["Concrete action"],"expected":"Observable result"}],"actions":[{"name":"Setup","required":true,"cwd":"project directory","command":"exact command or manual instructions","purpose":"Why needed","prerequisites":"Requirements","expected":"Success result","dataImpact":"What it changes","status":"pending"}],"verification":"Checks performed and results","limitations":"Unverified items, or none","delivery":"Branch/PR/environment and merged/deployed state"}
```

Use actions: [] when no extra setup is needed and say so in the final guide.
Unknown commands remain explicit blockers; do not fabricate runnable instructions.
Saved manifests remain canonical; schema migration preserves legacy accounting.
Adopt bounded on an existing run only with set-policy and a decision reference.
For runs already at reviewed/human-review gates, also pass --completion-guides
as an object keyed by issue key containing each head-bound guide. Adoption is
atomic: missing required guides reject the change and leave the saved policy intact.
Historical launch counts and receipts remain intact; they are not converted into
completed-review counts. New dispatches use the bounded ledger.
