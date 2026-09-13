import fs from "node:fs";
import path from "node:path";
export const skillPathPreamble = "Resolve bundled relative file paths from this skill's directory, not the project working directory.";
// Compatibility output for explicit legacy refresh only. Never concatenate skills.
export const portableSources = [];
export function renderPortable(root) {
  const version = JSON.parse(fs.readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf8")).version;
  return `<!-- workflow-kit:portable version=${version}; generated, do not edit -->\n\n# Project-local workflow skills\n\nThe full lifecycle fallback is retired. Keep repository tracker configuration\nand local overrides in their existing owner. Install the selected project-local\nskills, then invoke setup-workflow-skills only if configuration is needed.\nRead only the invoked skill and its relevant references; do not load the catalog.\nExisting review/status/acceptance rules remain in force during migration.\nMissing orchestration helpers are a capability blocker, not permission to skip gates.\n`;
}
