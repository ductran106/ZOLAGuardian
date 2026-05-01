// index.js
// Mục đích: Entry point — khởi động toàn hệ thống theo thứ tự

import { loadConfig } from "./core/loadConfig.js";

const config = loadConfig();

const log = (msg) =>
  console.log(`[${new Date().toISOString()}] [index] ${msg}`);

log("Khởi động Zalo Guardian v2.0...");

await import("./core/db.js");
log("DB initialized.");

const { startGuardian } = await import("./modules/guardian/index.js");
startGuardian(config);
log("Guardian started.");

const { startWebUI } = await import("./webui/server.js");
startWebUI(config);
log("WebUI started.");

const { startZalo } = await import("./core/zalo.js");
await startZalo(config);

log("Toàn hệ thống đã sẵn sàng.");
