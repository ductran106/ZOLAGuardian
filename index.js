// index.js
// Mục đích: Entry point — khởi động toàn hệ thống theo thứ tự

import { existsSync } from "node:fs";
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

const { startScheduler } = await import("./modules/scheduler/index.js");
startScheduler();
log("Scheduler started.");

const { startWebUI } = await import("./webui/server.js");
startWebUI(config);
log("WebUI started.");

if (String(process.env.ZALO_GUARDIAN_SKIP_ZALO || "") === "1") {
  log("Bỏ qua Zalo (ZALO_GUARDIAN_SKIP_ZALO=1) — Web UI / scheduler / Guardian vẫn chạy, không kết nối account.");
} else {
  const cred = config.credentialsPath
    ? String(config.credentialsPath).trim()
    : "";
  if (!cred || !existsSync(cred)) {
    log(
      "Chưa có file credentials — bỏ qua kết nối Zalo lúc khởi động. Dùng Web UI (Đăng nhập Zalo / QR) để tạo file, rồi restart tiến trình."
    );
  } else {
    const { startZalo } = await import("./core/zalo.js");
    try {
      await startZalo(config);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log(
        `Không kết nối được Zalo lúc khởi động: ${msg}. Web UI / Guardian vẫn chạy — dùng Đăng nhập QR hoặc sửa file credentials.`
      );
    }
  }
}

log("Toàn hệ thống đã sẵn sàng.");
