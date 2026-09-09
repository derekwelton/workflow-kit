#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validatePackage } from "./validate-package.mjs";
import { resolveRouting } from "./lib/model-policy.mjs";
import { resolveTracker } from "./lib/tracker-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checks = [];
const command = (name, args) => {
  // Only fixed internal command names/flags are accepted; no user text crosses a shell.
  if (!["codex", "claude"].includes(name) || args.some((arg) => !/^[a-z-]+$/.test(arg))) throw new Error("Unsupported diagnostic command.");
  const result = process.platform === "win32"
    ? spawnSync("cmd.exe", ["/d", "/c", `${name} ${args.join(" ")}`], { encoding: "utf8", windowsHide: true, timeout: 15000 })
    : spawnSync(name, args, { encoding: "utf8", timeout: 15000 });
  return { available: result.status === 0, output: String(result.stdout ?? "").trim(), error: result.error?.message ?? null };
};
checks.push({ name: "source-package", ...validatePackage(root) });
const codex = command("codex", ["--version"]);
checks.push({ name: "codex-cli", ...codex });
checks.push({ name: "claude-cli", ...command("claude", ["--version"]) });
const native = command("codex", ["plugin", "--help"]);
checks.push({ name: "native-plugin-cli", available: native.available, error: native.error });
if (native.available) {
  const listing = command("codex", ["plugin", "list", "--json"]);
  try {
    const payload = JSON.parse(listing.output);
    const found = [];
    function inspect(value) {
      if (!value || typeof value !== "object") return;
      if (value.name === "workflow-kit") found.push({ name: value.name, version: value.version ?? null, installed: value.installed ?? null });
      for (const child of Object.values(value)) if (typeof child === "object") inspect(child);
    }
    inspect(payload);
    checks.push({ name: "native-workflow-kit", plugins: found, status: found.length ? "discovered" : "not-installed" });
  } catch { checks.push({ name: "native-workflow-kit", status: "unverified", error: listing.error ?? "Could not parse installed plugin inventory." }); }
}
const skillsDir = path.join(os.homedir(), ".agents", "skills");
checks.push({ name: "fallback-links", entries: ["orchestrate-queue", "implement", "code-review", "workflow-doctor", "model-routing"].map((name) => {
  const location = path.join(skillsDir, name);
  const entry = fs.lstatSync(location, { throwIfNoEntry: false });
  return { name, present: Boolean(entry), broken: Boolean(entry) && !fs.existsSync(location) };
}) });
// Optional sanitized capability fixture; never dump user settings or credentials.
const input = process.argv[2] ? JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), "utf8")) : null;
if (input) {
  try {
    checks.push({ name: "tracker-config", tracker: resolveTracker(input.lifecycle ?? {}) });
    for (const request of input.routes ?? []) checks.push({ name: "model-route", ...resolveRouting({ ...request, availableModels: input.availableModels }) });
  } catch (error) { checks.push({ name: "capability-config", error: error.message }); }
}
checks.push({ name: "runtime-access", status: "unverified", detail: "Public catalogs and CLI versions do not establish account model access or loaded session versions. Inspect the host catalog and installed plugin list; never launch billable work as a health probe." });
const nativeInstalled = checks.some((check) => check.name === "native-workflow-kit" && check.plugins?.length);
const linked = checks.find((check) => check.name === "fallback-links")?.entries ?? [];
const fallbackInstalled = linked.length > 0 && linked.every((entry) => entry.present && !entry.broken);
const degraded = checks.some((check) => check.valid === false || check.error)
  || (!nativeInstalled && !fallbackInstalled) || !input?.availableModels;
console.log(JSON.stringify({ status: degraded ? "degraded" : "healthy", checks }, null, 2));
if (degraded) process.exitCode = 1;
