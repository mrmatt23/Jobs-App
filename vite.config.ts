import { defineConfig, type Plugin } from "vitest/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import react from "@vitejs/plugin-react";
import { scanDevice } from "./server/scanDevice";
import { buildLiveFeed } from "./server/liveFeed";

function setCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Accept");
  res.setHeader("Cache-Control", "no-store");
}

function jobsApiPlugin(): Plugin {
  const attach = (server: { middlewares: { use: Function } }) => {
    server.middlewares.use("/api/device-tasks", (req: IncomingMessage, res: ServerResponse, next: () => void) => {
      if (req.method !== "GET") {
        next();
        return;
      }
      try {
        const snapshot = scanDevice(process.cwd());
        setCors(res);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(snapshot));
      } catch (error) {
        res.statusCode = 500;
        setCors(res);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: String(error) }));
      }
    });

    server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
      const path = req.url?.split("?")[0];
      if (path !== "/live.json" && path !== "/api/live.json") {
        next();
        return;
      }
      if (req.method === "OPTIONS") {
        res.statusCode = 204;
        setCors(res);
        res.end();
        return;
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        next();
        return;
      }
      void buildLiveFeed()
        .then((feed) => {
          setCors(res);
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          const body = JSON.stringify(feed);
          if (req.method === "HEAD") {
            res.end();
            return;
          }
          res.end(body);
        })
        .catch((error: unknown) => {
          res.statusCode = 500;
          setCors(res);
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: String(error) }));
        });
    });
  };

  return {
    name: "jobs-live-api",
    configureServer(server) {
      attach(server);
    },
    configurePreviewServer(server) {
      attach(server);
    },
  };
}

export default defineConfig({
  plugins: [react(), jobsApiPlugin()],
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
