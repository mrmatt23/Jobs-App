import type { MouseEvent } from "react";
import type { Action, Domain, HassEntity } from "../engine/types";
import { asNumber, brightnessPct, formatDuration, titleState } from "../lib/format";
import { iconOf } from "../lib/icons";

interface EntityCardProps {
  entity: HassEntity;
  selected: boolean;
  dispatch: (action: Action) => void;
}

const ON_STATES = new Set([
  "on",
  "open",
  "unlocked",
  "playing",
  "cleaning",
  "recording",
  "home",
]);

function domainClass(domain: Domain): string {
  switch (domain) {
    case "light":
      return "card--light";
    case "climate":
      return "card--climate";
    case "media_player":
      return "card--media";
    case "sensor":
    case "binary_sensor":
      return "card--sensor";
    case "scene":
      return "card--scene";
    default:
      return "";
  }
}

function isOn(entity: HassEntity): boolean {
  return ON_STATES.has(entity.state);
}

export function EntityCard({ entity, selected, dispatch }: EntityCardProps) {
  const Icon = iconOf(entity.icon);
  const on = isOn(entity);
  const classes = [
    "card",
    on ? "card--on" : "card--off",
    selected ? "card--selected" : "",
    domainClass(entity.domain),
  ]
    .filter(Boolean)
    .join(" ");

  const select = () => dispatch({ type: "selectEntity", id: entity.entity_id });

  const toggle = (e: MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "toggle", id: entity.entity_id });
  };

  const brightness = asNumber(entity.attributes.brightness, 0);
  const mediaPos = asNumber(entity.attributes.position, 0);
  const mediaDur = asNumber(entity.attributes.duration, 1);
  const progress = Math.min(100, (mediaPos / Math.max(mediaDur, 1)) * 100);

  return (
    <article className={classes} onClick={select}>
      <div className="card__head">
        <button
          type="button"
          className="card__icon"
          aria-label={`Toggle ${entity.name}`}
          onClick={toggle}
        >
          <Icon
            size={18}
            strokeWidth={1.5}
            aria-hidden="true"
            style={
              entity.domain === "light" && on
                ? { opacity: Math.max(0.35, brightness / 255) }
                : undefined
            }
          />
        </button>
        <div>
          <div className="card__name">{entity.name}</div>
          <div className="card__id">{entity.entity_id}</div>
        </div>
        <button
          type="button"
          className="card__state readout"
          aria-label={`${entity.name} state ${entity.state}`}
          onClick={
            entity.domain === "light" ||
            entity.domain === "switch" ||
            entity.domain === "fan" ||
            entity.domain === "lock" ||
            entity.domain === "cover" ||
            entity.domain === "media_player" ||
            entity.domain === "vacuum" ||
            entity.domain === "alarm_control_panel"
              ? toggle
              : undefined
          }
        >
          {titleState(entity.state)}
          {entity.unit ? ` ${entity.unit}` : ""}
        </button>
      </div>

      {entity.domain === "light" && (
        <input
          className="slider"
          type="range"
          min={0}
          max={255}
          value={brightness}
          aria-label={`${entity.name} brightness`}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            dispatch({
              type: "setBrightness",
              id: entity.entity_id,
              brightness: Number(e.target.value),
            });
          }}
        />
      )}

      {entity.domain === "light" && on && (
        <div className="kicker">{brightnessPct(brightness)}%</div>
      )}

      {entity.domain === "media_player" && (
        <div>
          <div className="kicker">
            {String(entity.attributes.media_title ?? "—")} ·{" "}
            {String(entity.attributes.media_artist ?? "")}
          </div>
          <div
            className="slider"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Media progress"
            style={{
              height: 4,
              width: "100%",
              background: "rgba(120,220,255,0.12)",
              position: "relative",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--cyan)",
              }}
            />
          </div>
          <div className="readout">
            {formatDuration(mediaPos)} / {formatDuration(mediaDur)}
          </div>
        </div>
      )}
    </article>
  );
}
