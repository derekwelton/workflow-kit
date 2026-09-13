#!/usr/bin/env node
// Import an explicitly pinned local upstream checkout. Never fetch or update implicitly.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2];
const pin = "3cca18b368ae95cdbdebbff572ccafa662551015";
if (!source) throw new Error("Usage: node scripts/vendor-engineering.mjs <upstream-checkout> (overwrites the 17 imported skill folders)");
const upstream = path.resolve(source);
if (execFileSync("git", ["-C", upstream, "rev-parse", "HEAD"], { encoding: "utf8" }).trim() !== pin) throw new Error(`Expected upstream revision ${pin}`);
if (execFileSync("git", ["-C", upstream, "status", "--porcelain"], { encoding: "utf8" }).trim()) throw new Error("Upstream checkout must be clean");
const engineering = path.join(upstream, "skills/engineering");
const read = file => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const strip = text => text.replace(/^---\n[\s\S]*?\n---\n/, "");
const interview = strip(read(path.join(upstream, "skills/productivity/grilling/SKILL.md")))
  .replace("dispatch a sub-agent to find it", "look it up locally, or delegate a bounded independent lookup when useful and permitted");
for (const entry of fs.readdirSync(engineering, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === "ask-matt") continue;
  const name = entry.name === "setup-matt-pocock-skills" ? "setup-workflow-skills" : entry.name;
  const destination = path.join(root, "skills", name);
  // Only the named catalog folder is replaced; no caller-provided deletion target.
  if (!destination.startsWith(path.join(root, "skills") + path.sep)) throw new Error("Invalid destination");
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(path.join(engineering, entry.name), destination, { recursive: true });
  function adapt(directory) {
    for (const file of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, file.name);
      if (file.isDirectory()) adapt(full);
      else if (/\.(md|yaml)$/.test(file.name)) {
        let text = read(full).replaceAll("setup-matt-pocock-skills", "setup-workflow-skills")
          .replaceAll("Setup Matt Pocock's Skills", "Setup Workflow Skills");
        text = text.replace(/call the Skill tool twice, for "grilling" and "domain-modeling"/gi,
          "read the interview reference in `../grill-with-docs/references/interview.md` and use the installed domain-modeling skill");
        if (name === "grill-with-docs") text = text.replace("../grill-with-docs/references/interview.md", "references/interview.md");
        fs.writeFileSync(full, text);
      }
    }
  }
  adapt(destination);
}
fs.mkdirSync(path.join(root, "skills/grill-with-docs/references"), { recursive: true });
fs.writeFileSync(path.join(root, "skills/grill-with-docs/references/interview.md"), "# Interview rounds\n\n" + interview);
console.log(`Imported 17 engineering skills from ${pin}. Apply and review documented local adaptations before building.`);
