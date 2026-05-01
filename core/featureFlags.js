// core/featureFlags.js
// Mục đích: Đọc/ghi feature flags từ SQLite
// Dùng cho toggle ON/OFF runtime từ Web UI

import db from "./db.js";

export function isEnabled(key) {
  const row = db.prepare("SELECT enabled FROM features WHERE key = ?").get(key);
  return row ? row.enabled === 1 : false;
}

export function setEnabled(key, enabled) {
  db.prepare(
    "INSERT INTO features (key, enabled) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET enabled = excluded.enabled"
  ).run(key, enabled ? 1 : 0);
}

export function getAllFlags() {
  return db.prepare("SELECT key, enabled FROM features").all();
}
