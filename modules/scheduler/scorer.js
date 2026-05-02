// modules/scheduler/scorer.js
// Mục đích: Cộng/trừ điểm vào daily_scores

import db from "../../core/db.js";

const log = (...a) =>
  console.log(`[${new Date().toISOString()}] [scorer]`, ...a);

export function upsertScore(userId, displayName, groupId, date, earned, deducted, posted, taken) {
  try {
    const ex = db
      .prepare(
        "SELECT id FROM daily_scores WHERE user_id=? AND group_id=? AND date=?"
      )
      .get(String(userId), groupId, date);

    if (ex) {
      db.prepare(`
        UPDATE daily_scores SET
          jobs_posted     = jobs_posted + ?,
          jobs_taken      = jobs_taken + ?,
          points_earned   = points_earned + ?,
          points_deducted = points_deducted + ?,
          net_points      = net_points + ?
        WHERE user_id=? AND group_id=? AND date=?
      `).run(
        posted,
        taken,
        earned,
        deducted,
        earned - deducted,
        String(userId),
        groupId,
        date
      );
    } else {
      db.prepare(`
        INSERT INTO daily_scores
          (user_id, display_name, group_id, date,
           jobs_posted, jobs_taken, points_earned, points_deducted, net_points)
        VALUES (?,?,?,?,?,?,?,?,?)
      `).run(
        String(userId),
        displayName,
        groupId,
        date,
        posted,
        taken,
        earned,
        deducted,
        earned - deducted
      );
    }
  } catch (e) {
    log(`upsertScore error: ${e.message}`);
  }
}
