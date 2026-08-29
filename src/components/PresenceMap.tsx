import type { HassEntity, RoomId } from "../engine/types";

interface PresenceMapProps {
  persons: HassEntity[];
}

function locationToRoom(location: string | null | undefined): RoomId | null {
  if (!location) return null;
  const loc = location.toLowerCase();
  if (loc.includes("observatory")) return "observatory";
  if (loc.includes("neural") || loc.includes("lab")) return "lab";
  if (loc.includes("atrium")) return "atrium";
  if (loc.includes("galley")) return "galley";
  if (loc.includes("sanctum")) return "sanctum";
  if (loc.includes("aqua")) return "aqua";
  if (loc.includes("skydeck")) return "skydeck";
  if (loc.includes("transit") || loc.includes("away")) return null;
  return "atrium";
}

const NODES: { id: RoomId; label: string; x: number; y: number }[] = [
  { id: "skydeck", label: "Skydeck", x: 50, y: 12 },
  { id: "observatory", label: "Observatory", x: 22, y: 32 },
  { id: "atrium", label: "Atrium", x: 50, y: 38 },
  { id: "galley", label: "Galley", x: 78, y: 32 },
  { id: "sanctum", label: "Sanctum", x: 22, y: 62 },
  { id: "aqua", label: "Aqua", x: 50, y: 68 },
  { id: "lab", label: "Lab", x: 78, y: 62 },
];

export function PresenceMap({ persons }: PresenceMapProps) {
  const occupants = new Map<RoomId, HassEntity[]>();
  const ghosts: HassEntity[] = [];

  for (const person of persons) {
    const room = locationToRoom(String(person.attributes.location ?? ""));
    if (!room || room === "whole") {
      ghosts.push(person);
      continue;
    }
    const list = occupants.get(room) ?? [];
    list.push(person);
    occupants.set(room, list);
  }

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Presence floor schematic"
    >
      <defs>
        <linearGradient id="floorWash" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(77,251,255,0.08)" />
          <stop offset="100%" stopColor="rgba(181,107,255,0.06)" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="84" height="84" rx="4" fill="url(#floorWash)" stroke="rgba(120,220,255,0.25)" strokeWidth="0.4" />
      <path
        d="M20 30 H80 V70 H20 Z M50 30 V70 M20 50 H80"
        fill="none"
        stroke="rgba(120,220,255,0.2)"
        strokeWidth="0.35"
      />
      {NODES.map((node) => {
        const here = occupants.get(node.id) ?? [];
        const occupied = here.length > 0;
        return (
          <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
            <circle
              className={occupied ? "map-dot map-dot--here" : "map-dot"}
              r={occupied ? 5.5 : 4}
              fill={occupied ? "rgba(77,251,255,0.35)" : "rgba(10,18,34,0.8)"}
              stroke={occupied ? "#4dfbff" : "rgba(120,220,255,0.35)"}
              strokeWidth="0.5"
            />
            <text
              y={10}
              textAnchor="middle"
              fill="rgba(190,220,240,0.7)"
              fontSize="3.2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {node.label}
            </text>
            {here.map((person, i) => (
              <text
                key={person.entity_id}
                y={-7 - i * 4}
                textAnchor="middle"
                fill="var(--cyan)"
                fontSize="3"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {person.name}
              </text>
            ))}
          </g>
        );
      })}
      {ghosts.map((person, i) => (
        <g key={person.entity_id} transform={`translate(${12 + i * 16} 92)`} opacity={0.45}>
          <circle className="map-dot" r={3} fill="rgba(255,176,32,0.25)" stroke="#ffb020" strokeWidth="0.4" />
          <text y={6} textAnchor="middle" fill="var(--amber)" fontSize="2.8">
            {person.name} · transit
          </text>
        </g>
      ))}
    </svg>
  );
}
