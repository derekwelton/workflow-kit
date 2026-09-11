#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const blockPattern = /<!-- workflow-kit:managed-start version=[^>]+-->[\s\S]*?<!-- workflow-kit:managed-end -->/g;
function hasOneMarkerPair(text) {
  return [...text.matchAll(/<!--\s*workflow-kit:managed-start\b/g)].length === 1
    && [...text.matchAll(/<!--\s*workflow-kit:managed-end\b/g)].length === 1;
}
function readRegular(file, optional = false) {
  let stat;
  try { stat = fs.lstatSync(file); }
  catch (error) { if (optional && error.code === "ENOENT") return null; throw error; }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("Destination is not a generated regular file; reconcile before replacing.");
  return fs.readFileSync(file, "utf8");
}

export function refreshDocument(current, template) {
  const blocks = [...current.matchAll(blockPattern)];
  const incoming = [...template.matchAll(blockPattern)];
  if (!hasOneMarkerPair(current) || !hasOneMarkerPair(template) || blocks.length !== 1 || incoming.length !== 1) throw new Error("Require one managed block; reconcile legacy or ambiguous documents manually.");
  const oldVersion = blocks[0][0].match(/version=(\d+\.\d+\.\d+)/)?.[1];
  const newVersion = incoming[0][0].match(/version=(\d+\.\d+\.\d+)/)?.[1];
  if (!oldVersion || !newVersion) throw new Error("Unrecognized managed version.");
  const compare = oldVersion.split(".").reduce((result, n, i) => result || Math.sign(Number(n) - Number(newVersion.split(".")[i])), 0);
  if (compare > 0) throw new Error("Repository is newer; update the package before refreshing.");
  const newline = current.includes("\r\n") ? "\r\n" : "\n";
  const block = incoming[0][0].replace(/\r?\n/g, newline);
  return current.slice(0, blocks[0].index) + block + current.slice(blocks[0].index + blocks[0][0].length);
}

export function refreshLifecycle({ lifecycle, check = false, packageRoot = root }) {
  const target = path.resolve(lifecycle);
  const current = readRegular(target);
  const next = refreshDocument(current, fs.readFileSync(path.join(packageRoot, "templates/feature-lifecycle.md"), "utf8"));
  const fallback = path.join(path.dirname(target), "feature-lifecycle-portable.md");
  const portable = fs.readFileSync(path.join(packageRoot, "templates/feature-lifecycle-portable.md"), "utf8").replace(/\r\n/g, "\n");
  const existing = readRegular(fallback, true);
  if (existing !== null && !existing.startsWith("<!-- workflow-kit:portable version=")) throw new Error("Portable destination is not a generated regular file; reconcile before replacing.");
  const changed = [next !== current && target, existing !== portable && fallback].filter(Boolean);
  if (!check) {
    // Refuse a detected concurrent edit before either write.
    if (readRegular(target) !== current || readRegular(fallback, true) !== existing) throw new Error("Document changed during refresh; retry from current content.");
    if (next !== current) fs.writeFileSync(target, next);
    if (existing !== portable) fs.writeFileSync(fallback, portable);
  }
  return { check, changed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.filter(a => a !== "--check").length !== 1) throw new Error("Usage: refresh-lifecycle.mjs <lifecycle-path> [--check]");
    console.log(JSON.stringify(refreshLifecycle({ lifecycle: args.find(a => a !== "--check"), check: args.includes("--check") }), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
