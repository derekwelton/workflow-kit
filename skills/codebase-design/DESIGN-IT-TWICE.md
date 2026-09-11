# Design it twice

Use for an explicitly chosen interface design question. Read the glossary in
[SKILL.md](SKILL.md); consult [DEEPENING.md](DEEPENING.md) for dependency strategy.

1. State constraints, caller needs and the behavior hidden behind the interface.
2. Produce two alternatives locally by default: one minimizing interface surface,
   one optimizing the common caller. Avoid speculative flexibility.
3. For a large decision, bounded independent alternatives may run in parallel
   only when authorized and the coordinator has useful work. Read model-routing;
   pass relevant domain terms and constraints, not every vocabulary document.
4. For each alternative show interface/invariants/errors, usage, hidden behavior,
   dependencies, and tradeoffs. Compare depth, locality and seam placement.
5. Recommend one or a concrete synthesis. Do not start implementation or intake
   merely because alternatives were explored.
