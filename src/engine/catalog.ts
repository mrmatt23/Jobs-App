import type { EnergySample, HassEntity } from "./types";

function e(
  entity_id: string,
  rest: Omit<HassEntity, "entity_id" | "domain"> & { domain?: HassEntity["domain"] },
): HassEntity {
  const domain = rest.domain ?? (entity_id.split(".")[0] as HassEntity["domain"]);
  return { entity_id, domain, ...rest };
}

export function seedEntities(): Record<string, HassEntity> {
  const list: HassEntity[] = [
    e("light.atrium_chandelier", {
      room: "atrium",
      name: "Chandelier",
      state: "on",
      icon: "chandelier",
      attributes: { brightness: 168, color_temp: 380, rgb: "255,214,170" },
    }),
    e("light.observatory_cove", {
      room: "observatory",
      name: "Cove Wash",
      state: "on",
      icon: "lightbulb",
      attributes: { brightness: 132, color_temp: 420, rgb: "120,210,255" },
    }),
    e("light.galley_task", {
      room: "galley",
      name: "Task Array",
      state: "on",
      icon: "lightbulb",
      attributes: { brightness: 210, color_temp: 340, rgb: "255,244,220" },
    }),
    e("light.sanctum_bed", {
      room: "sanctum",
      name: "Bed Halo",
      state: "off",
      icon: "lightbulb",
      attributes: { brightness: 0, color_temp: 480, rgb: "255,160,200" },
    }),
    e("light.aqua_caustics", {
      room: "aqua",
      name: "Caustics",
      state: "on",
      icon: "waves",
      attributes: { brightness: 90, color_temp: 500, rgb: "80,255,220" },
    }),
    e("light.skydeck_lanterns", {
      room: "skydeck",
      name: "Lanterns",
      state: "off",
      icon: "lamp",
      attributes: { brightness: 0, color_temp: 360, rgb: "255,180,90" },
    }),
    e("light.lab_bench", {
      room: "lab",
      name: "Bench Lattice",
      state: "on",
      icon: "cpu",
      attributes: { brightness: 188, color_temp: 300, rgb: "180,255,255" },
    }),
    e("climate.lumen", {
      room: "whole",
      name: "Climate Core",
      state: "heat_cool",
      icon: "thermometer",
      unit: "°C",
      attributes: {
        current_temperature: 22.4,
        temperature: 22,
        target_temp_high: 23.5,
        target_temp_low: 20.5,
        humidity: 46,
        hvac_action: "idle",
        fan_mode: "auto",
      },
    }),
    e("weather.lumen_coast", {
      room: "whole",
      name: "Lumen Coast",
      state: "partlycloudy",
      icon: "cloud-sun",
      unit: "°C",
      attributes: {
        temperature: 19.6,
        humidity: 62,
        wind_speed: 14,
        wind_bearing: 248,
        pressure: 1014,
        forecast: "marine layer thinning after 21:00",
      },
    }),
    e("media_player.observatory_cinema", {
      room: "observatory",
      name: "Cinema Wall",
      state: "playing",
      icon: "play",
      attributes: {
        media_title: "Midnight Circuit",
        media_artist: "Vesper Array",
        media_album: "Glass Harbor",
        volume_level: 0.42,
        position: 146,
        duration: 248,
        source: "AETHERSTREAM",
        shuffle: false,
      },
    }),
    e("lock.front_portal", {
      room: "atrium",
      name: "Front Portal",
      state: "locked",
      icon: "lock",
      attributes: { last_user: "Aria", code_set: true },
    }),
    e("cover.skydeck_louvers", {
      room: "skydeck",
      name: "Louvers",
      state: "open",
      icon: "blinds",
      attributes: { current_position: 82, tilt: 24 },
    }),
    e("fan.sanctum_air", {
      room: "sanctum",
      name: "Air Ribbon",
      state: "on",
      icon: "fan",
      attributes: { percentage: 35, oscillating: true, preset: "sleep" },
    }),
    e("switch.water_veil", {
      room: "aqua",
      name: "Water Veil",
      state: "on",
      icon: "droplets",
      attributes: { flow_lpm: 4.2 },
    }),
    e("switch.lab_ionizer", {
      room: "lab",
      name: "Ionizer",
      state: "on",
      icon: "sparkles",
      attributes: { ppm: 18 },
    }),
    e("vacuum.nova", {
      room: "whole",
      name: "NOVA Sweep",
      state: "cleaning",
      icon: "robot",
      attributes: { battery: 71, area: "Observatory", fan_speed: "turbo", cleaned_m2: 38 },
    }),
    e("binary_sensor.garage_beam", {
      room: "lab",
      name: "Lab Beam",
      state: "off",
      icon: "scan",
      attributes: { device_class: "occupancy" },
    }),
    e("binary_sensor.skydeck_rain", {
      room: "skydeck",
      name: "Rain Grid",
      state: "off",
      icon: "cloud-rain",
      attributes: { device_class: "moisture" },
    }),
    e("sensor.grid_kw", {
      room: "whole",
      name: "Grid Draw",
      state: "2.41",
      unit: "kW",
      icon: "zap",
      attributes: { min: 0.4, max: 8.2 },
    }),
    e("sensor.solar_kw", {
      room: "skydeck",
      name: "Solar Skin",
      state: "3.86",
      unit: "kW",
      icon: "sun",
      attributes: { min: 0, max: 7.4 },
    }),
    e("sensor.battery_kwh", {
      room: "lab",
      name: "Buffer Cell",
      state: "14.2",
      unit: "kWh",
      icon: "battery",
      attributes: { capacity: 20, percent: 71 },
    }),
    e("sensor.atrium_lux", {
      room: "atrium",
      name: "Atrium Lux",
      state: "420",
      unit: "lx",
      icon: "sun-dim",
      attributes: {},
    }),
    e("sensor.water_temp", {
      room: "aqua",
      name: "Spa Thermal",
      state: "38.6",
      unit: "°C",
      icon: "bath",
      attributes: { setpoint: 39 },
    }),
    e("camera.approach", {
      room: "atrium",
      name: "Approach",
      state: "recording",
      icon: "video",
      attributes: { fps: 24, motion: false, codec: "HEVC" },
    }),
    e("person.aria", {
      room: "observatory",
      name: "Aria",
      state: "home",
      icon: "user",
      attributes: { location: "Observatory", eta: null, device: "Aria-Band" },
    }),
    e("person.kai", {
      room: "lab",
      name: "Kai",
      state: "home",
      icon: "user",
      attributes: { location: "Neural Lab", eta: null, device: "Kai-Lens" },
    }),
    e("alarm_control_panel.lumen", {
      room: "atrium",
      name: "Perimeter",
      state: "disarmed",
      icon: "shield",
      attributes: { code_arm_required: true, changed_by: "Aria" },
    }),
    e("scene.nightfall", {
      room: "whole",
      name: "Nightfall",
      state: "scening",
      icon: "moon",
      attributes: { last_activated: null },
    }),
    e("scene.cinema", {
      room: "observatory",
      name: "Cinema",
      state: "scening",
      icon: "clapperboard",
      attributes: { last_activated: null },
    }),
    e("scene.away", {
      room: "whole",
      name: "Away Protocol",
      state: "scening",
      icon: "plane",
      attributes: { last_activated: null },
    }),
    e("scene.sunrise", {
      room: "whole",
      name: "Sunrise",
      state: "scening",
      icon: "sunrise",
      attributes: { last_activated: null },
    }),
    e("scene.party", {
      room: "observatory",
      name: "Harbor Pulse",
      state: "scening",
      icon: "party-popper",
      attributes: { last_activated: null },
    }),
  ];

  return Object.fromEntries(list.map((ent) => [ent.entity_id, ent]));
}

export function seedEnergy(now: number): EnergySample[] {
  const out: EnergySample[] = [];
  for (let i = 48; i >= 0; i -= 1) {
    const t = now - i * 900;
    const solar = Math.max(0, 3.2 + Math.sin(i / 6) * 1.4 - i * 0.01);
    const grid = Math.max(0.2, 2.1 + Math.cos(i / 5) * 0.7 - solar * 0.15);
    out.push({ t, grid: Number(grid.toFixed(2)), solar: Number(solar.toFixed(2)) });
  }
  return out;
}

export const QUEUE = [
  { title: "Midnight Circuit", artist: "Vesper Array", album: "Glass Harbor", duration: 248 },
  { title: "Ion Garden", artist: "Nara Voss", album: "Ion Garden", duration: 196 },
  { title: "Below the Helipad", artist: "Soft Radar", album: "Verticals", duration: 221 },
  { title: "Cyan Harbor", artist: "AETHER OS", album: "House Tones", duration: 180 },
];
