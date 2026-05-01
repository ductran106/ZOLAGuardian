// modules/guardian/index.js
// Mục đích: Module chính Guardian — subscribe events, điều phối spam+undo

import eventBus from "../../core/eventBus.js";
import db from "../../core/db.js";
import { isEnabled } from "../../core/featureFlags.js";
import { detectSpam } from "./spam.js";
import { detectUndo } from "./undo.js";
import {
  dmAdmin,
  sendQuotedViolationNotice,
  sendUndoNotice,
  deleteSpamMessage,
  buildViolationDM,
  buildUndoDM,
} from "./notifier.js";
import {
  timeLabelGMT7,
  formatSpamEvidencePlain,
  formatUndoEvidencePlain,
  sendTelegramEvidence,
} from "./telegramNotify.js";

const log = (msg) =>
  console.log(`[${new Date().toISOString()}] [guardian] ${msg}`);
const VIOLATION_TYPES = ["LINK_SPAM", "SPAM_Emoji", "STICKER", "REPEAT", "UNDO"];

function isViolationRuleEnabled(groupId, type) {
  const t = String(type || "");
  if (!VIOLATION_TYPES.includes(t)) return true;
  const row = db
    .prepare(
      "SELECT enabled FROM group_violation_rules WHERE group_id = ? AND type = ?"
    )
    .get(groupId, t);
  return !row || Number(row.enabled) === 1;
}

export function startGuardian(config) {
  // Seed watch_groups từ config vào DB
  const insertGroup = db.prepare(`
    INSERT OR IGNORE INTO watch_groups (group_id, name, admin_ids, alert_group_id)
    VALUES (?, ?, ?, ?)
  `);
  for (const g of config.watchGroups) {
    insertGroup.run(
      g.groupId, g.name,
      JSON.stringify(g.adminIds || []),
      g.alertGroupId
    );
  }

  // Handler: message inbound
  eventBus.on("zalo:message", async ({ api, msg }) => {
    if (!isEnabled("bot") || !isEnabled("guardian")) return;

    const groupId     = msg.data?.idTo    || msg.idTo    || "";
    const senderId    = msg.data?.uidFrom || msg.uidFrom || "";
    const displayName = msg.data?.dName   || senderId;
    const content     = msg.data?.content || msg.content || "";
    const msgId       = msg.data?.msgId   || msg.msgId   || "";
    const ts          = msg.data?.ts      || Date.now();

    // Cache message — chỉ insert khi có msgId
    if (msgId) {
      try {
        db.prepare(`
          INSERT OR IGNORE INTO messages
            (msg_id, group_id, user_id, display_name, content, ts)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          msgId,
          groupId     || "",
          senderId    || "",
          displayName || "",
          content     || "",
          ts          || Date.now()
        );
      } catch (e) {
        log(`Cache error: ${e.message}`);
      }
    }

    // Chỉ xử lý group đang watch
    const watchGroup = db
      .prepare("SELECT * FROM watch_groups WHERE group_id = ? AND enabled = 1")
      .get(groupId);
    if (!watchGroup) return;

    const adminIds = JSON.parse(watchGroup.admin_ids || "[]");
    const violation = detectSpam(msg, config, adminIds);
    if (!violation) return;
    if (!isViolationRuleEnabled(groupId, violation.type)) return;

    log(`Violation: ${violation.type} by ${displayName} in ${groupId}`);

    const timeLabel = timeLabelGMT7();
    const plainEvidence = formatSpamEvidencePlain({
      groupName: watchGroup.name || "",
      groupId,
      displayName,
      senderId,
      type: violation.type,
      detail: violation.detail,
      content: violation.content,
      timeLabel,
    });

    await sendTelegramEvidence(config, {
      plainText: plainEvidence,
    });

    await sendQuotedViolationNotice(
      api,
      msg,
      watchGroup.alert_group_id,
      displayName,
      violation
    );

    await deleteSpamMessage(api, msg);

    db.prepare(`
      INSERT INTO violations (user_id, display_name, group_id, type, detail)
      VALUES (?, ?, ?, ?, ?)
    `).run(senderId, displayName, groupId, violation.type, violation.detail);

    const count = db
      .prepare("SELECT COUNT(*) as cnt FROM violations WHERE user_id = ? AND group_id = ?")
      .get(senderId, groupId).cnt;

    if (config.dmAdminId && config.dmAdminId !== "ADMIN_USER_ID_HERE") {
      await dmAdmin(
        api, config.dmAdminId,
        buildViolationDM(
          watchGroup.name,
          groupId,
          displayName,
          senderId,
          violation.type,
          violation.content,
          count
        )
      );
    }

    eventBus.emit("guardian:violation", {
      type: violation.type,
      displayName, groupId,
      content: violation.content,
      ts: new Date().toISOString(),
    });
  });

  // Handler: undo
  eventBus.on("zalo:undo", async ({ api, data }) => {
    if (!isEnabled("bot") || !isEnabled("guardian")) return;

    const undoInfo = detectUndo(data);
    if (!undoInfo) return;

    // Chỉ xử lý UNDO trong nhóm đang watch + đang bật Shield.
    const watchedEnabledGroup = db
      .prepare("SELECT * FROM watch_groups WHERE group_id = ? AND enabled = 1")
      .get(undoInfo.groupId);
    if (!watchedEnabledGroup) return;
    if (!isViolationRuleEnabled(undoInfo.groupId, "UNDO")) return;

    // Lookup nội dung bằng realMsgId trước, fallback về msgId
    // msg_id là TEXT trong DB — bind kiểu số có thể không khớp.
    const lookupId = undoInfo.realMsgId || undoInfo.msgId;
    const lookupKey =
      lookupId !== null &&
      lookupId !== undefined &&
      String(lookupId).trim() !== ""
        ? String(lookupId)
        : "";
    const cachedMsg = lookupKey
      ? db.prepare("SELECT content FROM messages WHERE msg_id = ?").get(lookupKey)
      : null;
    const cachedContent =
      cachedMsg?.content || "[không tìm thấy nội dung]";
    undoInfo.cachedContent = cachedContent;

    log(`Undo: ${undoInfo.msgId} by ${undoInfo.senderId}`);

    db.prepare(`
      INSERT INTO violations (user_id, display_name, group_id, type, detail)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      undoInfo.senderId    || "",
      undoInfo.displayName || "",
      undoInfo.groupId     || "",
      "UNDO",
      undoInfo.cachedContent || ""
    );

    const groupNameRow = db
      .prepare("SELECT name FROM group_names WHERE group_id = ?")
      .get(undoInfo.groupId);

    const groupName =
      watchedEnabledGroup?.name || groupNameRow?.name || undoInfo.groupId;

    const timeLabelUndo = timeLabelGMT7();
    const plainUndo = formatUndoEvidencePlain({
      groupName,
      groupId: String(undoInfo.groupId || ""),
      displayName: undoInfo.displayName || "",
      senderId: String(undoInfo.senderId || ""),
      recalledContent: undoInfo.cachedContent,
      timeLabel: timeLabelUndo,
    });
    await sendTelegramEvidence(config, {
      plainText: plainUndo,
    });

    await sendUndoNotice(
      api,
      watchedEnabledGroup.alert_group_id || undoInfo.groupId,
      groupName,
      undoInfo.displayName,
      undoInfo.senderId,
      undoInfo.cachedContent
    );

    if (config.dmAdminId && config.dmAdminId !== "ADMIN_USER_ID_HERE") {
      await dmAdmin(
        api, config.dmAdminId,
        buildUndoDM(
          groupName,
          undoInfo.groupId,
          undoInfo.displayName,
          undoInfo.senderId,
          undoInfo.cachedContent
        )
      );
    }

    eventBus.emit("guardian:violation", {
      type: "UNDO",
      displayName: undoInfo.displayName,
      groupId: undoInfo.groupId,
      content: undoInfo.cachedContent,
      ts: new Date().toISOString(),
    });
  });

  log("Guardian module started.");
}
