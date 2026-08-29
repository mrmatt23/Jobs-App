import type { Action, EnergySample, HassEntity } from "../engine/types";
import { asNumber, formatDuration } from "../lib/format";
import { iconOf } from "../lib/icons";
import { CameraFeed } from "./CameraFeed";
import { EnergyChart } from "./EnergyChart";

interface InspectorProps {
  entities: Record<string, HassEntity>;
  selectedEntityId: string | null;
  energyHistory: EnergySample[];
  now: number;
  dispatch: (action: Action) => void;
}

function AttrList({ entity }: { entity: HassEntity }) {
  return (
    <dl>
      {Object.entries(entity.attributes).map(([key, value]) => (
        <div key={key}>
          <dt className="kicker">{key}</dt>
          <dd className="readout">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function SelectedPanel({
  entity,
  now,
  dispatch,
}: {
  entity: HassEntity;
  now: number;
  dispatch: (action: Action) => void;
}) {
  const Icon = iconOf(entity.icon);

  return (
    <div>
      <div className="card__head">
        <span className="card__icon" aria-hidden="true">
          <Icon size={18} strokeWidth={1.5} />
        </span>
        <div>
          <div className="card__name display">{entity.name}</div>
          <div className="card__id">{entity.entity_id}</div>
        </div>
        <span className="card__state readout">{entity.state}</span>
      </div>

      <AttrList entity={entity} />

      {(entity.domain === "light" ||
        entity.domain === "switch" ||
        entity.domain === "fan" ||
        entity.domain === "lock" ||
        entity.domain === "cover" ||
        entity.domain === "vacuum" ||
        entity.domain === "media_player" ||
        entity.domain === "alarm_control_panel") && (
        <button
          type="button"
          className="chip chip--cyan"
          aria-label={`Toggle ${entity.name}`}
          onClick={() => dispatch({ type: "toggle", id: entity.entity_id })}
        >
          Toggle
        </button>
      )}

      {entity.domain === "light" && (
        <input
          className="slider"
          type="range"
          min={0}
          max={255}
          value={asNumber(entity.attributes.brightness, 0)}
          aria-label={`${entity.name} brightness`}
          onChange={(e) =>
            dispatch({
              type: "setBrightness",
              id: entity.entity_id,
              brightness: Number(e.target.value),
            })
          }
        />
      )}

      {entity.domain === "camera" && <CameraFeed entity={entity} now={now} />}
    </div>
  );
}

function DefaultStack({
  entities,
  energyHistory,
  now,
  dispatch,
}: {
  entities: Record<string, HassEntity>;
  energyHistory: EnergySample[];
  now: number;
  dispatch: (action: Action) => void;
}) {
  const media = entities["media_player.observatory_cinema"];
  const camera = entities["camera.approach"];
  const lock = entities["lock.front_portal"];
  const alarm = entities["alarm_control_panel.lumen"];
  const vacuum = entities["vacuum.nova"];

  const mediaPos = asNumber(media?.attributes.position, 0);
  const mediaDur = asNumber(media?.attributes.duration, 1);
  const progress = Math.min(100, (mediaPos / Math.max(mediaDur, 1)) * 100);
  const volume = asNumber(media?.attributes.volume_level, 0);

  return (
    <>
      <div>
        <div className="kicker">Energy bus</div>
        <EnergyChart history={energyHistory} />
      </div>

      {media && (
        <div>
          <div className="kicker">Now playing</div>
          <div className="card__name">{String(media.attributes.media_title ?? "—")}</div>
          <div className="kicker">
            {String(media.attributes.media_artist ?? "")} ·{" "}
            {String(media.attributes.media_album ?? "")}
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Media progress"
            style={{
              height: 4,
              width: "100%",
              background: "rgba(120,220,255,0.12)",
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
            {formatDuration(mediaPos)} / {formatDuration(mediaDur)} · VOL{" "}
            {Math.round(volume * 100)}%
          </div>
          <button
            type="button"
            className="chip chip--violet"
            aria-label={media.state === "playing" ? "Pause media" : "Play media"}
            onClick={() => dispatch({ type: "toggle", id: media.entity_id })}
          >
            {media.state === "playing" ? "Pause" : "Play"}
          </button>
        </div>
      )}

      {camera && <CameraFeed entity={camera} now={now} />}

      <div>
        <div className="kicker">Security</div>
        {lock && (
          <button
            type="button"
            className={`chip ${lock.state === "locked" ? "chip--cyan" : "chip--warn"}`}
            aria-label={`Toggle ${lock.name}`}
            onClick={() => dispatch({ type: "toggle", id: lock.entity_id })}
          >
            {lock.name}: {lock.state}
          </button>
        )}
        {alarm && (
          <button
            type="button"
            className={`chip ${alarm.state === "disarmed" ? "chip--warn" : "chip--cyan"}`}
            aria-label={`Toggle ${alarm.name}`}
            onClick={() => dispatch({ type: "toggle", id: alarm.entity_id })}
          >
            {alarm.name}: {alarm.state}
          </button>
        )}
      </div>

      {vacuum && (
        <div>
          <div className="kicker">NOVA</div>
          <div className="readout">{vacuum.state}</div>
          <div className="kicker">
            Battery {asNumber(vacuum.attributes.battery).toFixed(0)}% · Area{" "}
            {String(vacuum.attributes.area ?? "—")} ·{" "}
            {asNumber(vacuum.attributes.cleaned_m2).toFixed(0)} m²
          </div>
          <button
            type="button"
            className="chip chip--violet"
            aria-label="Toggle vacuum"
            onClick={() => dispatch({ type: "toggle", id: vacuum.entity_id })}
          >
            {vacuum.state === "cleaning" ? "Dock" : "Clean"}
          </button>
        </div>
      )}
    </>
  );
}

export function Inspector({
  entities,
  selectedEntityId,
  energyHistory,
  now,
  dispatch,
}: InspectorProps) {
  const selected = selectedEntityId ? entities[selectedEntityId] : null;

  return (
    <aside className="inspector" aria-label="Inspector">
      <div className="inspector__bar">
        <div className="kicker">{selected ? "Inspect" : "Systems"}</div>
        {selected && (
          <button
            type="button"
            className="chip chip--cyan"
            aria-label="Close inspector detail"
            onClick={() => dispatch({ type: "selectEntity", id: null })}
          >
            Close
          </button>
        )}
      </div>
      {selected ? (
        <SelectedPanel entity={selected} now={now} dispatch={dispatch} />
      ) : (
        <DefaultStack
          entities={entities}
          energyHistory={energyHistory}
          now={now}
          dispatch={dispatch}
        />
      )}
    </aside>
  );
}
