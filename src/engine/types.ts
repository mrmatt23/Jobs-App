export type Domain =
  | "light"
  | "climate"
  | "weather"
  | "media_player"
  | "lock"
  | "cover"
  | "fan"
  | "switch"
  | "vacuum"
  | "binary_sensor"
  | "sensor"
  | "camera"
  | "person"
  | "scene"
  | "alarm_control_panel";

export type RoomId =
  | "atrium"
  | "observatory"
  | "galley"
  | "sanctum"
  | "aqua"
  | "skydeck"
  | "lab"
  | "whole";

export type AlertLevel = "info" | "warn" | "crit";

export type AttrValue = string | number | boolean | null;

export interface HassEntity {
  entity_id: string;
  domain: Domain;
  room: RoomId;
  name: string;
  state: string;
  unit?: string;
  icon: string;
  attributes: Record<string, AttrValue>;
}

export interface Alert {
  id: string;
  level: AlertLevel;
  text: string;
  ts: number;
}

export interface EnergySample {
  t: number;
  grid: number;
  solar: number;
}

export interface HassState {
  entities: Record<string, HassEntity>;
  selectedRoom: RoomId;
  selectedEntityId: string | null;
  now: number;
  alerts: Alert[];
  energyHistory: EnergySample[];
}

export type Action =
  | { type: "tick" }
  | { type: "selectRoom"; room: RoomId }
  | { type: "selectEntity"; id: string | null }
  | { type: "toggle"; id: string }
  | { type: "set"; id: string; state?: string; attributes?: Record<string, AttrValue> }
  | { type: "activateScene"; id: string }
  | { type: "dismissAlert"; id: string }
  | { type: "nudgeClimate"; delta: number }
  | { type: "setBrightness"; id: string; brightness: number };

export const ROOMS: { id: RoomId; label: string; code: string }[] = [
  { id: "whole", label: "Entire House", code: "00" },
  { id: "atrium", label: "Atrium", code: "01" },
  { id: "observatory", label: "Observatory", code: "02" },
  { id: "galley", label: "Galley", code: "03" },
  { id: "sanctum", label: "Sanctum", code: "04" },
  { id: "aqua", label: "Aqua", code: "05" },
  { id: "skydeck", label: "Skydeck", code: "06" },
  { id: "lab", label: "Neural Lab", code: "07" },
];

export const ROOM_LABEL: Record<RoomId, string> = Object.fromEntries(
  ROOMS.map((r) => [r.id, r.label]),
) as Record<RoomId, string>;
