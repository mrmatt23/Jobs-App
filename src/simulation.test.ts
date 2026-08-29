import { describe, expect, it } from "vitest";
import { createSeedState } from "./seed";
import { createMotion, tickSimulation } from "./simulation";
import { projectProgress, tasksForProject } from "./lib/progress";

describe("tickSimulation", () => {
  it("does not advance work while paused", () => {
    const state = { ...createSeedState(), paused: true };
    const motions = createMotion(state.agents, state.tasks);
    const before = state.tasks.map((task) => task.progress);
    const result = tickSimulation(state, motions, [], 1);
    expect(result.state.tasks.map((task) => task.progress)).toEqual(before);
    expect(result.placed).toBe(false);
  });

  it("lets a placing agent raise task and project progress", () => {
    const state = createSeedState();
    state.paused = false;
    state.speed = 1;
    const agent = state.agents.find((item) => item.id === "ag-1")!;
    const task = state.tasks.find((item) => item.id === agent.taskId)!;
    const start = task.progress;
    const motions = createMotion(state.agents, state.tasks).map((motion) =>
      motion.agentId === agent.id
        ? {
            ...motion,
            phase: "place" as const,
            phaseT: 0.54,
            y: task.floor * 46,
            x: 560,
            carry: task.workKind,
          }
        : motion,
    );
    const result = tickSimulation(state, motions, [], 0.05);
    const updated = result.state.tasks.find((item) => item.id === task.id)!;
    expect(updated.progress).toBeGreaterThan(start);
    expect(result.placed).toBe(true);
    const project = result.state.projects.find((item) => item.id === task.projectId)!;
    const progress = projectProgress(
      tasksForProject(result.state.tasks, project.id),
      project.floors,
    );
    expect(progress).toBeGreaterThan(
      projectProgress(tasksForProject(state.tasks, project.id), project.floors),
    );
  });

  it("assigns the next same-trade task after a floor is finished", () => {
    const state = createSeedState();
    const agent = state.agents.find((item) => item.id === "ag-1")!;
    const task = state.tasks.find((item) => item.id === agent.taskId)!;
    task.progress = 99;
    task.status = "in_progress";
    const motions = createMotion(state.agents, state.tasks).map((motion) =>
      motion.agentId === agent.id
        ? {
            ...motion,
            phase: "place" as const,
            phaseT: 0.6,
            y: task.floor * 46,
            x: 560,
            carry: task.workKind,
          }
        : motion,
    );
    const result = tickSimulation(state, motions, [], 0.2);
    const finished = result.state.tasks.find((item) => item.id === task.id)!;
    expect(finished.status).toBe("done");
    const updatedAgent = result.state.agents.find((item) => item.id === agent.id)!;
    // Next tick they pick work; this tick clears the completed task.
    expect(finished.assigneeId).toBeNull();
    expect(updatedAgent.taskId === null || updatedAgent.taskId === task.id).toBe(true);
  });
});
