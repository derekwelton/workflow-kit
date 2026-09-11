import fs from "node:fs";
import path from "node:path";
export const skillPathPreamble = "Resolve this skill's real filesystem path; package root is `../..` from its directory.";

// Contract owners only. Specialist tutorials and HTML assets are not prerequisites.
export const portableSources = [
  "templates/lifecycle-contract.md",
  "templates/tracker-write.md",
  "skills/model-routing/SKILL.md",
  "skills/linear-mode/SKILL.md",
  "skills/linear-mode/references/write.md",
  "skills/linear-mode/references/status.md",
  "skills/linear-mode/references/intake.md",
  "skills/github-projects/SKILL.md",
  "skills/board/SKILL.md",
  "skills/new-feature/SKILL.md",
  "skills/implement/SKILL.md",
  "skills/ponytail/SKILL.md",
  "skills/tdd/SKILL.md",
  "skills/code-review/SKILL.md",
  "skills/code-review/references/providers.md",
  "skills/code-review/references/standards.md",
  "skills/code-review/references/queue.md",
  "skills/code-review/references/workload.md",
  "skills/orchestrate/SKILL.md",
  "skills/orchestrate/references/workload-contract.md",
  "skills/orchestrate/references/worker-envelope.md",
  "skills/integrate-reviewed/SKILL.md",
  "skills/wrap-feature/SKILL.md",
  "skills/update-issue/SKILL.md",
  "skills/research/SKILL.md",
];

export function renderPortable(root) {
  const version = JSON.parse(fs.readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf8")).version;
  const contents = portableSources.map(source => {
    const text = fs.readFileSync(path.join(root, source), "utf8").replace(/\r\n/g, "\n").replace(/^---\n[\s\S]*?\n---\n/, "").replace(skillPathPreamble, "").trim();
    // References are source identities in this standalone document, not broken local links.
    return `## Source: ${source}\n\n${text.replace(/\[([^\]]+)\]\((?!https?:)[^)]+\)/g, "$1")}`;
  });
  return `<!-- workflow-kit:portable version=${version}; generated, do not edit -->\n\n# Portable feature lifecycle\n\nFor hosts without the plugin. Repository frontmatter and local overrides in\nfeature-lifecycle.md still apply. This is generated from canonical source owners.\nRead only the task's sections below; do not read the plugin copy as well.\nRelative paths below identify bundled source sections, not files to open here.\n\nUse available Git and tracker tools to follow these contracts manually. If an\noperation requires an unavailable helper/runtime (especially validated workload\nmanifest transitions or cross-provider review), report that capability blocker;\ndo not invent receipts or replace deterministic gates with a prose approval.\nInstall the package or resume on a capable host for that operation. Single-issue\nwork and read-only advice remain runnable with Git and the configured tracker.\nOptional specialist skills/templates require a capable host only when selected;\nordinary advice does not escalate to them.\n\nContents (search for Source: followed by the path):\n${portableSources.map(s => `- ${s}`).join("\n")}\n\n${contents.join("\n\n")}\n`;
}
