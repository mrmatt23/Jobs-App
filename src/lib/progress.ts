import type { Task } from "../types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function tasksForProject(tasks: Task[], projectId: string): Task[] {
  return tasks.filter((task) => task.projectId === projectId);
}

export function floorProgress(tasks: Task[], floor: number): number {
  const onFloor = tasks.filter((task) => task.floor === floor);
  if (onFloor.length === 0) return 0;
  return average(onFloor.map((task) => clamp(task.progress, 0, 100)));
}

/** 0–100 overall construction progress, weighted equally across planned floors. */
export function projectProgress(tasks: Task[], floors: number): number {
  if (floors <= 0) return 0;
  const perFloor = Array.from({ length: floors }, (_, index) =>
    floorProgress(tasks, index + 1),
  );
  return average(perFloor);
}

export function completedFloorCount(progress: number, floors: number): number {
  if (floors <= 0) return 0;
  return Math.min(floors, Math.floor((progress / 100) * floors + 1e-9));
}

/** How far the in-progress floor is filled, 0–1. */
export function currentFloorFill(progress: number, floors: number): number {
  if (floors <= 0) return 0;
  const units = (progress / 100) * floors;
  const fill = units - Math.floor(units);
  if (progress >= 100) return 1;
  return fill;
}

export function placeAmount(workKindProgressBias = 1): number {
  return 5 * workKindProgressBias;
}

export function projectStatusFromProgress(
  progress: number,
  hasTasks: boolean,
): "planning" | "active" | "complete" {
  if (!hasTasks) return "planning";
  if (progress >= 100) return "complete";
  return "active";
}
