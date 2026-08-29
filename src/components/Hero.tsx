import type { Action, HassEntity } from "../engine/types";
import { asNumber, titleState } from "../lib/format";
import { PresenceMap } from "./PresenceMap";

interface HeroProps {
  entities: Record<string, HassEntity>;
  dispatch: (action: Action) => void;
}

export function Hero({ entities, dispatch }: HeroProps) {
  const climate = entities["climate.lumen"];
  const weather = entities["weather.lumen_coast"];
  const aria = entities["person.aria"];
  const kai = entities["person.kai"];

  const current = asNumber(climate?.attributes.current_temperature, 22);
  const target = asNumber(climate?.attributes.temperature, 22);
  const humidity = asNumber(climate?.attributes.humidity, 46);
  const hvac = String(climate?.attributes.hvac_action ?? "idle");

  const persons = [aria, kai].filter((p): p is HassEntity => Boolean(p));

  return (
    <section className="hero" aria-label="Climate and presence">
      <div className="hero__climate">
        <div className="kicker">Climate Core</div>
        <div className="display readout">
          {current.toFixed(1)}°
        </div>
        <div className="stepper">
          <button
            type="button"
            className="stepper__btn"
            aria-label="Lower target temperature"
            onClick={() => dispatch({ type: "nudgeClimate", delta: -0.5 })}
          >
            −
          </button>
          <span className="readout">{target.toFixed(1)}°</span>
          <button
            type="button"
            className="stepper__btn"
            aria-label="Raise target temperature"
            onClick={() => dispatch({ type: "nudgeClimate", delta: 0.5 })}
          >
            +
          </button>
        </div>
        <div className="kicker">
          {hvac.toUpperCase()} · {humidity.toFixed(0)}% RH
        </div>
      </div>

      {weather && (
        <div className="hero__weather">
          <span className="kicker">Exterior</span>
          <span className="readout">
            {titleState(weather.state)} · {asNumber(weather.attributes.temperature).toFixed(1)}° ·{" "}
            {asNumber(weather.attributes.wind_speed).toFixed(0)} kn
          </span>
          <span className="kicker">{String(weather.attributes.forecast ?? "")}</span>
        </div>
      )}

      <div className="hero__map">
        <PresenceMap persons={persons} />
      </div>
    </section>
  );
}
