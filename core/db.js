// core/db.js
// Mục đích: SQLite wrapper dùng better-sqlite3
// Khởi tạo schema, export db instance dùng chung

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { migrateViolationRuleTypes } from "./violationRuleMigration.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../data/guardian.db");

mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    msg_id       TEXT UNIQUE,
    group_id     TEXT,
    user_id      TEXT,
    display_name TEXT,
    content      TEXT,
    msg_type     TEXT DEFAULT 'text',
    ts           INTEGER,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS violations (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      TEXT,
    display_name TEXT,
    group_id     TEXT,
    type         TEXT,
    detail       TEXT,
    ts           DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS features (
    key     TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 1,
    config  TEXT
  );

  CREATE TABLE IF NOT EXISTS watch_groups (
    group_id       TEXT PRIMARY KEY,
    name           TEXT,
    enabled        INTEGER DEFAULT 1,
    admin_ids      TEXT,
    alert_group_id TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS group_names (
    group_id   TEXT PRIMARY KEY,
    name       TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS spam_list (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    list_type   TEXT    NOT NULL CHECK (list_type IN ('allow', 'block')),
    pattern     TEXT    NOT NULL,
    kind        TEXT    NOT NULL DEFAULT 'substring' CHECK (kind IN ('host', 'substring', 'regex')),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (list_type, pattern)
  );

  CREATE TABLE IF NOT EXISTS group_violation_rules (
    group_id   TEXT NOT NULL,
    type       TEXT NOT NULL,
    enabled    INTEGER NOT NULL DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, type)
  );
`);

// Seed default feature flags nếu chưa có
const seedFeature = db.prepare(
  "INSERT OR IGNORE INTO features (key, enabled) VALUES (?, ?)"
);
seedFeature.run("bot", 1);
seedFeature.run("guardian", 1);

try {
  migrateViolationRuleTypes(db);
} catch (e) {
  console.error(`[db] violation rule migration: ${e.message}`);
}

export default db;
