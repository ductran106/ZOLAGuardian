// core/zalo.js
// Mục đích: Login zca-js, khởi động listener, emit events lên eventBus
// Đây là cầu nối duy nhất giữa zca-js và phần còn lại của hệ thống

import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import eventBus from "./eventBus.js";
import db from "./db.js";
import { sendTelegramEvidence, timeLabelGMT7 } from "../modules/guardian/telegramNotify.js";
import { shouldSkipWatchdogForQuietHours } from "./watchdogQuiet.js";

let api = null;
let watchdogTimer = null;
let lastMessageAt = 0;
let watchdogRestarting = false;
let watchdogLastAlertAt = 0;
let watchdogConsecutiveFailures = 0;

const WATCHDOG_SILENCE_MS = 5 * 60 * 1000;
const WATCHDOG_TICK_MS = 30 * 1000;
const WATCHDOG_MAX_CONSECUTIVE_FAILURES = 3;

function clearWatchdog() {
  if (watchdogTimer) clearInterval(watchdogTimer);
  watchdogTimer = null;
  lastMessageAt = 0;
  watchdogRestarting = false;
  watchdogLastAlertAt = 0;
  watchdogConsecutiveFailures = 0;
}

async function sendWatchdogAlert(config, plainText) {
  await sendTelegramEvidence(config, { plainText });
}

function restartCurrentProcess(log) {
  try {
    const child = spawn(process.execPath, ["index.js"], {
      cwd: process.cwd(),
      env: process.env,
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    log(`Watchdog tầng 2: đã spawn process mới pid=${child.pid}`);
  } catch (e) {
    const em = e instanceof Error ? e.message : String(e);
    log(`Watchdog tầng 2: spawn process mới FAIL: ${em}`);
  } finally {
    setTimeout(() => process.exit(2), 300);
  }
}

function startWatchdog(config, log) {
  clearWatchdog();
  lastMessageAt = Date.now();
  watchdogTimer = setInterval(async () => {
    if (!api || !api.listener) return;
    if (watchdogRestarting) return;
    const now = Date.now();
    if (shouldSkipWatchdogForQuietHours(now)) {
      return;
    }
    const silentMs = now - lastMessageAt;
    if (silentMs < WATCHDOG_SILENCE_MS) return;
    if (watchdogLastAlertAt && now - watchdogLastAlertAt < WATCHDOG_SILENCE_MS) return;
    watchdogLastAlertAt = now;
    watchdogRestarting = true;
    const silentMin = Math.floor(silentMs / 60000);
    try {
      log(`Watchdog: không có message mới ${silentMin} phút, thử restart listener...`);
      await sendWatchdogAlert(
        config,
        [
          "⚠️ [GUARDIAN] Zalo listener im lặng > 5 phút",
          `Thời gian cảnh báo: ${timeLabelGMT7(now)}`,
          `Silent: ~${silentMin} phút`,
          "Hành động: tự động restart listener.",
        ].join("\n")
      );
      if (typeof api.listener.stop === "function") {
        api.listener.stop();
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      api.listener.start();
      lastMessageAt = Date.now();
      watchdogConsecutiveFailures = 0;
      log("Watchdog: restart listener thành công.");
      await sendWatchdogAlert(
        config,
        [
          "✅ [GUARDIAN] Zalo listener đã được restart",
          `Thời gian: ${timeLabelGMT7(Date.now())}`,
          "Trạng thái: đang chờ message mới.",
        ].join("\n")
      );
    } catch (e) {
      const em = e instanceof Error ? e.message : String(e);
      watchdogConsecutiveFailures += 1;
      log(`Watchdog: restart listener FAIL: ${em}`);
      await sendWatchdogAlert(
        config,
        [
          "❌ [GUARDIAN] Zalo listener restart thất bại",
          `Thời gian: ${timeLabelGMT7(Date.now())}`,
          `Lỗi: ${em}`,
          "Cần kiểm tra thủ công tiến trình / credentials / kết nối mạng.",
        ].join("\n")
      );
      if (watchdogConsecutiveFailures >= WATCHDOG_MAX_CONSECUTIVE_FAILURES) {
        const criticalText = [
          "🛑 [GUARDIAN][CRITICAL] Watchdog thất bại nhiều lần",
          `Thời gian: ${timeLabelGMT7(Date.now())}`,
          `Số lần restart lỗi liên tiếp: ${watchdogConsecutiveFailures}`,
          "Hành động: restart toàn bộ process để tự phục hồi.",
        ].join("\n");
        await sendWatchdogAlert(config, criticalText);
        log("Watchdog: kích hoạt tầng 2 - restart toàn process.");
        restartCurrentProcess(log);
      }
    } finally {
      watchdogRestarting = false;
    }
  }, WATCHDOG_TICK_MS);
  if (typeof watchdogTimer.unref === "function") {
    watchdogTimer.unref();
  }
}

export async function startZalo(config) {
  const log = (msg) => console.log(`[${new Date().toISOString()}] [zalo] ${msg}`);

  log("Đang load zca-js...");
  const { Zalo } = await import(config.zcaPath);

  log("Đang đọc credentials...");
  const creds = JSON.parse(readFileSync(config.credentialsPath, "utf8"));

  log("Đang login...");
  // selfListen: tin của chính account (bot) cũng được listener đẩy vào → có trong DB / xuất DOCX.
  // Mặc định false thì zca-js bỏ qua groupEvent.isSelf → không cache tin bot (vd: 2287316777534438968).
  const zalo = new Zalo({ logging: false, selfListen: true });
  api = await zalo.login({
    imei: creds.imei,
    cookie: creds.cookie,
    userAgent: creds.userAgent,
    language: "vi",
  });

  log(`Logged in as ${api.getOwnId()}`);
  eventBus.emit("zalo:connect", { userId: api.getOwnId() });

  // Đăng ký listeners
  api.listener.on("message", (msg) => {
    lastMessageAt = Date.now();
    const msgGroupId = msg.data?.idTo || msg.idTo || "";
    log(`MSG from group: ${msgGroupId}`);

    const gName = msg.data?.groupName || msg.groupName || "";
    if (msgGroupId && gName) {
      try {
        db.prepare(`
          INSERT INTO group_names (group_id, name, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(group_id) DO UPDATE SET name=excluded.name, updated_at=CURRENT_TIMESTAMP
        `).run(msgGroupId, gName);
      } catch {
        /* ignore */
      }
    }

    // Cache tất cả messages để phục vụ UNDO lookup
    const cacheContent = msg.data?.content || msg.content || "";
    const cacheMsgId = msg.data?.msgId || msg.msgId || "";
    const cacheSender = msg.data?.uidFrom || msg.uidFrom || "";
    const cacheTs = msg.data?.ts || Date.now();

    if (cacheMsgId) {
      try {
        const contentStr =
          typeof cacheContent === "object"
            ? JSON.stringify(cacheContent)
            : String(cacheContent || "");
        db.prepare(`
          INSERT OR IGNORE INTO messages
            (msg_id, group_id, user_id, display_name, content, ts,
             quote_msg_id, quote_owner_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          cacheMsgId,
          msgGroupId || "",
          cacheSender || "",
          msg.data?.dName || msg.dName || "",
          contentStr,
          cacheTs || Date.now(),
          String(msg.data?.quote?.globalMsgId || "") || null,
          String(msg.data?.quote?.ownerId || "") || null
        );
      } catch {
        /* ignore */
      }
    }

    // Không lọc theo config.watchGroups cứng.
    // Guardian sẽ tự lọc theo watch_groups (DB) + enabled realtime.
    eventBus.emit("zalo:message", { api, msg });
  });

  api.listener.on("undo", (data) => {
    eventBus.emit("zalo:undo", { api, data });
  });

  api.listener.start();
  log("Listener started.");
  startWatchdog(config, log);

  // Cache tên groups (chỉ cache watched groups + batch để tránh lỗi API)
  try {
    const watchedIds = (config.watchGroups || []).map((g) => g.groupId);

    if (watchedIds.length > 0) {
      const groupInfoRes = await api.getGroupInfo(watchedIds);
      if (groupInfoRes?.gridInfoMap) {
        for (const [gid, info] of Object.entries(groupInfoRes.gridInfoMap)) {
          if (info?.name) {
            db.prepare(`
              INSERT INTO group_names (group_id, name, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(group_id) DO UPDATE SET name=excluded.name, updated_at=CURRENT_TIMESTAMP
            `).run(gid, info.name);
          }
        }
        log(`Cached ${Object.keys(groupInfoRes.gridInfoMap).length} group names OK`);
      }
    }
  } catch (e) {
    log(`Group name cache FAIL: ${e.message}`);
  }
}

export function getApi() {
  return api;
}

/**
 * Dừng listener WebSocket và xóa tham chiếu API (đăng xuất phía client).
 */
export function stopZalo() {
  if (!api) return;
  clearWatchdog();
  try {
    if (api.listener && typeof api.listener.stop === "function") {
      api.listener.stop();
    }
  } catch (e) {
    console.log(
      `[${new Date().toISOString()}] [zalo] stopZalo: ${String(e?.message || e)}`
    );
  }
  api = null;
  eventBus.emit("zalo:disconnect", {});
}
