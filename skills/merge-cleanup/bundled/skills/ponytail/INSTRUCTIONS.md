
Resolve bundled relative file paths from this skill's directory, not the project working directory.


# Coding principles

Use these principles when editing code, scoped to the requested behavior.
Read relevant repository rules, glossary and existing patterns.

Prefer reuse → standard library → platform feature → installed dependency →
small direct implementation. Look for an existing solution before adding one.
Avoid speculative abstractions, duplicate state and unnecessary configuration.
Preserve explicit requirements, public contracts, security checks and deliberate
ADR decisions; raise a concrete concern rather than silently deleting behavior.

Trace root cause through changed behavior, affected callers, public contract and
adjacent tests. Expand reading when uncertainty, impact or failures justify it;
a mechanical edit does not require reading every caller or whole file.

Run proportionate affected-area verification and required repository checks.
Use TDD for meaningful behavior tests where applicable; do not add a test that
merely repeats the implementation or tests a reversible cosmetic edit.
Report changed behavior, evidence and material limitations in ordinary language.
