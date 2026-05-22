// core/zalo.js
// Mục đích: Login zca-js, khởi động listener, emit events lên eventBus
// Đây là cầu nối duy nhất giữa zca-js và phần còn lại của hệ thống

import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import os from "node:os";
import eventBus from "./eventBus.js";
import db from "./db.js";
import { upsertInboundGroupMessage } from "./inboundMessageCache.js";
import { sendTelegramEvidence, timeLabelGMT7 } from "../modules/guardian/telegramNotify.js";
import { shouldSkipWatchdogForQuietHours } from "./watchdogQuiet.js";

let api = null;
let watchdogTimer = null;
let lastAnyMessageAt = 0;
let lastWatchedMessageAt = 0;
let lastWatchedGroupId = "";
let watchdogRestarting = false;
let watchdogLastAlertAt = 0;
let watchdogConsecutiveFailures = 0;
let listenerLikelyDown = false;

const getEnabledWatchGroupStmt = db.prepare(
  "SELECT 1 FROM watch_groups WHERE group_id = ? AND enabled = 1 LIMIT 1"
);
const countEnabledWatchGroupsStmt = db.prepare(
  "SELECT COUNT(*) AS c FROM watch_groups WHERE enabled = 1"
);

const WATCHDOG_SILENCE_MS = 5 * 60 * 1000;
const WATCHDOG_TICK_MS = 30 * 1000;
const WATCHDOG_MAX_CONSECUTIVE_FAILURES = 3;

function clearWatchdog() {
  if (watchdogTimer) clearInterval(watchdogTimer);
  watchdogTimer = null;
  lastAnyMessageAt = 0;
  lastWatchedMessageAt = 0;
  lastWatchedGroupId = "";
  watchdogRestarting = false;
  watchdogLastAlertAt = 0;
  watchdogConsecutiveFailures = 0;
  listenerLikelyDown = false;
}

function isEnabledWatchGroup(groupId) {
  const gid = String(groupId || "").trim();
  if (!gid) return false;
  return !!getEnabledWatchGroupStmt.get(gid);
}

function countEnabledWatchGroups() {
  return Number(countEnabledWatchGroupsStmt.get()?.c || 0);
}

function processFingerprint() {
  return `host=${os.hostname()} pid=${process.pid} ppid=${process.ppid}`;
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

/**
 * Chỉ log lỗi lifecycle của listener, KHÔNG reconnect nóng ở tầng event này.
 * Lý do: với vài lỗi WS/event thấp tầng, việc stop/start ngay trong handler có thể
 * kéo runtime vào vòng lặp hoặc trạng thái nửa sống. Phục hồi nên đi qua watchdog.
 */
function attachListenerResilience(listener, log) {
  if (!listener?.on) return;

  listener.on("error", (err) => {
    listenerLikelyDown = true;
    const em =
      err instanceof Error
        ? `${err.message}${err.code ? ` [${err.code}]` : ""}`
        : String(err);
    log(`Listener error (process vẫn chạy): ${em}`);
  });

  listener.on("closed", (code, reason) => {
    listenerLikelyDown = true;
    log(`Listener closed: code=${code} reason=${reason || ""}`);
  });

  listener.on("disconnected", (code, reason) => {
    listenerLikelyDown = true;
    log(`Listener disconnected: code=${code} reason=${reason || ""}`);
  });
}

function startWatchdog(config, log) {
  clearWatchdog();
  const now0 = Date.now();
  lastAnyMessageAt = now0;
  lastWatchedMessageAt = now0;
  watchdogTimer = setInterval(async () => {
    if (!api || !api.listener) return;
    if (watchdogRestarting) return;
    if (countEnabledWatchGroups() <= 0) return;

    const now = Date.now();
    if (shouldSkipWatchdogForQuietHours(now) && !listenerLikelyDown) {
      return;
    }

    const silentMs = now - lastWatchedMessageAt;
    if (silentMs < WATCHDOG_SILENCE_MS) return;
    if (watchdogLastAlertAt && now - watchdogLastAlertAt < WATCHDOG_SILENCE_MS) return;

    watchdogLastAlertAt = now;
    watchdogRestarting = true;
    const silentMin = Math.floor(silentMs / 60000);
    const anySilentSec = Math.floor((now - lastAnyMessageAt) / 1000);
    const watchedGroupLabel = lastWatchedGroupId || "[chưa có nhóm watch nào ghi nhận]";
    const fingerprint = processFingerprint();

    try {
      log(
        `Watchdog: nhóm watch im lặng ${silentMin} phút, thử restart listener... lastWatchedGroup=${watchedGroupLabel} ${fingerprint}`
      );
      await sendWatchdogAlert(
        config,
        [
          "⚠️ [GUARDIAN] Zalo listener im lặng > 5 phút",
          `Thời gian cảnh báo: ${timeLabelGMT7(now)}`,
          `Silent(watch groups): ~${silentMin} phút`,
          `Nhóm watch gần nhất: ${watchedGroupLabel}`,
          `Silent(any message): ~${anySilentSec} giây`,
          `Process: ${fingerprint}`,
          "Hành động: tự động restart listener.",
        ].join("\n")
      );
      if (typeof api.listener.stop === "function") {
        api.listener.stop();
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      api.listener.start();
      lastWatchedMessageAt = Date.now();
      listenerLikelyDown = false;
      watchdogConsecutiveFailures = 0;
      log(`Watchdog: restart listener thành công. ${fingerprint}`);
      await sendWatchdogAlert(
        config,
        [
          "✅ [GUARDIAN] Zalo listener đã được restart",
          `Thời gian: ${timeLabelGMT7(Date.now())}`,
          `Process: ${fingerprint}`,
          "Trạng thái: đang chờ message mới.",
        ].join("\n")
      );
    } catch (e) {
      const em = e instanceof Error ? e.message : String(e);
      watchdogConsecutiveFailures += 1;
      log(`Watchdog: restart listener FAIL: ${em} ${fingerprint}`);
      await sendWatchdogAlert(
        config,
        [
          "❌ [GUARDIAN] Zalo listener restart thất bại",
          `Thời gian: ${timeLabelGMT7(Date.now())}`,
          `Process: ${fingerprint}`,
          `Lỗi: ${em}`,
          "Cần kiểm tra thủ công tiến trình / credentials / kết nối mạng.",
        ].join("\n")
      );
      if (watchdogConsecutiveFailures >= WATCHDOG_MAX_CONSECUTIVE_FAILURES) {
        const criticalText = [
          "🛑 [GUARDIAN][CRITICAL] Watchdog thất bại nhiều lần",
          `Thời gian: ${timeLabelGMT7(Date.now())}`,
          `Process: ${fingerprint}`,
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
    const now = Date.now();
    lastAnyMessageAt = now;
    listenerLikelyDown = false;
    const msgGroupId = msg.data?.idTo || msg.idTo || "";
    const isWatchedGroup = isEnabledWatchGroup(msgGroupId);
    if (isWatchedGroup) {
      lastWatchedMessageAt = now;
      lastWatchedGroupId = String(msgGroupId || "");
    }
    log(`MSG from group: ${msgGroupId}${isWatchedGroup ? " [watch]" : ""}`);

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

    // Cache tin nhóm (quote + global id) — một nguồn, xem core/inboundMessageCache.js
    try {
      upsertInboundGroupMessage(db, msg);
    } catch {
      /* ignore */
    }

    // Không lọc theo config.watchGroups cứng.
    // Guardian sẽ tự lọc theo watch_groups (DB) + enabled realtime.
    eventBus.emit("zalo:message", { api, msg });
  });

  api.listener.on("undo", (data) => {
    eventBus.emit("zalo:undo", { api, data });
  });

  attachListenerResilience(api.listener, log);
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
 * Read-only snapshot dùng cho /api/health/full.
 * Không expose tham chiếu mutable; mọi field đều JSON-safe.
 */
export function getWatchdogState() {
  return {
    lastAnyMessageAt: lastAnyMessageAt || 0,
    lastWatchedMessageAt: lastWatchedMessageAt || 0,
    lastWatchedGroupId: lastWatchedGroupId || "",
    watchdogRestarting: !!watchdogRestarting,
    watchdogLastAlertAt: watchdogLastAlertAt || 0,
    watchdogConsecutiveFailures: Number(watchdogConsecutiveFailures || 0),
    listenerLikelyDown: !!listenerLikelyDown,
    watchdogActive: !!watchdogTimer,
    silenceThresholdMs: WATCHDOG_SILENCE_MS,
    tickMs: WATCHDOG_TICK_MS,
    maxConsecutiveFailures: WATCHDOG_MAX_CONSECUTIVE_FAILURES,
  };
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
