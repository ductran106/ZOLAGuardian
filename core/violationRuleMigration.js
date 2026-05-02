// core/violationRuleMigration.js
// Đổi tên loại vi phạm cũ trong group_violation_rules sang tên mới (một lần, idempotent).

/**
 * @param {import("better-sqlite3").Database} db
 */
export function migrateViolationRuleTypes(db) {
  const pairs = [
    ["LINK_SPAM", "URL_BLACKLIST"],
    ["SPAM_Emoji", "EMOJI_SPAM"],
    ["STICKER", "STICKER_SPAM"],
    ["REPEAT", "REPEAT_SPAM"],
    ["UNDO", "MESSAGE_RECALLED_SELF"],
  ];

  const selOld = db.prepare(
    `SELECT group_id, enabled FROM group_violation_rules WHERE type = ?`
  );
  const selNew = db.prepare(
    `SELECT enabled FROM group_violation_rules WHERE group_id = ? AND type = ?`
  );
  const updNew = db.prepare(
    `UPDATE group_violation_rules SET enabled = ?, updated_at = CURRENT_TIMESTAMP
     WHERE group_id = ? AND type = ?`
  );
  const insNew = db.prepare(
    `INSERT INTO group_violation_rules (group_id, type, enabled, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
  );
  const delOld = db.prepare(
    `DELETE FROM group_violation_rules WHERE group_id = ? AND type = ?`
  );

  for (const [oldT, newT] of pairs) {
    const rows = selOld.all(oldT);
    for (const row of rows) {
      const gid = String(row.group_id || "");
      const oldEn = Number(row.enabled) === 1 ? 1 : 0;
      const ex = selNew.get(gid, newT);
      if (ex) {
        const newEn = Number(ex.enabled) === 1 && oldEn === 1 ? 1 : 0;
        updNew.run(newEn, gid, newT);
      } else {
        insNew.run(gid, newT, oldEn);
      }
      delOld.run(gid, oldT);
    }
  }
}
