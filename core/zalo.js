// core/zalo.js
// Mục đích: Login zca-js, khởi động listener, emit events lên eventBus
// Đây là cầu nối duy nhất giữa zca-js và phần còn lại của hệ thống

import { readFileSync } from "node:fs";
import os from "node:os";
import eventBus from "./eventBus.js";
import db from "./db.js";
import { upsertInboundGroupMessage } from "./inboundMessageCache.js";
import { sendTelegramEvidence, timeLabelGMT7 } from "../modules/guardian/telegramNotify.js";
import { shouldSkipWatchdogForQuietHours } from "./watchdogQuiet.js";
import { ACTIONS, STATES, evaluatePostRestart, evaluateTick, initialState } from "./watchdogStateMachine.js";

let api = null;
let watchdogTimer = null;
let lastAnyMessageAt = 0;
let lastWatchedMessageAt = 0;
let lastWatchedGroupId = "";
let watchdogRestarting = false;
let watchdogLastAlertAt = 0;
let watchdogConsecutiveFailures = 0;
let listenerLikelyDown = false;
let watchdogFsmState = initialState();
let watchdogFsmReason = "watchdog not started";
let watchdogFsmAction = ACTIONS.NONE;
let listenerRecoveryVerifyUntil = 0;
let listenerLastStartAt = 0;
let listenerInstanceSeq = 0;
let currentListenerInstanceId = 0;
let listenerStartSource = "";
let listenerLastDownAt = 0;
let listenerLastDownDetail = "";
let processRestartScheduled = false;
let quickRestartRequestedAt = 0;
let quickRestartReason = "";
let lastPersistOkAt = 0;
let lastPersistOkGroupId = "";
let lastPersistOkMsgId = "";
let lastPersistFailAt = 0;
let lastPersistFailGroupId = "";
let lastPersistFailMsgId = "";
let lastPersistFailDetail = "";

const getEnabledWatchGroupStmt = db.prepare(
  "SELECT 1 FROM watch_groups WHERE group_id = ? AND enabled = 1 LIMIT 1"
);
const countEnabledWatchGroupsStmt = db.prepare(
  "SELECT COUNT(*) AS c FROM watch_groups WHERE enabled = 1"
);

const WATCHDOG_SILENCE_MS = 5 * 60 * 1000;
const WATCHDOG_TICK_MS = 30 * 1000;
const WATCHDOG_MAX_CONSECUTIVE_FAILURES = 3;
const WATCHDOG_QUICK_RESTART_DELAY_MS = 15 * 1000;

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
  watchdogFsmState = initialState();
  watchdogFsmReason = "watchdog cleared";
  watchdogFsmAction = ACTIONS.NONE;
  listenerRecoveryVerifyUntil = 0;
  listenerLastStartAt = 0;
  listenerInstanceSeq = 0;
  currentListenerInstanceId = 0;
  listenerStartSource = "";
  listenerLastDownAt = 0;
  listenerLastDownDetail = "";
  processRestartScheduled = false;
  quickRestartRequestedAt = 0;
  quickRestartReason = "";
  lastPersistOkAt = 0;
  lastPersistOkGroupId = "";
  lastPersistOkMsgId = "";
  lastPersistFailAt = 0;
  lastPersistFailGroupId = "";
  lastPersistFailMsgId = "";
  lastPersistFailDetail = "";
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

function markListenerStart(source, log) {
  listenerInstanceSeq += 1;
  currentListenerInstanceId = listenerInstanceSeq;
  listenerStartSource = String(source || "manual");
  listenerLastStartAt = Date.now();
  listenerRecoveryVerifyUntil = listenerLastStartAt + WATCHDOG_TICK_MS * 2;
  quickRestartRequestedAt = 0;
  quickRestartReason = "";
  log(
    `Listener started. instance=${currentListenerInstanceId} source=${listenerStartSource} ${processFingerprint()}`
  );
}

async function sendWatchdogAlert(config, plainText) {
  await sendTelegramEvidence(config, { plainText });
}

function restartCurrentProcess(log) {
  if (processRestartScheduled) {
    log("Watchdog tầng 2: bỏ qua restart trùng vì process restart đã được lên lịch.");
    return;
  }
  processRestartScheduled = true;
  log(`Watchdog tầng 2: yêu cầu systemd restart bằng cách exit process hiện tại. ${processFingerprint()}`);
  setTimeout(() => process.exit(2), 300).unref();
}

/**
 * Chỉ log lỗi lifecycle của listener, KHÔNG reconnect nóng ở tầng event này.
 * Lý do: với vài lỗi WS/event thấp tầng, việc stop/start ngay trong handler có thể
 * kéo runtime vào vòng lặp hoặc trạng thái nửa sống. Phục hồi nên đi qua watchdog.
 */
function attachListenerResilience(listener, log) {
  if (!listener?.on) return;

  const markListenerDown = (detail) => {
    listenerLikelyDown = true;
    listenerLastDownAt = Date.now();
    listenerLastDownDetail = String(detail || "");
    const uptimeMs = listenerLastStartAt > 0 ? Math.max(0, listenerLastDownAt - listenerLastStartAt) : null;
    if (listenerRecoveryVerifyUntil && Date.now() <= listenerRecoveryVerifyUntil) {
      watchdogConsecutiveFailures += 1;
      watchdogLastAlertAt = 0;
      if (watchdogConsecutiveFailures < WATCHDOG_MAX_CONSECUTIVE_FAILURES) {
        quickRestartRequestedAt = Date.now() + WATCHDOG_QUICK_RESTART_DELAY_MS;
        quickRestartReason = `verify-window failure: ${detail}`;
      }
      log(
        `Listener hồi phục không bền ngay sau restart (${watchdogConsecutiveFailures}/${WATCHDOG_MAX_CONSECUTIVE_FAILURES}) instance=${currentListenerInstanceId} source=${listenerStartSource} uptimeMs=${uptimeMs ?? -1} -> ${detail}`
      );
      if (watchdogConsecutiveFailures >= WATCHDOG_MAX_CONSECUTIVE_FAILURES) {
        log("Watchdog: listener rơi lại nhiều lần ngay sau restart, escalates process-level restart.");
        restartCurrentProcess(log);
        return;
      }
    } else {
      quickRestartRequestedAt = Date.now() + WATCHDOG_QUICK_RESTART_DELAY_MS;
      quickRestartReason = `runtime down event outside verify window: ${detail}`;
      log(
        `Listener down ngoài verify-window: instance=${currentListenerInstanceId} source=${listenerStartSource} uptimeMs=${uptimeMs ?? -1} -> sẽ quick-restart sau ${Math.floor(WATCHDOG_QUICK_RESTART_DELAY_MS / 1000)}s`
      );
    }
  };

  listener.on("error", (err) => {
    const em =
      err instanceof Error
        ? `${err.message}${err.code ? ` [${err.code}]` : ""}`
        : String(err);
    markListenerDown(`error=${em}`);
    log(`Listener error (process vẫn chạy): ${em}`);
  });

  listener.on("closed", (code, reason) => {
    markListenerDown(`closed code=${code} reason=${reason || ""}`);
    log(`Listener closed: code=${code} reason=${reason || ""}`);
  });

  listener.on("disconnected", (code, reason) => {
    markListenerDown(`disconnected code=${code} reason=${reason || ""}`);
    log(`Listener disconnected: code=${code} reason=${reason || ""}`);
  });
}

function startWatchdog(config, log) {
  clearWatchdog();
  const now0 = Date.now();
  lastAnyMessageAt = now0;
  lastWatchedMessageAt = now0;
  watchdogTimer = setInterval(async () => {
    const now = Date.now();
    let forcedQuickRestart = false;
    if (
      quickRestartRequestedAt > 0 &&
      now >= quickRestartRequestedAt &&
      !watchdogRestarting &&
      api &&
      api.listener
    ) {
      forcedQuickRestart = true;
      watchdogFsmState = STATES.MONITORING;
      watchdogFsmReason = `quick restart requested: ${quickRestartReason || "listener-down event"}`;
      watchdogFsmAction = ACTIONS.RESTART_LISTENER;
    }
    const fsm = forcedQuickRestart
      ? {
          state: watchdogFsmState,
          reason: watchdogFsmReason,
          action: ACTIONS.RESTART_LISTENER,
          silentMs: Math.max(0, now - lastWatchedMessageAt),
        }
      : evaluateTick({
      nowMs: now,
      watchdogActive: !!watchdogTimer,
      hasListener: !!(api && api.listener),
      restarting: watchdogRestarting,
      watchGroupsEnabledCount: api && api.listener ? countEnabledWatchGroups() : 0,
      quietHoursActive: shouldSkipWatchdogForQuietHours(now),
      listenerLikelyDown,
      lastWatchedMessageAt,
      lastAlertAt: watchdogLastAlertAt,
      silenceThresholdMs: WATCHDOG_SILENCE_MS,
      alertCooldownMs: WATCHDOG_SILENCE_MS,
    });
    watchdogFsmState = fsm.state;
    watchdogFsmReason = fsm.reason;
    watchdogFsmAction = fsm.action;
    if (fsm.action !== ACTIONS.RESTART_LISTENER) return;

    const silentMs = fsm.silentMs;
    watchdogLastAlertAt = now;
    watchdogRestarting = true;
    const silentMin = Math.floor(silentMs / 60000);
    const anySilentSec = Math.floor((now - lastAnyMessageAt) / 1000);
    const watchedGroupLabel = lastWatchedGroupId || "[chưa có nhóm watch nào ghi nhận]";
    const fingerprint = processFingerprint();
    const restartMode = forcedQuickRestart ? "quick-restart" : "watchdog-silence";

    try {
      log(
        `Watchdog: thử restart listener mode=${restartMode} lastWatchedGroup=${watchedGroupLabel} silentWatchMin=${silentMin} quickReason=${quickRestartReason || ""} instance=${currentListenerInstanceId} ${fingerprint}`
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
      listenerLikelyDown = false;
      markListenerStart(`watchdog:${restartMode}`, log);
      watchdogFsmState = STATES.MONITORING;
      watchdogFsmReason = "listener restart requested; awaiting real traffic";
      watchdogFsmAction = ACTIONS.NONE;
      log(`Watchdog: restart listener thành công, chờ verify traffic thật. mode=${restartMode} ${fingerprint}`);
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
      const postRestart = evaluatePostRestart({
        consecutiveFailures: watchdogConsecutiveFailures,
        maxConsecutiveFailures: WATCHDOG_MAX_CONSECUTIVE_FAILURES,
      });
      watchdogFsmState = postRestart.state;
      watchdogFsmReason = postRestart.reason;
      watchdogFsmAction = postRestart.action;
      if (postRestart.action === ACTIONS.ESCALATE_PROCESS) {
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
    listenerRecoveryVerifyUntil = 0;
    watchdogConsecutiveFailures = 0;
    quickRestartRequestedAt = 0;
    quickRestartReason = "";
    const d = msg?.data || msg || {};
    const msgGroupId = d.idTo || msg.idTo || "";
    const msgId = String(d.msgId || msg?.msgId || "");
    const eventTsMs = Number(d.ts || now) || now;
    const isWatchedGroup = isEnabledWatchGroup(msgGroupId);
    if (isWatchedGroup) {
      lastWatchedMessageAt = now;
      lastWatchedGroupId = String(msgGroupId || "");
    }
    log(
      `MSG from group: ${msgGroupId}${isWatchedGroup ? " [watch]" : ""} msgId=${msgId || "[none]"} instance=${currentListenerInstanceId} source=${listenerStartSource}`
    );

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
      lastPersistOkAt = Date.now();
      lastPersistOkGroupId = String(msgGroupId || "");
      lastPersistOkMsgId = msgId;
      if (isWatchedGroup) {
        log(
          `Persist OK [watch] group=${msgGroupId} msgId=${msgId || "[none]"} eventLagMs=${Math.max(0, Date.now() - eventTsMs)} instance=${currentListenerInstanceId}`
        );
      }
    } catch (e) {
      const em = e instanceof Error ? e.stack || e.message : String(e);
      lastPersistFailAt = Date.now();
      lastPersistFailGroupId = String(msgGroupId || "");
      lastPersistFailMsgId = msgId;
      lastPersistFailDetail = em;
      log(
        `Persist FAIL group=${msgGroupId} msgId=${msgId || "[none]"} watched=${isWatchedGroup ? 1 : 0} instance=${currentListenerInstanceId} error=${em}`
      );
    }

    // Không lọc theo config.watchGroups cứng.
    // Guardian sẽ tự lọc theo watch_groups (DB) + enabled realtime.
    eventBus.emit("zalo:message", { api, msg });
  });

  api.listener.on("undo", (data) => {
    eventBus.emit("zalo:undo", { api, data });
  });

  attachListenerResilience(api.listener, log);
  startWatchdog(config, log);
  api.listener.start();
  markListenerStart("initial-login", log);

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
    fsmState: watchdogFsmState,
    fsmReason: watchdogFsmReason,
    fsmAction: watchdogFsmAction,
    listenerRecoveryVerifyUntil: listenerRecoveryVerifyUntil || 0,
    listenerLastStartAt: listenerLastStartAt || 0,
    currentListenerInstanceId: currentListenerInstanceId || 0,
    listenerStartSource: listenerStartSource || "",
    listenerLastDownAt: listenerLastDownAt || 0,
    listenerLastDownDetail: listenerLastDownDetail || "",
    quickRestartRequestedAt: quickRestartRequestedAt || 0,
    quickRestartReason: quickRestartReason || "",
    lastPersistOkAt: lastPersistOkAt || 0,
    lastPersistOkGroupId: lastPersistOkGroupId || "",
    lastPersistOkMsgId: lastPersistOkMsgId || "",
    lastPersistFailAt: lastPersistFailAt || 0,
    lastPersistFailGroupId: lastPersistFailGroupId || "",
    lastPersistFailMsgId: lastPersistFailMsgId || "",
    lastPersistFailDetail: lastPersistFailDetail || "",
  };
}

/**
 * Dừng listener WebSocket và xóa tham chiếu API (đăng xuất phía client).
 */
export function getHealthSnapshot() {
  const now = Date.now();
  const watchGroupsEnabledCount = api && api.listener ? countEnabledWatchGroups() : 0;
  const silentAnyMs = lastAnyMessageAt > 0 ? Math.max(0, now - lastAnyMessageAt) : null;
  const silentWatchedMs = lastWatchedMessageAt > 0 ? Math.max(0, now - lastWatchedMessageAt) : null;
  const listenerConnected = !!(api && api.listener);
  const startupGraceActive = !!(
    listenerLastStartAt && now - listenerLastStartAt < WATCHDOG_SILENCE_MS
  );

  let status = "healthy";
  let reason = "listener connected and traffic within threshold";

  if (!listenerConnected) {
    status = "down";
    reason = "api/listener missing";
  } else if (listenerLikelyDown) {
    status = "down";
    reason = "listener flagged down by runtime events";
  } else if (watchGroupsEnabledCount > 0 && !startupGraceActive && silentWatchedMs !== null && silentWatchedMs >= WATCHDOG_SILENCE_MS) {
    status = "down";
    reason = "watched-group traffic stale beyond threshold";
  } else if (watchdogConsecutiveFailures > 0) {
    status = "degraded";
    reason = `watchdog recovery failures present (${watchdogConsecutiveFailures})`;
  } else if (listenerRecoveryVerifyUntil && now <= listenerRecoveryVerifyUntil) {
    status = "degraded";
    reason = "listener recently started/restarted; waiting for real traffic verification";
  } else if (watchGroupsEnabledCount <= 0) {
    status = "degraded";
    reason = "no watch groups enabled";
  }

  return {
    ok: status === "healthy",
    status,
    reason,
    listenerConnected,
    listenerLikelyDown,
    watchGroupsEnabledCount,
    startupGraceActive,
    silentAnyMs,
    silentWatchedMs,
    watchdog: getWatchdogState(),
    process: {
      pid: process.pid,
      ppid: process.ppid,
    },
  };
}

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
