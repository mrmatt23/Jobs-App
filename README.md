# AETHER · Lumen House

A sleek, futuristic **Home Assistant** dashboard demo. Nothing is connected yet — a mock habitat bus ticks live so the UI can be demoed immediately.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm test    # mock entity engine
npm run build
```

## Demo habitat

**Lumen House** is a coastal penthouse. Entities are invented (`light.atrium_chandelier`, `climate.lumen`, `vacuum.nova`, scenes, people, energy, camera HUD, and more). Values drift on a 900ms tick. Toggles, brightness, climate steppers, scenes, and the command bar all mutate local state only.

Try:

- Room rail to filter the mosaic
- Light icon / brightness sliders
- Climate ±
- Scenes: Nightfall, Cinema, Away, Sunrise, Harbor Pulse
- Command: `cinema`, `lights off`, `seal portal`
- SYS chip (narrow viewports) to slide the inspector

## Stack

Vite · React · TypeScript · pure CSS HUD (no component library, no HA websocket).
