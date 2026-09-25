# Feature usage and acceptance guide

When implementation is ready for the user to try, return a consolidated guide in
the final response and reference it through the existing authorized handoff surface.
Do not require a new document or tracker write solely for this guide. On partial or
blocked delivery identify what can be tried and what cannot; do not claim completion.

For every implemented feature include its plain-language outcome, where to access
it, prerequisite role/account/data, concrete numbered steps and expected results.
Check coverage against the selected issues and acceptance criteria; a file list or
automated test summary is not a usage guide. Include relevant failure/permission
cases and mark anything not exercised in the intended environment as unverified.

List required migrations, scripts, configuration, seed data, services and deployment
steps in execution order, separately from optional utilities. For each give its
purpose, working directory, exact command (or concrete manual instructions),
prerequisites, expected result, data impact and completed/pending/blocked/unknown
status. Give rollback/recovery steps where applicable. Use placeholders for secrets.
Never invent missing commands. If nothing additional is needed, explicitly say so.

State what was tested and passed, remaining limitations, branch/PR or environment
to use, and whether the work is merged/deployed. Reconcile worker instructions
against the final integrated version. Preserve this information across resumes.
