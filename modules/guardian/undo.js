// modules/guardian/undo.js
// Mục đích: Detect tin nhắn bị thu hồi; lookup nội dung cache ở index.js (realMsgId)

export function detectUndo(data) {
  const msgId =
    data?.data?.msgId ?? data?.msgId ?? null;
  const realMsgId =
    data?.data?.content?.globalMsgId ||
    data?.data?.realMsgId ||
    data?.realMsgId ||
    data?.data?.msgId ||
    data?.msgId ||
    "";
  const senderId = data?.data?.uidFrom || data?.uidFrom || "";
  const groupId = data?.data?.idTo || data?.idTo || "";
  const displayName = data?.dName || data?.data?.dName || "";

  if (!msgId && !String(realMsgId || "").trim()) return null;

  return {
    msgId,
    realMsgId,
    senderId,
    groupId,
    displayName,
    cachedContent: "",
  };
}
