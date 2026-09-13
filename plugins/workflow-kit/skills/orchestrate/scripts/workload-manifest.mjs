#!/usr/bin/env node

import process from "node:process";

import { main } from "../bundled/scripts/workload-manifest.mjs";

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
