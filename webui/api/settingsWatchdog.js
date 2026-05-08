// webui/api/settingsWatchdog.js — giờ nghỉ watchdog mặc định (config.json)

import { Router } from "express";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseHHMM } from "../../core/watchdogQuiet.js";

export const watchdogSettingsRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, "../../config.json");

function readConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
}

function writeConfig(next) {
  writeFileSync(CONFIG_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

watchdogSettingsRouter.get("/", (_req, res) => {
  try {
    const cfg = readConfig();
    res.json({
      ok: true,
      watchdogQuietStart: String(cfg.watchdogQuietStart ?? "23:00"),
      watchdogQuietEnd: String(cfg.watchdogQuietEnd ?? "05:00"),
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
});

watchdogSettingsRouter.patch("/", (req, res) => {
  const { watchdogQuietStart, watchdogQuietEnd } = req.body || {};
  const s = String(watchdogQuietStart ?? "").trim();
  const e = String(watchdogQuietEnd ?? "").trim();
  if (!s || !e) {
    return res.status(400).json({
      ok: false,
      error: "watchdogQuietStart và watchdogQuietEnd (HH:MM) bắt buộc",
    });
  }
  if (parseHHMM(s) == null || parseHHMM(e) == null) {
    return res
      .status(400)
      .json({ ok: false, error: "Định dạng giờ phải là HH:MM (00:00–23:59)" });
  }
  try {
    const cfg = readConfig();
    cfg.watchdogQuietStart = s;
    cfg.watchdogQuietEnd = e;
    writeConfig(cfg);
    res.json({
      ok: true,
      watchdogQuietStart: s,
      watchdogQuietEnd: e,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});
