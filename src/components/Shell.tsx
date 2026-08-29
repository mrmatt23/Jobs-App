import { useHass } from "../hooks/useHass";
import { CommandBar } from "./CommandBar";
import { Hero } from "./Hero";
import { Inspector } from "./Inspector";
import { Mosaic } from "./Mosaic";
import { Rail } from "./Rail";
import { Topbar } from "./Topbar";

export function Shell() {
  const {
    entities,
    selectedRoom,
    selectedEntityId,
    now,
    alerts,
    energyHistory,
    dispatch,
  } = useHass();

  return (
    <div className="os">
      <div className="os__grid" aria-hidden="true" />
      <div className="os__scan" aria-hidden="true" />
      <div className="os__vignette" aria-hidden="true" />
      <div className={`shell${selectedEntityId ? " shell--inspect" : ""}`}>
        <Topbar
          entities={entities}
          now={now}
          inspectOpen={Boolean(selectedEntityId)}
          onToggleInspect={() =>
            dispatch({
              type: "selectEntity",
              id: selectedEntityId ? null : "sensor.battery_kwh",
            })
          }
        />
        <Rail
          entities={entities}
          selectedRoom={selectedRoom}
          dispatch={dispatch}
        />
        <main className="main">
          <Hero entities={entities} dispatch={dispatch} />
          <Mosaic
            entities={entities}
            selectedRoom={selectedRoom}
            selectedEntityId={selectedEntityId}
            dispatch={dispatch}
          />
        </main>
        <Inspector
          entities={entities}
          selectedEntityId={selectedEntityId}
          energyHistory={energyHistory}
          now={now}
          dispatch={dispatch}
        />
        <CommandBar entities={entities} alerts={alerts} dispatch={dispatch} />
      </div>
    </div>
  );
}
