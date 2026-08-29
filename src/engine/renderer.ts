import type { Agent, AgentMotion, Particle, Project, Task } from "../types";
import { WORK_KIND_META } from "../types";
import { completedFloorCount, currentFloorFill, projectProgress } from "../lib/progress";
import { WORLD, carryColor } from "../simulation";

export interface SceneFrame {
  project: Project;
  tasks: Task[];
  agents: Agent[];
  motions: AgentMotion[];
  particles: Particle[];
  now: number;
  selectedAgentId: string | null;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function worldToScreen(
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number; scale: number } {
  const scale = Math.min(width / WORLD.width, height / 620);
  const groundY = height - 78;
  return {
    x: x * scale + (width - WORLD.width * scale) / 2,
    y: groundY - y * scale,
    scale,
  };
}

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#121526");
  sky.addColorStop(0.42, "#2a1d3a");
  sky.addColorStop(0.72, "#7a3a2a");
  sky.addColorStop(1, "#c45c26");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#f3b15c";
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.38, Math.min(w, h) * 0.08, 0, Math.PI * 2);
  ctx.fill();
  const glow = ctx.createRadialGradient(w * 0.82, h * 0.38, 8, w * 0.82, h * 0.38, h * 0.28);
  glow.addColorStop(0, "rgba(243, 177, 92, 0.35)");
  glow.addColorStop(1, "rgba(243, 177, 92, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 5; i += 1) {
    const cx = ((t * 8 + i * 180) % (w + 220)) - 110;
    const cy = 40 + i * 28;
    ctx.fillStyle = "#d9c4b0";
    roundRect(ctx, cx, cy, 140 + i * 10, 22, 11);
    ctx.fill();
    roundRect(ctx, cx + 30, cy - 14, 90, 24, 12);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // distant skyline
  ctx.fillStyle = "rgba(10, 12, 20, 0.55)";
  const base = h * 0.62;
  for (let i = 0; i < 18; i += 1) {
    const bw = 18 + (i % 4) * 10;
    const bh = 30 + ((i * 17) % 90);
    ctx.fillRect(i * (w / 16), base - bh, bw, bh);
  }
}

function drawGround(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const groundY = h - 78;
  const dirt = ctx.createLinearGradient(0, groundY - 20, 0, h);
  dirt.addColorStop(0, "#3a2a1c");
  dirt.addColorStop(0.3, "#2a1d14");
  dirt.addColorStop(1, "#16110e");
  ctx.fillStyle = dirt;
  ctx.fillRect(0, groundY, w, h - groundY);

  ctx.fillStyle = "#4a3826";
  ctx.fillRect(0, groundY, w, 8);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  for (let i = 0; i < 40; i += 1) {
    ctx.fillRect((i * 47) % w, groundY + 10 + (i % 5) * 8, 3, 2);
  }
}

function drawMaterials(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
): void {
  const pile = worldToScreen(WORLD.pileX, 0, width, height);
  const s = pile.scale;
  ctx.save();
  ctx.translate(pile.x - 50 * s, pile.y);
  ctx.fillStyle = "#2b241c";
  roundRect(ctx, -10 * s, -8 * s, 90 * s, 12 * s, 3 * s);
  ctx.fill();
  const stacks = [
    { c: "#c4a574", h: 18 },
    { c: "#e07a3d", h: 26 },
    { c: "#5b9fd6", h: 14 },
    { c: "#f0c14a", h: 20 },
  ];
  stacks.forEach((stack, i) => {
    ctx.fillStyle = stack.c;
    roundRect(ctx, i * 20 * s, -stack.h * s, 16 * s, stack.h * s, 2 * s);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(i * 20 * s, -stack.h * s + 4 * s, 16 * s, 3 * s);
  });
  ctx.fillStyle = "#8b6b4a";
  ctx.fillRect(8 * s, -34 * s - Math.sin(t * 2) * 2 * s, 22 * s, 10 * s);
  ctx.restore();

  ctx.font = `600 ${11 * s}px Sora, sans-serif`;
  ctx.fillStyle = "rgba(232, 238, 248, 0.55)";
  ctx.fillText("YARD", pile.x - 28 * s, pile.y + 22 * s);
}

function drawCrane(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  floors: number,
  t: number,
): void {
  if (floors < 4) return;
  const base = worldToScreen(WORLD.towerX + 160, 0, width, height);
  const s = base.scale;
  const mastH = (floors * WORLD.floorHeight + 80) * s;
  ctx.strokeStyle = "#f0a202";
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(base.x, base.y - mastH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(base.x - 8 * s, base.y);
  ctx.lineTo(base.x + 8 * s, base.y);
  ctx.stroke();
  const boom = 180 * s;
  ctx.beginPath();
  ctx.moveTo(base.x, base.y - mastH);
  ctx.lineTo(base.x - boom, base.y - mastH + 18 * s);
  ctx.stroke();
  const hookX = base.x - boom * (0.45 + 0.2 * Math.sin(t * 0.4));
  const hookY = base.y - mastH * (0.35 + 0.1 * Math.sin(t * 0.7));
  ctx.beginPath();
  ctx.moveTo(base.x - boom * 0.55, base.y - mastH + 10 * s);
  ctx.lineTo(hookX, hookY);
  ctx.strokeStyle = "rgba(232,238,248,0.45)";
  ctx.lineWidth = 1.2 * s;
  ctx.stroke();
  ctx.fillStyle = "#f0a202";
  ctx.fillRect(hookX - 6 * s, hookY, 12 * s, 8 * s);
}

function drawTower(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  project: Project,
  tasks: Task[],
  t: number,
): void {
  const progress = projectProgress(tasks, project.floors);
  const done = completedFloorCount(progress, project.floors);
  const fill = currentFloorFill(progress, project.floors);
  const origin = worldToScreen(WORLD.towerX, 0, width, height);
  const s = origin.scale;
  const floorH = WORLD.floorHeight * s;
  const towerW = 168 * s;
  const x = origin.x - towerW / 2;

  // foundation pit / slab
  ctx.fillStyle = "#4d3c2a";
  ctx.fillRect(x - 18 * s, origin.y - 10 * s, towerW + 36 * s, 14 * s);
  ctx.fillStyle = "#6b5a45";
  ctx.fillRect(x - 8 * s, origin.y - 14 * s, towerW + 16 * s, 8 * s);

  for (let floor = 1; floor <= project.floors; floor += 1) {
    const y = origin.y - floor * floorH;
    const complete = floor <= done;
    const building = floor === done + 1 && progress < 100;
    const ghost = !complete && !building;
    const heightMul = complete ? 1 : building ? Math.max(0.12, fill) : 0;
    if (heightMul <= 0 && ghost) {
      ctx.strokeStyle = "rgba(232,238,248,0.08)";
      ctx.setLineDash([4, 6]);
      ctx.strokeRect(x, y, towerW, floorH - 2 * s);
      ctx.setLineDash([]);
      continue;
    }
    const h = (floorH - 2 * s) * heightMul;
    const top = y + (floorH - 2 * s - h);
    ctx.fillStyle = complete ? "#d9cbb8" : "#b7a48c";
    ctx.fillRect(x, top, towerW, h);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(x, top, 6 * s, h);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x + towerW - 7 * s, top, 7 * s, h);

    const rows = Math.max(1, Math.floor(h / (16 * s)));
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        const lit = complete && (Math.sin(floor * 3 + c * 1.7 + r + t * 0.3) > 0.15);
        ctx.fillStyle = lit ? "rgba(240, 193, 74, 0.85)" : "rgba(28, 36, 52, 0.75)";
        ctx.fillRect(x + 16 * s + c * 38 * s, top + 6 * s + r * 16 * s, 14 * s, 10 * s);
      }
    }

    if (building) {
      ctx.strokeStyle = "#e07a3d";
      ctx.lineWidth = 2 * s;
      ctx.setLineDash([]);
      // scaffolding
      ctx.beginPath();
      ctx.moveTo(x - 12 * s, origin.y);
      ctx.lineTo(x - 12 * s, top);
      ctx.moveTo(x + towerW + 12 * s, origin.y);
      ctx.lineTo(x + towerW + 12 * s, top);
      for (let i = 0; i < floor; i += 1) {
        const sy = origin.y - i * floorH;
        ctx.moveTo(x - 12 * s, sy);
        ctx.lineTo(x + towerW + 12 * s, sy);
      }
      ctx.stroke();
      ctx.strokeStyle = "rgba(240,162,2,0.45)";
      ctx.strokeRect(x - 2 * s, top, towerW + 4 * s, 3 * s);
    }
  }

  if (progress >= 100) {
    const roof = origin.y - project.floors * floorH;
    ctx.fillStyle = "#8b3a2a";
    ctx.fillRect(x - 6 * s, roof - 10 * s, towerW + 12 * s, 12 * s);
    ctx.fillStyle = "#f0a202";
    ctx.fillRect(x + towerW / 2 - 2 * s, roof - 36 * s, 4 * s, 26 * s);
    ctx.beginPath();
    ctx.moveTo(x + towerW / 2 + 2 * s, roof - 36 * s);
    ctx.lineTo(x + towerW / 2 + 28 * s, roof - 28 * s);
    ctx.lineTo(x + towerW / 2 + 2 * s, roof - 22 * s);
    ctx.closePath();
    ctx.fill();
  }

  ctx.font = `600 ${12 * s}px Sora, sans-serif`;
  ctx.fillStyle = "rgba(232,238,248,0.8)";
  ctx.textAlign = "center";
  ctx.fillText(project.name.toUpperCase(), origin.x, origin.y + 28 * s);
  ctx.font = `500 ${10 * s}px Figtree, sans-serif`;
  ctx.fillStyle = "rgba(232,238,248,0.5)";
  ctx.fillText(
    `${Math.round(progress)}% · ${done}/${project.floors} floors`,
    origin.x,
    origin.y + 44 * s,
  );
  ctx.textAlign = "left";
}

function drawWorker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  agent: Agent,
  motion: AgentMotion,
  highlight: boolean,
): void {
  const s = scale * 1.15;
  const walk = motion.phase === "to_pile" || motion.phase === "to_tower" || motion.phase === "idle";
  const climb = motion.phase === "climb" || motion.phase === "descend";
  const place = motion.phase === "place";
  const leg = Math.sin(motion.walkCycle) * (walk ? 5 : climb ? 3 : 0);
  const arm = Math.sin(motion.walkCycle + 0.4) * (place ? 8 : walk ? 5 : 2);

  ctx.save();
  ctx.translate(x, y - motion.bob * s);
  ctx.scale(motion.facing, 1);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 4 * s, 10 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // legs
  ctx.strokeStyle = "#1c2433";
  ctx.lineWidth = 3.2 * s;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-3 * s, -6 * s);
  ctx.lineTo(-3 * s + (climb ? 0 : -1), 2 * s + leg);
  ctx.moveTo(3 * s, -6 * s);
  ctx.lineTo(3 * s, 2 * s - leg);
  ctx.stroke();

  // body / vest
  ctx.fillStyle = agent.color;
  roundRect(ctx, -7 * s, -22 * s, 14 * s, 16 * s, 3 * s);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(-1 * s, -20 * s, 2 * s, 12 * s);

  // arms
  ctx.strokeStyle = "#e8cbb0";
  ctx.lineWidth = 2.4 * s;
  ctx.beginPath();
  ctx.moveTo(-7 * s, -18 * s);
  ctx.lineTo(-11 * s, -10 * s + arm * 0.3);
  ctx.moveTo(7 * s, -18 * s);
  ctx.lineTo(12 * s, -12 * s - arm * 0.4);
  ctx.stroke();

  // head
  ctx.fillStyle = "#e8cbb0";
  ctx.beginPath();
  ctx.arc(0, -26 * s, 5.2 * s, 0, Math.PI * 2);
  ctx.fill();

  // hard hat
  ctx.fillStyle = agent.color;
  roundRect(ctx, -6 * s, -34 * s, 12 * s, 7 * s, 3 * s);
  ctx.fill();
  ctx.fillRect(-8 * s, -28 * s, 16 * s, 2.2 * s);

  if (motion.carry) {
    ctx.fillStyle = carryColor(motion.carry);
    roundRect(ctx, 8 * s, -16 * s, 11 * s, 8 * s, 1.5 * s);
    ctx.fill();
  }

  if (highlight) {
    ctx.strokeStyle = "rgba(240, 193, 74, 0.9)";
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.arc(0, -18 * s, 20 * s, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  name: string,
  action: string,
  color: string,
): void {
  const s = scale;
  ctx.font = `600 ${10 * s}px Figtree, sans-serif`;
  const title = name.split(" ")[0];
  const text = `${title} · ${action}`;
  const w = ctx.measureText(text).width + 14 * s;
  const h = 16 * s;
  const lx = x - w / 2;
  const ly = y - 48 * s;
  ctx.fillStyle = "rgba(12, 16, 24, 0.78)";
  roundRect(ctx, lx, ly, w, h, 8 * s);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(lx, ly, 4 * s, h);
  ctx.fillStyle = "#e8eef8";
  ctx.fillText(text, lx + 8 * s, ly + 11.5 * s);
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  particles: Particle[],
): void {
  for (const particle of particles) {
    const p = worldToScreen(particle.x, particle.y, width, height);
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, particle.size * p.scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawWorkLights(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const left = worldToScreen(80, 0, width, height);
  const s = left.scale;
  ctx.fillStyle = "#2a303c";
  ctx.fillRect(left.x, left.y - 70 * s, 5 * s, 70 * s);
  const beam = ctx.createLinearGradient(left.x, left.y - 70 * s, left.x + 90 * s, left.y);
  beam.addColorStop(0, "rgba(240, 193, 74, 0.18)");
  beam.addColorStop(1, "rgba(240, 193, 74, 0)");
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(left.x + 5 * s, left.y - 68 * s);
  ctx.lineTo(left.x + 110 * s, left.y);
  ctx.lineTo(left.x + 20 * s, left.y);
  ctx.closePath();
  ctx.fill();
}

export function drawScene(ctx: CanvasRenderingContext2D, frame: SceneFrame): void {
  const { canvas } = ctx;
  const width = canvas.clientWidth || canvas.width;
  const height = canvas.clientHeight || canvas.height;
  const t = frame.now / 1000;

  drawSky(ctx, width, height, t);
  drawGround(ctx, width, height);
  drawWorkLights(ctx, width, height);
  drawMaterials(ctx, width, height, t);
  drawCrane(ctx, width, height, frame.project.floors, t);
  drawTower(ctx, width, height, frame.project, frame.tasks, t);
  drawParticles(ctx, width, height, frame.particles);

  const onSite = frame.agents.filter(
    (agent) => agent.projectId === frame.project.id,
  );
  const motionMap = new Map(frame.motions.map((motion) => [motion.agentId, motion]));

  for (const agent of onSite) {
    const motion = motionMap.get(agent.id);
    if (!motion) continue;
    const p = worldToScreen(motion.x, motion.y, width, height);
    drawWorker(
      ctx,
      p.x,
      p.y,
      p.scale,
      agent,
      motion,
      frame.selectedAgentId === agent.id,
    );
  }

  for (const agent of onSite) {
    const motion = motionMap.get(agent.id);
    if (!motion) continue;
    const p = worldToScreen(motion.x, motion.y, width, height);
    const task = frame.tasks.find((item) => item.id === agent.taskId);
    const action = task
      ? `${WORK_KIND_META[task.workKind].label} L${task.floor}`
      : agent.status === "break"
        ? "Break"
        : "Standby";
    drawLabel(ctx, p.x, p.y, p.scale, agent.name, action, agent.color);
  }

  if (onSite.length === 0) {
    ctx.fillStyle = "rgba(232,238,248,0.7)";
    ctx.font = "600 16px Sora, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No crew on this job yet — add a tech or assign someone.", width / 2, height / 2);
    ctx.textAlign = "left";
  }
}
