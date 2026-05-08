// core/watchdogQuiet.js
// Giờ nghỉ watchdog (GMT+7): mỗi nhóm có thể inherit / custom / tắt.
// Bỏ qua kiểm tra im lặng chỉ khi MỌI nhóm enabled đều đang trong khung nghỉ của chính nhóm đó.

import db from "./db.js";
import { loadConfig } from "./loadConfig.js";

const MODE = {
  INHERIT: "inherit",
  CUSTOM: "custom",
  OFF: "off",
};

/** @param {string} s */
export function parseHHMM(s) {
  const t = String(s ?? "").trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

/** Phút trong ngày theo đồng hồ GMT+7 (hiển thị giờ VN). */
export function minutesNowGmt7(ms) {
  const d = new Date(Number(ms) + 7 * 3600000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/**
 * @param {number} m - phút 0..1439
 * @param {number} startMin
 * @param {number} endMin
 */
export function isMinuteInQuietWindow(m, startMin, endMin) {
  if (startMin === endMin) return false;
  if (startMin > endMin) {
    return m >= startMin || m < endMin;
  }
  return m >= startMin && m < endMin;
}

/**
 * Nhóm có đang trong khung nghỉ (theo cấu hình nhóm + mặc định config) hay không.
 * @param {Record<string, unknown>} row
 * @param {Record<string, unknown>} config
 * @param {number} nowMs
 */
function rowIsInQuietWindow(row, config, nowMs) {
  const mode = String(row.watchdog_quiet_mode || MODE.INHERIT);
  if (mode === MODE.OFF) return false;

  const defS =
    String(config.watchdogQuietStart || "23:00").trim() || "23:00";
  const defE = String(config.watchdogQuietEnd || "05:00").trim() || "05:00";

  let startStr = defS;
  let endStr = defE;
  if (mode === MODE.CUSTOM) {
    startStr = String(row.watchdog_quiet_start ?? "").trim() || defS;
    endStr = String(row.watchdog_quiet_end ?? "").trim() || defE;
  }

  const sm = parseHHMM(startStr);
  const em = parseHHMM(endStr);
  if (sm == null || em == null) return false;

  const m = minutesNowGmt7(nowMs);
  return isMinuteInQuietWindow(m, sm, em);
}

/**
 * @param {number} nowMs
 * @returns {boolean} true → bỏ qua tick watchdog (giờ thấp điểm theo tất cả nhóm enabled)
 */
export function shouldSkipWatchdogForQuietHours(nowMs) {
  const config = loadConfig();
  const rows = db
    .prepare(
      `SELECT watchdog_quiet_mode, watchdog_quiet_start, watchdog_quiet_end
       FROM watch_groups WHERE enabled = 1`
    )
    .all();

  if (rows.length === 0) return false;

  for (const row of rows) {
    if (!rowIsInQuietWindow(row, config, nowMs)) {
      return false;
    }
  }
  return true;
}
