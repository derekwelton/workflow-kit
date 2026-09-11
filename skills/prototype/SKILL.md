---
name: prototype
description: Build the smallest throwaway experiment that answers a logic or UI design question. Use variants when comparison helps; preserve decisions within authorized scope.
---

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

## Pick a branch

Identify which question is being answered — from the user's prompt, the surrounding code, or by asking if the user is around:

- **"Does this logic / state model feel right?"** → [LOGIC.md](LOGIC.md). Build a single shareable HTML file with free-play controls and guided walkthroughs that a non-developer can drive.
- **"What should this look like?"** → [UI.md](UI.md). Build the smallest visual experiment that answers the question; use variants only when comparison helps on a single route, switchable via a URL search param and a floating bottom bar.

The two branches produce very different artifacts — getting this wrong wastes the whole prototype. If the question is genuinely ambiguous and the user isn't reachable, default to whichever branch better matches the surrounding code (a backend module → logic; a page or component → UI) and state the assumption at the top of the prototype.

## Rules that apply to both

If investigation is delegated, route it through `../research/SKILL.md` and
retain citations; a research artifact is conditional.
Do not launch a research batch for a prototype whose question is already clear.

1. **Throwaway from day one, and clearly marked as such.** Locate the prototype code close to where it will actually be used (next to the module or page it's prototyping for) so context is obvious — but name it so a casual reader can see it's a prototype, not production. For throwaway UI routes, obey whatever routing convention the project already uses; don't invent a new top-level structure.
2. **Trivial to run.** A logic prototype is a single HTML file opened directly. For UI prototypes: Whatever the project's existing task runner supports — `pnpm <name>`, `python <path>`, `bun <path>`, etc. The user must be able to start it without thinking.
3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE — wipe me" name.
4. **Skip the polish.** No tests, no error handling beyond what makes the prototype _runnable_, no abstractions. The point is to learn something fast.
5. **Surface the state.** After every action (logic) or on every variant switch (UI), print or render the full relevant state so the user can see what changed.
6. **Capture the result.** Return the question, verdict, evidence and any
   decision needed. Persist or commit the prototype only as authorized; use
   a throwaway branch when preserving code. Implement validated changes only
   within the user's scope. For authorized issue-backed work the caller posts
   one checkpoint with reachable evidence; a local prototype remains usable
   without pushing just to obtain a link.
