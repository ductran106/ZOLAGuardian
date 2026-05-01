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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function startWebUI(config) {
  const port = Number(config?.webuiPort) || 3456;
  const app = express();
  app.use(express.json());
  app.use("/api/status", statusRouter);
  app.use("/api/violations", violationsRouter);
  app.use("/api/features", featuresRouter);
  app.use("/api/groups", groupsRouter);
  app.use("/api/spam-rules", spamRoutesRouter);
  app.use(express.static(path.join(__dirname, "public")));

  const server = createServer(app);
  const wss = new WebSocketServer({ server });

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

  server.listen(port, () => {
    console.log(
      `[${new Date().toISOString()}] [webui] Web UI running at http://localhost:${port}`
    );
  });

  return { app, server, wss };
}
