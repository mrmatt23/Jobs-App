import { useState, type FormEvent } from "react";
import type { Action, Alert, HassEntity } from "../engine/types";

interface CommandBarProps {
  entities: Record<string, HassEntity>;
  alerts: Alert[];
  dispatch: (action: Action) => void;
}

const SCENE_KEYWORDS: { needle: string; id: string }[] = [
  { needle: "night", id: "scene.nightfall" },
  { needle: "cinema", id: "scene.cinema" },
  { needle: "away", id: "scene.away" },
  { needle: "sunrise", id: "scene.sunrise" },
  { needle: "party", id: "scene.party" },
];

function lightsOff(entities: Record<string, HassEntity>, dispatch: (a: Action) => void) {
  for (const ent of Object.values(entities)) {
    if (ent.domain === "light" && ent.state === "on") {
      dispatch({ type: "set", id: ent.entity_id, state: "off", attributes: { brightness: 0 } });
    }
  }
}

function runDirective(
  text: string,
  entities: Record<string, HassEntity>,
  dispatch: (a: Action) => void,
) {
  const lower = text.toLowerCase();
  if (lower.includes("lights off") || lower.includes("all lights")) {
    lightsOff(entities, dispatch);
    return;
  }
  if (lower.includes("seal") || lower.includes("lock")) {
    dispatch({ type: "set", id: "lock.front_portal", state: "locked" });
    return;
  }
  for (const { needle, id } of SCENE_KEYWORDS) {
    if (lower.includes(needle)) {
      dispatch({ type: "activateScene", id });
      return;
    }
  }
  dispatch({ type: "activateScene", id: "scene.nightfall" });
}

export function CommandBar({ entities, alerts, dispatch }: CommandBarProps) {
  const [value, setValue] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    runDirective(text, entities, dispatch);
    setValue("");
  };

  return (
    <footer className="command" aria-label="Command bar">
      <div className="orb orb--pulse" aria-hidden="true" />

      <form className="cmd" onSubmit={onSubmit}>
        <input
          className="cmd__input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Speak or type a directive…"
          aria-label="Command directive"
        />
      </form>

      <div className="command__chips">
        <button
          type="button"
          className="chip chip--violet"
          aria-label="Activate Nightfall scene"
          onClick={() => dispatch({ type: "activateScene", id: "scene.nightfall" })}
        >
          Nightfall
        </button>
        <button
          type="button"
          className="chip chip--violet"
          aria-label="Activate Cinema scene"
          onClick={() => dispatch({ type: "activateScene", id: "scene.cinema" })}
        >
          Cinema
        </button>
        <button
          type="button"
          className="chip chip--violet"
          aria-label="Activate Away scene"
          onClick={() => dispatch({ type: "activateScene", id: "scene.away" })}
        >
          Away
        </button>
        <button
          type="button"
          className="chip chip--cyan"
          aria-label="Turn all lights off"
          onClick={() => lightsOff(entities, dispatch)}
        >
          All lights off
        </button>
        <button
          type="button"
          className="chip chip--warn"
          aria-label="Seal front portal lock"
          onClick={() => dispatch({ type: "set", id: "lock.front_portal", state: "locked" })}
        >
          Seal portal
        </button>
      </div>

      <div className="ticker" aria-label="Alerts">
        {alerts.map((alert) => (
          <button
            key={alert.id}
            type="button"
            className={`ticker__item chip chip--${alert.level === "info" ? "cyan" : alert.level === "warn" ? "warn" : "crit"}`}
            aria-label={`Dismiss alert: ${alert.text}`}
            onClick={() => dispatch({ type: "dismissAlert", id: alert.id })}
          >
            {alert.text}
          </button>
        ))}
      </div>
    </footer>
  );
}
