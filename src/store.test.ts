import { describe, expect, it } from "vitest";
import { addProject } from "./store";
import { createSeedState } from "./seed";

describe("addProject", () => {
  it("accepts a small 3-level job", () => {
    const next = addProject(createSeedState(), {
      name: "Pier Shed",
      site: "Dock 3",
      floors: 3,
    });
    const job = next.projects.find((project) => project.name === "Pier Shed")!;
    expect(job.floors).toBe(3);
    expect(next.selectedProjectId).toBe(job.id);
    const tasks = next.tasks.filter((task) => task.projectId === job.id);
    expect(tasks.some((task) => task.workKind === "framing")).toBe(true);
    expect(tasks.every((task) => task.floor >= 1 && task.floor <= 3)).toBe(true);
  });
});
