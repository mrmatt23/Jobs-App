import { describe, expect, it } from "vitest";
import { applyDeviceSnapshot, type DeviceSnapshot } from "./device";
import { AI_AGENT_IDS, applyGithubSnapshot, type GithubSnapshot } from "./github";
import { assembleLiveFeed } from "./live";
import { createSeedState } from "./seed";

const device: DeviceSnapshot = {
  hostname: "cursor",
  where: "cloud-agent",
  workspace: "/workspace",
  branch: "cursor/multiagent-tower-dashboard-14c4",
  fetchedAt: Date.parse("2026-08-29T16:00:00Z"),
  tasks: [
    {
      id: "cloud-agent",
      name: "Cloud agent",
      detail: "This Cursor cloud run",
      status: "running",
      workKind: "code",
      kind: "ai",
      model: "cursor-grok-4.6-high",
      floor: 1,
    },
    {
      id: "vite",
      name: "Vite",
      detail: "Jobs dashboard on :5173",
      status: "running",
      workKind: "code",
      kind: "tech",
      model: null,
      floor: 2,
    },
  ],
};

const github: GithubSnapshot = {
  fetchedAt: Date.parse("2026-08-29T16:01:00Z"),
  commits: [
    {
      sha: "abc1234",
      html_url: "https://github.com/mrmatt23/Jobs-App/commit/abc1234",
      commit: {
        message: "Add isometric office floor with 8-bit animal bots",
        author: { name: "Cursor Agent", date: "2026-08-29T16:28:00Z" },
      },
      author: { login: "cursoragent" },
    },
  ],
  pulls: [
    {
      number: 1,
      title: "Crew dashboard with tower and office floor",
      html_url: "https://github.com/mrmatt23/Jobs-App/pull/1",
      state: "open",
      user: { login: "cursoragent" },
      created_at: "2026-08-29T01:00:00Z",
      updated_at: "2026-08-29T16:28:00Z",
    },
  ],
};

function feed() {
  let state = applyDeviceSnapshot(createSeedState(), device);
  state = applyGithubSnapshot(state, github);
  return assembleLiveFeed(state, github.pulls, Date.parse("2026-08-29T16:30:00Z"));
}

describe("Pulse live feed", () => {
  it("only includes Jobs-App and this-device rows, not placeholder jobsite crew", () => {
    const names = feed().agents.map((agent) => agent.name);
    expect(names).toContain("Grok 4.6");
    expect(names).toContain("Vite");
    expect(names).not.toContain("Maya Chen");
    expect(names).not.toContain("Priya Nair");
    expect(names).not.toContain("Cloud agent");
  });

  it("keeps every bot at their own desk (no invented visits)", () => {
    for (const agent of feed().agents) {
      expect(agent.office).toBe(agent.name);
    }
  });

  it("does not emit invented percentages", () => {
    const blob = JSON.stringify(feed());
    expect(blob).not.toMatch(/\d+%/);
    expect(feed().agents.some((agent) => "progress" in agent)).toBe(false);
  });

  it("marks Grok working from the live cloud agent and uses that process line", () => {
    const grok = feed().agents.find((agent) => agent.id === AI_AGENT_IDS.grok);
    expect(grok?.status).toBe("working");
    expect(grok?.current).toBe("This Cursor cloud run");
    expect(grok?.project).toBe("Jobs-App");
    expect(grok?.last_action).toMatch(/office floor|Pushed|code/i);
  });

  it("records open PRs as handoffs, not cubicle walks", () => {
    expect(feed().handoffs).toEqual([
      {
        from: "Grok 4.6",
        to: "Matt",
        what: "PR #1 open: Crew dashboard with tower and office floor",
        at: "2026-08-29T16:28:00Z",
      },
    ]);
  });

  it("treats a Matt-owned PR with Grok commits as a Grok → Matt handoff", () => {
    let state = applyDeviceSnapshot(createSeedState(), device);
    const mattPr = {
      ...github,
      pulls: [{ ...github.pulls[0]!, user: { login: "mrmatt23" } }],
    };
    state = applyGithubSnapshot(state, mattPr);
    const live = assembleLiveFeed(state, mattPr.pulls, Date.parse("2026-08-29T16:30:00Z"));
    expect(live.handoffs).toEqual([
      {
        from: "Grok 4.6",
        to: "Matt",
        what: "PR #1 open: Crew dashboard with tower and office floor",
        at: "2026-08-29T16:28:00Z",
      },
    ]);
  });

  it("leaves idle Jobs-App bots idle at their desk", () => {
    const claude = feed().agents.find((agent) => agent.id === AI_AGENT_IDS.claude);
    expect(claude?.status).toBe("idle");
    expect(claude?.office).toBe("Claude");
    expect(claude?.current).toBe("Idle");
  });
});
