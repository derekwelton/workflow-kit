import test from "node:test";
import assert from "node:assert/strict";
import { parseSelection } from "../scripts/select-skills.mjs";

test("picker resolves numbers, names, all and duplicate selections", () => {
  const names = ["grill-me", "handoff", "writing-for-agents"];
  assert.deepEqual(parseSelection("1, handoff 1", names), ["grill-me", "handoff"]);
  assert.deepEqual(parseSelection("all", names), names);
  for (const answer of ["", "0", "4", "missing"]) assert.throws(() => parseSelection(answer, names));
});
