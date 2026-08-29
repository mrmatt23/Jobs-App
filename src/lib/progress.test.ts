import { describe, expect, it } from "vitest";
import {
  completedFloorCount,
  currentFloorFill,
  floorProgress,
  projectProgress,
  projectStatusFromProgress,
} from "./progress";
import type { Task } from "../types";

function task(partial: Partial<Task> & Pick<Task, "floor" | "progress">): Task {
  return {
    id: partial.id ?? "t",
    projectId: partial.projectId ?? "p",
    title: partial.title ?? "task",
    workKind: partial.workKind ?? "framing",
    floor: partial.floor,
    progress: partial.progress,
    status: partial.status ?? "in_progress",
    assigneeId: partial.assigneeId ?? null,
  };
}

describe("projectProgress", () => {
  it("is zero with no tasks across planned floors", () => {
    expect(projectProgress([], 8)).toBe(0);
  });

  it("averages floors equally so unfinished upper floors hold the tower back", () => {
    const tasks = [
      task({ floor: 1, progress: 100 }),
      task({ floor: 2, progress: 100 }),
      task({ floor: 3, progress: 50 }),
    ];
    expect(projectProgress(tasks, 4)).toBeCloseTo((100 + 100 + 50 + 0) / 4);
  });

  it("averages multiple trades on the same floor", () => {
    const tasks = [
      task({ floor: 1, progress: 100, workKind: "framing" }),
      task({ floor: 1, progress: 0, workKind: "electrical" }),
    ];
    expect(floorProgress(tasks, 1)).toBe(50);
  });
});

describe("tower fill", () => {
  it("counts completed floors from overall progress", () => {
    expect(completedFloorCount(0, 10)).toBe(0);
    expect(completedFloorCount(50, 10)).toBe(5);
    expect(completedFloorCount(100, 10)).toBe(10);
  });

  it("returns the partial fill of the floor under construction", () => {
    expect(currentFloorFill(0, 10)).toBe(0);
    expect(currentFloorFill(55, 10)).toBeCloseTo(0.5);
    expect(currentFloorFill(100, 10)).toBe(1);
  });
});

describe("projectStatusFromProgress", () => {
  it("stays planning until there is work", () => {
    expect(projectStatusFromProgress(0, false)).toBe("planning");
  });

  it("is complete only at 100", () => {
    expect(projectStatusFromProgress(99, true)).toBe("active");
    expect(projectStatusFromProgress(100, true)).toBe("complete");
  });
});
