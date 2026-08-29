import { seedEnergy, seedEntities, QUEUE } from "./catalog";
import { scenePatch } from "./scenes";
import type { Action, AttrValue, HassEntity, HassState, RoomId } from "./types";

const TICK_MS = 900;
const HISTORY_MAX = 48;

function cloneEntities(src: Record<string, HassEntity>): Record<string, HassEntity> {
  const out: Record<string, HassEntity> = {};
  for (const [id, ent] of Object.entries(src)) {
    out[id] = { ...ent, attributes: { ...ent.attributes } };
  }
  return out;
}

function num(v: AttrValue | undefined, fallback: number): number {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v))) return Number(v);
  return fallback;
}

function applyPatch(
  entities: Record<string, HassEntity>,
  id: string,
  state?: string,
  attributes?: Record<string, AttrValue>,
): void {
  const ent = entities[id];
  if (!ent) return;
  if (state !== undefined) ent.state = state;
  if (attributes) ent.attributes = { ...ent.attributes, ...attributes };
}

function toggleEntity(ent: HassEntity): void {
  switch (ent.domain) {
    case "light":
    case "switch":
    case "fan": {
      const on = ent.state === "on";
      ent.state = on ? "off" : "on";
      if (ent.domain === "light") {
        const prev = num(ent.attributes.brightness, 140);
        ent.attributes.brightness = on ? 0 : prev || 160;
      }
      if (ent.domain === "fan" && !on) {
        ent.attributes.percentage = num(ent.attributes.percentage, 0) || 40;
      }
      break;
    }
    case "lock":
      ent.state = ent.state === "locked" ? "unlocked" : "locked";
      break;
    case "cover": {
      const open = ent.state === "open";
      ent.state = open ? "closed" : "open";
      ent.attributes.current_position = open ? 0 : 100;
      break;
    }
    case "vacuum":
      ent.state = ent.state === "cleaning" ? "docked" : "cleaning";
      break;
    case "media_player":
      if (ent.state === "playing") ent.state = "paused";
      else if (ent.state === "paused") ent.state = "playing";
      else {
        ent.state = "playing";
        ent.attributes.position = 0;
      }
      break;
    case "alarm_control_panel":
      ent.state = ent.state === "disarmed" ? "armed_home" : "disarmed";
      break;
    case "binary_sensor":
      ent.state = ent.state === "on" ? "off" : "on";
      break;
    default:
      break;
  }
}

function tickSimulator(state: HassState): void {
  const { entities, now } = state;
  const climate = entities["climate.lumen"];
  if (climate) {
    const current = num(climate.attributes.current_temperature, 22);
    const target = num(climate.attributes.temperature, 22);
    const next = current + (target - current) * 0.08 + (Math.sin(now / 4000) * 0.04);
    climate.attributes.current_temperature = Number(next.toFixed(2));
    const delta = next - target;
    climate.attributes.hvac_action =
      delta > 0.35 ? "cooling" : delta < -0.35 ? "heating" : "idle";
    const humidity = num(climate.attributes.humidity, 46) + (Math.random() - 0.5) * 0.4;
    climate.attributes.humidity = Number(Math.min(70, Math.max(30, humidity)).toFixed(1));
  }

  const weather = entities["weather.lumen_coast"];
  if (weather) {
    const temp = num(weather.attributes.temperature, 19) + (Math.random() - 0.5) * 0.12;
    weather.attributes.temperature = Number(temp.toFixed(1));
    const wind = num(weather.attributes.wind_speed, 14) + (Math.random() - 0.5) * 0.6;
    weather.attributes.wind_speed = Number(Math.max(2, wind).toFixed(1));
  }

  const media = entities["media_player.observatory_cinema"];
  if (media && media.state === "playing") {
    const duration = num(media.attributes.duration, 248);
    let pos = num(media.attributes.position, 0) + TICK_MS / 1000;
    if (pos >= duration) {
      const title = String(media.attributes.media_title ?? "");
      const idx = Math.max(0, QUEUE.findIndex((q) => q.title === title));
      const next = QUEUE[(idx + 1) % QUEUE.length];
      media.attributes.media_title = next.title;
      media.attributes.media_artist = next.artist;
      media.attributes.media_album = next.album;
      media.attributes.duration = next.duration;
      pos = 0;
    }
    media.attributes.position = Number(pos.toFixed(1));
  }

  const vacuum = entities["vacuum.nova"];
  if (vacuum && vacuum.state === "cleaning") {
    const battery = Math.max(8, num(vacuum.attributes.battery, 70) - 0.12);
    vacuum.attributes.battery = Number(battery.toFixed(1));
    vacuum.attributes.cleaned_m2 = Number(
      (num(vacuum.attributes.cleaned_m2, 30) + 0.35).toFixed(1),
    );
    if (battery < 12) vacuum.state = "returning";
  } else if (vacuum && vacuum.state === "returning") {
    const battery = Math.min(100, num(vacuum.attributes.battery, 12) + 0.4);
    vacuum.attributes.battery = Number(battery.toFixed(1));
    if (battery > 20 && Math.random() < 0.08) vacuum.state = "docked";
  } else if (vacuum && vacuum.state === "docked") {
    vacuum.attributes.battery = Number(
      Math.min(100, num(vacuum.attributes.battery, 80) + 0.5).toFixed(1),
    );
  }

  const solar = 2.2 + Math.max(0, Math.sin(now / 18000) * 2.4) + Math.random() * 0.15;
  const baseLoad =
    Object.values(entities).filter((x) => x.domain === "light" && x.state === "on").length *
      0.11 +
    (media?.state === "playing" ? 0.38 : 0.05) +
    0.9 +
    Math.random() * 0.2;
  const grid = Math.max(0.05, baseLoad - solar * 0.35);
  applyPatch(entities, "sensor.solar_kw", solar.toFixed(2));
  applyPatch(entities, "sensor.grid_kw", grid.toFixed(2));

  const batt = entities["sensor.battery_kwh"];
  if (batt) {
    const percent = Math.min(
      98,
      Math.max(12, num(batt.attributes.percent, 71) + (solar - baseLoad) * 0.04),
    );
    batt.attributes.percent = Number(percent.toFixed(1));
    batt.state = ((percent / 100) * num(batt.attributes.capacity, 20)).toFixed(1);
  }

  const lux = 280 + Math.sin(now / 9000) * 160 + Math.random() * 20;
  applyPatch(entities, "sensor.atrium_lux", String(Math.round(lux)));

  const spa = entities["sensor.water_temp"];
  if (spa) {
    const set = num(spa.attributes.setpoint, 39);
    const cur = num(Number(spa.state), 38.6);
    spa.state = (cur + (set - cur) * 0.05).toFixed(1);
  }

  const veil = entities["switch.water_veil"];
  if (veil && veil.state === "on") {
    veil.attributes.flow_lpm = Number((3.6 + Math.random() * 1.1).toFixed(1));
  }

  const camera = entities["camera.approach"];
  if (camera) {
    camera.attributes.motion = Math.random() < 0.04;
  }

  const rain = entities["binary_sensor.skydeck_rain"];
  if (rain && Math.random() < 0.015) {
    rain.state = rain.state === "on" ? "off" : "on";
    if (rain.state === "on") {
      state.alerts.unshift({
        id: `rain-${now}`,
        level: "info",
        text: "Skydeck rain grid armed — louvers can auto-seal",
        ts: now,
      });
    }
  }

  if (Math.random() < 0.02) {
    const roll = Math.random();
    if (roll < 0.4) {
      state.alerts.unshift({
        id: `grid-${now}`,
        level: "info",
        text: "Solar skin exceeding grid draw — house is net positive",
        ts: now,
      });
    } else if (roll < 0.75) {
      state.alerts.unshift({
        id: `nova-${now}`,
        level: "info",
        text: `NOVA mapped ${entities["vacuum.nova"]?.attributes.cleaned_m2 ?? 0} m² this cycle`,
        ts: now,
      });
    } else {
      state.alerts.unshift({
        id: `lux-${now}`,
        level: "warn",
        text: "Atrium lux dropped — chandelier compensating",
        ts: now,
      });
    }
  }

  state.alerts = state.alerts.slice(0, 8);
  state.energyHistory = [
    ...state.energyHistory.slice(-(HISTORY_MAX - 1)),
    { t: now, grid: Number(grid.toFixed(2)), solar: Number(solar.toFixed(2)) },
  ];
}

function reduce(state: HassState, action: Action): HassState {
  const next: HassState = {
    ...state,
    entities: cloneEntities(state.entities),
    alerts: [...state.alerts],
    energyHistory: [...state.energyHistory],
  };

  switch (action.type) {
    case "tick":
      next.now = Date.now();
      tickSimulator(next);
      break;
    case "selectRoom":
      next.selectedRoom = action.room;
      next.selectedEntityId = null;
      break;
    case "selectEntity":
      next.selectedEntityId = action.id;
      break;
    case "toggle": {
      const ent = next.entities[action.id];
      if (ent) toggleEntity(ent);
      break;
    }
    case "set":
      applyPatch(next.entities, action.id, action.state, action.attributes);
      break;
    case "setBrightness": {
      const light = next.entities[action.id];
      if (light?.domain === "light") {
        const brightness = Math.max(0, Math.min(255, action.brightness));
        light.state = brightness > 0 ? "on" : "off";
        light.attributes.brightness = brightness;
      }
      break;
    }
    case "nudgeClimate": {
      const climate = next.entities["climate.lumen"];
      if (climate) {
        const t = num(climate.attributes.temperature, 22) + action.delta;
        climate.attributes.temperature = Number(Math.max(16, Math.min(28, t)).toFixed(1));
      }
      break;
    }
    case "activateScene": {
      const patch = scenePatch(action.id, next.entities, next.now);
      for (const [id, p] of Object.entries(patch)) {
        applyPatch(next.entities, id, p.state, p.attributes);
      }
      next.alerts.unshift({
        id: `scene-${action.id}-${next.now}`,
        level: "info",
        text: `Scene ${next.entities[action.id]?.name ?? action.id} committed to habitat bus`,
        ts: next.now,
      });
      break;
    }
    case "dismissAlert":
      next.alerts = next.alerts.filter((a) => a.id !== action.id);
      break;
    default:
      break;
  }

  return next;
}

const now = Date.now();
let current: HassState = {
  entities: seedEntities(),
  selectedRoom: "whole",
  selectedEntityId: null,
  now,
  alerts: [
    {
      id: "boot",
      level: "info",
      text: "AETHER neural bus online — demo habitat, no live bindings",
      ts: now,
    },
  ],
  energyHistory: seedEnergy(now),
};

const listeners = new Set<() => void>();

export function getState(): HassState {
  return current;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function dispatch(action: Action): void {
  current = reduce(current, action);
  for (const fn of listeners) fn();
}

export function startLoop(): () => void {
  const id = globalThis.setInterval(() => dispatch({ type: "tick" }), TICK_MS);
  return () => globalThis.clearInterval(id);
}

export function entitiesInRoom(
  entities: Record<string, HassEntity>,
  room: RoomId,
): HassEntity[] {
  return Object.values(entities).filter((ent) => {
    if (ent.domain === "scene") return false;
    if (room === "whole") return true;
    return ent.room === room || ent.room === "whole";
  });
}

export function scenesOf(entities: Record<string, HassEntity>): HassEntity[] {
  return Object.values(entities).filter((ent) => ent.domain === "scene");
}
