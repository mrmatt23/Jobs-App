import { createSeedState } from "./seed";
import type { Agent, JobState, Project, Task, WorkKind } from "./types";
import { WORK_KINDS } from "./types";

const STORAGE_KEY = "jobs-app-state-v3";

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadState(): JobState {
  try {
    if (typeof localStorage === "undefined") return createSeedState();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as JobState;
    if (!parsed.projects?.length || !parsed.agents || !parsed.tasks) {
      return createSeedState();
    }
    return {
      ...createSeedState(),
      ...parsed,
      speed: parsed.speed === 2 || parsed.speed === 4 ? parsed.speed : 1,
    };
  } catch {
    return createSeedState();
  }
}

export function saveState(state: JobState): void {
  if (typeof localStorage === "undefined") return;
  const persist: JobState = {
    ...state,
    activity: state.activity.slice(0, 40),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
}

export function resetState(): JobState {
  if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
  return createSeedState();
}

const AGENT_COLORS = [
  "#f0a202",
  "#3ecfb2",
  "#ff6b6b",
  "#5b9fd6",
  "#d38bd8",
  "#e07a3d",
  "#9ae66e",
  "#f4d35e",
];

export function addProject(
  state: JobState,
  input: { name: string; site: string; floors: number; notes?: string },
): JobState {
  const floors = Math.max(1, Math.min(20, Math.round(input.floors) || 4));
  const project: Project = {
    id: uid("proj"),
    name: input.name.trim() || "Untitled job",
    site: input.site.trim() || "TBD",
    floors,
    status: "planning",
    notes: input.notes?.trim() ?? "",
    source: "local",
  };
  const tasks: Task[] = [];
  for (let index = 0; index < floors; index += 1) {
    const floor = index + 1;
    if (floor === 1) {
      tasks.push({
        id: uid("task"),
        projectId: project.id,
        title: "Footings and slab",
        workKind: "foundation",
        floor,
        progress: 0,
        status: "queued",
        assigneeId: null,
      });
    }
    tasks.push({
      id: uid("task"),
      projectId: project.id,
      title: `Level ${floor} framing`,
      workKind: "framing",
      floor,
      progress: 0,
      status: "queued",
      assigneeId: null,
    });
    if (floor > 1) {
      tasks.push({
        id: uid("task"),
        projectId: project.id,
        title: `Level ${floor} rough-in`,
        workKind: "electrical",
        floor,
        progress: 0,
        status: "queued",
        assigneeId: null,
      });
    }
  }
  return {
    ...state,
    projects: [...state.projects, project],
    tasks: [...state.tasks, ...tasks],
    selectedProjectId: project.id,
  };
}

export function addAgent(
  state: JobState,
  input: { name: string; trade: WorkKind; projectId: string | null },
): JobState {
  const agent: Agent = {
    id: uid("ag"),
    name: input.name.trim() || "New tech",
    trade: WORK_KINDS.includes(input.trade) ? input.trade : "framing",
    color: AGENT_COLORS[state.agents.length % AGENT_COLORS.length],
    status: "idle",
    projectId: input.projectId,
    taskId: null,
    kind: "tech",
    model: null,
  };
  return { ...state, agents: [...state.agents, agent] };
}

export function addTask(
  state: JobState,
  input: {
    projectId: string;
    title: string;
    workKind: WorkKind;
    floor: number;
    assigneeId: string | null;
  },
): JobState {
  const project = state.projects.find((item) => item.id === input.projectId);
  const floor = Math.max(1, Math.min(project?.floors ?? 1, input.floor));
  const task: Task = {
    id: uid("task"),
    projectId: input.projectId,
    title: input.title.trim() || `${input.workKind} · L${floor}`,
    workKind: input.workKind,
    floor,
    progress: 0,
    status: input.assigneeId ? "in_progress" : "queued",
    assigneeId: input.assigneeId,
  };
  const agents = state.agents.map((agent) =>
    agent.id === input.assigneeId
      ? { ...agent, status: "working" as const, projectId: input.projectId, taskId: task.id }
      : agent,
  );
  return { ...state, tasks: [...state.tasks, task], agents };
}

export function setAgentBreak(state: JobState, agentId: string, onBreak: boolean): JobState {
  return {
    ...state,
    agents: state.agents.map((agent) =>
      agent.id === agentId
        ? { ...agent, status: onBreak ? "break" : agent.taskId ? "working" : "idle" }
        : agent,
    ),
  };
}

export function assignAgentToProject(
  state: JobState,
  agentId: string,
  projectId: string | null,
): JobState {
  return {
    ...state,
    agents: state.agents.map((agent) =>
      agent.id === agentId
        ? { ...agent, projectId, taskId: null, status: projectId ? "idle" : "idle" }
        : agent,
    ),
    tasks: state.tasks.map((task) =>
      task.assigneeId === agentId ? { ...task, assigneeId: null, status: task.status === "done" ? "done" : "queued" } : task,
    ),
  };
}

export function exportState(state: JobState): string {
  return JSON.stringify(state, null, 2);
}

export function importState(raw: string): JobState {
  const parsed = JSON.parse(raw) as JobState;
  if (!Array.isArray(parsed.projects) || !Array.isArray(parsed.agents)) {
    throw new Error("Not a Jobs file");
  }
  return parsed;
}
