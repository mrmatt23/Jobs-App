import type { Agent, JobState, Project, Task } from "./types";
import { GITHUB_PROJECT_ID, GITHUB_REPO, AI_AGENT_IDS } from "./github";

function id(prefix: string, n: number): string {
  return `${prefix}-${n}`;
}

const colors = [
  "#f0a202",
  "#3ecfb2",
  "#ff6b6b",
  "#5b9fd6",
  "#d38bd8",
  "#e07a3d",
  "#9ae66e",
  "#f4d35e",
];

export function createSeedState(): JobState {
  const harbor: Project = {
    id: "proj-harbor",
    name: "Harborview Tower",
    site: "12 Pier St",
    floors: 10,
    status: "active",
    notes: "Core and shell. Crew is working the mid floors tonight.",
  };
  const clinic: Project = {
    id: "proj-clinic",
    name: "Oakridge Clinic",
    site: "88 Maple Ave",
    floors: 4,
    status: "active",
    notes: "Tenant improvement. Keep the occupied first floor clear.",
  };

  const jobsApp: Project = {
    id: GITHUB_PROJECT_ID,
    name: "Jobs-App",
    site: `github.com/${GITHUB_REPO}`,
    floors: 6,
    status: "active",
    notes: "This repo. AI crew plus GitHub commits drive the tower.",
    source: "github",
  };

  const tech = (
    agent: Omit<Agent, "kind" | "model">,
  ): Agent => ({ ...agent, kind: "tech", model: null });

  const agents: Agent[] = [
    tech({ id: id("ag", 1), name: "Maya Chen", trade: "framing", color: colors[0], status: "working", projectId: harbor.id, taskId: "task-h-5-frame" }),
    tech({ id: id("ag", 2), name: "Dez Alvarez", trade: "electrical", color: colors[1], status: "working", projectId: harbor.id, taskId: "task-h-4-elec" }),
    tech({ id: id("ag", 3), name: "Sam Okonkwo", trade: "plumbing", color: colors[2], status: "working", projectId: harbor.id, taskId: "task-h-4-plumb" }),
    tech({ id: id("ag", 4), name: "Jules Park", trade: "finishing", color: colors[3], status: "working", projectId: harbor.id, taskId: "task-h-3-finish" }),
    tech({ id: id("ag", 5), name: "Rio Santos", trade: "materials", color: colors[4], status: "working", projectId: harbor.id, taskId: "task-h-5-mat" }),
    tech({ id: id("ag", 6), name: "Quinn Hale", trade: "inspection", color: colors[5], status: "working", projectId: harbor.id, taskId: "task-h-2-insp" }),
    tech({ id: id("ag", 7), name: "Priya Nair", trade: "hvac", color: colors[6], status: "working", projectId: clinic.id, taskId: "task-c-2-hvac" }),
    tech({ id: id("ag", 8), name: "Chris Bell", trade: "foundation", color: colors[7], status: "working", projectId: clinic.id, taskId: "task-c-1-found" }),
    {
      id: AI_AGENT_IDS.grok,
      name: "Grok 4.6",
      trade: "code",
      color: "#3ecfb2",
      status: "working",
      projectId: jobsApp.id,
      taskId: "task-app-2-code",
      kind: "ai",
      model: "cursor-grok-4.6-high",
    },
    {
      id: AI_AGENT_IDS.claude,
      name: "Claude",
      trade: "debug",
      color: "#d38bd8",
      status: "idle",
      projectId: jobsApp.id,
      taskId: null,
      kind: "ai",
      model: "Claude",
    },
    {
      id: AI_AGENT_IDS.grokbot,
      name: "GrokBot",
      trade: "research",
      color: "#f0a202",
      status: "idle",
      projectId: jobsApp.id,
      taskId: null,
      kind: "ai",
      model: "Grok",
    },
    {
      id: AI_AGENT_IDS.matt,
      name: "Matt",
      trade: "review",
      color: "#5b9fd6",
      status: "idle",
      projectId: jobsApp.id,
      taskId: null,
      kind: "human",
      model: null,
    },
  ];

  const harborTasks: Task[] = [
    { id: "task-h-1-found", projectId: harbor.id, title: "Footings and slab", workKind: "foundation", floor: 1, progress: 100, status: "done", assigneeId: null },
    { id: "task-h-1-frame", projectId: harbor.id, title: "Level 1 steel", workKind: "framing", floor: 1, progress: 100, status: "done", assigneeId: null },
    { id: "task-h-1-elec", projectId: harbor.id, title: "Level 1 homeruns", workKind: "electrical", floor: 1, progress: 100, status: "done", assigneeId: null },
    { id: "task-h-2-frame", projectId: harbor.id, title: "Level 2 steel", workKind: "framing", floor: 2, progress: 100, status: "done", assigneeId: null },
    { id: "task-h-2-plumb", projectId: harbor.id, title: "Level 2 wet stack", workKind: "plumbing", floor: 2, progress: 100, status: "done", assigneeId: null },
    { id: "task-h-2-insp", projectId: harbor.id, title: "Level 2 walkthrough", workKind: "inspection", floor: 2, progress: 62, status: "in_progress", assigneeId: "ag-6" },
    { id: "task-h-3-frame", projectId: harbor.id, title: "Level 3 steel", workKind: "framing", floor: 3, progress: 100, status: "done", assigneeId: null },
    { id: "task-h-3-elec", projectId: harbor.id, title: "Level 3 lighting", workKind: "electrical", floor: 3, progress: 88, status: "in_progress", assigneeId: null },
    { id: "task-h-3-finish", projectId: harbor.id, title: "Level 3 interiors", workKind: "finishing", floor: 3, progress: 41, status: "in_progress", assigneeId: "ag-4" },
    { id: "task-h-4-frame", projectId: harbor.id, title: "Level 4 steel", workKind: "framing", floor: 4, progress: 100, status: "done", assigneeId: null },
    { id: "task-h-4-elec", projectId: harbor.id, title: "Level 4 panels", workKind: "electrical", floor: 4, progress: 54, status: "in_progress", assigneeId: "ag-2" },
    { id: "task-h-4-plumb", projectId: harbor.id, title: "Level 4 restrooms", workKind: "plumbing", floor: 4, progress: 37, status: "in_progress", assigneeId: "ag-3" },
    { id: "task-h-5-frame", projectId: harbor.id, title: "Level 5 steel", workKind: "framing", floor: 5, progress: 28, status: "in_progress", assigneeId: "ag-1" },
    { id: "task-h-5-mat", projectId: harbor.id, title: "Stage level 5 deck", workKind: "materials", floor: 5, progress: 18, status: "in_progress", assigneeId: "ag-5" },
    { id: "task-h-6-frame", projectId: harbor.id, title: "Level 6 steel", workKind: "framing", floor: 6, progress: 0, status: "queued", assigneeId: null },
    { id: "task-h-7-frame", projectId: harbor.id, title: "Level 7 steel", workKind: "framing", floor: 7, progress: 0, status: "queued", assigneeId: null },
    { id: "task-h-8-frame", projectId: harbor.id, title: "Level 8 steel", workKind: "framing", floor: 8, progress: 0, status: "queued", assigneeId: null },
    { id: "task-h-9-roof", projectId: harbor.id, title: "Roof deck", workKind: "roofing", floor: 9, progress: 0, status: "queued", assigneeId: null },
    { id: "task-h-10-roof", projectId: harbor.id, title: "Penthouse skin", workKind: "roofing", floor: 10, progress: 0, status: "queued", assigneeId: null },
  ];

  const clinicTasks: Task[] = [
    { id: "task-c-1-found", projectId: clinic.id, title: "Underslab rough-in", workKind: "foundation", floor: 1, progress: 72, status: "in_progress", assigneeId: "ag-8" },
    { id: "task-c-1-frame", projectId: clinic.id, title: "Level 1 partitions", workKind: "framing", floor: 1, progress: 40, status: "queued", assigneeId: null },
    { id: "task-c-2-hvac", projectId: clinic.id, title: "Level 2 VAV boxes", workKind: "hvac", floor: 2, progress: 33, status: "in_progress", assigneeId: "ag-7" },
    { id: "task-c-2-elec", projectId: clinic.id, title: "Level 2 exam lights", workKind: "electrical", floor: 2, progress: 0, status: "queued", assigneeId: null },
    { id: "task-c-3-frame", projectId: clinic.id, title: "Level 3 framing", workKind: "framing", floor: 3, progress: 0, status: "queued", assigneeId: null },
    { id: "task-c-4-finish", projectId: clinic.id, title: "Level 4 interiors", workKind: "finishing", floor: 4, progress: 0, status: "queued", assigneeId: null },
  ];

  const appTasks: Task[] = [
    { id: "task-app-1-repo", projectId: jobsApp.id, title: "Stand up the repo", workKind: "code", floor: 1, progress: 100, status: "done", assigneeId: null },
    { id: "task-app-2-code", projectId: jobsApp.id, title: "Crew dashboard", workKind: "code", floor: 2, progress: 70, status: "in_progress", assigneeId: AI_AGENT_IDS.grok },
    { id: "task-app-3-scene", projectId: jobsApp.id, title: "Tower scene", workKind: "design", floor: 3, progress: 55, status: "in_progress", assigneeId: null },
    { id: "task-app-4-ui", projectId: jobsApp.id, title: "Roster and board", workKind: "review", floor: 4, progress: 40, status: "in_progress", assigneeId: null },
    { id: "task-app-5-test", projectId: jobsApp.id, title: "Simulation tests", workKind: "test", floor: 5, progress: 35, status: "queued", assigneeId: null },
    { id: "task-app-6-git", projectId: jobsApp.id, title: "GitHub live feed", workKind: "code", floor: 6, progress: 10, status: "in_progress", assigneeId: AI_AGENT_IDS.grok },
  ];

  return {
    projects: [jobsApp, harbor, clinic],
    agents,
    tasks: [...appTasks, ...harborTasks, ...clinicTasks],
    activity: [
      {
        id: "act-ai-1",
        at: Date.now() - 12000,
        agentId: AI_AGENT_IDS.grok,
        projectId: jobsApp.id,
        text: "Grok 4.6 writing the crew dashboard on this branch.",
        source: "ai",
      },
      {
        id: "act-ai-2",
        at: Date.now() - 80000,
        agentId: AI_AGENT_IDS.claude,
        projectId: jobsApp.id,
        text: "Claude idle — last work was Claude Code / keyring troubleshooting.",
        source: "ai",
      },
      {
        id: "act-ai-3",
        at: Date.now() - 90000,
        agentId: AI_AGENT_IDS.grokbot,
        projectId: jobsApp.id,
        text: "GrokBot idle — last work was Omarchy compatibility research.",
        source: "ai",
      },
      {
        id: "act-1",
        at: Date.now() - 40000,
        agentId: "ag-1",
        projectId: harbor.id,
        text: "Maya Chen started setting frame on level 5.",
        source: "site",
      },
      {
        id: "act-2",
        at: Date.now() - 22000,
        agentId: "ag-2",
        projectId: harbor.id,
        text: "Dez Alvarez pulling homeruns on level 4.",
        source: "site",
      },
    ],
    selectedProjectId: jobsApp.id,
    paused: false,
    speed: 1,
  };
}
