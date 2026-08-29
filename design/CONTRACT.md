# AETHER — Lumen House OS

Futuristic Home Assistant dashboard demo. No real HA connection. Mock entities tick live.

## Product

- Name in UI: **AETHER**
- House: **Lumen House** — a coastal penthouse
- Tagline: `NEURAL HABITAT CONTROL`
- Demo mode banner is allowed but must feel like a HUD status chip, not a website ribbon.

## Stack (locked)

- Vite 6 + React 18 + TypeScript
- No UI component library
- No Home Assistant websocket
- Fonts via Google Fonts in `index.html`:
  - Display: `Orbitron`
  - UI: `Rajdhani`
  - Telemetry: `Share Tech Mono`
- App root: `/workspace`
- Entry: `src/main.tsx` → `src/App.tsx`

## Visual language (locked tokens)

Use these CSS custom properties in `:root`. Do not rename.

```css
:root {
  --bg-0: #04060c;
  --bg-1: #070b16;
  --panel: rgba(10, 18, 34, 0.62);
  --panel-2: rgba(8, 14, 28, 0.82);
  --stroke: rgba(120, 220, 255, 0.18);
  --stroke-hot: rgba(77, 251, 255, 0.55);
  --cyan: #4dfbff;
  --cyan-dim: rgba(77, 251, 255, 0.14);
  --violet: #b56bff;
  --magenta: #ff2bd6;
  --amber: #ffb020;
  --lime: #3dff9a;
  --red: #ff4d6d;
  --text: #e9f6ff;
  --muted: rgba(190, 220, 240, 0.58);
  --shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  --radius: 18px;
  --radius-sm: 12px;
  --font-display: "Orbitron", sans-serif;
  --font-ui: "Rajdhani", sans-serif;
  --font-mono: "Share Tech Mono", monospace;
}
```

Feel: orbital HUD / glass cockpit. Deep space black, aurora washes (cyan + violet), hairline neon strokes, faint hex grid, scanline overlay at ~4% opacity. Motion is smooth, expensive, never cartoonish. No Comic Sans, no rounded pastel iOS cards, no generic Tailwind purple gradient hero.

## Layout (locked)

Full viewport, no page scroll on desktop (inner panels may scroll).

```
┌─────────────────────────────────────────────────────────────┐
│ TOPBAR: mark · clock · weather chip · presence · power draw │
├──────┬──────────────────────────────────────────┬───────────┤
│ RAIL │ HERO                                     │ INSPECTOR │
│ rooms│ climate + weather + floor presence       │ energy    │
│      │ entity mosaic (filters by room)          │ media     │
│ scenes                                          │ security  │
│      │                                          │ camera    │
├──────┴──────────────────────────────────────────┴───────────┤
│ COMMAND: assistant orb + suggestion chips + alerts ticker   │
└─────────────────────────────────────────────────────────────┘
```

Breakpoints:
- ≥1280px: 3-column as above
- 768–1279: hide inspector in a slide-over; keep rail collapsed to icons
- <768: bottom room tabs, stacked cards

## Engine API (locked)

`src/engine/types.ts` and `src/engine/store.ts` own all state.

```ts
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

export interface HassEntity {
  entity_id: string;
  domain: Domain;
  room: RoomId;
  name: string;
  state: string;
  unit?: string;
  attributes: Record<string, string | number | boolean | null>;
  icon: string; // lucide-style key OR emoji-free short token
}

export interface HassState {
  entities: Record<string, HassEntity>;
  selectedRoom: RoomId;
  selectedEntityId: string | null;
  now: number;
  alerts: Array<{ id: string; level: "info" | "warn" | "crit"; text: string; ts: number }>;
}
```

Store must expose:

- `getState(): HassState`
- `subscribe(fn: () => void): () => void`
- `dispatch(action)` where actions include:
  - `{ type: "tick" }`
  - `{ type: "selectRoom", room: RoomId }`
  - `{ type: "selectEntity", id: string | null }`
  - `{ type: "toggle", id: string }`
  - `{ type: "set", id: string, state?: string, attributes?: Partial<HassEntity["attributes"]> }`
  - `{ type: "activateScene", id: string }`
  - `{ type: "dismissAlert", id: string }`

Tick every 900ms. Simulator must drift climate, energy, solar, media position, vacuum, weather wind, and occasionally emit alerts. Toggles must be instant and optimistic.

## Rooms

| id | label | vibe |
|----|-------|------|
| whole | Entire House | overview |
| atrium | Atrium | entry chandelier, lock, alarm |
| observatory | Observatory | living / cinema |
| galley | Galley | kitchen |
| sanctum | Sanctum | bedroom |
| aqua | Aqua | bath / spa |
| skydeck | Skydeck | terrace |
| lab | Neural Lab | office / garage lab |

## Required entities (minimum)

Must exist with HA-like `entity_id`s:

Lights: `light.atrium_chandelier`, `light.observatory_cove`, `light.galley_task`, `light.sanctum_bed`, `light.aqua_caustics`, `light.skydeck_lanterns`, `light.lab_bench`
Climate: `climate.lumen` (heat_cool, current/target, humidity)
Weather: `weather.lumen_coast`
Media: `media_player.observatory_cinema` (playing a fictional track)
Lock: `lock.front_portal`
Cover: `cover.skydeck_louvers`
Fan: `fan.sanctum_air`
Switch: `switch.water_veil`, `switch.lab_ionizer`
Vacuum: `vacuum.nova`
Binary: `binary_sensor.garage_beam`, `binary_sensor.skydeck_rain`
Sensors: `sensor.grid_kw`, `sensor.solar_kw`, `sensor.battery_kwh`, `sensor.atrium_lux`, `sensor.water_temp`
Camera: `camera.approach` (no real video — generated HUD feed)
People: `person.aria`, `person.kai`
Alarm: `alarm_control_panel.lumen`
Scenes: `scene.nightfall`, `scene.cinema`, `scene.away`, `scene.sunrise`, `scene.party`

Scenes must actually change multiple entity states.

## Interaction

Every control is live in the demo:

- Light cards: toggle + brightness
- Climate: target ±
- Media: play/pause, skip (skips mock queue)
- Lock / alarm / covers / switches / vacuum start-return
- Room filter reshapes the mosaic
- Clicking an entity opens inspector details
- Command bar chips trigger scenes or “all lights off”

## Quality bar

Looks like a product trailer HUD, not a Bootstrap admin. Density with breathing room. Numbers use mono. Labels uppercase tracking. Hover states glow. Active room has a cyan tick.
