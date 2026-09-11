---
name: grilling
description: Interview the user in dependency-aware question rounds. Use for explicit grilling, interview or plan stress-test requests, or an accepted offer; ordinary planning is insufficient.
---

Interview the user relentlessly about every aspect of this plan until you reach
a shared understanding. Walk down each branch of the design tree, resolving
dependencies between decisions one-by-one.

**This session is opt-in.** It runs because the user asked for it (or said yes
to a one-line offer) — never because the task "seemed big enough". Once
invoked, be relentless; until invoked, don't be here.

## Rules

- **Rounds of bulk questions.** Group related questions into a numbered round
  (typically 3–6 questions), get answers, then open the next round with
  whatever branches those answers exposed. Do not ask one question at a time —
  and do not fire every question in the whole tree at once; a round covers the
  decisions that are currently unblocked.
- **For each question, provide your recommended answer** and the reasoning in
  a sentence or two, so the user can accept it in a word. Make it easy to
  answer a whole round in one line ("1a, 2 yes, 3b…").
- **If a fact can be found by exploring the codebase, look it up rather than
  asking.** Questions are for *decisions* — those are the user's; put each one
  to them and wait for the answer. Never answer your own question and move on.
- **Use the question surface the user and host support.** Preserve an explicit
  plain-text preference. On Codex hosts that support asynchronous text questions,
  use them for missing decisions and continue independent work while awaiting
  replies. Never ask for file uploads through a text-only question tool. Required
  answers still gate dependent actions; elapsed time never counts as approval.

- **Sequence by dependency.** If question B only makes sense after A is
  answered, A goes in this round and B in the next. Say what the next round
  will cover so the user sees the shape of the tree.
- Where the conversation is sharpening domain terms or crystallizing
  hard-to-reverse decisions, apply the `domain-modeling` skill alongside
  (glossary updates, sparing ADRs).
- **Do not enact the plan until the user confirms** shared understanding has
  been reached. Close the final round by restating the locked decisions in
  one compact list.

Read `../../templates/lifecycle-contract.md`; personal/advisory interviews
remain in chat unless an artifact or publication is requested. Authorized
issue-backed decisions are written into the feature's
`spec.md` / `notes.md` — or, under Linear mode
(`../linear-mode/SKILL.md`), into the issue body and a sync-thread
comment. Either way the interview transcript is not the record. At the
end of each issue-backed session, apply `update-issue` with the locked
decisions, unresolved questions, recommendations, and next action. If the
session pauses awaiting answers, the issue gets the same question round as a
**Needs decision** comment; do not rely on chat history as the only queue.

If delegated investigation is needed, route it through `../research/SKILL.md`
and retain its citations; a durable artifact is conditional on the research task.
Do not spawn research workers merely to expand an interview.

End with one proportional offer: "Use to-spec to capture these decisions"
(`/workflow-kit:to-spec` in Claude, `$to-spec` in Codex). Do not invoke a user-only
skill implicitly or restart the interview.
