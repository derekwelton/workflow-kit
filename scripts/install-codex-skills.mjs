#!/usr/bin/env node
// Compatibility entrypoint. Distribution is project-local; no user-skill links.
import { main } from "./install-skills.mjs";
try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
