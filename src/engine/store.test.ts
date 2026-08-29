import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dispatch, entitiesInRoom, getState } from "./store";

const REQUIRED_ENTITY_IDS = [
  "light.atrium_chandelier",
  "light.observatory_cove",
  "light.galley_task",
  "light.sanctum_bed",
  "light.aqua_caustics",
  "light.skydeck_lanterns",
  "light.lab_bench",
  "climate.lumen",
  "weather.lumen_coast",
  "media_player.observatory_cinema",
  "lock.front_portal",
  "cover.skydeck_louvers",
  "fan.sanctum_air",
  "switch.water_veil",
  "switch.lab_ionizer",
  "vacuum.nova",
  "binary_sensor.garage_beam",
  "binary_sensor.skydeck_rain",
  "sensor.grid_kw",
  "sensor.solar_kw",
  "sensor.battery_kwh",
  "sensor.atrium_lux",
  "sensor.water_temp",
  "camera.approach",
  "person.aria",
  "person.kai",
  "alarm_control_panel.lumen",
  "scene.nightfall",
  "scene.cinema",
  "scene.away",
  "scene.sunrise",
  "scene.party",
] as const;

function lights() {
  return Object.values(getState().entities).filter((ent) => ent.domain === "light");
}

describe("AETHER mock Home Assistant engine", { concurrency: 1 }, () => {
  it("seeds every required entity_id from CONTRACT.md", () => {
    const { entities } = getState();
    for (const id of REQUIRED_ENTITY_IDS) {
      assert.ok(entities[id], `missing entity ${id}`);
      assert.equal(entities[id].entity_id, id);
    }
  });

  it("toggle light.atrium_chandelier flips on/off and brightness", () => {
    const id = "light.atrium_chandelier";
    dispatch({ type: "set", id, state: "on", attributes: { brightness: 168 } });

    dispatch({ type: "toggle", id });
    const off = getState().entities[id];
    assert.equal(off.state, "off");
    assert.equal(off.attributes.brightness, 0);

    dispatch({ type: "toggle", id });
    const on = getState().entities[id];
    assert.equal(on.state, "on");
    assert.ok(
      Number(on.attributes.brightness) > 0,
      "brightness should restore when toggled on",
    );
  });

  it("activateScene scene.away locks portal, arms alarm, turns lights off, people away", () => {
    dispatch({ type: "activateScene", id: "scene.away" });
    const { entities } = getState();

    assert.equal(entities["lock.front_portal"].state, "locked");
    assert.equal(entities["alarm_control_panel.lumen"].state, "armed_away");
    for (const light of lights()) {
      assert.equal(light.state, "off", `${light.entity_id} should be off`);
      assert.equal(light.attributes.brightness, 0);
    }
    assert.equal(entities["person.aria"].state, "away");
    assert.equal(entities["person.kai"].state, "away");
  });

  it("activateScene scene.cinema turns most lights down/off and plays media", () => {
    dispatch({ type: "activateScene", id: "scene.cinema" });
    const { entities } = getState();

    const cinema = entities["media_player.observatory_cinema"];
    assert.equal(cinema.state, "playing");

    const bright = lights().filter((light) => Number(light.attributes.brightness) > 40);
    assert.equal(bright.length, 0, "cinema should keep lights dim or off");

    const onLights = lights().filter((light) => light.state === "on");
    assert.ok(onLights.length < lights().length, "most lights should be off");
    for (const light of onLights) {
      assert.ok(
        Number(light.attributes.brightness) <= 40,
        `${light.entity_id} should be dim in cinema`,
      );
    }
  });

  it("nudgeClimate changes climate.lumen temperature", () => {
    const before = Number(getState().entities["climate.lumen"].attributes.temperature);
    dispatch({ type: "nudgeClimate", delta: 1 });
    const after = Number(getState().entities["climate.lumen"].attributes.temperature);
    assert.notEqual(after, before);
    const expected = Number(Math.max(16, Math.min(28, before + 1)).toFixed(1));
    assert.equal(after, expected);
  });

  it("setBrightness 0 turns light off and 200 turns it on", () => {
    const id = "light.galley_task";
    dispatch({ type: "setBrightness", id, brightness: 0 });
    const off = getState().entities[id];
    assert.equal(off.state, "off");
    assert.equal(off.attributes.brightness, 0);

    dispatch({ type: "setBrightness", id, brightness: 200 });
    const on = getState().entities[id];
    assert.equal(on.state, "on");
    assert.equal(on.attributes.brightness, 200);
  });

  it("tick mutates energyHistory length without exploding", () => {
    const before = getState().energyHistory.length;
    assert.doesNotThrow(() => {
      dispatch({ type: "tick" });
      dispatch({ type: "tick" });
      dispatch({ type: "tick" });
    });
    const history = getState().energyHistory;
    assert.ok(Array.isArray(history));
    assert.notEqual(history.length, before);
    assert.ok(history.length > 0);
    assert.ok(history.length <= 64, "energyHistory should stay bounded");
  });

  it("entitiesInRoom('observatory') includes observatory entities and whole-home climate", () => {
    const list = entitiesInRoom(getState().entities, "observatory");
    const ids = new Set(list.map((ent) => ent.entity_id));

    assert.ok(ids.has("light.observatory_cove"));
    assert.ok(ids.has("media_player.observatory_cinema"));
    assert.ok(ids.has("person.aria"));
    assert.ok(ids.has("climate.lumen"));

    assert.ok(!ids.has("light.atrium_chandelier"));
    assert.ok(!ids.has("scene.cinema"));
    assert.ok(list.every((ent) => ent.domain !== "scene"));
    assert.ok(list.every((ent) => ent.room === "observatory" || ent.room === "whole"));
  });
});
