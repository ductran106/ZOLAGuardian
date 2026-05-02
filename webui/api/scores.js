// webui/api/scores.js
import { Router } from "express";
import db from "../../core/db.js";

const router = Router();

// GET /api/scores?date=2026-05-02&group_id=xxx
router.get("/", (req, res) => {
  const { date, group_id } = req.query;
  let query = `
    SELECT user_id, display_name, group_id, date,
           jobs_posted, jobs_taken, points_earned, points_deducted, net_points
    FROM daily_scores
    WHERE 1=1
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
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
