import type { Agent } from "../types";
import { animalFor, type AnimalId } from "./animals";

export interface Point {
  x: number;
  y: number;
}

export type OfficePhase = "work" | "walk" | "pair";

export interface OfficeBot {
  agentId: string;
  desk: number;
  x: number;
  y: number;
  facing: 1 | -1;
  phase: OfficePhase;
  waypoints: Point[];
  home: Point;
  visit: Point | null;
  pairWith: string | null;
  goingHome: boolean;
  wait: number;
  frame: number;
  animal: AnimalId;
}

export function cubicleCols(count: number): number {
  return Math.max(3, Math.min(5, Math.ceil(Math.sqrt(Math.max(1, count)))));
}

export function deskWorld(index: number, cols: number): Point {
  const col = index % cols;
  const row = Math.floor(index / cols);
  return { x: col * 3 + 1.05, y: row * 3 + 0.72 };
}

export function visitorWorld(index: number, cols: number): Point {
  const desk = deskWorld(index, cols);
  return { x: desk.x + 0.62, y: desk.y + 0.18 };
}

export function aislePath(from: Point, to: Point): Point[] {
  const fromAisle = { x: from.x, y: Math.floor(from.y / 3) * 3 };
  const toAisle = { x: to.x, y: Math.floor(to.y / 3) * 3 };
  return [fromAisle, { x: toAisle.x, y: fromAisle.y }, toAisle, to];
}

export function syncOfficeBots(bots: OfficeBot[], agents: Agent[]): OfficeBot[] {
  const cols = cubicleCols(agents.length);
  const keep = new Map(bots.map((bot) => [bot.agentId, bot]));
  return agents.map((agent, index) => {
    const home = deskWorld(index, cols);
    const existing = keep.get(agent.id);
    if (existing) {
      existing.desk = index;
      existing.home = home;
      existing.animal = animalFor(agent.id);
      if (existing.phase === "work") {
        existing.x = home.x;
        existing.y = home.y;
      }
      return existing;
    }
    return {
      agentId: agent.id,
      desk: index,
      x: home.x,
      y: home.y,
      facing: 1,
      phase: "work",
      waypoints: [],
      home,
      visit: null,
      pairWith: null,
      goingHome: false,
      wait: 1.5 + (index % 5) * 0.8,
      frame: index * 0.4,
      animal: animalFor(agent.id),
    };
  });
}

function stepToward(bot: OfficeBot, target: Point, dist: number): boolean {
  const dx = target.x - bot.x;
  const dy = target.y - bot.y;
  const len = Math.hypot(dx, dy);
  if (len <= dist || len < 0.04) {
    bot.x = target.x;
    bot.y = target.y;
    return true;
  }
  bot.x += (dx / len) * dist;
  bot.y += (dy / len) * dist;
  bot.facing = dx >= 0 ? 1 : -1;
  return false;
}

export function tickOffice(
  bots: OfficeBot[],
  agents: Agent[],
  dt: number,
  paused: boolean,
  speed: number,
): OfficeBot[] {
  const onSite = agents.filter((agent) => bots.some((bot) => bot.agentId === agent.id));
  const scaled = paused ? 0 : dt * speed;
  const cols = cubicleCols(onSite.length);
  const byId = new Map(onSite.map((agent) => [agent.id, agent]));

  for (const bot of bots) {
    bot.frame += dt * (bot.phase === "walk" ? 10 : 4);
    const agent = byId.get(bot.agentId);
    if (!agent) continue;

    if (paused) {
      bot.phase = "work";
      bot.waypoints = [];
      bot.x = bot.home.x;
      bot.y = bot.home.y;
      continue;
    }

    if (bot.phase === "work") {
      bot.x = bot.home.x;
      bot.y = bot.home.y;
      bot.wait -= scaled;
      if (agent.status === "working" && bot.wait <= 0) {
        const others = bots.filter((other) => {
          const otherAgent = byId.get(other.agentId);
          return (
            other.agentId !== bot.agentId &&
            other.phase === "work" &&
            otherAgent?.status === "working"
          );
        });
        const host = others[Math.floor(Math.random() * others.length)];
        if (host) {
          bot.phase = "walk";
          bot.goingHome = false;
          bot.pairWith = host.agentId;
          bot.visit = visitorWorld(host.desk, cols);
          bot.waypoints = aislePath({ x: bot.x, y: bot.y }, bot.visit);
        } else {
          bot.wait = 2 + Math.random() * 3;
        }
      }
      continue;
    }

    if (bot.phase === "walk") {
      const next = bot.waypoints[0];
      if (!next) {
        bot.phase = bot.goingHome ? "work" : "pair";
        bot.wait = bot.goingHome ? 2 + Math.random() * 4 : 2.4;
        bot.goingHome = false;
        continue;
      }
      if (stepToward(bot, next, 1.55 * Math.max(scaled, 0.016))) {
        bot.waypoints.shift();
      }
      continue;
    }

    bot.wait -= scaled;
    if (bot.wait <= 0) {
      bot.phase = "walk";
      bot.goingHome = true;
      bot.pairWith = null;
      bot.visit = null;
      bot.waypoints = aislePath({ x: bot.x, y: bot.y }, bot.home);
    }
  }

  return bots;
}

export function officeAction(bot: OfficeBot, agent: Agent): string {
  if (bot.phase === "walk" && bot.goingHome) return "Heading back";
  if (bot.phase === "walk") return "Walking over";
  if (bot.phase === "pair") return "Pairing up";
  if (agent.status === "working") return "At desk";
  if (agent.status === "break") return "Away";
  return "At desk";
}
