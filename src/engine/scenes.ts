import type { HassEntity } from "./types";

type Patch = Partial<Pick<HassEntity, "state">> & {
  attributes?: Record<string, string | number | boolean | null>;
};

function lights(
  entities: Record<string, HassEntity>,
  brightness: number,
  extra: Record<string, number> = {},
): Record<string, Patch> {
  const patch: Record<string, Patch> = {};
  for (const ent of Object.values(entities)) {
    if (ent.domain !== "light") continue;
    const b = extra[ent.entity_id] ?? brightness;
    patch[ent.entity_id] = {
      state: b > 0 ? "on" : "off",
      attributes: { ...ent.attributes, brightness: b },
    };
  }
  return patch;
}

export function scenePatch(
  id: string,
  entities: Record<string, HassEntity>,
  now: number,
): Record<string, Patch> {
  const stamp = { last_activated: now };
  switch (id) {
    case "scene.nightfall":
      return {
        ...lights(entities, 18, {
          "light.sanctum_bed": 42,
          "light.atrium_chandelier": 22,
          "light.observatory_cove": 12,
          "light.galley_task": 0,
          "light.lab_bench": 0,
          "light.skydeck_lanterns": 40,
        }),
        "climate.lumen": {
          attributes: { temperature: 20.5, hvac_action: "cooling" },
        },
        "lock.front_portal": { state: "locked" },
        "cover.skydeck_louvers": {
          state: "closed",
          attributes: { current_position: 8, tilt: 0 },
        },
        "media_player.observatory_cinema": { state: "paused" },
        "alarm_control_panel.lumen": { state: "armed_night" },
        "fan.sanctum_air": {
          state: "on",
          attributes: { percentage: 22, preset: "sleep", oscillating: true },
        },
        "scene.nightfall": { attributes: stamp },
      };
    case "scene.cinema":
      return {
        ...lights(entities, 0, {
          "light.observatory_cove": 28,
          "light.atrium_chandelier": 10,
        }),
        "media_player.observatory_cinema": {
          state: "playing",
          attributes: { volume_level: 0.58 },
        },
        "cover.skydeck_louvers": {
          state: "closed",
          attributes: { current_position: 0, tilt: 0 },
        },
        "scene.cinema": { attributes: stamp },
      };
    case "scene.away":
      return {
        ...lights(entities, 0),
        "lock.front_portal": { state: "locked" },
        "alarm_control_panel.lumen": { state: "armed_away" },
        "climate.lumen": {
          attributes: { temperature: 18, hvac_action: "idle" },
        },
        "media_player.observatory_cinema": { state: "off" },
        "vacuum.nova": {
          state: "cleaning",
          attributes: { area: "Whole home" },
        },
        "switch.water_veil": { state: "off" },
        "switch.lab_ionizer": { state: "off" },
        "person.aria": { state: "away", attributes: { location: "Transit" } },
        "person.kai": { state: "away", attributes: { location: "Transit" } },
        "scene.away": { attributes: stamp },
      };
    case "scene.sunrise":
      return {
        ...lights(entities, 160, {
          "light.sanctum_bed": 200,
          "light.skydeck_lanterns": 0,
          "light.aqua_caustics": 70,
        }),
        "cover.skydeck_louvers": {
          state: "open",
          attributes: { current_position: 100, tilt: 40 },
        },
        "climate.lumen": {
          attributes: { temperature: 22, hvac_action: "heating" },
        },
        "alarm_control_panel.lumen": { state: "disarmed" },
        "media_player.observatory_cinema": {
          state: "playing",
          attributes: {
            media_title: "Cyan Harbor",
            media_artist: "AETHER OS",
            media_album: "House Tones",
            position: 0,
            duration: 180,
            volume_level: 0.28,
          },
        },
        "scene.sunrise": { attributes: stamp },
      };
    case "scene.party":
      return {
        ...lights(entities, 200, {
          "light.observatory_cove": 255,
          "light.aqua_caustics": 180,
          "light.skydeck_lanterns": 210,
        }),
        "media_player.observatory_cinema": {
          state: "playing",
          attributes: { volume_level: 0.72, shuffle: true },
        },
        "switch.water_veil": { state: "on" },
        "alarm_control_panel.lumen": { state: "disarmed" },
        "scene.party": { attributes: stamp },
      };
    default:
      return {};
  }
}
