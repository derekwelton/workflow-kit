import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { measureSkills } from "../scripts/measure-context.mjs";

const root = path.resolve(import.meta.dirname, "..");
const { budgets } = JSON.parse(fs.readFileSync(path.join(root, "test/context-budgets.json"), "utf8"));

test("every skill stays within its reachable instruction budget", () => {
  const skills = measureSkills(root);
  assert.deepEqual(Object.keys(budgets).sort(), skills.map(skill => skill.name), "budgets must list exactly the catalog skills");
  for (const skill of skills) {
    assert.ok(skill.reachableChars <= budgets[skill.name],
      `${skill.name} can load ${skill.reachableChars} characters (budget ${budgets[skill.name]}): ${skill.reachableFiles.join(", ")}. ` +
      "Load the new material conditionally, move it to the skill that needs it, or raise the budget deliberately.");
  }
});
