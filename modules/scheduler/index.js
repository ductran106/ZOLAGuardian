// modules/scheduler/index.js
// Mục đích: Subscribe zalo:message, điều phối parser + DB jobs + scorer

import eventBus from "../../core/eventBus.js";
import db from "../../core/db.js";
import { parseMessage } from "./parser.js";
import { upsertScore } from "./scorer.js";

const log = (...a) =>
  console.log(`[${new Date().toISOString()}] [scheduler]`, ...a);

const SCHEDULER_GROUPS = [
  "8912027696462383403", // [1-1 RETURN] Tái định cư
  "2718828458346611005", // [1_1 RET 2] ROOM LỊCH
];

export function startScheduler() {
  eventBus.on("zalo:message", ({ msg }) => {
    const d = msg.data || msg;
    const groupId = String(d.idTo || "");
    const userId = String(d.uidFrom || "");
    const name = String(d.dName || "");
    const msgId = String(d.msgId || "");
    const ts = parseInt(d.ts, 10) || Date.now();
    const content =
      typeof d.content === "object"
        ? JSON.stringify(d.content)
        : String(d.content || "");
    // quote.globalMsgId là số → phải String() khi so sánh với TEXT trong DB
    const quoteId = d.quote?.globalMsgId
      ? String(d.quote.globalMsgId)
      : null;
    const jobDate = new Date(ts).toISOString().slice(0, 10);

    if (!SCHEDULER_GROUPS.includes(groupId)) return;

    const parsed = parseMessage(content);

    // ── POST: đăng lịch ──────────────────────────────────────────
    if (parsed.type === "POST") {
      try {
        db.prepare(`
          INSERT OR IGNORE INTO jobs
            (msg_id, group_id, poster_id, poster_name, raw_content,
             price, trip_type, base_points, status, job_date, ts, points_source)
          VALUES (?,?,?,?,?,?,?,?,'OPEN',?,?,?)
        `).run(
          msgId,
          groupId,
          userId,
          name,
          content,
          parsed.price,
          parsed.tripType,
          parsed.points,
          jobDate,
          ts,
          parsed.pointsSource || "BAREM"
        );
        log(
          `POST: ${name} | ${parsed.price}k ${parsed.tripType} → ${parsed.points}đ (${parsed.pointsSource || "BAREM"})`
        );
      } catch (e) {
        log(`POST err: ${e.message}`);
      }
      return;
    }

    // ── TAKE: nhận lịch (quote vào tin POST) ──────────────────────
    if (parsed.type === "TAKE" && quoteId) {
      // Case 1: quote vào tin POST → MATCHED
      const openJob = db
        .prepare("SELECT * FROM jobs WHERE msg_id=? AND status='OPEN'")
        .get(quoteId);

      if (openJob) {
        try {
          db.prepare(
            "UPDATE jobs SET taker_id=?, taker_name=?, taker_msg_id=?, status='MATCHED' WHERE id=?"
          ).run(userId, name, msgId, openJob.id);
          log(`MATCHED: [${openJob.poster_name}] ← ${name}`);
        } catch (e) {
          log(`MATCHED err: ${e.message}`);
        }
        return;
      }

      // Case 2: quote vào tin TAKE (poster confirm lại taker) → CONFIRMED
      const matchedJob = db
        .prepare(
          "SELECT * FROM jobs WHERE taker_msg_id=? AND poster_id=? AND status='MATCHED'"
        )
        .get(quoteId, userId);

      if (matchedJob) {
        try {
          db.prepare(
            "UPDATE jobs SET status='CONFIRMED', confirm_msg_id=? WHERE id=?"
          ).run(msgId, matchedJob.id);

          // Cộng điểm poster
          upsertScore(
            matchedJob.poster_id,
            matchedJob.poster_name,
            groupId,
            jobDate,
            matchedJob.base_points,
            0,
            1,
            0
          );
          // Trừ điểm taker
          upsertScore(
            matchedJob.taker_id,
            matchedJob.taker_name,
            groupId,
            jobDate,
            0,
            matchedJob.base_points,
            0,
            1
          );

          log(
            `CONFIRMED: ${matchedJob.poster_name} +${matchedJob.base_points}đ | ${matchedJob.taker_name} -${matchedJob.base_points}đ`
          );
        } catch (e) {
          log(`CONFIRMED err: ${e.message}`);
        }
        return;
      }
    }

    // ── CANCEL: hủy lịch ─────────────────────────────────────────
    if (parsed.type === "CANCEL") {
      const activeJob = db
        .prepare(`
        SELECT * FROM jobs
        WHERE group_id=?
          AND (poster_id=? OR taker_id=?)
          AND status IN ('OPEN','MATCHED')
          AND ts > ?
        ORDER BY ts DESC LIMIT 1
      `)
        .get(groupId, userId, userId, ts - 30 * 60 * 1000); // trong 30 phút

      if (activeJob) {
        try {
          db.prepare(
            "UPDATE jobs SET status='CANCELLED', cancel_msg_id=? WHERE id=?"
          ).run(msgId, activeJob.id);
          log(`CANCELLED: job #${activeJob.id} by ${name}`);
        } catch (e) {
          log(`CANCEL err: ${e.message}`);
        }
      }
    }
  });

  log("Scheduler module started.");
}
