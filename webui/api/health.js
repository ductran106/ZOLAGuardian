// webui/api/health.js — /api/health/full
// Snapshot toàn diện cho System Health page: process + config + db + zalo + watchdog.
// Bắt buộc: không crash khi Zalo chưa kết nối, DB query lỗi, hoặc config thiếu trường.

import os from "node:os";
import { Router } from "express";
import db from "../../core/db.js";
import { loadConfig } from "../../core/loadConfig.js";
import { getApi, getWatchdogState } from "../../core/zalo.js";
import { getAllFlags } from "../../core/featureFlags.js";
import { isWebUiAuthConfigured } from "../basicAuth.js";
import { getZaloAuthEnv } from "./zaloAuth.js";

export const healthRouter = Router();

const PROCESS_STARTED_AT_MS = Date.now() - Math.floor(process.uptime() * 1000);
const PROCESS_STARTED_AT_ISO = new Date(PROCESS_STARTED_AT_MS).toISOString();

function safeDbQuery(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function readDbHealth() {
  let ok = false;
  let probeError = null;
  try {
    const row = db.prepare("SELECT 1 AS ok").get();
    ok = !!(row && row.ok === 1);
  } catch (e) {
    probeError = String(e?.message || e);
  }

  const messagesTotal = safeDbQuery(
    () => Number(db.prepare("SELECT COUNT(*) AS c FROM messages").get()?.c || 0),
    null
  );
  const lastMessageTs = safeDbQuery(
    () => Number(db.prepare("SELECT MAX(ts) AS m FROM messages").get()?.m || 0),
    null
  );
  const watchGroupsEnabled = safeDbQuery(
    () =>
      Number(
        db.prepare("SELECT COUNT(*) AS c FROM watch_groups WHERE enabled = 1").get()?.c || 0
      ),
    null
  );
  const watchGroupsTotal = safeDbQuery(
    () => Number(db.prepare("SELECT COUNT(*) AS c FROM watch_groups").get()?.c || 0),
    null
  );
  const violationsTotal = safeDbQuery(
    () => Number(db.prepare("SELECT COUNT(*) AS c FROM violations").get()?.c || 0),
    null
  );
  const violationsLast24h = safeDbQuery(
    () =>
      Number(
        db
          .prepare(
            "SELECT COUNT(*) AS c FROM violations WHERE ts >= datetime('now','-1 day')"
          )
          .get()?.c || 0
      ),
    null
  );

  return {
    ok,
    probeError,
    messagesTotal,
    lastMessageTs,
    watchGroupsEnabled,
    watchGroupsTotal,
    violationsTotal,
    violationsLast24h,
  };
}

function readProcessHealth() {
  const mem = process.memoryUsage();
  return {
    pid: process.pid,
    ppid: process.ppid,
    hostname: os.hostname(),
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    uptimeSec: Math.floor(process.uptime()),
    startedAt: PROCESS_STARTED_AT_ISO,
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
    },
    loadAvg: os.loadavg(),
    cpus: os.cpus().length,
  };
}

function readConfigHealth(config) {
  return {
    webuiPort: Number(config?.webuiPort) || 3456,
    skipZalo: String(process.env.ZALO_GUARDIAN_SKIP_ZALO || "") === "1",
    basicAuthEnabled: isWebUiAuthConfigured(config),
    watchdogQuietStart: String(config?.watchdogQuietStart || "23:00"),
    watchdogQuietEnd: String(config?.watchdogQuietEnd || "05:00"),
    hasTelegram: !!(config?.telegramBotToken && config?.telegramChatId),
    credentialsPathConfigured: !!String(config?.credentialsPath || "").trim(),
    zcaPathConfigured: !!String(config?.zcaPath || "").trim(),
  };
}

function readZaloHealth() {
  const api = getApi();
  const connected = !!api;
  let ownId = null;
  if (api) {
    try {
      ownId = api.getOwnId != null ? String(api.getOwnId()) : null;
    } catch {
      ownId = null;
    }
  }
  let watchdog = null;
  try {
    watchdog = getWatchdogState();
  } catch (e) {
    watchdog = { error: String(e?.message || e) };
  }
  return {
    connected,
    ownId,
    auth: getZaloAuthEnv(),
    watchdog,
  };
}

healthRouter.get("/", (_req, res) => {
  let config = {};
  try {
    config = loadConfig();
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: `config_load_failed: ${String(e?.message || e)}`,
    });
  }

  let flags = [];
  try {
    flags = getAllFlags();
  } catch {
    flags = [];
  }

  const proc = readProcessHealth();
  const dbHealth = readDbHealth();
  const zalo = readZaloHealth();
  const cfg = readConfigHealth(config);

  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    process: proc,
    config: cfg,
    db: dbHealth,
    zalo,
    flags,
  });
});
