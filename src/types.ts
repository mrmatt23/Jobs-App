export const WORK_KINDS = [
  "foundation",
  "framing",
  "electrical",
  "plumbing",
  "hvac",
  "roofing",
  "finishing",
  "inspection",
  "materials",
  "code",
  "review",
  "test",
  "research",
  "debug",
  "design",
] as const;

export type WorkKind = (typeof WORK_KINDS)[number];

export const SITE_WORK_KINDS: WorkKind[] = [
  "foundation",
  "framing",
  "electrical",
  "plumbing",
  "hvac",
  "roofing",
  "finishing",
  "inspection",
  "materials",
];

export const AI_WORK_KINDS: WorkKind[] = [
  "code",
  "review",
  "test",
  "research",
  "debug",
  "design",
];

export type AgentKind = "tech" | "ai" | "human";
export type AgentStatus = "idle" | "working" | "blocked" | "break";
export type TaskStatus = "queued" | "in_progress" | "done" | "blocked";
export type ProjectStatus = "planning" | "active" | "paused" | "complete";
export type ProjectSource = "local" | "github";
export type ActivitySource = "site" | "github" | "ai";

export type MotionPhase =
  | "idle"
  | "to_pile"
  | "to_tower"
  | "climb"
  | "place"
  | "descend"
  | "break";

export interface Project {
  id: string;
  name: string;
  site: string;
  floors: number;
  status: ProjectStatus;
  notes: string;
  source?: ProjectSource;
}

export interface Agent {
  id: string;
  name: string;
  trade: WorkKind;
  color: string;
  status: AgentStatus;
  projectId: string | null;
  taskId: string | null;
  kind: AgentKind;
  model: string | null;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  workKind: WorkKind;
  floor: number;
  progress: number;
  status: TaskStatus;
  assigneeId: string | null;
}

export interface ActivityEvent {
  id: string;
  at: number;
  agentId: string;
  projectId: string;
  text: string;
  source?: ActivitySource;
  url?: string;
}

export interface AgentMotion {
  agentId: string;
  x: number;
  y: number;
  facing: 1 | -1;
  phase: MotionPhase;
  floorTarget: number;
  carry: WorkKind | null;
  walkCycle: number;
  phaseT: number;
  bob: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface JobState {
  projects: Project[];
  agents: Agent[];
  tasks: Task[];
  activity: ActivityEvent[];
  selectedProjectId: string;
  paused: boolean;
  speed: 1 | 2 | 4;
}

export const WORK_KIND_META: Record<
  WorkKind,
  { label: string; verb: string; tool: string; hue: string }
> = {
  foundation: { label: "Foundation", verb: "pouring", tool: "shovel", hue: "#c4a574" },
  framing: { label: "Framing", verb: "setting frame", tool: "beam", hue: "#e07a3d" },
  electrical: { label: "Electrical", verb: "pulling wire", tool: "coil", hue: "#f0c14a" },
  plumbing: { label: "Plumbing", verb: "running pipe", tool: "pipe", hue: "#5b9fd6" },
  hvac: { label: "HVAC", verb: "hanging duct", tool: "duct", hue: "#7ad0c6" },
  roofing: { label: "Roofing", verb: "sheathing", tool: "sheet", hue: "#b85c38" },
  finishing: { label: "Finishing", verb: "trimming out", tool: "roller", hue: "#d38bd8" },
  inspection: { label: "Inspection", verb: "walking the floor", tool: "board", hue: "#9aa4b2" },
  materials: { label: "Materials", verb: "staging", tool: "crate", hue: "#8b6b4a" },
  code: { label: "Code", verb: "writing", tool: "diff", hue: "#3ecfb2" },
  review: { label: "Review", verb: "reviewing", tool: "pr", hue: "#5b9fd6" },
  test: { label: "Test", verb: "testing", tool: "check", hue: "#9ae66e" },
  research: { label: "Research", verb: "researching", tool: "notes", hue: "#d38bd8" },
  debug: { label: "Debug", verb: "debugging", tool: "log", hue: "#ff6b6b" },
  design: { label: "Design", verb: "shaping", tool: "layout", hue: "#f4d35e" },
};
