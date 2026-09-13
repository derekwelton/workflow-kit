# Install workflow skills

From the target project, run `npx skills@latest add derekwelton/workflow-kit` and
choose skills and agents. Each folder includes its required files. Invoke
setup-workflow-skills only when project configuration is needed.

See [README.md](README.md) for local-checkout installation and the alternative
managed installer used by projects with `.workflow-skills.json`.

For orchestration/review, prefer the other provider's CLI. If its authorized
reviewers are unavailable, use a fresh same-provider session and record why.
Claude review uses Opus 5 high, then Fable medium/low, then Codex. Neither optional
CLI is a prerequisite for adopting skills. Claude-to-Codex: follow `codex-cli`.
Do not stamp companion-plugin instructions into consumer CLAUDE.md files.
For existing companion routing, follow [migration](docs/codex-cli-migration.md).
