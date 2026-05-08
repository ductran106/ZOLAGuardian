// modules/guardian/notifier.js
// Mục đích: Gửi cảnh báo — DM admin + reply vào group
// sendMessage group: api.sendMessage({ msg, quote }, groupId, ThreadType.Group) — Group = 1

import { shortGroupLabel } from "./undoFormat.js";

const log = (msg) =>
  console.log(`[${new Date().toISOString()}] [notifier] ${msg}`);

function presentType(type) {
  const map = {
    URL_BLACKLIST: "URL_BLACKLIST",
    KEYWORD_SPAM: "KEYWORD_SPAM",
    REPEAT_SPAM: "REPEAT_SPAM",
    EMOJI_SPAM: "EMOJI_SPAM",
    STICKER_SPAM: "STICKER_SPAM",
    MESSAGE_RECALLED_SELF: "MESSAGE_RECALLED_SELF",
    MESSAGE_DELETED_BY_ADMIN: "MESSAGE_DELETED_BY_ADMIN",
    LINK_SPAM: "URL_BLACKLIST",
    SPAM_Emoji: "EMOJI_SPAM",
    STICKER: "STICKER_SPAM",
    REPEAT: "REPEAT_SPAM",
    UNDO: "MESSAGE_RECALLED_SELF",
  };
  return map[type] || type;
}

/** ThreadType.Group (zca-js) — cùng giá trị với deleteMessage(..., type: 1) */
const THREAD_GROUP = 1;

export async function dmAdmin(api, adminId, text) {
  try {
    await api.sendMessage(text, adminId);
    log(`DM admin ${adminId} OK`);
  } catch (err) {
    log(`DM admin FAIL: ${err.message}`);
  }
}

/**
 * Gửi thông báo vi phạm trong nhóm, trích dẫn tin vi phạm (quote) nếu API hỗ trợ.
 * Phải gọi TRƯỚC khi xóa tin spam để quote còn hiệu.
 */
export async function sendQuotedViolationNotice(api, msg, groupId, displayName, violation) {
  const text = buildViolationReply(displayName, violation.type);
  try {
    await api.sendMessage({ msg: text, quote: msg }, groupId, THREAD_GROUP);
    log(`Thông báo vi phạm + quote (msg) OK group=${groupId}`);
    return;
  } catch (err) {
    log(`sendMessage quote=msg FAIL: ${err.message}`);
  }
  try {
    if (msg?.data) {
      await api.sendMessage({ msg: text, quote: msg.data }, groupId, THREAD_GROUP);
      log(`Thông báo vi phạm + quote (msg.data) OK`);
      return;
    }
  } catch (err) {
    log(`sendMessage quote=msg.data FAIL: ${err.message}`);
  }
  try {
    await api.sendMessage(text, groupId, THREAD_GROUP);
    log(`Thông báo vi phạm (không quote — fallback) OK`);
  } catch (err) {
    log(`sendMessage plain FAIL: ${err.message}`);
  }
}

export function buildViolationDM(
  groupName,
  groupId,
  displayName,
  senderId,
  type,
  content,
  count
) {
  const time =
    new Date(Date.now() + 7 * 3600000).toISOString().replace("T", " ").slice(0, 19) +
    " (GMT+7)";
  const groupLine = `${groupName} (${groupId})`;
  const whoLine = displayName ? `${displayName} (${senderId})` : senderId;
  const summarize = () => {
    const raw = String(content ?? "").trim();
    if (!raw) return "-";
    const short = (s, n = 180) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
    if (type === "URL_BLACKLIST") {
      try {
        const o = JSON.parse(raw);
        const href = o?.href || o?.url || o?.title || "";
        const src = o?.params ? (() => {
          try {
            const p = typeof o.params === "string" ? JSON.parse(o.params) : o.params;
            return p?.src || "";
          } catch {
            return "";
          }
        })() : "";
        const out = [href, src ? `(src: ${src})` : ""].filter(Boolean).join(" ");
        if (out) return short(out, 220);
      } catch {
        // fallthrough
      }
    }
    return short(raw.replace(/\s+/g, " "), 220);
  };
  return (
    `🚨 [GUARDIAN] Vi phạm\n` +
    `Nhóm: ${groupLine}\n` +
    `Người vi phạm: ${whoLine}\n` +
    `Loại: ${presentType(type)}  |  Lần: #${count}\n` +
    `Tóm tắt: ${summarize()}\n` +
    `Thời gian: ${time}`
  );
}

export function buildViolationReply(displayName, type) {
  const who = displayName || "Thành viên";
  if (type === "REPEAT_SPAM" || type === "REPEAT") {
    return (
      `⚠️ [Guardian] Vi phạm: REPEAT_SPAM\n` +
      `${who} vi phạm: Spam tin quá 3 lần liền nhau, không phù hợp quy định nhóm — sẽ kick out nếu tái phạm.\n` +
      `Admin đã nhận thông báo.`
    );
  }
  if (type === "URL_BLACKLIST" || type === "LINK_SPAM") {
    return (
      `⚠️ [Guardian] Vi phạm: URL_BLACKLIST\n` +
      `${who} vi phạm: Gửi URL/link nằm trong blacklist — đề nghị kiểm tra lại trước khi gửi.\n` +
      `Admin đã nhận thông báo, vi phạm này sẽ bị trừ điểm nếu vi phạm nội quy.`
    );
  }
  if (type === "KEYWORD_SPAM") {
    return (
      `⚠️ [Guardian] Vi phạm: KEYWORD_SPAM\n` +
      `${who} vi phạm: Nội dung chứa từ khóa spam/marketing bị cấm trong nhóm.\n` +
      `Admin đã nhận thông báo,vi phạm này sẽ bị trừ điểm nếu vi phạm nội quy.`
    );
  }
  if (type === "STICKER_SPAM" || type === "STICKER") {
    return (
      `⚠️ [Guardian] Vi phạm: STICKER_SPAM\n` +
      `${who} vi phạm: Gửi STICKER không phù hợp quy định nhóm — vi phạm này sẽ bị trừ điểm.\n` +
      `Admin đã nhận thông báo.`
    );
  }
  if (type === "EMOJI_SPAM" || type === "SPAM_Emoji") {
    return (
      `⚠️ [Guardian] Vi phạm: EMOJI_SPAM\n` +
      `${who} vi phạm: Gửi emoji/emoticon  — vi phạm này sẽ bị trừ điểm.\n` +
      `Admin đã nhận thông báo.`
    );
  }
  return (
    `⚠️ [Guardian] Vi phạm: ${type}\n` +
    `${who} vi phạm: Tin không phù hợp quy định nhóm — sẽ gỡ khỏi phòng.\n` +
    `Admin đã nhận thông báo.`
  );
}

export function buildUndoDM(
  groupName,
  groupId,
  actorDisplayName,
  actorId,
  originalDisplayName,
  originalSenderId,
  content,
  undoType = "MESSAGE_RECALLED_SELF",
  undoCountToday
) {
  const time =
    new Date(Date.now() + 7 * 3600000).toISOString().replace("T", " ").slice(0, 19) +
    " (GMT+7)";
  const groupShort = shortGroupLabel(groupName);
  const who =
    (actorDisplayName && String(actorDisplayName).trim()) || String(actorId || "[không rõ]");
  const origWho =
    (originalDisplayName && String(originalDisplayName).trim()) ||
    String(originalSenderId || "[không rõ]");
  const dailyLine =
    undoCountToday != null && undoCountToday >= 0
      ? `Số vi phạm trong ngày: ${undoCountToday} lần\n`
      : "";
  const roleBlock =
    undoType === "MESSAGE_DELETED_BY_ADMIN"
      ? `Người xóa: ${who}\nTác giả tin: ${origWho}\n`
      : `Người thu hồi: ${who}\n`;
  return (
    `📸 Tin nhắn thu hồi\n` +
    `Group: ${groupShort}\n` +
    roleBlock +
    dailyLine +
    `Nội dung đã thu hồi: "${content}"\n` +
    `Thời gian: ${time}`
  );
}

export async function sendUndoNotice(
  api,
  groupId,
  groupName,
  actorDisplayName,
  actorId,
  originalDisplayName,
  originalSenderId,
  content,
  undoType = "MESSAGE_RECALLED_SELF",
  undoCountToday
) {
  if (undoType === "MESSAGE_DELETED_BY_ADMIN") {
    // Yêu cầu vận hành: admin xóa tin người khác thì không thông báo lên room.
    return;
  }
  const raw = String(content ?? "");
  const hasOkVariant = /(^|[^a-z0-9])(?:[o0]+k+)+(?:[^a-z0-9]|$)/i.test(
    raw.normalize("NFKC")
  );
  const time =
    new Date(Date.now() + 7 * 3600000).toISOString().replace("T", " ").slice(0, 19) +
    " (GMT+7)";
  const groupShort = shortGroupLabel(groupName);
  const who =
    (actorDisplayName && String(actorDisplayName).trim()) || "[không rõ]";
  const origWho =
    (originalDisplayName && String(originalDisplayName).trim()) || "[không rõ]";
  const dailyLine =
    undoCountToday != null && undoCountToday >= 0
      ? `Số vi phạm trong ngày: ${undoCountToday} lần\n`
      : "";
  const roleBlock =
    undoType === "MESSAGE_DELETED_BY_ADMIN"
      ? `Người xóa: ${who}\nTác giả tin: ${origWho}\n`
      : `Người thu hồi: ${who}\n`;
  const fullText =
    `📸 Tin nhắn thu hồi\n` +
    `Group: ${groupShort}\n` +
    roleBlock +
    dailyLine +
    `Nội dung đã thu hồi: "${raw}"\n` +
    `Thời gian: ${time}`;
  const shortText =
    `📸 Tin nhắn thu hồi\n` +
    `Group: ${groupShort}\n` +
    roleBlock +
    dailyLine +
    `Thời gian: ${time}`;
  const text = hasOkVariant ? fullText : shortText;
  try {
    await api.sendMessage(text, groupId, THREAD_GROUP);
    log(`Thông báo UNDO (${hasOkVariant ? "full" : "short"}) OK group=${groupId}`);
  } catch (err) {
    log(`Thông báo UNDO lên nhóm FAIL: ${err.message}`);
  }
}

export async function deleteSpamMessage(api, msg) {
  // msg = object từ listener event "message"
  // msg.data: { msgId, cliMsgId, uidFrom, idTo }
  const botId = api.getOwnId();
  const isSelf = String(msg.data.uidFrom) === String(botId);

  try {
    if (isSelf) {
      // Tin của chính bot → dùng undo
      await api.undo(msg);
      log(`[NOTIFIER] Đã undo tin của bot msgId=${msg.data.msgId}`);
    } else {
      // Tin của member khác → deleteMessage cho cả nhóm
      // zca-js Enum: ThreadType.User=0, ThreadType.Group=1 (không phải 2)
      await api.deleteMessage(
        {
          threadId: String(msg.data.idTo),
          type: 1,
          data: {
            cliMsgId: msg.data.cliMsgId,
            msgId: msg.data.msgId,
            uidFrom: String(msg.data.uidFrom),
          },
        },
        false
      ); // onlyMe = false → xóa cho cả nhóm
      log(
        `[NOTIFIER] Đã xóa tin spam msgId=${msg.data.msgId} của ${msg.data.uidFrom}`
      );
    }
  } catch (e) {
    log(`[NOTIFIER] deleteSpamMessage FAIL: ${e.message}`);
  }
}
