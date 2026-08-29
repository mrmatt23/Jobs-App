import type { ActivityEvent, Agent, AgentKind, JobState, Project, Task, WorkKind } from "./types";

export const DEVICE_PROJECT_ID = "proj-this-device";

export interface DeviceTask {
  id: string;
  name: string;
  detail: string;
  status: "running" | "idle";
  workKind: WorkKind;
  kind: AgentKind;
  model: string | null;
  floor: number;
}

export interface DeviceSnapshot {
  hostname: string;
  where: "cloud-agent" | "local";
  workspace: string;
  branch: string;
  fetchedAt: number;
  tasks: DeviceTask[];
}

const COLORS = ["#3ecfb2", "#f0a202", "#5b9fd6", "#ff6b6b", "#d38bd8", "#9ae66e", "#f4d35e"];

export function classifyProcess(comm: string, args: string): DeviceTask | null {
  const line = `${comm} ${args}`;
  const lower = line.toLowerCase();
  if (
    /chrome|xfce|dbus|tigervnc|plank|thunar|bamf|websockify|xfwm|xfdesktop|xfsettings|crashpad|zygote|gpu-process|type=renderer|type=utility/.test(
      lower,
    )
  ) {
    return null;
  }
  if (/ps -eo|scanDevice|head -|dump_bash_state/.test(lower)) return null;

  if (/exec-daemon|cursor-agent-store|bc_id=|self-store-id bc-/.test(lower)) {
    return {
      id: "cloud-agent",
      name: "Cloud agent",
      detail: "This Cursor cloud run",
      status: "running",
      workKind: "code",
      kind: "ai",
      model: "cursor-grok-4.6-high",
      floor: 1,
    };
  }
  if (/server-main\.js/.test(lower) && /cursor-server/.test(lower)) {
    return {
      id: "cursor-runtime",
      name: "Cursor",
      detail: "Editor / agent runtime on this device",
      status: "running",
      workKind: "code",
      kind: "ai",
      model: "Cursor",
      floor: 1,
    };
  }
  if (/\bvite\b/.test(lower) && !/extensionhost|filewatcher|bootstrap-fork/.test(lower)) {
    return {
      id: "vite",
      name: "Vite",
      detail: "Jobs dashboard on :5173",
      status: "running",
      workKind: "code",
      kind: "tech",
      model: null,
      floor: 2,
    };
  }
  if (/vitest|npm test/.test(lower)) {
    return {
      id: "tests",
      name: "Tests",
      detail: args.slice(0, 80),
      status: "running",
      workKind: "test",
      kind: "tech",
      model: null,
      floor: 5,
    };
  }
  if (/\btsc\b/.test(lower) && /--noemit|tsc /.test(lower)) {
    return {
      id: "typecheck",
      name: "Typecheck",
      detail: "tsc",
      status: "running",
      workKind: "code",
      kind: "tech",
      model: null,
      floor: 4,
    };
  }
  return null;
}

export function classifyTerminalCommand(command: string, running: boolean): DeviceTask | null {
  const lower = command.toLowerCase();
  if (!command.trim()) return null;
  const fromProc = classifyProcess("shell", command);
  if (fromProc) return { ...fromProc, status: running ? "running" : "idle" };
  if (/npm run|node |python|cargo |go run|make /.test(lower)) {
    return {
      id: `sh-${hash(command)}`,
      name: shortCommand(command),
      detail: command.slice(0, 100),
      status: running ? "running" : "idle",
      workKind: /test/.test(lower) ? "test" : "code",
      kind: "tech",
      model: null,
      floor: 4,
    };
  }
  return null;
}

export function ensureDeviceProject(state: JobState, snapshot: DeviceSnapshot): Project {
  const existing = state.projects.find((item) => item.id === DEVICE_PROJECT_ID);
  const site = `${snapshot.hostname} · ${snapshot.branch || "no branch"}`;
  if (existing) {
    return { ...existing, site, notes: `Live processes on ${snapshot.where}.`, source: "device" };
  }
  return {
    id: DEVICE_PROJECT_ID,
    name: "This device",
    site,
    floors: 6,
    status: "active",
    notes: "Whatever is running on the machine serving this dashboard.",
    source: "device",
  };
}

export function applyDeviceSnapshot(state: JobState, snapshot: DeviceSnapshot): JobState {
  const project = ensureDeviceProject(state, snapshot);
  const projects = [
    project,
    ...state.projects.filter((item) => item.id !== DEVICE_PROJECT_ID),
  ];

  const deviceAgents: Agent[] = snapshot.tasks.map((task, index) => ({
    id: `ag-dev-${task.id}`,
    name: task.name,
    trade: task.workKind,
    color: COLORS[index % COLORS.length],
    status: task.status === "running" ? "working" : "idle",
    projectId: DEVICE_PROJECT_ID,
    taskId: `task-dev-${task.id}`,
    kind: task.kind,
    model: task.model,
  }));

  const deviceTasks: Task[] = snapshot.tasks.map((task) => ({
    id: `task-dev-${task.id}`,
    projectId: DEVICE_PROJECT_ID,
    title: task.detail,
    workKind: task.workKind,
    floor: Math.min(6, Math.max(1, task.floor)),
    progress: task.status === "running" ? 62 : 8,
    status: task.status === "running" ? "in_progress" : "queued",
    assigneeId: `ag-dev-${task.id}`,
  }));

  if (deviceTasks.length === 0) {
    deviceTasks.push({
      id: "task-dev-idle",
      projectId: DEVICE_PROJECT_ID,
      title: "Nothing extra running",
      workKind: "code",
      floor: 1,
      progress: 0,
      status: "queued",
      assigneeId: null,
    });
  }

  const previous = new Map(state.agents.filter((agent) => agent.id.startsWith("ag-dev-")).map((agent) => [agent.id, agent]));
  const activity: ActivityEvent[] = [...state.activity];
  for (const agent of deviceAgents) {
    const before = previous.get(agent.id);
    if (agent.status === "working" && before?.status !== "working") {
      const task = snapshot.tasks.find((item) => `ag-dev-${item.id}` === agent.id);
      activity.unshift({
        id: `dev-${agent.id}-${snapshot.fetchedAt}`,
        at: snapshot.fetchedAt,
        agentId: agent.id,
        projectId: DEVICE_PROJECT_ID,
        text: `${agent.name} running here — ${task?.detail ?? agent.trade}`,
        source: "device",
      });
    }
  }
  if (activity.length > 50) activity.length = 50;

  return {
    ...state,
    projects,
    agents: [
      ...deviceAgents,
      ...state.agents.filter((agent) => !agent.id.startsWith("ag-dev-")),
    ],
    tasks: [
      ...deviceTasks,
      ...state.tasks.filter((task) => task.projectId !== DEVICE_PROJECT_ID),
    ],
    activity,
    selectedProjectId: state.selectedProjectId || DEVICE_PROJECT_ID,
  };
}

export async function fetchDeviceSnapshot(): Promise<DeviceSnapshot> {
  const response = await fetch("/api/device-tasks");
  if (!response.ok) throw new Error(`device ${response.status}`);
  return (await response.json()) as DeviceSnapshot;
}

function shortCommand(command: string): string {
  const trimmed = command.trim().replace(/^["']|["']$/g, "");
  const parts = trimmed.split(/\s+/);
  return parts.slice(0, 3).join(" ").slice(0, 28);
}

function hash(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36).slice(0, 6);
}
