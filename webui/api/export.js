// webui/api/export.js
import { Router } from "express";
import db from "../../core/db.js";
import {
  buildQuoteDocxBuffer,
  safeExportFilename,
} from "../lib/quoteDocxBuild.js";
import { loadConfig } from "../../core/loadConfig.js";
import { sendTelegramDocument } from "../../modules/guardian/telegramNotify.js";

const router = Router();

// GET /api/export/scores?date=2026-05-02 → CSV
router.get("/scores", (req, res) => {
  const { date, group_id } = req.query;
  let query = `
    SELECT display_name, group_id, date,
           jobs_posted, jobs_taken,
           points_earned, points_deducted, net_points
    FROM daily_scores WHERE 1=1
  `;
  const params = [];
  if (date) {
    query += " AND date = ?";
    params.push(date);
  }
  if (group_id) {
    query += " AND group_id = ?";
    params.push(group_id);
  }
  query += " ORDER BY net_points DESC";

  try {
    const rows = db.prepare(query).all(...params);
    const header =
      "Tên,Group,Ngày,Lịch đăng,Lịch nhận,Điểm cộng,Điểm trừ,Điểm net\n";
    const csv =
      header +
      rows
        .map((r) =>
          `"${r.display_name}","${r.group_id}","${r.date}",${r.jobs_posted},${r.jobs_taken},${r.points_earned},${r.points_deducted},${r.net_points}`
        )
        .join("\n");
    const filename = `scores_${date || "all"}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\ufeff" + csv);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** Danh sách nhóm theo dõi riêng cho xuất DOCX (bảng docx_tracked_groups), kèm tin mới nhất trong DB */
router.get("/docx-tracked-snapshot", (_req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT dt.group_id,
                COALESCE(wg.name, gn.name, dt.group_id) AS name,
                (SELECT MAX(COALESCE(m.ts, 0))
                 FROM messages m
                 WHERE m.group_id = dt.group_id) AS last_message_ts
         FROM docx_tracked_groups dt
         LEFT JOIN watch_groups wg ON wg.group_id = dt.group_id
         LEFT JOIN group_names gn ON gn.group_id = dt.group_id
         ORDER BY name COLLATE NOCASE`
      )
      .all();
    res.json({ ok: true, items: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** Thêm / gỡ nhóm khỏi danh sách theo dõi xuất DOCX (không liên quan Shield) */
router.post("/docx-tracked", (req, res) => {
  try {
    const group_id = String(req.body?.group_id || "").trim();
    if (!group_id) {
      return res.status(400).json({ ok: false, error: "group_id_required" });
    }
    if (req.body?.remove) {
      db.prepare("DELETE FROM docx_tracked_groups WHERE group_id = ?").run(
        group_id
      );
      return res.json({ ok: true, removed: group_id });
    }
    db.prepare(
      "INSERT OR IGNORE INTO docx_tracked_groups (group_id) VALUES (?)"
    ).run(group_id);
    res.json({ ok: true, added: group_id });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const QUOTE_DOCX_BAD = new Set([
  "group_id_required",
  "date_required",
  "date_invalid",
  "time_invalid",
  "time_order",
  "range_invalid",
]);

// GET /api/export/quote-docx?date=YYYY-MM-DD&time_start=HH:MM&time_end=HH:MM&group_id=...
router.get("/quote-docx", async (req, res) => {
  try {
    const cfg = loadConfig();
    const qq = {
      ...req.query,
      bot_user_id: String(cfg.botUserId || "").trim(),
    };
    const buf = await buildQuoteDocxBuffer(db, qq);
    const fn = safeExportFilename(
      String(req.query.date || "export"),
      String(req.query.group_id || "group")
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fn.replace(/"/g, "")}"`
    );
    res.send(Buffer.from(buf));
  } catch (e) {
    const code = String(e.message || "");
    if (QUOTE_DOCX_BAD.has(code)) {
      return res.status(400).json({ ok: false, error: code });
    }
    console.error("[export] quote-docx", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/export/quote-docx/send-telegram
// body: { date, time_start, time_end, group_id, at_all_scope? }
router.post("/quote-docx/send-telegram", async (req, res) => {
  try {
    const payload = req.body && typeof req.body === "object" ? req.body : {};
    const config = loadConfig();
    const payloadWithBot = {
      ...payload,
      bot_user_id: String(config.botUserId || "").trim(),
    };
    const buf = await buildQuoteDocxBuffer(db, payloadWithBot);
    const fn = safeExportFilename(
      String(payload.date || "export"),
      String(payload.group_id || "group")
    );
    const sent = await sendTelegramDocument(config, {
      filename: fn,
      buffer: Buffer.from(buf),
      caption: `DOCX export ${String(payload.date || "")} · ${String(payload.group_id || "")}`,
    });
    if (!sent.sent) {
      const reason = String(sent.reason || "telegram_send_failed");
      const status = reason === "telegram_not_configured" ? 400 : 500;
      return res.status(status).json({ ok: false, error: reason });
    }
    return res.json({ ok: true, sent: true, filename: fn });
  } catch (e) {
    const code = String(e.message || "");
    if (QUOTE_DOCX_BAD.has(code)) {
      return res.status(400).json({ ok: false, error: code });
    }
    console.error("[export] quote-docx/send-telegram", e);
    return res.status(500).json({ ok: false, error: code || "send_failed" });
  }
});

export default router;
