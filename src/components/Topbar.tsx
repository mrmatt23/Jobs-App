import type { HassEntity } from "../engine/types";
import { asNumber, formatClock, titleState } from "../lib/format";

interface TopbarProps {
  entities: Record<string, HassEntity>;
  now: number;
  inspectOpen: boolean;
  onToggleInspect: () => void;
}

export function Topbar({ entities, now, inspectOpen, onToggleInspect }: TopbarProps) {
  const clock = formatClock(now);
  const weather = entities["weather.lumen_coast"];
  const aria = entities["person.aria"];
  const kai = entities["person.kai"];
  const grid = entities["sensor.grid_kw"];
  const solar = entities["sensor.solar_kw"];
  const gridKw = asNumber(grid?.state);
  const solarKw = asNumber(solar?.state);
  const solarWins = solarKw > gridKw;

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div>
          <div className="topbar__mark display">AETHER</div>
          <div className="kicker">LUMEN HOUSE OS / NEURAL HABITAT CONTROL</div>
        </div>
      </div>

      <div className="topbar__meta">
        <div className="topbar__clock">
          <div className="readout">{clock.time}</div>
          <div className="kicker">
            {clock.date} · {clock.zone}
          </div>
        </div>

        {weather && (
          <div className="topbar__chip chip chip--cyan">
            <span className="kicker">{titleState(weather.state)}</span>
            <span className="readout">
              {asNumber(weather.attributes.temperature).toFixed(1)}°
            </span>
            <span className="kicker">
              {asNumber(weather.attributes.wind_speed).toFixed(0)} kn
            </span>
          </div>
        )}

        <div className="topbar__presence">
          {aria && (
            <span className="topbar__chip chip">
              <span className="kicker">{aria.name}</span>
              <span className="readout">{String(aria.attributes.location ?? "—")}</span>
            </span>
          )}
          {kai && (
            <span className="topbar__chip chip">
              <span className="kicker">{kai.name}</span>
              <span className="readout">{String(kai.attributes.location ?? "—")}</span>
            </span>
          )}
        </div>

        <div className={`topbar__chip chip ${solarWins ? "chip--cyan" : ""}`}>
          <span className="kicker">GRID</span>
          <span className="readout">{gridKw.toFixed(2)} kW</span>
          <span className="kicker">SOLAR</span>
          <span
            className="readout"
            style={solarWins ? { color: "var(--lime)" } : undefined}
          >
            {solarKw.toFixed(2)} kW
          </span>
        </div>
        <button
          type="button"
          className={`chip ${inspectOpen ? "chip--cyan" : "chip--violet"} inspect-toggle`}
          aria-label={inspectOpen ? "Close inspector" : "Open inspector"}
          aria-pressed={inspectOpen}
          onClick={onToggleInspect}
        >
          SYS
        </button>
      </div>
    </header>
  );
}
