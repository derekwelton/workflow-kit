import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

// Exercise the selector agents are given, not a second test-only algorithm.
const skill = fs.readFileSync(new URL("../skills/linear-mode/SKILL.md", import.meta.url), "utf8");
const implementation = skill.match(/```javascript\r?\n(function selectSyncRoot[\s\S]+?)\r?\n```/)?.[1];
assert.ok(implementation, "The canonical skill must contain its reference selector");
const select = vm.runInNewContext(`${implementation}; selectSyncRoot`, { URL });
const target = "https://github.com/example/project/issues/353";
const root = (id = "sync-root", link = target) => ({
  id, parentId: null,
  body: `This comment thread is synced to a corresponding [GitHub issue](${link}). All replies are displayed in both locations.`
});

test("sync roots accept populated, null, and omitted authors", () => {
  for (const author of [undefined, null, { id: "integration", name: "GitHub" }]) {
    const comment = root();
    if (author !== undefined) comment.author = author;
    const selected = select([comment], target, true);
    assert.equal(selected.status, "found");
    assert.equal(selected.parentId, comment.id);
  }
});

test("discovery excludes replies, unrelated targets, and misleading text", () => {
  const misleading = [
    { ...root("reply"), parentId: "other-root" },
    { ...root("unknown-parent"), parentId: undefined },
    root("wrong-repo", "https://github.com/example/other/issues/353"),
    root("wrong-number", "https://github.com/example/project/issues/354"),
    root("wrong-host", "https://github.com.attacker.example/example/project/issues/353"),
    { ...root("quoted"), body: `Someone wrote: ${root().body}` },
    { ...root("generic"), body: `synced to a corresponding issue: ${target}` }
  ];
  assert.equal(select(misleading, target, true).status, "unverified");
  assert.equal(select([...misleading, root()], target, true).parentId, "sync-root");
});

test("complete pagination and a unique target are required before selecting a root", () => {
  const pageOne = [{ id: "ordinary", parentId: null, body: "Discussion" }];
  assert.equal(select(pageOne, target, false).status, "unverified");
  assert.equal(select([root()], target, false).parentId, null, "Later pages may contain another root");
  assert.equal(select([...pageOne, root()], target, true).parentId, "sync-root");
  assert.equal(select([root(), root("second")], target, true).status, "ambiguous");
  assert.equal(select([root(), root("second")], target, true).parentId, null);
  assert.equal(select([root(), root()], target, true).parentId, "sync-root", "Repeated pagination results share one ID");
  assert.equal(select([], target, true).status, "unverified");
  assert.equal(select([root()], undefined, true).status, "unverified");
  assert.equal(select([root()], "https://github.com/example/project/pull/353", true).status, "unverified");
});

test("GitHub issue identity tolerates harmless URL variants without accepting another repository", () => {
  assert.equal(select([root("root", `${target}/#issuecomment-123`)], "https://github.com/Example/Project/issues/353", true).parentId, "root");
  assert.equal(select([root()], "https://github.com/example/project/issues/3530", true).status, "unverified");
});

test("distributed instructions preserve the full discovery and no-double-post rules", () => {
  for (const relative of ["skills/linear-mode/SKILL.md", "skills/update-issue/SKILL.md", "templates/feature-lifecycle.md"]) {
    const source = fs.readFileSync(new URL(`../${relative}`, import.meta.url), "utf8");
    assert.match(source, /[Pp]age/);
    assert.match(source, /[Uu]nique/);
    assert.match(source, /[Ii]gnore.*author/s);
    assert.match(source, /GitHub delivery\s+unverified/);
    assert.match(source, /parentId: <selected root id>/);
    assert.match(source, /Never\*?\*? post the same comment to GitHub|\*\*Never\*\* post the same comment to GitHub/i);
    assert.doesNotMatch(source, /author[^\n]*is `null`|`author: null`|the issue is not synced/);
    const generated = fs.readFileSync(new URL(`../plugins/workflow-kit/${relative}`, import.meta.url), "utf8");
    if (relative === "skills/linear-mode/SKILL.md") {
      assert.equal(generated.match(/```javascript\r?\n(function selectSyncRoot[\s\S]+?)\r?\n```/)?.[1], implementation);
    }
  }
});
