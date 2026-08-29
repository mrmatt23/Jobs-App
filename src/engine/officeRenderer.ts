import type { Agent, Task } from "../types";
import { WORK_KIND_META } from "../types";
import { ANIMAL_LABEL, drawAnimal } from "./animals";
import { cubicleCols, officeAction, type OfficeBot } from "./officeSim";

export interface OfficeFrame {
  bots: OfficeBot[];
  agents: Agent[];
  tasks: Task[];
  selectedAgentId: string | null;
  title: string;
}

function iso(gx: number, gy: number, tw: number, th: number): { x: number; y: number } {
  return {
    x: (gx - gy) * (tw / 2),
    y: (gx + gy) * (th / 2),
  };
}

function diamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tw: number,
  th: number,
  fill: string,
): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + tw / 2, y + th / 2);
  ctx.lineTo(x, y + th);
  ctx.lineTo(x - tw / 2, y + th / 2);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawCubicle(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  tw: number,
  th: number,
  lit: boolean,
): void {
  ctx.save();
  ctx.translate(ox, oy);

  diamond(ctx, 0, 0, tw * 2, th * 2, lit ? "#425044" : "#2a3140");
  ctx.strokeStyle = "rgba(8,10,16,0.35)";
  ctx.stroke();

  const wall = "#c4b49a";
  const wallDark = "#8a7a62";
  ctx.beginPath();
  const a = iso(0, 0, tw, th);
  const b = iso(0, 2, tw, th);
  const c = iso(2, 2, tw, th);
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(a.x, a.y - th * 1.15);
  ctx.lineTo(b.x, b.y - th * 1.15);
  ctx.lineTo(b.x, b.y);
  ctx.closePath();
  ctx.fillStyle = wallDark;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x, b.y - th * 1.15);
  ctx.lineTo(c.x, c.y - th * 1.15);
  ctx.lineTo(c.x, c.y);
  ctx.closePath();
  ctx.fillStyle = wall;
  ctx.fill();

  const desk = iso(1.15, 0.45, tw, th);
  ctx.fillStyle = "#6b4a2e";
  ctx.fillRect(desk.x - tw * 0.28, desk.y - th * 0.08, tw * 0.55, th * 0.22);
  ctx.fillStyle = lit ? "#8fd4ff" : "#1c2838";
  ctx.fillRect(desk.x + tw * 0.02, desk.y - th * 0.42, tw * 0.16, th * 0.28);
  ctx.fillStyle = "#2a303c";
  ctx.fillRect(desk.x + tw * 0.02, desk.y - th * 0.16, tw * 0.16, th * 0.06);

  ctx.restore();
}

export function officeView(
  width: number,
  height: number,
  botCount: number,
): { tw: number; th: number; ox: number; oy: number; cols: number } {
  const cols = cubicleCols(botCount);
  const rows = Math.max(1, Math.ceil(Math.max(1, botCount) / cols));
  const worldW = cols * 3 + 1;
  const worldH = rows * 3 + 1;
  const tw = Math.max(36, Math.min(64, width / (worldW * 0.85)));
  const th = tw * 0.5;
  const origin = iso(worldW / 2, worldH / 2, tw, th);
  return {
    tw,
    th,
    ox: width / 2 - origin.x,
    oy: height * 0.22,
    cols,
  };
}

export function botScreen(
  bot: OfficeBot,
  width: number,
  height: number,
  count: number,
): { x: number; y: number; pixel: number } {
  const view = officeView(width, height, count);
  const p = iso(bot.x, bot.y, view.tw, view.th);
  return {
    x: view.ox + p.x,
    y: view.oy + p.y,
    pixel: Math.max(2, Math.round(view.tw / 18)),
  };
}

export function drawOffice(ctx: CanvasRenderingContext2D, frame: OfficeFrame): void {
  const { canvas } = ctx;
  const width = canvas.clientWidth || canvas.width;
  const height = canvas.clientHeight || canvas.height;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#1a2030";
  ctx.fillRect(0, 0, width, height);

  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.35);
  sky.addColorStop(0, "#2a3348");
  sky.addColorStop(1, "#1a2030");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height * 0.38);

  const count = Math.max(1, frame.bots.length);
  const view = officeView(width, height, count);
  const cols = view.cols;
  const rows = Math.max(1, Math.ceil(count / cols));

  for (let gy = 0; gy < rows * 3 + 2; gy += 1) {
    for (let gx = 0; gx < cols * 3 + 2; gx += 1) {
      const p = iso(gx, gy, view.tw, view.th);
      const carpet = (gx + gy) % 2 === 0 ? "#3a4558" : "#323c4e";
      diamond(ctx, view.ox + p.x, view.oy + p.y, view.tw, view.th, carpet);
    }
  }

  const occupied = new Set(frame.bots.map((bot) => bot.desk));
  const agentMap = new Map(frame.agents.map((agent) => [agent.id, agent]));
  const layers: { depth: number; draw: () => void }[] = [];

  for (let i = 0; i < cols * rows; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const origin = iso(col * 3, row * 3, view.tw, view.th);
    const bot = frame.bots.find((item) => item.desk === i);
    const working = bot
      ? frame.agents.find((agent) => agent.id === bot.agentId)?.status === "working"
      : false;
    layers.push({
      depth: col * 3 + row * 3,
      draw: () =>
        drawCubicle(
          ctx,
          view.ox + origin.x,
          view.oy + origin.y,
          view.tw,
          view.th,
          Boolean(working && occupied.has(i)),
        ),
    });
  }

  for (const bot of frame.bots) {
    if (!agentMap.has(bot.agentId)) continue;
    layers.push({
      depth: bot.x + bot.y + 0.35,
      draw: () => {
        const screen = botScreen(bot, width, height, count);
        drawAnimal(
          ctx,
          bot.animal,
          screen.x,
          screen.y,
          screen.pixel,
          bot.facing,
          bot.frame,
          frame.selectedAgentId === bot.agentId,
        );
      },
    });
  }

  layers.sort((a, b) => a.depth - b.depth);
  for (const layer of layers) layer.draw();

  for (const bot of frame.bots) {
    const agent = agentMap.get(bot.agentId);
    if (!agent) continue;
    const screen = botScreen(bot, width, height, count);
    const task = frame.tasks.find((item) => item.id === agent.taskId);
    const action = officeAction(bot, agent);
    const label = `${agent.name.split(" ")[0]} · ${ANIMAL_LABEL[bot.animal]}`;
    const sub = task ? `${WORK_KIND_META[task.workKind].label} · ${action}` : action;
    ctx.font = `600 ${Math.max(10, screen.pixel * 4)}px Figtree, sans-serif`;
    const text = `${label}  ${sub}`;
    const labelW = ctx.measureText(text).width + 12;
    const lx = screen.x - labelW / 2;
    const ly = screen.y - screen.pixel * 16;
    ctx.fillStyle = "rgba(12,16,24,0.78)";
    ctx.fillRect(lx, ly, labelW, 16);
    ctx.fillStyle = agent.color;
    ctx.fillRect(lx, ly, 4, 16);
    ctx.fillStyle = "#e8eef8";
    ctx.fillText(text, lx + 8, ly + 12);
  }

  ctx.font = "600 13px Sora, sans-serif";
  ctx.fillStyle = "rgba(232,238,248,0.7)";
  ctx.fillText(`${frame.title} · office floor`, 16, 22);
  ctx.font = "500 11px Figtree, sans-serif";
  ctx.fillStyle = "rgba(232,238,248,0.48)";
  ctx.fillText("At their cubicle, or walking over to pair at another desk", 16, 40);
  if (frame.bots.length === 0) {
    ctx.textAlign = "center";
    ctx.fillText("No bots on this job.", width / 2, height / 2);
    ctx.textAlign = "left";
  }
}
