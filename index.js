// index.js
// Mục đích: Entry point — khởi động toàn hệ thống theo thứ tự

import { existsSync } from "node:fs";
import { loadConfig } from "./core/loadConfig.js";
import { sendTelegramEvidence, timeLabelGMT7 } from "./modules/guardian/telegramNotify.js";

const config = loadConfig();
let startupComplete = false;
let fatalRecoveryScheduled = false;

const log = (msg) =>
  console.log(`[${new Date().toISOString()}] [index] ${msg}`);

function scheduleFatalRecovery(reason, err) {
  if (fatalRecoveryScheduled) return;
  fatalRecoveryScheduled = true;

  const errText = err instanceof Error ? err.stack || err.message : String(err ?? err);
  const plainText = [
    "🛑 [GUARDIAN][FATAL] Process gặp lỗi không bắt được sau khi boot",
    `Thời gian: ${timeLabelGMT7(Date.now())}`,
    `Host/PID: ${process.pid}`,
    `Lý do: ${reason}`,
    `Lỗi: ${errText}`,
    "Hành động: thoát process để systemd tự khởi động lại.",
  ].join("\n");

  Promise.resolve(sendTelegramEvidence(config, { plainText }))
    .catch(() => {})
    .finally(() => {
      console.error(`[${new Date().toISOString()}] [process] Fatal after startup -> exit 2 for systemd recovery`);
      setTimeout(() => process.exit(2), 300);
    });
}

function installProcessGuards() {
  const logErr = (tag, err) => {
    const msg =
      err instanceof Error ? err.stack || err.message : String(err ?? err);
    console.error(`[${new Date().toISOString()}] [${tag}] ${msg}`);
  };
  process.on("uncaughtException", (err) => {
    logErr("process", err);
    if (!startupComplete) {
      console.error(`[${new Date().toISOString()}] [process] Fatal during startup -> exit 1`);
      process.exit(1);
    }
    scheduleFatalRecovery("uncaughtException", err);
  });
  process.on("unhandledRejection", (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    logErr("unhandledRejection", err);
    if (!startupComplete) return;
    scheduleFatalRecovery("unhandledRejection", err);
  });
}

installProcessGuards();

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

startupComplete = true;
log("Toàn hệ thống đã sẵn sàng.");
