export function resolveTracker(config = {}) {
  const tracker = config.tracker ?? (config.linearTeam ? "linear" : "github");
  if (!["github", "github-projects", "linear"].includes(tracker)) throw new Error(`Unsupported tracker: ${tracker}`);
  if (config.linearTeam && tracker !== "linear") throw new Error("Conflicting tracker and linearTeam; reconcile configuration before writing.");
  if (tracker === "linear" && !config.linearTeam) throw new Error("Linear requires linearTeam.");
  if (tracker === "github-projects") {
    if (!config.githubProject?.owner || !Number.isSafeInteger(config.githubProject.number) || config.githubProject.number < 1) throw new Error("GitHub Projects requires githubProject.owner and positive number.");
    for (const key of ["todo", "inProgress", "inReview"]) {
      if (!config.githubProject.statuses?.[key]) throw new Error(`Missing GitHub Projects status mapping: ${key}`);
    }
  }
  return tracker;
}

export function trackerTransition(config, phase) {
  const tracker = resolveTracker(config);
  if (phase === "done") throw new Error("Agents do not set Done; human acceptance or configured merge automation owns completion.");
  if (tracker === "github") return { tracker, status: null, checkpoint: phase };
  if (tracker === "linear") return { tracker, status: { todo: "Todo", inProgress: "In Progress", codeReview: "Code Review", inReview: "In Review" }[phase] ?? null };
  const status = config.githubProject.statuses[phase] ?? null;
  // If a project has no AI review column, independent review remains manifest-only.
  if (!status && phase !== "codeReview") throw new Error(`Missing status mapping: ${phase}`);
  return { tracker, status, checkpoint: phase };
}
