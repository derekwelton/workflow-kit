#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { main, selectSkills } from "./install-skills.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function parseSelection(answer, names) {
  if (answer.trim().toLowerCase() === "all") return [...names];
  const selected = answer.trim().split(/[\s,]+/).filter(Boolean).map(value => {
    const name = /^\d+$/.test(value) ? names[Number(value) - 1] : value;
    if (!names.includes(name)) throw new Error(`Unknown selection: ${value}`);
    return name;
  });
  if (!selected.length) throw new Error("Choose at least one skill, or type all.");
  return [...new Set(selected)];
}

export async function run(argv = process.argv.slice(2)) {
  // Explicit CLI options retain the existing automation/update interface.
  if (argv.length && !argv.includes("--interactive")) return main(argv);
  const args = argv.filter(arg => arg !== "--interactive");
  if (args.some(arg => ["--skills", "--all", "--host"].includes(arg))) throw new Error("The picker selects skills and host; omit --skills, --all and --host.");
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error("The picker needs an interactive terminal. Use --skills <name,...> --host codex|claude|both, or --help.");
  const catalog = JSON.parse(fs.readFileSync(path.join(root, "catalog.json"), "utf8"));
  const names = Object.keys(catalog.skills).sort();
  console.log("Choose skills by number or name (comma-separated), or type all. Ctrl+C cancels.\n");
  names.forEach((name, index) => {
    const body = fs.readFileSync(path.join(root, "skills", name, "SKILL.md"), "utf8");
    console.log(`${index + 1}. ${name} — ${body.match(/^description:\s*(.+)$/m)?.[1] ?? ""}`);
  });
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    let selected;
    while (!selected) {
      try { selected = parseSelection(await terminal.question("\nSkills: "), names); }
      catch (error) { if (error.code) throw error; console.log(error.message); }
    }
    let host;
    while (!["codex", "claude", "both"].includes(host)) {
      host = (await terminal.question("Agent (codex / claude / both) [codex]: ")).trim().toLowerCase() || "codex";
    }
    console.log(`Including required dependencies: ${selectSkills(catalog, selected).join(", ")}`);
    main([...args, "--host", host, "--skills", selected.join(",")]);
  } finally { terminal.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch(error => { console.error(error.message); process.exitCode = 1; });
}
