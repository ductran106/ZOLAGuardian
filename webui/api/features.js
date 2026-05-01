// webui/api/features.js

import { Router } from "express";
import { getAllFlags, setEnabled } from "../../core/featureFlags.js";
import eventBus from "../../core/eventBus.js";
import db from "../../core/db.js";
import { getApi } from "../../core/zalo.js";
import { isBotGroupAdmin } from "../../core/groupDiscovery.js";

export const featuresRouter = Router();
export const groupsRouter = Router();

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
  const items = db
    .prepare(
      `SELECT group_id, name, enabled, alert_group_id, admin_ids
       FROM watch_groups ORDER BY name COLLATE NOCASE`
    )
    .all();
  res.json({ ok: true, items });
});

const GROUP_INFO_CHUNK = 35;

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
