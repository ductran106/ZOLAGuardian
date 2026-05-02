// webui/api/jobs.js
import { Router } from "express";
import db from "../../core/db.js";

const router = Router();

// GET /api/jobs?date=2026-05-02&status=OPEN&group_id=xxx
router.get("/", (req, res) => {
  const { date, status, group_id } = req.query;
  let query = `
    SELECT id, msg_id, group_id, poster_name, taker_name,
           raw_content, price, trip_type, base_points,
           points_source, override_points, override_note,
           status, job_date, ts
    FROM jobs WHERE 1=1
  `;
  const params = [];
  if (date) {
    query += " AND job_date = ?";
    params.push(date);
  }
  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (group_id) {
    query += " AND group_id = ?";
    params.push(group_id);
  }
  query += " ORDER BY ts DESC LIMIT 200";
  try {
    const rows = db.prepare(query).all(...params);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/override — Manual override điểm
router.post("/:id/override", (req, res) => {
  const { id } = req.params;
  const { points, note } = req.body;
  if (points === undefined || Number.isNaN(parseFloat(points))) {
    return res.status(400).json({ ok: false, error: "points required" });
  }
  try {
    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id);
    if (!job) return res.status(404).json({ ok: false, error: "job not found" });

    db.prepare(`
      UPDATE jobs SET override_points = ?, override_note = ?, override_by = 'admin'
      WHERE id = ?
    `).run(parseFloat(points), note || "", id);

    if (job.status === "CONFIRMED") {
      const oldPts = job.override_points ?? job.base_points;
      const newPts = parseFloat(points);
      const diff = newPts - oldPts;
      if (diff !== 0) {
        if (job.poster_id) {
          db.prepare(`
            UPDATE daily_scores SET points_earned = points_earned + ?, net_points = net_points + ?
            WHERE user_id = ? AND group_id = ? AND date = ?
          `).run(diff, diff, job.poster_id, job.group_id, job.job_date);
        }
        if (job.taker_id) {
          db.prepare(`
            UPDATE daily_scores SET points_deducted = points_deducted + ?, net_points = net_points - ?
            WHERE user_id = ? AND group_id = ? AND date = ?
          `).run(diff, diff, job.taker_id, job.group_id, job.job_date);
        }
      }
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
