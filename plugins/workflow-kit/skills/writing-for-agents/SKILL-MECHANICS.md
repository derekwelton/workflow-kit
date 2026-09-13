# Skill mechanics

Use the target host's supported frontmatter and metadata, preserving existing invocation choices.

- Include a concise `name` and `description` describing the capability and when it applies.
- Model-invocable skills can be discovered for relevant work and explicitly requested by users.
- Preserve upstream explicit-only policies when importing skills. For new skills, leave automatic discovery enabled unless the user requests explicit-only invocation.
- In this kit, Claude explicit-only skills use `disable-model-invocation: true`; Codex metadata uses `policy.allow_implicit_invocation: false` in `agents/openai.yaml`. Keep both surfaces consistent. Do not promise zero catalog overhead.
- Shared instructions can live in a plain reference file read by several skills without activating the reference owner's workflow. Declare cross-folder dependencies in `catalog.json` so selective installations remain complete.

Split skills when their independent uses justify separate discovery. Put conditional detail in supporting files and state when to read each file. A router should identify available skills and their purposes while respecting the user's requested scope and the host's invocation rules.
