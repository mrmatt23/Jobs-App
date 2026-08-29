import type { ActivityEvent, Agent, JobState, Task, WorkKind } from "./types";
import { clamp } from "./lib/progress";

export const GITHUB_REPO = "mrmatt23/Jobs-App";
export const GITHUB_PROJECT_ID = "proj-jobs-app";

export const AI_AGENT_IDS = {
  grok: "ag-ai-grok",
  claude: "ag-ai-claude",
  grokbot: "ag-ai-grokbot",
  matt: "ag-ai-matt",
} as const;

export interface GithubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  author: { login: string } | null;
}

export interface GithubPull {
  number: number;
  title: string;
  html_url: string;
  state: string;
  user: { login: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface GithubSnapshot {
  commits: GithubCommit[];
  pulls: GithubPull[];
  fetchedAt: number;
}

export function inferWorkKind(message: string): WorkKind {
  const text = message.toLowerCase();
  if (/test/.test(text)) return "test";
  if (/\breview\b|\bclick\b/.test(text)) return "review";
  if (/\bfix\b|\bbug\b|\bdebug\b/.test(text)) return "debug";
  if (/\breadme\b|\bcopy\b|\bdesign\b/.test(text)) return "design";
  if (/\bresearch\b|\bomarchy\b|\bcompat/.test(text)) return "research";
  return "code";
}

export function inferFloor(message: string, floors: number): number {
  const text = message.toLowerCase();
  if (text.includes("initial")) return 1;
  if (/test/.test(text)) return Math.min(5, floors);
  if (/\bgithub\b|\bsync\b|\blive\b/.test(text)) return floors;
  if (/\brender|scene|canvas|tower|click\b/.test(text)) return Math.min(3, floors);
  if (/\bcrew|roster|ui|copy|dashboard\b/.test(text)) return Math.min(4, floors);
  if (/\btrade|floor|job\b/.test(text)) return Math.min(2, floors);
  return Math.min(2, floors);
}

export function resolveCommitAgent(commit: GithubCommit): string {
  const login = commit.author?.login?.toLowerCase() ?? "";
  const name = commit.commit.author.name.toLowerCase();
  const blob = `${login} ${name}`;
  if (blob.includes("cursoragent") || blob.includes("cursor agent") || blob.includes("grok")) {
    return AI_AGENT_IDS.grok;
  }
  if (blob.includes("claude")) return AI_AGENT_IDS.claude;
  if (blob.includes("grokbot")) return AI_AGENT_IDS.grokbot;
  if (blob.includes("mrmatt") || blob.includes("matt")) return AI_AGENT_IDS.matt;
  return AI_AGENT_IDS.grok;
}

export function commitsToActivity(
  commits: GithubCommit[],
  projectId: string,
): ActivityEvent[] {
  return commits.map((commit) => {
    const headline = commit.commit.message.split("\n")[0] ?? "commit";
    const kind = inferWorkKind(headline);
    return {
      id: `gh-${commit.sha}`,
      at: Date.parse(commit.commit.author.date) || Date.now(),
      agentId: resolveCommitAgent(commit),
      projectId,
      text: `${kind === "code" ? "Pushed" : kind} · ${headline}`,
      source: "github" as const,
      url: commit.html_url,
    };
  });
}

export function pullsToActivity(pulls: GithubPull[], projectId: string): ActivityEvent[] {
  return pulls.map((pull) => ({
    id: `gh-pr-${pull.number}`,
    at: Date.parse(pull.updated_at || pull.created_at || "") || Date.now(),
    agentId: pull.user?.login?.toLowerCase().includes("matt")
      ? AI_AGENT_IDS.matt
      : AI_AGENT_IDS.grok,
    projectId,
    text: `PR #${pull.number} ${pull.state}: ${pull.title}`,
    source: "github" as const,
    url: pull.html_url,
  }));
}

export function taskProgressFromCommits(
  tasks: Task[],
  commits: GithubCommit[],
  floors: number,
): Task[] {
  const perFloor = new Map<number, number>();
  for (const commit of commits) {
    const floor = inferFloor(commit.commit.message, floors);
    perFloor.set(floor, (perFloor.get(floor) ?? 0) + 28);
  }
  if (commits.length > 0) perFloor.set(1, 100);
  return tasks.map((task) => {
    if (task.projectId !== GITHUB_PROJECT_ID) return task;
    const raw = perFloor.get(task.floor) ?? (task.floor === 1 && commits.length ? 100 : task.progress);
    const progress = clamp(raw, 0, 100);
    return {
      ...task,
      progress,
      status: progress >= 100 ? "done" : progress > 0 ? "in_progress" : "queued",
    };
  });
}

export function applyGithubSnapshot(state: JobState, snapshot: GithubSnapshot): JobState {
  const project = state.projects.find((item) => item.id === GITHUB_PROJECT_ID);
  if (!project) return state;

  const incoming = [
    ...pullsToActivity(snapshot.pulls, project.id),
    ...commitsToActivity(snapshot.commits, project.id),
  ];
  const have = new Set(state.activity.map((event) => event.id));
  const fresh = incoming.filter((event) => !have.has(event.id));
  const activity = [...fresh, ...state.activity].slice(0, 50);

  const latest = snapshot.commits[0];
  const latestAt = latest ? Date.parse(latest.commit.author.date) : 0;
  const grokHot = Boolean(latest) && Date.now() - latestAt < 6 * 60 * 60 * 1000;

  const agents: Agent[] = state.agents.map((agent) => {
    if (agent.id === AI_AGENT_IDS.grok) {
      return {
        ...agent,
        status: grokHot ? "working" : "idle",
        projectId: GITHUB_PROJECT_ID,
      };
    }
    if (agent.id === AI_AGENT_IDS.claude || agent.id === AI_AGENT_IDS.grokbot) {
      return { ...agent, projectId: GITHUB_PROJECT_ID };
    }
    return agent;
  });

  return {
    ...state,
    agents,
    tasks: taskProgressFromCommits(state.tasks, snapshot.commits, project.floors),
    activity,
  };
}

export async function fetchGithubSnapshot(): Promise<GithubSnapshot> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const commitUrls = [
    `https://api.github.com/repos/${GITHUB_REPO}/commits?sha=cursor/multiagent-tower-dashboard-14c4&per_page=20`,
    `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=20`,
  ];
  let commits: GithubCommit[] = [];
  let commitOk = false;
  for (const url of commitUrls) {
    const commitRes = await fetch(url, { headers });
    if (commitRes.ok) {
      commits = (await commitRes.json()) as GithubCommit[];
      commitOk = true;
      break;
    }
  }
  const pullRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/pulls?state=open&per_page=5`,
    { headers },
  );
  const pulls = pullRes.ok ? ((await pullRes.json()) as GithubPull[]) : [];
  if (!commitOk && !pullRes.ok) {
    throw new Error("GitHub unreachable");
  }
  return { commits, pulls, fetchedAt: Date.now() };
}
