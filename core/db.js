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
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    quote_msg_id   TEXT,
    quote_owner_id TEXT
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

  CREATE TABLE IF NOT EXISTS group_members (
    group_id         TEXT NOT NULL,
    user_id          TEXT NOT NULL,
    display_name     TEXT,
    zalo_name        TEXT,
    avatar           TEXT,
    account_status   INTEGER,
    type             INTEGER,
    global_id        TEXT,
    last_update_time INTEGER,
    last_sync_ts     INTEGER NOT NULL,
    is_active        INTEGER DEFAULT 1,
    left_ts          INTEGER,
    PRIMARY KEY (group_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS sheet_member_sync_state (
    target_key     TEXT PRIMARY KEY,
    group_id       TEXT,
    last_row_count INTEGER DEFAULT 0,
    last_write_ts  INTEGER
  );
`);

// Migrate: thêm cột quote nếu chưa có
try {
  db.prepare("ALTER TABLE messages ADD COLUMN quote_msg_id TEXT").run();
} catch {}
try {
  db.prepare("ALTER TABLE messages ADD COLUMN quote_owner_id TEXT").run();
} catch {}
try {
  db.prepare("ALTER TABLE messages ADD COLUMN global_msg_id TEXT").run();
} catch {}
try {
  db.prepare("ALTER TABLE messages ADD COLUMN cli_msg_id TEXT").run();
} catch {}

try {
  db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_messages_group_ts ON messages(group_id, ts)"
  ).run();
} catch {}
try {
  db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_messages_group_global_msg_id ON messages(group_id, global_msg_id)"
  ).run();
} catch {}
try {
  db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_messages_group_quote_msg_id ON messages(group_id, quote_msg_id)"
  ).run();
} catch {}
try {
  db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_messages_group_cli_msg_id ON messages(group_id, cli_msg_id)"
  ).run();
} catch {}
try {
  db.prepare("ALTER TABLE group_members ADD COLUMN is_active INTEGER DEFAULT 1").run();
} catch {}
try {
  db.prepare("ALTER TABLE group_members ADD COLUMN left_ts INTEGER").run();
} catch {}
try {
  db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id)"
  ).run();
} catch {}
try {
  db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_group_members_sync ON group_members(last_sync_ts)"
  ).run();
} catch {}
try {
  db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_group_members_active ON group_members(group_id, is_active)"
  ).run();
} catch {}

try {
  db.prepare(`CREATE TABLE IF NOT EXISTS jobs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    msg_id          TEXT UNIQUE,
    group_id        TEXT,
    poster_id       TEXT,
    poster_name     TEXT,
    taker_id        TEXT,
    taker_name      TEXT,
    taker_msg_id    TEXT,
    confirm_msg_id  TEXT,
    cancel_msg_id   TEXT,
    raw_content     TEXT,
    price           INTEGER,
    trip_type       TEXT,
    base_points     REAL,
    status          TEXT DEFAULT 'OPEN',
    job_date        TEXT,
    ts              INTEGER,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    points_source   TEXT DEFAULT 'BAREM',
    override_points REAL,
    override_by     TEXT,
    override_note   TEXT
  )`).run();
} catch (e) {}

try {
  db.prepare(
    "ALTER TABLE jobs ADD COLUMN points_source TEXT DEFAULT 'BAREM'"
  ).run();
} catch {}
try {
  db.prepare("ALTER TABLE jobs ADD COLUMN override_points REAL").run();
} catch {}
try {
  db.prepare("ALTER TABLE jobs ADD COLUMN override_by TEXT").run();
} catch {}
try {
  db.prepare("ALTER TABLE jobs ADD COLUMN override_note TEXT").run();
} catch {}

try {
  db.prepare(`CREATE TABLE IF NOT EXISTS docx_tracked_groups (
    group_id   TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
} catch (e) {}

try {
  db.prepare(
    "ALTER TABLE watch_groups ADD COLUMN watchdog_quiet_mode TEXT DEFAULT 'inherit'"
  ).run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE watch_groups ADD COLUMN watchdog_quiet_start TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE watch_groups ADD COLUMN watchdog_quiet_end TEXT").run();
} catch (e) {}

try {
  db.prepare(`CREATE TABLE IF NOT EXISTS daily_scores (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT,
    display_name    TEXT,
    group_id        TEXT,
    date            TEXT,
    jobs_posted     INTEGER DEFAULT 0,
    jobs_taken      INTEGER DEFAULT 0,
    points_earned   REAL DEFAULT 0,
    points_deducted REAL DEFAULT 0,
    net_points      REAL DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id, date)
  )`).run();
} catch (e) {}

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
