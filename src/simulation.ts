import type {
  Agent,
  AgentMotion,
  JobState,
  Particle,
  Task,
  WorkKind,
} from "./types";
import { WORK_KIND_META } from "./types";
import {
  clamp,
  placeAmount,
  projectProgress,
  projectStatusFromProgress,
  tasksForProject,
} from "./lib/progress";

export const WORLD = {
  width: 1000,
  ground: 0,
  pileX: 118,
  towerX: 560,
  floorHeight: 46,
  walkSpeed: 92,
  climbSpeed: 70,
};

const PLACE_DURATION = 0.55;

export function createMotion(agents: Agent[], tasks: Task[]): AgentMotion[] {
  return agents.map((agent, index) => {
    const task = tasks.find((item) => item.id === agent.taskId);
    const working = agent.status === "working" && task && task.status !== "done";
    const lane = 70 + (index % 6) * 36;
    return {
      agentId: agent.id,
      x: working ? WORLD.pileX + lane : 40 + index * 52,
      y: 0,
      facing: 1,
      phase: working ? "to_pile" : agent.status === "break" ? "break" : "idle",
      floorTarget: task?.floor ?? 1,
      carry: null,
      walkCycle: Math.random() * 4,
      phaseT: Math.random() * 0.4,
      bob: 0,
    };
  });
}

export function nextOpenTask(agent: Agent, tasks: Task[]): Task | undefined {
  return tasks
    .filter(
      (task) =>
        task.projectId === agent.projectId &&
        task.status !== "done" &&
        task.workKind === agent.trade &&
        (task.assigneeId === null || task.assigneeId === agent.id),
    )
    .sort((a, b) => a.floor - b.floor || a.progress - b.progress)[0];
}

function actionLine(agent: Agent, task: Task, phase: AgentMotion["phase"]): string {
  const meta = WORK_KIND_META[task.workKind];
  if (phase === "to_pile" || phase === "to_tower") {
    return `${agent.name} hauling ${meta.label.toLowerCase()} for level ${task.floor}.`;
  }
  if (phase === "climb" || phase === "descend") {
    return `${agent.name} on the scaffold to level ${task.floor}.`;
  }
  if (phase === "place") {
    return `${agent.name} ${meta.verb} on level ${task.floor}.`;
  }
  return `${agent.name} ${meta.verb} — ${task.title}.`;
}

function moveToward(
  motion: AgentMotion,
  targetX: number,
  dt: number,
  speed: number,
): boolean {
  const dx = targetX - motion.x;
  const step = speed * dt;
  if (Math.abs(dx) <= step) {
    motion.x = targetX;
    return true;
  }
  motion.facing = dx > 0 ? 1 : -1;
  motion.x += Math.sign(dx) * step;
  motion.walkCycle += dt * 8;
  return false;
}

export function spawnPlaceDust(particles: Particle[], x: number, y: number): void {
  for (let i = 0; i < 10; i += 1) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 70,
      vy: -20 - Math.random() * 40,
      life: 0.45 + Math.random() * 0.35,
      maxLife: 0.8,
      size: 2 + Math.random() * 3,
      color: "rgba(232, 214, 176, 0.7)",
    });
  }
}

export function tickParticles(particles: Particle[], dt: number): Particle[] {
  const next: Particle[] = [];
  for (const particle of particles) {
    particle.life -= dt;
    if (particle.life <= 0) continue;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 90 * dt;
    next.push(particle);
  }
  return next;
}

export interface SimTickResult {
  state: JobState;
  motions: AgentMotion[];
  particles: Particle[];
  placed: boolean;
}

export function tickSimulation(
  state: JobState,
  motions: AgentMotion[],
  particles: Particle[],
  dt: number,
): SimTickResult {
  if (state.paused) {
    return { state, motions, particles: tickParticles(particles, dt), placed: false };
  }

  const scaled = dt * state.speed;
  const nextTasks: Task[] = state.tasks.map((task) => ({ ...task }));
  const nextAgents: Agent[] = state.agents.map((agent) => ({ ...agent }));
  const activity = [...state.activity];
  let placed = false;

  const motionById = new Map(motions.map((motion) => [motion.agentId, { ...motion }]));

  for (const agent of nextAgents) {
    let motion = motionById.get(agent.id);
    if (!motion) {
      motion = createMotion([agent], nextTasks)[0];
      motionById.set(agent.id, motion);
    }

    if (agent.status === "break") {
      motion.phase = "break";
      motion.y = 0;
      motion.bob = Math.sin(motion.walkCycle) * 1.2;
      motion.walkCycle += scaled * 2;
      continue;
    }

    let task = nextTasks.find((item) => item.id === agent.taskId);
    if (!task || task.status === "done" || task.projectId !== agent.projectId) {
      const open = nextOpenTask(agent, nextTasks);
      if (!open) {
        agent.status = "idle";
        agent.taskId = null;
        motion.phase = "idle";
        motion.carry = null;
        motion.y = 0;
        motion.x += Math.sin(motion.walkCycle) * 0.2;
        motion.walkCycle += scaled * 1.4;
        continue;
      }
      open.assigneeId = agent.id;
      if (open.status === "queued") open.status = "in_progress";
      agent.taskId = open.id;
      agent.status = "working";
      task = open;
      motion.phase = "to_pile";
      motion.floorTarget = open.floor;
      motion.phaseT = 0;
    }

    motion.floorTarget = task.floor;
    motion.bob = Math.sin(motion.walkCycle * 2) * 1.4;
    const floorY = task.floor * WORLD.floorHeight;
    const towerBaseX = WORLD.towerX - 40 + (hash(agent.id) % 70);

    switch (motion.phase) {
      case "idle": {
        motion.y = 0;
        const idleX = WORLD.pileX + (hash(agent.id) % 80);
        if (moveToward(motion, idleX, scaled, WORLD.walkSpeed * 0.45)) {
          motion.walkCycle += scaled * 2;
          motion.x += Math.sin(motion.walkCycle) * 0.15;
        }
        if (agent.status === "working") motion.phase = "to_pile";
        break;
      }
      case "break": {
        motion.y = 0;
        motion.walkCycle += scaled * 2;
        break;
      }
      case "to_pile": {
        motion.y = 0;
        if (moveToward(motion, WORLD.pileX, scaled, WORLD.walkSpeed)) {
          motion.carry = task.workKind;
          motion.phase = "to_tower";
          motion.phaseT = 0;
        }
        break;
      }
      case "to_tower": {
        motion.y = 0;
        if (moveToward(motion, towerBaseX, scaled, WORLD.walkSpeed)) {
          motion.phase = "climb";
          motion.phaseT = 0;
        }
        break;
      }
      case "climb": {
        motion.facing = 1;
        motion.y = Math.min(floorY, motion.y + WORLD.climbSpeed * scaled);
        motion.walkCycle += scaled * 6;
        if (motion.y >= floorY) {
          motion.y = floorY;
          motion.phase = "place";
          motion.phaseT = 0;
        }
        break;
      }
      case "place": {
        motion.phaseT += scaled;
        motion.walkCycle += scaled * 10;
        if (motion.phaseT >= PLACE_DURATION) {
          const source = state.projects.find((item) => item.id === task.projectId)?.source;
          const liveRemote = source === "github" || source === "device";
          if (!liveRemote) {
            const bump = placeAmount(task.workKind === "inspection" ? 0.7 : 1);
            task.progress = clamp(task.progress + bump, 0, 100);
            activity.unshift({
              id: `act-${Date.now()}-${agent.id}`,
              at: Date.now(),
              agentId: agent.id,
              projectId: task.projectId,
              text: actionLine(agent, task, "place"),
              source: agent.kind === "ai" ? "ai" : "site",
            });
            if (activity.length > 40) activity.length = 40;
            if (task.progress >= 100) {
              task.progress = 100;
              task.status = "done";
              task.assigneeId = null;
              agent.taskId = null;
            }
          }
          placed = true;
          spawnPlaceDust(particles, motion.x, motion.y + 10);
          motion.carry = null;
          motion.phase = "descend";
          motion.phaseT = 0;
        }
        break;
      }
      case "descend": {
        motion.y = Math.max(0, motion.y - WORLD.climbSpeed * 1.15 * scaled);
        motion.walkCycle += scaled * 6;
        if (motion.y <= 0) {
          motion.y = 0;
          motion.phase = agent.status === "working" ? "to_pile" : "idle";
        }
        break;
      }
      default:
        break;
    }
  }

  const projects = state.projects.map((project) => {
    const tasks = tasksForProject(nextTasks, project.id);
    const progress = projectProgress(tasks, project.floors);
    if (project.status === "paused") return project;
    return {
      ...project,
      status: projectStatusFromProgress(progress, tasks.length > 0),
    };
  });

  return {
    state: {
      ...state,
      agents: nextAgents,
      tasks: nextTasks,
      projects,
      activity,
    },
    motions: [...motionById.values()],
    particles: tickParticles(particles, scaled),
    placed,
  };
}

export function agentActionLabel(
  agent: Agent,
  task: Task | undefined,
  motion: AgentMotion | undefined,
): string {
  if (agent.status === "break") return "On break";
  if (agent.status === "blocked") return "Waiting on materials";
  if (agent.status === "idle" || !task) return "Standing by";
  const meta = WORK_KIND_META[task.workKind];
  const phase = motion?.phase;
  if (phase === "to_pile") return `Grabbing ${meta.tool}`;
  if (phase === "to_tower") return `Hauling to level ${task.floor}`;
  if (phase === "climb") return `Climbing to level ${task.floor}`;
  if (phase === "place") return `${capitalize(meta.verb)} · L${task.floor}`;
  if (phase === "descend") return "Coming down";
  return `${meta.label} · L${task.floor}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function carryColor(kind: WorkKind): string {
  return WORK_KIND_META[kind].hue;
}

