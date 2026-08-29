import { useEffect, useRef, type MouseEvent, type MutableRefObject } from "react";
import { drawScene, type SceneFrame } from "../engine/renderer";

interface Props {
  sceneRef: MutableRefObject<SceneFrame>;
  onSelectAgent: (id: string | null) => void;
}

export function SiteScene({ sceneRef, onSelectAgent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const loop = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawScene(ctx, sceneRef.current);
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
    const frame = sceneRef.current;
    const hit = frame.agents
      .filter((agent) => agent.projectId === frame.project.id)
      .map((agent) => ({
        agent,
        motion: frame.motions.find((item) => item.agentId === agent.id),
      }))
      .find(({ motion }) => {
        if (!motion) return false;
        const scale = Math.min(rect.width / 1000, rect.height / 620);
        const groundY = rect.height - 78;
        const sx = motion.x * scale + (rect.width - 1000 * scale) / 2;
        const sy = groundY - motion.y * scale;
        return Math.hypot(x - sx, y - sy + 18) < 28;
      });
    onSelectAgent(hit?.agent.id ?? null);
  };

  return (
    <canvas
      ref={canvasRef}
      className="site-canvas"
      onClick={onClick}
      aria-label="Construction site with crew building the project tower"
    />
  );
}
