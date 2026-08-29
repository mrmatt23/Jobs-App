import { DEVICE_PROJECT_ID } from "./device";
import {
  AI_AGENT_IDS,
  GITHUB_PROJECT_ID,
  applyGithubSnapshot,
  type GithubPull,
  type GithubSnapshot,
} from "./github";
import { createSeedState } from "./seed";
import type { ActivityEvent, Agent, JobState } from "./types";
import { WORK_KIND_META } from "./types";

const CLOUD_AGENT_ID = "ag-dev-cloud-agent";

export type PulseStatus = "working" | "idle" | "blocked";

export interface PulseAgent {
  id: string;
  name: string;
  role: string;
  project: string;
  status: PulseStatus;
  office: string;
  current: string;
  last_action: string;
  last_at: string;
}

export interface PulseHandoff {
  from: string;
  to: string;
  what: string;
  at: string;
}

export interface PulseFeed {
  updated: string;
  agents: PulseAgent[];
  handoffs: PulseHandoff[];
}

function iso(at: number): string {
  return new Date(at).toISOString();
}

function pulseStatus(status: Agent["status"]): PulseStatus {
  if (status === "working") return "working";
  if (status === "blocked") return "blocked";
  return "idle";
}

function isRealEvent(event: ActivityEvent): boolean {
  return event.source === "github" || event.source === "device";
}

function latestRealEvent(state: JobState, agentId: string): ActivityEvent | undefined {
  return state.activity
    .filter((event) => event.agentId === agentId && isRealEvent(event))
    .sort((a, b) => b.at - a.at)[0];
}

function oneLine(text: string): string {
  return text.split("\n")[0]?.trim() ?? "";
}

function liveProjectIds(): Set<string> {
  return new Set([GITHUB_PROJECT_ID, DEVICE_PROJECT_ID]);
}

function includeAgent(agent: Agent): boolean {
  if (agent.id === CLOUD_AGENT_ID) return false;
  return liveProjectIds().has(agent.projectId ?? "");
}

function pullAuthorName(pull: GithubPull): string {
  const login = pull.user?.login?.toLowerCase() ?? "";
  if (login.includes("cursoragent") || login.includes("grok")) return "Grok 4.6";
  if (login.includes("claude")) return "Claude";
  if (login.includes("grokbot")) return "GrokBot";
  if (login.includes("mrmatt") || login.includes("matt")) return "Matt";
  return pull.user?.login ?? "unknown";
}

function pullHandoff(
  pull: GithubPull,
  grokHasCommits: boolean,
): { from: string; to: string } | null {
  const author = pullAuthorName(pull);
  if (author === "Matt" && grokHasCommits) return { from: "Grok 4.6", to: "Matt" };
  if (author === "Matt") return null;
  return { from: author, to: "Matt" };
}

export function assembleLiveFeed(
  state: JobState,
  pulls: GithubPull[] = [],
  now = Date.now(),
): PulseFeed {
  const updated = iso(now);
  const cloud = state.agents.find((agent) => agent.id === CLOUD_AGENT_ID);
  const cloudTask = state.tasks.find((task) => task.id === cloud?.taskId);

  const agents: PulseAgent[] = state.agents.filter(includeAgent).map((agent) => {
    const project = state.projects.find((item) => item.id === agent.projectId);
    let status = pulseStatus(agent.status);
    const event = latestRealEvent(state, agent.id);
    const ownEvent =
      agent.id === AI_AGENT_IDS.grok && !event
        ? latestRealEvent(state, CLOUD_AGENT_ID)
        : event;

    if (agent.id === AI_AGENT_IDS.grok && cloud?.status === "working") {
      status = "working";
    }

    let current = "Idle";
    if (status === "working") {
      if (agent.id === AI_AGENT_IDS.grok && cloudTask?.title) {
        current = oneLine(cloudTask.title);
      } else if (ownEvent) {
        current = oneLine(ownEvent.text);
      } else {
        const task = state.tasks.find((item) => item.id === agent.taskId);
        current = task?.title ? oneLine(task.title) : oneLine(agent.trade);
      }
    }

    return {
      id: agent.id,
      name: agent.name,
      role: agent.model ? `${WORK_KIND_META[agent.trade].label} · ${agent.model}` : WORK_KIND_META[agent.trade].label,
      project: project?.name ?? "",
      status,
      office: agent.name,
      current,
      last_action: ownEvent ? oneLine(ownEvent.text) : "",
      last_at: ownEvent ? iso(ownEvent.at) : "",
    };
  });

  const grokHasCommits = state.activity.some(
    (event) =>
      event.agentId === AI_AGENT_IDS.grok &&
      event.source === "github" &&
      event.id.startsWith("gh-") &&
      !event.id.startsWith("gh-pr-"),
  );

  const handoffs: PulseHandoff[] = [];
  for (const pull of pulls) {
    const ends = pullHandoff(pull, grokHasCommits);
    if (!ends) continue;
    handoffs.push({
      from: ends.from,
      to: ends.to,
      what: oneLine(`PR #${pull.number} ${pull.state}: ${pull.title}`),
      at: pull.updated_at || pull.created_at || updated,
    });
  }

  return { updated, agents, handoffs };
}

/** GitHub-backed Pulse document. No device processes, no jobsite placeholders. */
export function buildGithubLiveFeed(snapshot: GithubSnapshot, now = Date.now()): PulseFeed {
  const state = applyGithubSnapshot(createSeedState(), snapshot);
  const feed = assembleLiveFeed(state, snapshot.pulls, now);
  return {
    ...feed,
    agents: feed.agents.filter((agent) => agent.project === "Jobs-App"),
  };
}

export function liveFeedSignature(feed: PulseFeed): string {
  return JSON.stringify({ agents: feed.agents, handoffs: feed.handoffs });
}
