import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { classifyProcess, classifyTerminalCommand, type DeviceSnapshot, type DeviceTask } from "../src/device";

function run(cmd: string, args: string[], cwd?: string): string {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", cwd, timeout: 2000 }).trim();
  } catch {
    return "";
  }
}

function parseProcesses(): DeviceTask[] {
  const raw = run("ps", ["-eo", "pid=,comm=,args="]);
  const found: DeviceTask[] = [];
  const seen = new Set<string>();
  for (const line of raw.split("\n")) {
    const match = line.trim().match(/^(\d+)\s+(\S+)\s+(.*)$/);
    if (!match) continue;
    const task = classifyProcess(match[2], match[3]);
    if (!task || seen.has(task.id)) continue;
    seen.add(task.id);
    found.push(task);
  }
  return found;
}

function parseTerminals(): DeviceTask[] {
  const homes = Array.from(new Set([os.homedir(), "/home/ubuntu"]));
  const tasks: DeviceTask[] = [];
  const seen = new Set<string>();
  for (const home of homes) {
    const root = path.join(home, ".cursor/projects");
    if (!fs.existsSync(root)) continue;
    for (const project of fs.readdirSync(root)) {
      const dir = path.join(root, project, "terminals");
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith(".txt")) continue;
        const text = fs.readFileSync(path.join(dir, file), "utf8").slice(0, 2500);
        const command =
          /(?:^|\n)command:\s*(.+)/.exec(text)?.[1]?.trim() ??
          /(?:^|\n)last_command:\s*(.+)/.exec(text)?.[1]?.trim() ??
          "";
        const status = /(?:^|\n)status:\s*(\w+)/.exec(text)?.[1];
        const exit = /(?:^|\n)last_exit_code:/.test(text);
        const running = status === "running" || (!exit && Boolean(command));
        const task = classifyTerminalCommand(command, running);
        if (!task || seen.has(task.id)) continue;
        seen.add(task.id);
        tasks.push(task);
      }
    }
  }
  return tasks;
}

function gitTask(workspace: string, branch: string): DeviceTask {
  const dirty = run("git", ["status", "--porcelain"], workspace);
  const files = dirty ? dirty.split("\n").filter(Boolean).length : 0;
  return {
    id: "git",
    name: "Git",
    detail: files > 0 ? `${branch} · ${files} local change${files === 1 ? "" : "s"}` : `${branch} · clean`,
    status: files > 0 ? "running" : "idle",
    workKind: "review",
    kind: "human",
    model: null,
    floor: 3,
  };
}

export function scanDevice(workspace = process.cwd()): DeviceSnapshot {
  const hostname = os.hostname();
  const where =
    hostname === "cursor" || fs.existsSync("/run/cursor") || Boolean(process.env.CURSOR_AGENT)
      ? "cloud-agent"
      : "local";
  const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"], workspace) || "unknown";
  const merged = new Map<string, DeviceTask>();
  for (const task of [...parseProcesses(), ...parseTerminals(), gitTask(workspace, branch)]) {
    const previous = merged.get(task.id);
    if (!previous || (task.status === "running" && previous.status !== "running")) {
      merged.set(task.id, task);
    }
  }
  const tasks = [...merged.values()].sort((a, b) => a.floor - b.floor || a.name.localeCompare(b.name));
  const filtered = merged.has("vite")
    ? tasks.filter((task) => !(task.id.startsWith("sh-") && /npm run dev/.test(task.detail)))
    : tasks;
  return {
    hostname,
    where,
    workspace,
    branch,
    fetchedAt: Date.now(),
    tasks: filtered,
  };
}
