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

function scheduleFatalRecovery(reason, err, options = {}) {
  if (fatalRecoveryScheduled) return;
  fatalRecoveryScheduled = true;

  const exitCode = Number.isFinite(Number(options.exitCode)) ? Number(options.exitCode) : 2;
  const exitDelayMs = Number.isFinite(Number(options.exitDelayMs)) ? Number(options.exitDelayMs) : 5000;
  const phase = options.phase || (startupComplete ? "sau khi boot" : "trong lúc boot");
  const errText = err instanceof Error ? err.stack || err.message : String(err ?? err);
  const plainText = [
    `🛑 [GUARDIAN][FATAL] Process gặp lỗi ${phase}`,
    `Thời gian: ${timeLabelGMT7(Date.now())}`,
    `Host/PID: ${process.pid}`,
    `Lý do: ${reason}`,
    `Lỗi: ${errText}`,
    "Hành động: thoát process để systemd tự khởi động lại.",
  ].join("\n");

  let exiting = false;
  const exitForRecovery = (why) => {
    if (exiting) return;
    exiting = true;
    console.error(`[${new Date().toISOString()}] [process] Fatal ${phase} -> exit ${exitCode} for systemd recovery (${why})`);
    process.exit(exitCode);
  };

  const hardExitTimer = setTimeout(() => exitForRecovery("hard-timeout"), exitDelayMs);
  Promise.resolve(sendTelegramEvidence(config, { plainText }))
    .catch(() => {})
    .finally(() => {
      clearTimeout(hardExitTimer);
      setTimeout(() => exitForRecovery("alert-finished"), 300);
    });
}

function scheduleStartupZaloRecovery(err) {
  const msg = err instanceof Error ? err.message : String(err ?? err);
  log(
    `Không kết nối được Zalo lúc khởi động: ${msg}. Fail-closed: thoát process để systemd retry, tránh Web UI sống nhưng listener chết âm thầm.`
  );
  scheduleFatalRecovery("zalo startup/login failed", err, {
    phase: "khi startup/login Zalo",
    exitCode: 2,
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
  process.on("SIGTERM", () => {
    console.error(`[${new Date().toISOString()}] [process] SIGTERM received -> exit 0`);
    process.exit(0);
  });
  process.on("SIGINT", () => {
    console.error(`[${new Date().toISOString()}] [process] SIGINT received -> exit 0`);
    process.exit(0);
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
  if (!cred) {
    log(
      "Chưa cấu hình credentialsPath — bỏ qua kết nối Zalo lúc khởi động. Dùng Web UI (Đăng nhập Zalo / QR) để tạo file, rồi restart tiến trình."
    );
  } else if (!existsSync(cred)) {
    scheduleStartupZaloRecovery(new Error(`credentials file missing: ${cred}`));
    await new Promise(() => {});
  } else {
    const { startZalo } = await import("./core/zalo.js");
    try {
      await startZalo(config);
    } catch (e) {
      scheduleStartupZaloRecovery(e);
      await new Promise(() => {});
    }
  }
}

startupComplete = true;
log("Toàn hệ thống đã sẵn sàng.");
