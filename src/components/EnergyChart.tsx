import type { EnergySample } from "../engine/types";

interface EnergyChartProps {
  history: EnergySample[];
}

function toPoints(
  history: EnergySample[],
  key: "grid" | "solar",
  maxY: number,
  width: number,
  height: number,
): string {
  if (history.length === 0) return "";
  const n = history.length;
  return history
    .map((sample, i) => {
      const x = n === 1 ? 0 : (i / (n - 1)) * width;
      const y = height - (sample[key] / maxY) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function EnergyChart({ history }: EnergyChartProps) {
  const maxVal = Math.max(
    1,
    ...history.map((s) => Math.max(s.grid, s.solar)),
  );
  const maxY = maxVal * 1.15;
  const width = 320;
  const height = 120;
  const gridPts = toPoints(history, "grid", maxY, width, height);
  const solarPts = toPoints(history, "solar", maxY, width, height);
  const latest = history[history.length - 1];

  return (
    <svg
      className="spark"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Energy sparkline grid versus solar"
    >
      <polyline
        className="spark__grid"
        fill="none"
        stroke="rgba(255,176,32,0.85)"
        strokeWidth="1.5"
        points={gridPts}
      />
      <polyline
        className="spark__solar"
        fill="none"
        stroke="var(--lime)"
        strokeWidth="1.5"
        points={solarPts}
      />
      <text x="4" y="14" fill="var(--muted)" fontSize="10" style={{ fontFamily: "var(--font-mono)" }}>
        kW
      </text>
      <text
        x={width - 4}
        y={height - 6}
        textAnchor="end"
        fill="var(--muted)"
        fontSize="10"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        now
      </text>
      {latest && (
        <text
          x="4"
          y={height - 6}
          fill="var(--muted)"
          fontSize="9"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          G {latest.grid.toFixed(2)} · S {latest.solar.toFixed(2)}
        </text>
      )}
    </svg>
  );
}
