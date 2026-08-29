import { entitiesInRoom, scenesOf } from "../engine/store";
import type { Action, HassEntity, RoomId } from "../engine/types";
import { ROOMS } from "../engine/types";
import { iconOf } from "../lib/icons";

interface RailProps {
  entities: Record<string, HassEntity>;
  selectedRoom: RoomId;
  dispatch: (action: Action) => void;
}

export function Rail({ entities, selectedRoom, dispatch }: RailProps) {
  const scenes = scenesOf(entities);
  const roomEntities = entitiesInRoom(entities, selectedRoom);
  const lights = roomEntities.filter((e) => e.domain === "light");
  const lightsOn = lights.filter((e) => e.state === "on").length;

  return (
    <aside className="rail" aria-label="Habitat navigation">
      <div className="rail__section">
        <div className="rail__label kicker">Zones</div>
        {ROOMS.map((room) => {
          const active = selectedRoom === room.id;
          return (
            <button
              key={room.id}
              type="button"
              className={`rail__btn${active ? " rail__btn--active" : ""}`}
              aria-label={`Select ${room.label}`}
              aria-pressed={active}
              onClick={() => dispatch({ type: "selectRoom", room: room.id })}
            >
              <span className="rail__code readout">{room.code}</span>
              <span>{room.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rail__section">
        <div className="rail__label kicker">Scenes</div>
        {scenes.map((scene) => {
          const Icon = iconOf(scene.icon);
          return (
            <button
              key={scene.entity_id}
              type="button"
              className="rail__btn"
              aria-label={`Activate ${scene.name}`}
              onClick={() => dispatch({ type: "activateScene", id: scene.entity_id })}
            >
              <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
              <span>{scene.name}</span>
            </button>
          );
        })}
      </div>

      <div className="rail__section">
        <div className="rail__label kicker">Lights</div>
        <div className="readout">
          {lightsOn} / {lights.length}
        </div>
        <div className="kicker">active in filter</div>
      </div>
    </aside>
  );
}
