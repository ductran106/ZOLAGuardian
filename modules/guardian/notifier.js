// modules/guardian/notifier.js
// Mục đích: Gửi cảnh báo — DM admin + reply vào group
// sendMessage probe: DM=DM-B, GRP=GRP-B

const log = (msg) =>
  console.log(`[${new Date().toISOString()}] [notifier] ${msg}`);

export async function dmAdmin(api, adminId, text) {
  try {
    await api.sendMessage(text, adminId);
    log(`DM admin ${adminId} OK`);
  } catch (err) {
    log(`DM admin FAIL: ${err.message}`);
  }
}

export async function quoteReply(api, groupId, msgId, text) {
  try {
    await api.sendMessage(text, groupId);
    log(`Reply group ${groupId} OK`);
  } catch (err) {
    log(`Reply group FAIL: ${err.message}`);
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
  return (
    `🚨 [GUARDIAN] Vi phạm phát hiện\n` +
    `Group: ${groupLine}\n` +
    `Người vi phạm: ${whoLine}\n` +
    `Loại: ${type}\n` +
    `Nội dung: "${content}"\n` +
    `Lần vi phạm: #${count}\n` +
    `Thời gian: ${time}`
  );
}

export function buildViolationReply(displayName, type) {
  return `⚠️ @${displayName} — Tin nhắn vi phạm quy định nhóm (${type}). Admin đã được thông báo.`;
}

export function buildUndoDM(
  groupName,
  groupId,
  displayName,
  senderId,
  content
) {
  const time =
    new Date(Date.now() + 7 * 3600000).toISOString().replace("T", " ").slice(0, 19) +
    " (GMT+7)";
  const groupLine = `${groupName} (${groupId})`;
  const whoLine = displayName ? `${displayName} (${senderId})` : senderId;
  return (
    `🔍 [GUARDIAN] Tin nhắn bị thu hồi\n` +
    `Group: ${groupLine}\n` +
    `Người thu hồi: ${whoLine}\n` +
    `Nội dung đã thu hồi: "${content}"\n` +
    `Thời gian: ${time}`
  );
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
