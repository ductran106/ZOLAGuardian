// webui/server.js
// Mục đích: HTTP server Express + API + static Web UI

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { createServer } from "node:http";
import eventBus from "../core/eventBus.js";
import { statusRouter } from "./api/status.js";
import { violationsRouter } from "./api/violations.js";
import { featuresRouter, groupsRouter } from "./api/features.js";
import { spamRoutesRouter } from "./api/spamRoutes.js";
import scoresRouter from "./api/scores.js";
import jobsRouter from "./api/jobs.js";
import exportRouter from "./api/export.js";
import { zaloAuthRouter } from "./api/zaloAuth.js";
import { watchdogSettingsRouter } from "./api/settingsWatchdog.js";
import {
  isWebUiAuthConfigured,
  verifyBasicAuth,
  webUiBasicAuthMiddleware,
} from "./basicAuth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function startWebUI(config) {
  const port = Number(config?.webuiPort) || 3456;
  const app = express();
  app.use(express.json());
  app.use(webUiBasicAuthMiddleware(config));
  app.use("/api/status", statusRouter);
  app.use("/api/violations", violationsRouter);
  app.use("/api/features", featuresRouter);
  app.use("/api/groups", groupsRouter);
  app.use("/api/spam-rules", spamRoutesRouter);
  app.use("/api/scores", scoresRouter);
  app.use("/api/jobs", jobsRouter);
  app.use("/api/export", exportRouter);
  app.use("/api/zalo", zaloAuthRouter);
  app.use("/api/settings/watchdog-quiet", watchdogSettingsRouter);
  app.use(express.static(path.join(__dirname, "public")));

  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (isWebUiAuthConfigured(config) && !verifyBasicAuth(request, config)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  const broadcast = (payload) => {
    const s = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(s);
    }
  };

  eventBus.on("guardian:db:changed", () => {
    broadcast({ type: "violations_updated" });
  });
  eventBus.on("guardian:violation", () => {
    broadcast({ type: "violations_updated" });
  });
  eventBus.on("zalo:connect", (p) => {
    broadcast({ type: "zalo_connect", payload: p });
  });
  eventBus.on("zalo:disconnect", () => {
    broadcast({ type: "zalo_disconnect" });
  });

  server.listen(port, () => {
    const authHint = isWebUiAuthConfigured(config)
      ? " (Basic Auth bật)"
      : "";
    console.log(
      `[${new Date().toISOString()}] [webui] Web UI running at http://localhost:${port}${authHint}`
    );
  });

  return { app, server, wss };
}
