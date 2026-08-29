import { entitiesInRoom } from "../engine/store";
import type { Action, HassEntity, RoomId } from "../engine/types";
import { EntityCard } from "./EntityCard";

interface MosaicProps {
  entities: Record<string, HassEntity>;
  selectedRoom: RoomId;
  selectedEntityId: string | null;
  dispatch: (action: Action) => void;
}

const HIDDEN_IDS = new Set([
  "climate.lumen",
  "weather.lumen_coast",
  "camera.approach",
  "sensor.grid_kw",
  "sensor.solar_kw",
  "sensor.battery_kwh",
  "person.aria",
  "person.kai",
]);

const HIDDEN_DOMAINS = new Set(["weather", "person", "scene", "camera"]);

function includeInMosaic(ent: HassEntity): boolean {
  if (HIDDEN_IDS.has(ent.entity_id)) return false;
  if (HIDDEN_DOMAINS.has(ent.domain)) return false;
  return true;
}

export function Mosaic({
  entities,
  selectedRoom,
  selectedEntityId,
  dispatch,
}: MosaicProps) {
  const cards = entitiesInRoom(entities, selectedRoom).filter(includeInMosaic);

  return (
    <section className="mosaic" aria-label="Entity mosaic">
      {cards.map((ent) => (
        <EntityCard
          key={ent.entity_id}
          entity={ent}
          selected={selectedEntityId === ent.entity_id}
          dispatch={dispatch}
        />
      ))}
    </section>
  );
}
