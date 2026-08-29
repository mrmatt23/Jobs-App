import { useEffect, useRef, type MouseEvent, type MutableRefObject } from "react";
import { botScreen, drawOffice } from "../engine/officeRenderer";
import { syncOfficeBots, tickOffice, type OfficeBot } from "../engine/officeSim";
import type { SceneFrame } from "../engine/renderer";

interface Props {
  sceneRef: MutableRefObject<SceneFrame>;
  onSelectAgent: (id: string | null) => void;
  paused: boolean;
  speed: number;
}

export function OfficeScene({ sceneRef, onSelectAgent, paused, speed }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const botsRef = useRef<OfficeBot[]>([]);
  const lastRef = useRef(performance.now());
  const pausedRef = useRef(paused);
  const speedRef = useRef(speed);
  pausedRef.current = paused;
  speedRef.current = speed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const fit = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, parent.clientWidth);
      const height = Math.max(1, parent.clientHeight);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    const loop = (time: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const frame = sceneRef.current;
      const onSite = frame.agents.filter((agent) => agent.projectId === frame.project.id);
      const dt = Math.min(0.05, (time - lastRef.current) / 1000);
      lastRef.current = time;
      botsRef.current = syncOfficeBots(botsRef.current, onSite);
      botsRef.current = tickOffice(
        botsRef.current,
        onSite,
        dt,
        pausedRef.current,
        speedRef.current,
      );
      drawOffice(ctx, {
        bots: botsRef.current,
        agents: onSite,
        tasks: frame.tasks,
        selectedAgentId: frame.selectedAgentId,
        title: frame.project.name,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [sceneRef]);

  const onClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = [...botsRef.current].reverse().find((bot) => {
      const screen = botScreen(bot, rect.width, rect.height, Math.max(1, botsRef.current.length));
      return Math.hypot(x - screen.x, y - screen.y + 10) < 28;
    });
    onSelectAgent(hit?.agentId ?? null);
  };

  return (
    <canvas
      ref={canvasRef}
      className="site-canvas"
      onClick={onClick}
      aria-label="Isometric office floor with 8-bit animal bots at cubicles"
    />
  );
}
