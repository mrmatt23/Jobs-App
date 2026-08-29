import { describe, expect, it } from "vitest";
import { animalFor } from "./animals";
import { aislePath, cubicleCols, deskWorld, syncOfficeBots, tickOffice } from "./officeSim";
import type { Agent } from "../types";

const agent = (id: string, status: Agent["status"] = "working"): Agent => ({
  id,
  name: id,
  trade: "code",
  color: "#3ecfb2",
  status,
  projectId: "p",
  taskId: null,
  kind: "ai",
  model: null,
});

describe("office layout", () => {
  it("places desks on a spaced grid", () => {
    expect(cubicleCols(4)).toBe(3);
    const a = deskWorld(0, 3);
    const b = deskWorld(1, 3);
    expect(b.x).toBeGreaterThan(a.x);
  });

  it("builds an aisle path with a corner", () => {
    const path = aislePath({ x: 1, y: 1.3 }, { x: 4, y: 4.3 });
    expect(path.length).toBeGreaterThanOrEqual(3);
    expect(path[path.length - 1]).toEqual({ x: 4, y: 4.3 });
  });
});

describe("office bots", () => {
  it("assigns a stable animal per agent id", () => {
    expect(animalFor("ag-dev-vite")).toBe(animalFor("ag-dev-vite"));
  });

  it("sends a working bot toward another desk", () => {
    const agents = [agent("a"), agent("b")];
    let bots = syncOfficeBots([], agents);
    bots[0].wait = 0;
    bots = tickOffice(bots, agents, 0.05, false, 1);
    expect(bots[0].phase === "walk" || bots[0].phase === "pair").toBe(true);
    expect(bots[0].pairWith).toBe("b");
  });

  it("holds still when the shift is paused", () => {
    const agents = [agent("a"), agent("b")];
    let bots = syncOfficeBots([], agents);
    bots[0].wait = 0;
    bots = tickOffice(bots, agents, 0.2, true, 1);
    expect(bots[0].phase).toBe("work");
    expect(bots[0].x).toBe(bots[0].home.x);
  });

  it("pairs at the other desk, then walks home", () => {
    const agents = [agent("a"), agent("b")];
    let bots = syncOfficeBots([], agents);
    bots[0].wait = 0;
    bots = tickOffice(bots, agents, 0.05, false, 1);
    bots[0].waypoints = [];
    bots = tickOffice(bots, agents, 0.05, false, 1);
    expect(bots[0].phase).toBe("pair");
    bots[0].wait = 0;
    bots = tickOffice(bots, agents, 0.05, false, 1);
    expect(bots[0].phase).toBe("walk");
    expect(bots[0].goingHome).toBe(true);
  });
});
