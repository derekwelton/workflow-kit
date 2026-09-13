#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { selectSkills } from "./install-skills.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slash = value => value.split(path.sep).join("/");
const read = file => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
// Literal bundled file pointers and executable imports. Project paths and examples
// are left alone unless they resolve to one of the selected package source files.
export const fileReferences = /(?:(?:\.\.\/|\.\/)+|(?:references|assets|agents|scripts|bundled)\/)(?:[a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+\.(?:md|mjs|json|html|sh|yaml)|(?<=[`("'])[A-Z][A-Z0-9_-]*\.md/g;
const fallback = "When this workflow calls for a required skill that is not separately installed, read its instructions from `bundled/dependencies.md`. Load only the dependency needed for the current step; bundled instructions do not authorize additional work.";

function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === "bundled") return [];
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Source links are not portable: ${file}`);
    return entry.isDirectory() ? filesBelow(file) : [file];
  });
}

export function canonicalReference(relative, reference) {
  const resolved = slash(path.normalize(path.join(path.dirname(relative), reference)));
  // Bundled trees mirror canonical repository paths. Dependency entrypoints are
  // plain instructions so hosts and the skills CLI cannot discover nested skills.
  return resolved.replace(/^skills\/[^/]+\/bundled\//, "").replace(/\/INSTRUCTIONS\.md$/, "/SKILL.md");
}

export function bundlePayload(sourceRoot, owner, catalog) {
  const selected = selectSkills(catalog, [owner]);
  const sourceFiles = new Set();
  for (const name of selected) {
    for (const file of filesBelow(path.join(sourceRoot, "skills", name))) {
      sourceFiles.add(slash(path.relative(sourceRoot, file)));
    }
    for (const support of catalog.skills[name].support ?? []) sourceFiles.add(support);
  }
  sourceFiles.add("UPSTREAM.md");
  // Follow helper imports and shared references transitively, independent of any
  // existing generated bundle on disk (stale copies must never mask a missing owner).
  for (const relative of sourceFiles) {
    if (relative === "UPSTREAM.md") continue;
    const content = read(path.join(sourceRoot, relative));
    for (const match of content.matchAll(fileReferences)) {
      if (match[0].endsWith("bundled/dependencies.md")) continue;
      const dependency = canonicalReference(relative, match[0]);
      if (!fs.existsSync(path.join(sourceRoot, dependency))) continue;
      if (dependency.startsWith("../") || path.isAbsolute(dependency)) throw new Error(`Escaping dependency: ${relative}`);
      if (dependency.startsWith("skills/")) {
        if (!selected.includes(dependency.split("/")[1])) throw new Error(`Undeclared dependency: ${relative} -> ${dependency}`);
      } else sourceFiles.add(dependency);
    }
  }
  const destination = relative => relative.startsWith(`skills/${owner}/`)
    ? relative.slice(`skills/${owner}/`.length)
    : `bundled/${relative.replace(/\/SKILL\.md$/, "/INSTRUCTIONS.md")}`;
  const relativeLink = (from, to) => {
    const result = slash(path.relative(path.dirname(from), to));
    return result.startsWith(".") ? result : `./${result}`;
  };
  const payload = new Map();
  for (const relative of sourceFiles) {
    const output = destination(relative);
    let content = read(path.join(sourceRoot, relative));
    if (relative !== "UPSTREAM.md") content = content.replace(fileReferences, reference => {
      if (reference.endsWith("bundled/dependencies.md")) return relativeLink(output, "bundled/dependencies.md");
      const canonical = canonicalReference(relative, reference);
      return sourceFiles.has(canonical) ? relativeLink(output, destination(canonical)) : reference;
    });
    if (relative.endsWith("/SKILL.md") && !relative.startsWith(`skills/${owner}/`)) {
      content = content.replace(/^---\n[\s\S]*?\n---\n/, "");
      content = content.replace("Resolve bundled relative file paths from this skill's directory, not the project working directory.", "Resolve this document's relative file paths from the directory containing it, not the project working directory.");
    }
    // Own source files are maintained by authors, never overwritten by the builder.
    if (output.startsWith("bundled/")) payload.set(output, content);
  }
  const dependencies = selected.filter(name => name !== owner);
  payload.set("bundled/dependencies.md", "# Bundled dependencies\n\nRead only the instructions needed by the current workflow. Preserve the user's scope,\nrepository contracts, independent review, and human acceptance boundaries.\n\n" + dependencies.map(name => `- ${name}${catalog.skills[name].name ? ` (${catalog.skills[name].name})` : ""}: [instructions](./skills/${name}/INSTRUCTIONS.md)`).join("\n") + "\n");
  return payload;
}

export function buildSkillBundles(sourceRoot = root, { check = false } = {}) {
  const catalog = JSON.parse(read(path.join(sourceRoot, "catalog.json")));
  let count = 0;
  for (const owner of Object.keys(catalog.skills)) {
    const skillRoot = path.join(sourceRoot, "skills", owner);
    const expected = bundlePayload(sourceRoot, owner, catalog);
    for (const [relative, content] of expected) {
      const file = path.join(skillRoot, relative);
      if (check) {
        if (!fs.existsSync(file) || read(file) !== content) throw new Error(`Skill bundle drift: ${owner}/${relative}`);
      } else {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content);
      }
      count++;
    }
    const bundledRoot = path.resolve(skillRoot, "bundled");
    function inspect(directory) {
      if (!fs.existsSync(directory)) return;
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.resolve(directory, entry.name);
        if (!file.startsWith(bundledRoot + path.sep) || entry.isSymbolicLink()) throw new Error(`Unsafe bundle output: ${file}`);
        if (entry.isDirectory()) inspect(file);
        else if (!expected.has(slash(path.relative(skillRoot, file)))) {
          if (check) throw new Error(`Unexpected bundle file: ${file}`);
          fs.unlinkSync(file);
        }
      }
    }
    inspect(bundledRoot);
  }
  return count;
}

// One-time preparation is deliberately explicit: rewrite only cross-folder
// pointers in authored files, and add the fallback for named skill dependencies.
export function prepareSkillSources(sourceRoot = root) {
  const catalog = JSON.parse(read(path.join(sourceRoot, "catalog.json")));
  for (const owner of Object.keys(catalog.skills)) {
    const skillRoot = path.join(sourceRoot, "skills", owner);
    for (const file of filesBelow(skillRoot)) {
      const relative = slash(path.relative(sourceRoot, file));
      let content = read(file).replace(fileReferences, reference => {
        if (reference.includes("bundled/")) return reference;
        const canonical = canonicalReference(relative, reference);
        if (!fs.existsSync(path.join(sourceRoot, canonical)) || canonical.startsWith(`skills/${owner}/`)) return reference;
        if (canonical.startsWith("../") || path.isAbsolute(canonical)) return reference;
        const target = path.join(skillRoot, "bundled", canonical.replace(/\/SKILL\.md$/, "/INSTRUCTIONS.md"));
        const result = slash(path.relative(path.dirname(file), target));
        return result.startsWith(".") ? result : `./${result}`;
      });
      if (relative === `skills/${owner}/SKILL.md`) {
        const preamble = "Resolve bundled relative file paths from this skill's directory, not the project working directory.";
        if (!content.includes(preamble)) {
          const end = content.indexOf("\n---", 4) + 4;
          content = content.slice(0, end) + `\n\n${preamble}\n` + content.slice(end);
        }
        if (catalog.skills[owner].dependencies?.length && !content.includes(fallback)) content += `\n${fallback}\n`;
      }
      if (content !== read(file)) fs.writeFileSync(file, content);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--prepare")) prepareSkillSources();
  const count = buildSkillBundles(root, { check: process.argv.includes("--check") });
  console.log(`${process.argv.includes("--check") ? "Verified" : "Generated"} ${count} bundled skill files.`);
}
