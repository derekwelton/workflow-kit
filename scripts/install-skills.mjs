#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slash = value => value.replaceAll(path.sep, "/");
const hash = value => createHash("sha256").update(value).digest("hex");
const read = file => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const exists = file => { try { return fs.lstatSync(file); } catch (error) { if (error.code === "ENOENT") return null; throw error; } };
const inside = (parent, file) => { const relative = path.relative(parent, file); return relative && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative); };

export function selectSkills(catalog, requested) {
  const selected = new Set();
  function add(input) {
    const name = Object.keys(catalog.skills).find(key => key === input || catalog.skills[key].name === input);
    if (!name) throw new Error(`Unknown skill: ${input}`);
    if (selected.has(name)) return;
    selected.add(name);
    for (const dependency of catalog.skills[name].dependencies ?? []) add(dependency);
  }
  requested.forEach(add);
  return [...selected].sort();
}

function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Source links are not portable: ${file}`);
    return entry.isDirectory() ? filesBelow(file) : [file];
  });
}

export function projectPayload({ root = sourceRoot, host, selected, catalog }) {
  const hostRoot = host === "codex" ? ".agents" : ".claude";
  const destination = relative => {
    const parts = slash(relative).split("/");
    if (parts[0] === "skills") {
      if (host === "codex") parts[1] = catalog.skills[parts[1]]?.name ?? parts[1];
      return `${hostRoot}/${parts.join("/")}`;
    }
    return `${hostRoot}/workflow-kit/${slash(relative)}`;
  };
  const sourceFiles = new Set();
  for (const name of selected) {
    if (!fs.existsSync(path.join(root, "skills", name, "SKILL.md"))) throw new Error(`Missing skill entrypoint: ${name}/SKILL.md`);
    for (const file of filesBelow(path.join(root, "skills", name))) sourceFiles.add(slash(path.relative(root, file)));
    for (const file of catalog.skills[name].support ?? []) sourceFiles.add(file);
  }
  // Follow executable imports and explicit file references, never all skill bodies.
  const pattern = /(?:(?:\.\.\/|\.\/)+|(?<=[`(])(?:references|assets|agents)\/)(?:[a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+\.(?:md|mjs|json|html|sh|yaml)/g;
  for (const relative of sourceFiles) {
    const text = read(path.join(root, relative)).replace(/```[\s\S]*?```/g, "");
    for (const reference of text.matchAll(pattern)) {
      const resolved = path.resolve(root, path.dirname(relative), reference[0]);
      if (!inside(root, resolved) || !fs.existsSync(resolved)) throw new Error(`Missing source dependency: ${relative}: ${reference[0]}`);
      const dependency = slash(path.relative(root, resolved));
      if (dependency.startsWith("skills/")) {
        const owner = dependency.split("/")[1];
        if (!selected.includes(owner)) throw new Error(`Undeclared skill dependency: ${relative} requires ${owner}`);
      } else sourceFiles.add(dependency);
    }
  }
  const payload = new Map();
  for (const relative of sourceFiles) {
    let text = read(path.join(root, relative));
    const output = destination(relative);
    text = text.replace(pattern, reference => {
      const resolved = slash(path.relative(root, path.resolve(root, path.dirname(relative), reference)));
      if (!sourceFiles.has(resolved)) return reference;
      const replacement = slash(path.relative(path.dirname(output), destination(resolved)));
      return replacement.startsWith(".") ? replacement : `./${replacement}`;
    });
    if (relative.endsWith("/SKILL.md")) {
      // Generated native-plugin discovery metadata is not consumer skill policy.
      text = text.replace(/^metadata:\n  internal: true\n/m, "");
      const metadata = read(path.join(root, path.dirname(relative), "agents/openai.yaml"));
      const explicitOnly = /allow_implicit_invocation: false/.test(metadata);
      text = text.replace(/^disable-model-invocation: true\n/gm, "");
      if (host === "claude" && explicitOnly) text = text.replace("\n---", "\ndisable-model-invocation: true\n---");
      // Markdown references are always relative to this installed skill file.
      const preamble = "Resolve bundled relative file paths from this skill's directory, not the project working directory.";
      text = text.replace(`\n\n${preamble}\n`, "");
      const end = text.indexOf("\n---", 4) + 4;
      text = text.slice(0, end) + `\n\n${preamble}\n` + text.slice(end);
    }
    payload.set(output, text);
  }
  for (const license of ["licenses/mattpocock-skills-MIT.txt", "licenses/ponytail-MIT.txt", "licenses/pstack-LICENSE.txt", "UPSTREAM.md"]) {
    if (fs.existsSync(path.join(root, license))) payload.set(destination(license), read(path.join(root, license)));
  }
  return payload;
}

function assertSafe(project, relative) {
  const file = path.resolve(project, relative);
  if (!inside(project, file)) throw new Error(`Path escapes project: ${relative}`);
  let cursor = project;
  for (const part of path.relative(project, file).split(path.sep)) {
    cursor = path.join(cursor, part);
    const stat = exists(cursor);
    if (stat?.isSymbolicLink()) throw new Error(`Refusing linked destination: ${cursor}`);
    if (cursor !== file && stat && !stat.isDirectory()) throw new Error(`Not a directory: ${cursor}`);
  }
  const stat = exists(file);
  if (stat && !stat.isFile()) throw new Error(`Not a regular file: ${file}`);
  return file;
}

export function installSkills({ project = process.cwd(), host = "codex", skills = [], all = false, check = false, dryRun = false, diff = false, root = sourceRoot } = {}) {
  dryRun ||= diff;
  project = fs.realpathSync(path.resolve(project));
  if (project === fs.realpathSync(os.homedir()) || project === path.parse(project).root) throw new Error("Choose a project directory, not a user home or filesystem root");
  if (!["codex", "claude", "both"].includes(host)) throw new Error("--host must be codex, claude, or both");
  if (all && skills.length) throw new Error("Choose --all or --skills, not both");
  const catalog = JSON.parse(read(path.join(root, "catalog.json")));
  const version = JSON.parse(read(path.join(root, ".claude-plugin/plugin.json"))).version;
  const lockPath = assertSafe(project, ".workflow-skills.json");
  const previousText = exists(lockPath) ? read(lockPath) : null;
  const previous = previousText ? JSON.parse(previousText) : { schema: 1, hosts: {} };
  if (previous.schema !== 1 || !previous.hosts || typeof previous.hosts !== "object") throw new Error("Unsupported installation record");
  const next = structuredClone(previous);
  const writes = new Map(), removals = new Set(), results = [], selections = {};
  const hosts = host === "both" ? ["codex", "claude"] : [host];
  for (const selectedHost of hosts) {
    const old = previous.hosts[selectedHost] ?? { requested: [], files: {} };
    const requested = (all ? Object.keys(catalog.skills) : [...new Set([...old.requested, ...skills])]).sort();
    if (!requested.length) throw new Error("Choose --all or --skills <name,...> for the first installation");
    const selected = selectSkills(catalog, requested);
    selections[selectedHost] = { requested, included: selected, dependencies: selected.filter(name => !requested.includes(name)) };
    const payload = projectPayload({ root, host: selectedHost, selected, catalog });
    const owned = old.files;
    const nextFiles = {};
    for (const relative of new Set([...Object.keys(owned), ...payload.keys()])) {
      const allowedPrefix = selectedHost === "codex" ? ".agents/" : ".claude/";
      if (!relative.startsWith(`${allowedPrefix}skills/`) && !relative.startsWith(`${allowedPrefix}workflow-kit/`)) throw new Error(`Invalid owned path: ${relative}`);
      const file = assertSafe(project, relative);
      if (slash(path.relative(project, file)) !== relative) throw new Error(`Non-canonical owned path: ${relative}`);
      const current = exists(file) ? read(file) : null;
      const proposed = payload.get(relative) ?? null;
      if (current !== null && (!owned[relative] || hash(current) !== owned[relative])) {
        throw new Error(`Local edit or unowned file; preserved without changes: ${relative}. Review and reconcile it before updating.`);
      }
      if (proposed !== null) nextFiles[relative] = hash(proposed);
      if (current === proposed) continue;
      const action = proposed === null ? "remove" : current === null ? "add" : "update";
      const result = { path: relative, action };
      if (diff) result.diff = `--- ${relative}\n+++ ${relative}\n@@ -1,${current?.split("\n").length ?? 0} +1,${proposed?.split("\n").length ?? 0} @@\n${current === null ? "" : current.split("\n").map(line => `-${line}\n`).join("")}${proposed === null ? "" : proposed.split("\n").map(line => `+${line}\n`).join("")}`;
      results.push(result);
      if (proposed === null) removals.add(relative); else writes.set(relative, proposed);
    }
    next.hosts[selectedHost] = { version, upstream: catalog.upstream, requested, included: selected, files: nextFiles };
  }
  const nextText = JSON.stringify(next, null, 2) + "\n";
  if (nextText !== previousText) {
    writes.set(".workflow-skills.json", nextText);
    results.push({ path: ".workflow-skills.json", action: previousText === null ? "add" : "update" });
  }
  if (!check && !dryRun) {
    const backups = new Map();
    try {
      for (const relative of [...removals, ...writes.keys()]) {
        const file = assertSafe(project, relative);
        backups.set(file, exists(file) ? fs.readFileSync(file) : null);
        if (removals.has(relative)) fs.unlinkSync(file);
        else { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, writes.get(relative)); }
      }
    } catch (error) {
      for (const [file, contents] of [...backups].reverse()) {
        if (contents === null) { if (exists(file)) fs.unlinkSync(file); }
        else fs.writeFileSync(file, contents);
      }
      throw error;
    }
  }
  return { project, healthy: check ? results.length === 0 : true, preview: check || dryRun, selections, changes: results };
}

export function main(argv = process.argv.slice(2)) {
  const options = {};
  let json = false;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (["--project", "--host", "--skills"].includes(arg)) {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value`);
      options[arg.slice(2)] = arg === "--skills" ? value.split(",").filter(Boolean) : value;
    } else if (arg === "--all") options.all = true;
    else if (arg === "--check") options.check = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--diff") { options.diff = true; options.dryRun = true; }
    else if (arg === "--json") json = true;
    else if (arg === "--help" || arg === "-h") {
      console.log("node scripts/install-skills.mjs --project <existing-project> [--host codex|claude|both] (--all | --skills ponytail,tdd) [--dry-run|--diff|--check] [--json]\nDefaults: current project, Codex. Rerun without a selection to update installed skills. New selections are additive. Local edits and unowned files block updates before any writes.");
      return;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  const result = installSkills(options);
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`${result.preview ? "Preview" : "Installed"}: ${result.project}`);
    for (const [host, selection] of Object.entries(result.selections)) console.log(`${host}: ${selection.included.length} skills (${selection.dependencies.length} dependencies). ${selection.included.join(", ")}`);
    for (const change of result.changes) console.log(change.diff ?? `${change.action}: ${change.path}`);
    if (!result.changes.length) console.log("Already current.");
  }
  if (!result.healthy) process.exitCode = 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
