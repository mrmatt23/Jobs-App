import { describe, expect, it } from "vitest";
import {
  DEVICE_PROJECT_ID,
  applyDeviceSnapshot,
  classifyProcess,
  classifyTerminalCommand,
  type DeviceSnapshot,
} from "./device";
import { createSeedState } from "./seed";

describe("classifyProcess", () => {
  it("maps the cloud exec-daemon to a running Grok agent", () => {
    const task = classifyProcess(
      "node",
      "/exec-daemon/node /exec-daemon/index.js serve --trace-attributes bc_id=bc-91fea688-6516-409c-965b-af2a34f414c4",
    );
    expect(task?.id).toBe("cloud-agent");
    expect(task?.status).toBe("running");
    expect(task?.model).toBe("cursor-grok-4.6-high");
  });

  it("maps vite to the dashboard server", () => {
    expect(classifyProcess("node", "node /workspace/node_modules/.bin/vite --port 5173")?.id).toBe(
      "vite",
    );
  });

  it("ignores chrome helpers", () => {
    expect(
      classifyProcess("chrome", "/opt/google/chrome/chrome --type=renderer --no-sandbox"),
    ).toBeNull();
  });
});

describe("applyDeviceSnapshot", () => {
  it("puts running device tasks on This device and keeps other jobs", () => {
    const snapshot: DeviceSnapshot = {
      hostname: "cursor",
      where: "cloud-agent",
      workspace: "/workspace",
      branch: "cursor/multiagent-tower-dashboard-14c4",
      fetchedAt: 1,
      tasks: [
        {
          id: "vite",
          name: "Vite",
          detail: ":5173",
          status: "running",
          workKind: "code",
          kind: "tech",
          model: null,
          floor: 2,
        },
      ],
    };
    const next = applyDeviceSnapshot(createSeedState(), snapshot);
    expect(next.projects[0]?.id).toBe(DEVICE_PROJECT_ID);
    const vite = next.agents.find((agent) => agent.id === "ag-dev-vite");
    expect(vite?.status).toBe("working");
    expect(vite?.projectId).toBe(DEVICE_PROJECT_ID);
    expect(next.agents.some((agent) => agent.id === "ag-1")).toBe(true);
  });
});

describe("classifyTerminalCommand", () => {
  it("keeps a running npm script", () => {
    const task = classifyTerminalCommand("npm run build", true);
    expect(task?.status).toBe("running");
  });
});
