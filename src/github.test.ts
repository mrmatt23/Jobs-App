import { describe, expect, it } from "vitest";
import {
  AI_AGENT_IDS,
  commitsToActivity,
  inferFloor,
  inferWorkKind,
  resolveCommitAgent,
  type GithubCommit,
} from "./github";

function commit(partial: {
  sha: string;
  message: string;
  login?: string;
  name?: string;
}): GithubCommit {
  return {
    sha: partial.sha,
    html_url: `https://github.com/mrmatt23/Jobs-App/commit/${partial.sha}`,
    commit: {
      message: partial.message,
      author: { name: partial.name ?? "Cursor Agent", date: "2026-08-29T01:00:00Z" },
    },
    author: { login: partial.login ?? "cursoragent" },
  };
}

describe("github mapping", () => {
  it("maps Cursor Agent commits to Grok 4.6", () => {
    expect(resolveCommitAgent(commit({ sha: "abc", message: "Add dashboard" }))).toBe(
      AI_AGENT_IDS.grok,
    );
  });

  it("maps Matt commits to the human owner", () => {
    expect(
      resolveCommitAgent(
        commit({ sha: "def", message: "Initial commit", login: "mrmatt23", name: "mrmatt23" }),
      ),
    ).toBe(AI_AGENT_IDS.matt);
  });

  it("infers work kind and floor from the commit message", () => {
    expect(inferWorkKind("Add tests for simulation")).toBe("test");
    expect(inferWorkKind("Clarify framing copy")).toBe("design");
    expect(inferFloor("Initial commit", 6)).toBe(1);
    expect(inferFloor("Add live GitHub sync", 6)).toBe(6);
  });

  it("turns commits into activity lines", () => {
    const events = commitsToActivity(
      [commit({ sha: "aaa1111", message: "Add crew dashboard with animated project tower" })],
      "proj-jobs-app",
    );
    expect(events[0]?.source).toBe("github");
    expect(events[0]?.text).toMatch(/crew dashboard/i);
    expect(events[0]?.agentId).toBe(AI_AGENT_IDS.grok);
  });
});
