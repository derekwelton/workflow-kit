### 4. Run an independent reviewer

Read `../../model-routing/SKILL.md`; pass explicit model and effort controls.

Choose the provider before launching review:

- Codex-authored implementation → fresh Claude reviewer selected by model-routing by default.
- Claude-authored implementation → fresh Codex reviewer selected by model-routing by default.
- `codex-only` / `claude-only` workloads → a fresh, context-independent
  session of that provider.

The reviewer covers both axes in one fresh independent session by default.
For Codex from Claude use the dedicated reviewer adapter with exact --cwd,
base/head, standards and issue/spec content. Use separate axis workers only
when their bounded independent work benefits parallel review within capacity.
Never call the low-level companion runtime or poll its state files.

#### Optional separate axis prompts

Only when separate axes were selected, use these brief shapes.

**Standards sub-agent prompt** — include:

- The full diff command and commit list.
- The standards-source files found in step 3, **plus the smell baseline pasted
  in full** — the sub-agent has no other access to it.
- The brief: "Report — per file/hunk where relevant — (a) every place the diff
  violates a documented standard: cite the standard (file + rule); and (b) any
  baseline smell you spot: name it and quote the hunk. Distinguish hard
  violations from judgement calls — documented-standard breaches can be hard,
  but baseline smells are always judgement calls, and a documented repo
  standard overrides the baseline. Skip anything tooling enforces. Under 400
  words."

**Spec sub-agent prompt** — include:

- The diff command and commit list.
- The path or fetched contents of the spec (and ticket, if reviewing one).
  Under Linear mode, **paste the issue body and spec comment in full** — the
  sub-agent may have no Linear tool surface, so a key alone gets it nothing.
- The brief: "Report: (a) requirements the spec asked for that are missing or
  partial; (b) behaviour in the diff that wasn't asked for (scope creep);
  (c) requirements that look implemented but where the implementation looks
  wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the report.
