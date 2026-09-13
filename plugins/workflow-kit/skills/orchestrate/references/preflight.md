# Capability-scoped preflight

Check only capabilities needed by the selected workflow, before dispatch.

| Needed capability | Read-only evidence | Remedy owner |
| --- | --- | --- |
| Workflow instructions | Installed SKILL.md, project installation record, sibling/helper files | Refresh the selected project-local files and session. Do not guess global cache paths or change user settings. |
| Selected provider/model | Host catalog and adapter/tool availability; requested versus reported model/effort | Coordinator selects an explicitly available allowed route or reports unknown access. Public availability does not prove account access. No paid probe jobs. |
| Tracker | Repository-selected mappings and a scoped read of the issue | Repository owner fixes mappings; installation/account owner fixes connector/auth. Do not alter credentials or board configuration as a diagnostic. |
| Required verification tool | Repository's actual command, executable presence, local version/help where relevant | Installation owner fixes PATH/version/auth for that selected tool. Do not install unrelated tools or make CodeRabbit/Playwright universally mandatory. |
| Resume | Saved jobs, actual branch/worktree/head and receipts, policy decisions, owned process identity, prerequisites | Reconcile in the owning runtime/project. Preserve active jobs and dirty work; never kill a PID without confirming command/start-time/ownership. |

Report each needed capability as verified, unavailable, or unknown with its next
action. Installation integrity is not end-to-end workflow readiness. The installer
checks the selected dependency closure and owned files; that does not prove the
version loaded in a live session or success of the user's workload.
