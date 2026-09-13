---
name: research
description: Investigate a question against primary sources and return cited findings. Use for technical research, documentation lookup, or delegated reading.
metadata:
  internal: true
---

Resolve bundled relative file paths from this skill's directory, not the project working directory.


Investigate locally by default. Use a background agent for a bounded independent
research task when delegation is permitted and there is useful work to do alongside it.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Return cited findings in chat, or write the artifact the user requested.
3. When saving findings, follow the repository's existing location conventions.
   Research does not require issue intake, tracker publication or a feature folder.
