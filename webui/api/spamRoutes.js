// webui/api/spamRoutes.js — CRUD spam_list + invalidate cache Guardian

import { Router } from "express";
import db from "../../core/db.js";
import eventBus from "../../core/eventBus.js";
import { invalidateSpamConfigCache } from "../../core/spamRules.js";

export const spamRoutesRouter = Router();

spamRoutesRouter.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, list_type AS listType, pattern, kind FROM spam_list
       ORDER BY list_type DESC, id ASC`
    )
    .all();
  res.json({
    ok: true,
    allow: rows.filter((r) => r.listType === "allow"),
    block: rows.filter((r) => r.listType === "block"),
  });
});

spamRoutesRouter.post("/", (req, res) => {
  const { listType, pattern, kind } = req.body || {};
  const lt =
    listType === "allow" || listType === "block" ? listType : null;
  const p = String(pattern || "").trim();
  if (!lt || !p) {
    return res
      .status(400)
      .json({ ok: false, error: "listType (allow|block) và pattern bắt buộc" });
  }

  let k = kind || "substring";
  if (lt === "allow" && k !== "host" && k !== "substring") {
    return res
      .status(400)
      .json({ ok: false, error: "allow: kind phải host hoặc substring" });
  }
  if (lt === "block" && k !== "substring" && k !== "regex") {
    return res
      .status(400)
      .json({ ok: false, error: "block: kind phải substring hoặc regex" });
  }

  if (p.length > 800) {
    return res
      .status(400)
      .json({ ok: false, error: "pattern tối đa 800 ký tự" });
  }

  try {
    db.prepare(
      `INSERT INTO spam_list (list_type, pattern, kind) VALUES (?,?,?)`
    ).run(lt, p, k);
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) {
      return res
        .status(409)
        .json({ ok: false, error: "Mục này đã tồn tại trong danh sách" });
    }
    throw e;
  }

  invalidateSpamConfigCache();
  eventBus.emit("guardian:db:changed");

  res.json({ ok: true });
});

spamRoutesRouter.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ ok: false, error: "id không hợp lệ" });
  }
  const row = db
    .prepare(
      `SELECT id, list_type AS listType, pattern, kind FROM spam_list WHERE id = ?`
    )
    .get(id);
  if (!row) {
    return res.status(404).json({ ok: false, error: "Không tìm thấy" });
  }

  const p = String(req.body?.pattern ?? row.pattern).trim();
  let k = String(req.body?.kind ?? row.kind).trim();

  const lt = row.listType;
  if (lt === "allow") {
    if (k !== "host" && k !== "substring") {
      return res
        .status(400)
        .json({ ok: false, error: "allow: kind phải host hoặc substring" });
    }
  } else if (k !== "substring" && k !== "regex") {
    return res
      .status(400)
      .json({ ok: false, error: "block: kind phải substring hoặc regex" });
  }

  if (!p) {
    return res.status(400).json({ ok: false, error: "pattern không được để trống" });
  }
  if (p.length > 800) {
    return res
      .status(400)
      .json({ ok: false, error: "pattern tối đa 800 ký tự" });
  }

  try {
    db.prepare(`UPDATE spam_list SET pattern = ?, kind = ? WHERE id = ?`).run(
      p,
      k,
      id
    );
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) {
      return res
        .status(409)
        .json({ ok: false, error: "Trùng pattern với mục khác trong cùng danh sách" });
    }
    throw e;
  }

  invalidateSpamConfigCache();
  eventBus.emit("guardian:db:changed");
  res.json({ ok: true });
});

spamRoutesRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ ok: false, error: "id không hợp lệ" });
  }
  const info = db.prepare("DELETE FROM spam_list WHERE id = ?").run(id);
  if (info.changes === 0) {
    return res.status(404).json({ ok: false, error: "Không tìm thấy" });
  }
  invalidateSpamConfigCache();
  eventBus.emit("guardian:db:changed");
  res.json({ ok: true });
});
