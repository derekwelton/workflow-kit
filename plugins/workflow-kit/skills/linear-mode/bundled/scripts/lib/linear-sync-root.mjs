export function selectSyncRoot(comments, expectedGitHubIssue, commentsComplete) {
  const issueKey = (value) => {
    try {
      const url = new URL(value);
      if (url.origin !== "https://github.com" || url.username || url.password) return null;
      const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/issues\/([1-9]\d*)\/?$/);
      return match ? `${match[1]}/${match[2]}/${match[3]}`.toLowerCase() : null;
    } catch { return null; }
  };
  const expected = issueKey(expectedGitHubIssue);
  if (commentsComplete !== true || !Array.isArray(comments) || !expected) {
    return { status: "unverified", parentId: null };
  }
  const roots = new Set();
  for (const comment of comments) {
    if (comment?.parentId !== null || typeof comment.id !== "string" || !comment.id.trim()) continue;
    const match = typeof comment.body === "string" && comment.body.match(
      /^\s*This comment thread is synced to a corresponding\s+\[GitHub issue\]\((https:\/\/github\.com\/[^\s)]+)\)\.\s+All replies are displayed in both locations\./i
    );
    if (match && issueKey(match[1]) === expected) roots.add(comment.id);
  }
  if (roots.size !== 1) return { status: roots.size ? "ambiguous" : "unverified", parentId: null };
  return { status: "found", parentId: [...roots][0] };
}
