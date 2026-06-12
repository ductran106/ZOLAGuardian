// webui/api/features.js

import { Router } from "express";
import { getAllFlags, setEnabled } from "../../core/featureFlags.js";
import eventBus from "../../core/eventBus.js";
import db from "../../core/db.js";
import { getApi } from "../../core/zalo.js";
import { isBotGroupAdmin } from "../../core/groupDiscovery.js";
import { parseHHMM } from "../../core/watchdogQuiet.js";
import { loadConfig } from "../../core/loadConfig.js";
import { getCachedGroupMembers, syncGroupMembers, dedupeMembersForSheet } from "../../core/groupMembers.js";
import { getMemberSheetTargets, pushMemberNamesToSheets } from "../../core/googleSheetsMembers.js";

export const featuresRouter = Router();
export const groupsRouter = Router();
const VIOLATION_TYPES = [
  "URL_BLACKLIST",
  "KEYWORD_SPAM",
  "REPEAT_SPAM",
  "EMOJI_SPAM",
  "STICKER_SPAM",
  "MESSAGE_RECALLED_SELF",
  "MESSAGE_DELETED_BY_ADMIN",
];

function readViolationRules(groupId) {
  const rows = db
    .prepare(
      "SELECT type, enabled FROM group_violation_rules WHERE group_id = ?"
    )
    .all(groupId);
  const out = Object.fromEntries(VIOLATION_TYPES.map((t) => [t, true]));
  for (const r of rows) out[String(r.type)] = Number(r.enabled) === 1;
  return out;
}

featuresRouter.get("/", (_req, res) => {
  res.json({ ok: true, flags: getAllFlags() });
});

featuresRouter.post("/", (req, res) => {
  const { key, enabled } = req.body || {};
  if (!key || typeof enabled !== "boolean") {
    return res.status(400).json({ ok: false, error: "key và enabled (boolean) bắt buộc" });
  }
  setEnabled(String(key), enabled);
  eventBus.emit("guardian:db:changed");
  res.json({ ok: true, flags: getAllFlags() });
});

/** GET /api/groups/ — danh sách watch_groups */
groupsRouter.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT group_id, name, enabled, alert_group_id, admin_ids,
              watchdog_quiet_mode, watchdog_quiet_start, watchdog_quiet_end
       FROM watch_groups ORDER BY name COLLATE NOCASE`
    )
    .all();
  const items = rows.map((g) => ({
    ...g,
    violation_rules: readViolationRules(g.group_id),
  }));
  res.json({ ok: true, items });
});

/** GET /api/groups/lookup-users?q=...&groupId=... — tra UID theo tên hiển thị */
groupsRouter.get("/lookup-users", (req, res) => {
  const q = String(req.query.q || "").trim();
  const groupId = String(req.query.groupId || "").trim();
  let limit = Number(req.query.limit);
  if (!Number.isFinite(limit) || limit <= 0) limit = 30;
  limit = Math.min(100, Math.max(1, Math.trunc(limit)));
  if (q.length < 2) {
    return res
      .status(400)
      .json({ ok: false, error: "Vui lòng nhập ít nhất 2 ký tự để tra UID" });
  }
  const like = `%${q}%`;
  const sql = groupId
    ? `SELECT
         m.user_id,
         m.display_name,
         m.group_id,
         COALESCE(wg.name, gn.name, m.group_id) AS group_label,
         MAX(COALESCE(m.ts, 0)) AS last_ts,
         COUNT(*) AS hits
       FROM messages m
       LEFT JOIN watch_groups wg ON wg.group_id = m.group_id
       LEFT JOIN group_names gn ON gn.group_id = m.group_id
       WHERE m.display_name LIKE ? AND m.group_id = ?
       GROUP BY m.user_id, m.display_name, m.group_id
       ORDER BY last_ts DESC
       LIMIT ?`
    : `SELECT
         m.user_id,
         m.display_name,
         m.group_id,
         COALESCE(wg.name, gn.name, m.group_id) AS group_label,
         MAX(COALESCE(m.ts, 0)) AS last_ts,
         COUNT(*) AS hits
       FROM messages m
       LEFT JOIN watch_groups wg ON wg.group_id = m.group_id
       LEFT JOIN group_names gn ON gn.group_id = m.group_id
       WHERE m.display_name LIKE ?
       GROUP BY m.user_id, m.display_name, m.group_id
       ORDER BY last_ts DESC
       LIMIT ?`;
  const rows = groupId
    ? db.prepare(sql).all(like, groupId, limit)
    : db.prepare(sql).all(like, limit);
  res.json({ ok: true, q, group_id: groupId || null, items: rows });
});

const GROUP_INFO_CHUNK = 35;

/** GET /api/groups/member-sheet-targets — target Google Sheets public metadata, no secrets */
groupsRouter.get("/member-sheet-targets", (_req, res) => {
  const config = loadConfig();
  const targets = Object.values(getMemberSheetTargets(config)).map((t) => ({
    key: t.key,
    label: t.label,
    sheetName: t.sheetName,
    startCell: t.startCell,
    clearRange: t.clearRange,
    valuesRange: t.valuesRange,
  }));
  res.json({
    ok: true,
    enabled: !!config.googleSheets?.enabled,
    configured: !!(config.googleSheets?.enabled && config.googleSheets?.credentialsPath),
    targets,
  });
});

/** GET /api/groups/:groupId/members — cache-only by default; ?refresh=1 syncs from Zalo */
groupsRouter.get("/:groupId/members", async (req, res) => {
  const groupId = String(req.params.groupId || "").trim();
  if (!groupId) return res.status(400).json({ ok: false, error: "Thiếu groupId" });
  try {
    if (String(req.query.refresh || "") === "1") {
      const fresh = await syncGroupMembers(groupId);
      return res.json({ ok: true, ...fresh, lastSyncTs: fresh.syncedAt });
    }
    res.json({ ok: true, ...getCachedGroupMembers(groupId) });
  } catch (e) {
    res.status(e.statusCode || 500).json({ ok: false, error: String(e?.message || e) });
  }
});

/** POST /api/groups/:groupId/members/sync — read-only Zalo member sync into cache */
groupsRouter.post("/:groupId/members/sync", async (req, res) => {
  const groupId = String(req.params.groupId || "").trim();
  if (!groupId) return res.status(400).json({ ok: false, error: "Thiếu groupId" });
  try {
    const fresh = await syncGroupMembers(groupId);
    eventBus.emit("guardian:db:changed");
    res.json({ ok: true, ...fresh, lastSyncTs: fresh.syncedAt });
  } catch (e) {
    res.status(e.statusCode || 500).json({ ok: false, error: String(e?.message || e) });
  }
});

/** POST /api/groups/:groupId/members/push-sheets — writes display names only; supports dryRun */
groupsRouter.post("/:groupId/members/push-sheets", async (req, res) => {
  const groupId = String(req.params.groupId || "").trim();
  const { target = "both", dryRun = false } = req.body || {};
  if (!groupId) return res.status(400).json({ ok: false, error: "Thiếu groupId" });
  try {
    const cached = getCachedGroupMembers(groupId);
    const members = dedupeMembersForSheet(cached.members);
    if (!members.length) {
      return res.status(409).json({ ok: false, code: "GROUP_MEMBERS_CACHE_EMPTY", error: "Chưa có cache thành viên; hãy bấm Lấy danh sách thành viên trước." });
    }
    const names = members.map((m) => m.display_name);
    const pushedAt = new Date().toISOString();
    const out = await pushMemberNamesToSheets({ config: loadConfig(), target, names, dryRun: !!dryRun });
    res.json({ ok: true, groupId, count: names.length, target, pushedAt, ...out });
  } catch (e) {
    res.status(e.statusCode || 500).json({ ok: false, code: e.code, error: String(e?.message || e) });
  }
});

/** POST /api/groups/sync — phải khai báo TRƯỚC route :groupId */
groupsRouter.post("/sync", async (req, res) => {
  const mode = String(req.query.mode || "admin");
  const api = getApi();
  if (!api) {
    return res.status(503).json({ ok: false, error: "Zalo chưa đăng nhập" });
  }
  try {
    const all = await api.getAllGroups();
    const ids = Object.keys(all?.gridVerMap || {});
    if (ids.length === 0) {
      return res.json({
        ok: true,
        message: "API không trả danh sách nhóm",
        count: 0,
      });
    }

    const botId = String(api.getOwnId());
    const toUpsert = [];

    for (let i = 0; i < ids.length; i += GROUP_INFO_CHUNK) {
      const slice = ids.slice(i, i + GROUP_INFO_CHUNK);
      const infoRes = await api.getGroupInfo(slice);
      const map = infoRes?.gridInfoMap || {};

      for (const gid of slice) {
        const meta = map[gid];
        if (mode === "admin") {
          if (!meta || !isBotGroupAdmin(botId, meta)) continue;
          toUpsert.push({
            group_id: String(gid),
            name: String(meta.name || gid),
          });
          continue;
        }
        toUpsert.push({
          group_id: String(gid),
          name: String(meta?.name || gid),
        });
      }
    }

    const stmt = db.prepare(`
      INSERT INTO watch_groups (group_id, name, admin_ids, alert_group_id, enabled)
      VALUES (@group_id, @name, '[]', @group_id, 1)
      ON CONFLICT(group_id) DO UPDATE SET name = excluded.name
    `);
    for (const row of toUpsert) stmt.run(row);

    eventBus.emit("guardian:db:changed");

    res.json({
      ok: true,
      mode,
      count: toUpsert.length,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/** POST /api/groups/bulk/disable-shield — tắt Guardian (enabled=0) mọi nhóm trong DB */
groupsRouter.post("/bulk/disable-shield", (_req, res) => {
  const r = db.prepare("UPDATE watch_groups SET enabled = 0").run();
  eventBus.emit("guardian:db:changed");
  res.json({
    ok: true,
    updated: typeof r.changes === "number" ? r.changes : 0,
  });
});

/** PATCH /api/groups/:groupId/watchdog-quiet — giờ nghỉ watchdog theo nhóm (GMT+7) */
groupsRouter.patch("/:groupId/watchdog-quiet", (req, res) => {
  const groupId = String(req.params.groupId || "").trim();
  const { mode, watchdogQuietStart, watchdogQuietEnd } = req.body || {};
  if (!groupId) {
    return res.status(400).json({ ok: false, error: "Thiếu groupId" });
  }
  const m = String(mode || "").trim().toLowerCase();
  if (!["inherit", "custom", "off"].includes(m)) {
    return res.status(400).json({
      ok: false,
      error: "mode phải là inherit | custom | off",
    });
  }
  const exists = db
    .prepare("SELECT 1 FROM watch_groups WHERE group_id = ?")
    .get(groupId);
  if (!exists) {
    return res.status(404).json({ ok: false, error: "Không tìm thấy nhóm" });
  }
  if (m === "custom") {
    const s = String(watchdogQuietStart ?? "").trim();
    const e = String(watchdogQuietEnd ?? "").trim();
    if (!s || !e) {
      return res.status(400).json({
        ok: false,
        error: "custom cần watchdogQuietStart và watchdogQuietEnd (HH:MM)",
      });
    }
    if (parseHHMM(s) == null || parseHHMM(e) == null) {
      return res.status(400).json({
        ok: false,
        error: "Định dạng giờ phải là HH:MM (00:00–23:59)",
      });
    }
    db.prepare(
      `UPDATE watch_groups SET
        watchdog_quiet_mode = ?,
        watchdog_quiet_start = ?,
        watchdog_quiet_end = ?
       WHERE group_id = ?`
    ).run(m, s, e, groupId);
  } else if (m === "inherit") {
    db.prepare(
      `UPDATE watch_groups SET
        watchdog_quiet_mode = ?,
        watchdog_quiet_start = NULL,
        watchdog_quiet_end = NULL
       WHERE group_id = ?`
    ).run(m, groupId);
  } else {
    db.prepare(
      `UPDATE watch_groups SET watchdog_quiet_mode = ? WHERE group_id = ?`
    ).run(m, groupId);
  }
  eventBus.emit("guardian:db:changed");
  const row = db
    .prepare(
      `SELECT group_id, watchdog_quiet_mode, watchdog_quiet_start, watchdog_quiet_end
       FROM watch_groups WHERE group_id = ?`
    )
    .get(groupId);
  res.json({ ok: true, ...row });
});

/** PATCH /api/groups/:groupId/admins — cập nhật admin_ids (miễn kiểm spam), JSON array text trong DB */
groupsRouter.patch("/:groupId/admins", (req, res) => {
  const groupId = String(req.params.groupId || "").trim();
  const { adminIds } = req.body || {};
  if (!groupId) {
    return res.status(400).json({ ok: false, error: "Thiếu groupId" });
  }
  if (!Array.isArray(adminIds)) {
    return res
      .status(400)
      .json({ ok: false, error: "body.adminIds phải là mảng string (UID)" });
  }
  const normalized = adminIds
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);
  const json = JSON.stringify(normalized);
  const info = db
    .prepare("UPDATE watch_groups SET admin_ids = ? WHERE group_id = ?")
    .run(json, groupId);
  if (info.changes === 0) {
    return res.status(404).json({ ok: false, error: "Không tìm thấy nhóm" });
  }
  eventBus.emit("guardian:db:changed");
  res.json({ ok: true, group_id: groupId, admin_ids: normalized });
});

/** PATCH /api/groups/:groupId/rules — bật/tắt từng loại vi phạm theo room */
groupsRouter.patch("/:groupId/rules", (req, res) => {
  const groupId = String(req.params.groupId || "").trim();
  const { rules } = req.body || {};
  if (!groupId) {
    return res.status(400).json({ ok: false, error: "Thiếu groupId" });
  }
  if (!rules || typeof rules !== "object") {
    return res
      .status(400)
      .json({ ok: false, error: "body.rules phải là object {TYPE:boolean}" });
  }
  const exists = db
    .prepare("SELECT 1 FROM watch_groups WHERE group_id = ?")
    .get(groupId);
  if (!exists) {
    return res.status(404).json({ ok: false, error: "Không tìm thấy nhóm" });
  }
  const up = db.prepare(`
    INSERT INTO group_violation_rules (group_id, type, enabled, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(group_id, type) DO UPDATE SET
      enabled = excluded.enabled,
      updated_at = CURRENT_TIMESTAMP
  `);
  for (const t of VIOLATION_TYPES) {
    if (rules[t] === undefined) continue;
    up.run(groupId, t, rules[t] ? 1 : 0);
  }
  eventBus.emit("guardian:db:changed");
  res.json({ ok: true, group_id: groupId, rules: readViolationRules(groupId) });
});

/** POST /api/groups/leave/:groupId — rời nhóm Zalo + xóa khỏi watch_groups */
groupsRouter.post("/leave/:groupId", async (req, res) => {
  const groupId = String(req.params.groupId || "").trim();
  const api = getApi();
  if (!groupId) {
    return res.status(400).json({ ok: false, error: "Thiếu groupId" });
  }
  if (!api) {
    return res.status(503).json({ ok: false, error: "Zalo chưa đăng nhập" });
  }
  try {
    await api.leaveGroup(groupId, false);
    db.prepare("DELETE FROM watch_groups WHERE group_id = ?").run(groupId);
    db.prepare("DELETE FROM group_names WHERE group_id = ?").run(groupId);
    eventBus.emit("guardian:db:changed");
    res.json({ ok: true, group_id: groupId });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/** POST /api/groups/:groupId/toggle */
groupsRouter.post("/:groupId/toggle", (req, res) => {
  const groupId = String(req.params.groupId || "");
  if (!groupId) {
    return res.status(400).json({ ok: false, error: "Thiếu groupId" });
  }
  const row = db
    .prepare("SELECT enabled FROM watch_groups WHERE group_id = ?")
    .get(groupId);
  if (!row) {
    return res.status(404).json({ ok: false, error: "Không tìm thấy nhóm" });
  }
  const next = row.enabled === 1 ? 0 : 1;
  db.prepare("UPDATE watch_groups SET enabled = ? WHERE group_id = ?").run(
    next,
    groupId
  );
  eventBus.emit("guardian:db:changed");
  res.json({ ok: true, group_id: groupId, enabled: next });
});

/** POST /api/groups/:groupId/enabled — bật/tắt rõ ràng (cho toggle UI) */
groupsRouter.post("/:groupId/enabled", (req, res) => {
  const groupId = String(req.params.groupId || "");
  const { enabled } = req.body || {};
  if (!groupId) {
    return res.status(400).json({ ok: false, error: "Thiếu groupId" });
  }
  if (typeof enabled !== "boolean") {
    return res
      .status(400)
      .json({ ok: false, error: "body.enabled (boolean) bắt buộc" });
  }
  const info = db
    .prepare("UPDATE watch_groups SET enabled = ? WHERE group_id = ?")
    .run(enabled ? 1 : 0, groupId);
  if (info.changes === 0) {
    return res.status(404).json({ ok: false, error: "Không tìm thấy nhóm" });
  }
  eventBus.emit("guardian:db:changed");
  res.json({ ok: true, group_id: groupId, enabled: enabled ? 1 : 0 });
});
