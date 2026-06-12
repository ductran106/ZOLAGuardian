// core/googleSheetsMembers.js
// Google Sheets writer for group member display names. Disabled unless configured.

import { existsSync } from "node:fs";
import db from "./db.js";

export const DEFAULT_MEMBER_SHEET_TARGETS = {
  bonngay: {
    label: "BonNgay",
    spreadsheetId: "",
    sheetName: "BonNgay",
    startCell: "F3",
  },
  sheet1: {
    label: "Sheet1",
    spreadsheetId: "",
    sheetName: "Sheet1",
    startCell: "B2",
  },
};

export function parseStartCell(startCell) {
  const m = /^([A-Za-z]+)([1-9][0-9]*)$/.exec(String(startCell || "").trim());
  if (!m) throw new Error(`Invalid startCell: ${startCell}`);
  return { column: m[1].toUpperCase(), row: Number(m[2]) };
}

function quoteSheetName(sheetName) {
  const s = String(sheetName || "").trim();
  if (!s) throw new Error("Missing sheetName");
  if (/^[A-Za-z0-9_]+$/.test(s)) return s;
  return `'${s.replace(/'/g, "''")}'`;
}

export function boundedClearRange(sheetName, startCell, currentCount = 0, previousCount = 0) {
  const { column, row } = parseStartCell(startCell);
  const clearCount = Math.max(Number(currentCount) || 0, Number(previousCount) || 0, 1);
  const endRow = row + clearCount - 1;
  return `${quoteSheetName(sheetName)}!${column}${row}:${column}${endRow}`;
}

export function valuesRange(sheetName, startCell) {
  const { column, row } = parseStartCell(startCell);
  return `${quoteSheetName(sheetName)}!${column}${row}`;
}

export function escapeSheetCellValue(value) {
  const s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r\n]/.test(s)) return `'${s}`;
  return s;
}

export function getMemberSheetTargets(config = {}) {
  const configured = config?.googleSheets?.memberTargets;
  const src = configured && typeof configured === "object" ? configured : DEFAULT_MEMBER_SHEET_TARGETS;
  return Object.fromEntries(
    Object.entries(src).map(([key, t]) => [
      key,
      {
        key,
        label: String(t.label || key),
        spreadsheetId: String(t.spreadsheetId || ""),
        sheetName: String(t.sheetName || ""),
        startCell: String(t.startCell || ""),
        valuesRange: valuesRange(t.sheetName, t.startCell),
      },
    ])
  );
}

export function publicMemberSheetTarget(t) {
  return {
    key: t.key,
    label: t.label,
    sheetName: t.sheetName,
    startCell: t.startCell,
  };
}

export function resolveTargetKeys(target) {
  const t = String(target || "").trim().toLowerCase();
  if (t === "both") return ["bonngay", "sheet1"];
  if (["bonngay", "sheet1"].includes(t)) return [t];
  throw new Error("target phải là bonngay | sheet1 | both");
}

export function isGoogleSheetsConfigured(config = {}) {
  const gs = config?.googleSheets || {};
  const targets = getMemberSheetTargets(config);
  return !!(
    gs.enabled &&
    gs.credentialsPath &&
    existsSync(gs.credentialsPath) &&
    Object.values(targets).every((t) => t.spreadsheetId)
  );
}

function getPreviousRowCount(targetKey) {
  const row = db.prepare("SELECT last_row_count FROM sheet_member_sync_state WHERE target_key = ?").get(targetKey);
  return Number(row?.last_row_count || 0);
}

function updateRowCount(targetKey, groupId, count, ts) {
  db.prepare(`
    INSERT INTO sheet_member_sync_state (target_key, group_id, last_row_count, last_write_ts)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(target_key) DO UPDATE SET
      group_id = excluded.group_id,
      last_row_count = excluded.last_row_count,
      last_write_ts = excluded.last_write_ts
  `).run(targetKey, groupId || "", Number(count) || 0, ts);
}

export async function pushMemberNamesToSheets({ config, target, names, groupId = "", dryRun = false }) {
  const targets = getMemberSheetTargets(config);
  const keys = resolveTargetKeys(target);
  const values = (names || []).map((name) => [escapeSheetCellValue(name)]);
  const ts = Date.now();
  const results = keys.map((key) => {
    const t = targets[key];
    if (!t) throw new Error(`Chưa cấu hình target Google Sheets: ${key}`);
    const previousCount = getPreviousRowCount(key);
    return {
      key,
      label: t.label,
      sheetName: t.sheetName,
      startCell: t.startCell,
      clearRange: boundedClearRange(t.sheetName, t.startCell, values.length, previousCount),
      valuesRange: t.valuesRange,
      count: values.length,
      previousCount,
      dryRun: !!dryRun,
    };
  });

  if (dryRun) return { ok: true, dryRun: true, results };
  if (!isGoogleSheetsConfigured(config)) {
    const err = new Error("Google Sheets chưa được bật/cấu hình credentials và spreadsheet targets");
    err.statusCode = 501;
    err.code = "GOOGLE_SHEETS_NOT_CONFIGURED";
    throw err;
  }

  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    keyFile: config.googleSheets.credentialsPath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  for (const r of results) {
    const t = targets[r.key];
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: t.spreadsheetId,
        range: r.clearRange,
      });
      if (values.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: t.spreadsheetId,
          range: r.valuesRange,
          valueInputOption: "RAW",
          requestBody: { values },
        });
      }
      updateRowCount(r.key, groupId, values.length, ts);
    } catch (e) {
      const err = new Error(`Google Sheets write failed after bounded clear for ${r.key}: ${e?.message || e}`);
      err.statusCode = 502;
      err.code = "GOOGLE_SHEETS_PARTIAL_FAILURE";
      err.partialFailure = true;
      err.clearRange = r.clearRange;
      throw err;
    }
  }
  return { ok: true, dryRun: false, results };
}
