import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { refreshDocument, refreshLifecycle } from "../scripts/refresh-lifecycle.mjs";
import { renderPortable } from "../scripts/lib/portable-contract.mjs";

const root = path.resolve(import.meta.dirname, "..");
const old = "<!-- workflow-kit:managed-start version=0.9.2 -->\nold rules\n<!-- workflow-kit:managed-end -->";
const template = fs.readFileSync(path.join(root, "templates/feature-lifecycle.md"), "utf8");

test("refresh preserves exact custom tracker configuration and local verification overrides", () => {
  const prefix = "---\r\ntracker: github-projects\r\ngithubProject:\r\n  statuses: {inReview: Owner Review}\r\n---\r\n\r\nOwner preface\r\n";
  const suffix = "\r\n## Local overrides\r\nNever run whole-solution tests.\r\n";
  const refreshed = refreshDocument(prefix + old.replaceAll("\n", "\r\n") + suffix, template);
  assert.ok(refreshed.startsWith(prefix));
  assert.ok(refreshed.endsWith(suffix));
  assert.ok(!/(?<!\r)\n/.test(refreshed));
  assert.equal(refreshDocument(refreshed, template), refreshed);
  assert.throws(() => refreshDocument(old + old, template), /one managed block/);
  const start = "<!-- workflow-kit:managed-start version=0.9.2 -->";
  const end = "<!-- workflow-kit:managed-end -->";
  for (const ambiguous of [start + "owner text" + old, old + end, end + start, start + "unfinished"]) {
    assert.throws(() => refreshDocument(ambiguous, template), /one managed block/);
    assert.throws(() => refreshDocument(old, ambiguous), /one managed block/);
  }
  assert.throws(() => refreshDocument(old.replace("0.9.2", "99.0.0"), template), /newer/);
  assert.throws(() => refreshDocument("unmarked local contract", template), /one managed block/);
});

test("refresh rejects a dangling portable symlink without creating its destination", t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-consumer-link-"));
  try {
    const lifecycle = path.join(dir, "feature-lifecycle.md");
    const external = path.join(dir, "unrelated-missing.md");
    fs.writeFileSync(lifecycle, old);
    try { fs.symlinkSync(external, path.join(dir, "feature-lifecycle-portable.md"), "file"); }
    catch (error) { if (["EPERM", "EACCES", "ENOSYS"].includes(error.code)) { t.skip("Host cannot create file symlinks"); return; } throw error; }
    assert.throws(() => refreshLifecycle({ lifecycle }), /not a generated regular file/);
    assert.equal(fs.existsSync(external), false);
    assert.equal(fs.readFileSync(lifecycle, "utf8"), old);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("check makes no files and apply refreshes both router and portable fallback in an isolated consumer", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-consumer-"));
  try {
    const lifecycle = path.join(dir, "feature-lifecycle.md");
    fs.writeFileSync(lifecycle, "---\nlinearTeam: TEST\n---\n" + old + "\nOwner rules\n");
    const original = fs.readFileSync(lifecycle, "utf8");
    assert.equal(refreshLifecycle({ lifecycle, check: true }).changed.length, 2);
    assert.equal(fs.readFileSync(lifecycle, "utf8"), original);
    assert.deepEqual(fs.readdirSync(dir), ["feature-lifecycle.md"]);
    assert.equal(refreshLifecycle({ lifecycle }).changed.length, 2);
    assert.equal(refreshLifecycle({ lifecycle, check: true }).changed.length, 0);
    const fallback = path.join(dir, "feature-lifecycle-portable.md");
    assert.equal(fs.readFileSync(fallback, "utf8"), renderPortable(root));
    fs.writeFileSync(fallback, "owner-authored document");
    assert.throws(() => refreshLifecycle({ lifecycle }), /not a generated/);
    assert.equal(fs.readFileSync(fallback, "utf8"), "owner-authored document");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
