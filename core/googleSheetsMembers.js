// core/googleSheetsMembers.js
// Google Sheets writer for group member display names. Disabled unless configured.

import { existsSync } from "node:fs";

export const DEFAULT_MEMBER_SHEET_TARGETS = {
  bonngay: {
    label: "BonNgay",
    spreadsheetId: "1kKlmhAb7zCk4Jmw48QOSBYbXXpnTEkSOATN9EKMbDhw",
    sheetName: "BonNgay",
    startCell: "F3",
  },
  sheet1: {
    label: "Sheet1",
    spreadsheetId: "1Kct73bLlGUBA_5gYKVaUgw3KJ2Qz7dhvIcdN5jc0CVE",
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

export function clearRange(sheetName, startCell) {
  const { column, row } = parseStartCell(startCell);
  return `${quoteSheetName(sheetName)}!${column}${row}:${column}`;
}

export function valuesRange(sheetName, startCell) {
  const { column, row } = parseStartCell(startCell);
  return `${quoteSheetName(sheetName)}!${column}${row}`;
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
        clearRange: clearRange(t.sheetName, t.startCell),
        valuesRange: valuesRange(t.sheetName, t.startCell),
      },
    ])
  );
}

export function resolveTargetKeys(target) {
  const t = String(target || "").trim().toLowerCase();
  if (t === "both") return ["bonngay", "sheet1"];
  if (["bonngay", "sheet1"].includes(t)) return [t];
  throw new Error("target phải là bonngay | sheet1 | both");
}

export function isGoogleSheetsConfigured(config = {}) {
  const gs = config?.googleSheets || {};
  return !!(gs.enabled && gs.credentialsPath && existsSync(gs.credentialsPath));
}

export async function pushMemberNamesToSheets({ config, target, names, dryRun = false }) {
  const targets = getMemberSheetTargets(config);
  const keys = resolveTargetKeys(target);
  const values = (names || []).map((name) => [String(name || "")]);
  const results = keys.map((key) => {
    const t = targets[key];
    if (!t) throw new Error(`Chưa cấu hình target Google Sheets: ${key}`);
    return {
      key,
      label: t.label,
      spreadsheetId: t.spreadsheetId,
      sheetName: t.sheetName,
      clearRange: t.clearRange,
      valuesRange: t.valuesRange,
      count: values.length,
      dryRun: !!dryRun,
    };
  });

  if (dryRun) return { ok: true, dryRun: true, results };
  if (!isGoogleSheetsConfigured(config)) {
    const err = new Error("Google Sheets chưa được bật/cấu hình credentials");
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
    await sheets.spreadsheets.values.clear({
      spreadsheetId: r.spreadsheetId,
      range: r.clearRange,
    });
    if (values.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: r.spreadsheetId,
        range: r.valuesRange,
        valueInputOption: "RAW",
        requestBody: { values },
      });
    }
  }
  return { ok: true, dryRun: false, results };
}
