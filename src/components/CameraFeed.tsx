import type { HassEntity } from "../engine/types";
import { formatClock } from "../lib/format";

interface CameraFeedProps {
  entity: HassEntity;
  now: number;
}

export function CameraFeed({ entity, now }: CameraFeedProps) {
  const motion = Boolean(entity.attributes.motion);
  const clock = formatClock(now);

  return (
    <div className="feed" aria-label={`${entity.name} camera feed`}>
      <div className="kicker">
        {entity.name} · REC
        {motion && <span className="chip chip--crit"> MOTION</span>}
      </div>
      <svg viewBox="0 0 320 180" role="img" aria-label="Synthetic approach camera">
        <defs>
          <filter id="noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed="2"
            >
              <animate
                attributeName="baseFrequency"
                values="0.85;1.05;0.85"
                dur="1.6s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="320" height="180" fill="#050910" />
        <rect width="320" height="180" filter="url(#noise)" opacity="0.18" />
        <line
          x1="0"
          y1="118"
          x2="320"
          y2="108"
          stroke="rgba(77,251,255,0.35)"
          strokeWidth="1"
        />
        <line
          x1="0"
          y1="130"
          x2="320"
          y2="140"
          stroke="rgba(181,107,255,0.2)"
          strokeWidth="0.8"
        />
        <circle
          cx="260"
          cy="42"
          r="10"
          fill="none"
          stroke="rgba(77,251,255,0.4)"
          strokeWidth="0.8"
        >
          <animate attributeName="r" values="8;14;8" dur="3s" repeatCount="indefinite" />
        </circle>
        <text
          x="12"
          y="22"
          fill="var(--red)"
          fontSize="11"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ● REC
        </text>
        <text
          x="308"
          y="22"
          textAnchor="end"
          fill="var(--muted)"
          fontSize="10"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {clock.time}
        </text>
        {motion && (
          <text
            x="160"
            y="90"
            textAnchor="middle"
            fill="var(--red)"
            fontSize="14"
            style={{ fontFamily: "var(--font-display)" }}
          >
            MOTION
          </text>
        )}
      </svg>
    </div>
  );
}
