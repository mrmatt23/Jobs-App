import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import { scanDevice } from "./server/scanDevice";

function deviceTasksPlugin(): Plugin {
  return {
    name: "device-tasks",
    configureServer(server) {
      server.middlewares.use("/api/device-tasks", (_req, res, next) => {
        if (_req.method !== "GET") {
          next();
          return;
        }
        try {
          const snapshot = scanDevice(process.cwd());
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(snapshot));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: String(error) }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), deviceTasksPlugin()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
