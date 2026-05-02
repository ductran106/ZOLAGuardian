// modules/guardian/telegramNotify.js
// Gửi Telegram: chỉ tin nhắn text thuần (ảnh đã tắt theo yêu cầu vận hành).
// Biến môi trường: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (hoặc trong config.json)

const log = (m) =>
  console.log(`[${new Date().toISOString()}] [telegram] ${m}`);

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

/** Chuỗi thời gian hiển thị — ví dụ 2026-05-01 15:52:05 (GMT+7) */
export function timeLabelGMT7(d = Date.now()) {
  const s = new Date(Number(d) + 7 * 3600000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
  return `${s} (GMT+7)`;
}

function clip(s, max) {
  const t = String(s ?? "");
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

/** Tin spam — cùng phong cách nhóm tin Guardian */
export function formatSpamEvidencePlain(ctx) {
  const groupLine = `${ctx.groupName || "(Không tên)"} (${ctx.groupId})`;
  const whoLine = ctx.displayName
    ? `${ctx.displayName} (${ctx.senderId})`
    : String(ctx.senderId);
  const content = clip(String(ctx.content ?? ""), 3800);
  return (
    `🚨 [GUARDIAN] Vi phạm\n` +
    `Group: ${groupLine}\n` +
    `Người vi phạm: ${whoLine}\n` +
    `Loại: ${presentType(ctx.type)}\n` +
    `Chi tiết: ${ctx.detail}\n` +
    `Nội dung tin: "${content}"\n` +
    `Thời gian: ${ctx.timeLabel}`
  );
}

/** Tin thu hồi (UNDO) — đúng kiểu anh gửi mẫu */
export function formatUndoEvidencePlain(ctx) {
  const groupLine = `${ctx.groupName || "(Không tên)"} (${ctx.groupId})`;
  const actorLine = ctx.actorDisplayName
    ? `${ctx.actorDisplayName} (${ctx.actorId})`
    : String(ctx.actorId);
  const originalLine = ctx.originalDisplayName
    ? `${ctx.originalDisplayName} (${ctx.originalSenderId})`
    : String(ctx.originalSenderId || "[không rõ]");
  const content = clip(String(ctx.recalledContent ?? ""), 3800);
  return (
    `🔍 [GUARDIAN] Tin nhắn bị xóa/thu hồi\n` +
    `Group: ${groupLine}\n` +
    `Loại: ${presentType(ctx.type)}\n` +
    `Người thao tác: ${actorLine}\n` +
    `Tác giả tin gốc: ${originalLine}\n` +
    `Nội dung đã thu hồi: "${content}"\n` +
    `Thời gian: ${ctx.timeLabel}`
  );
}

async function sendTelegramJson(token, method, body) {
  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/${method}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) {
    throw new Error(j.description || `${method} HTTP ${r.status}`);
  }
  return j;
}

/**
 * Gửi tin nhắn text đầy đủ.
 */
export async function sendTelegramEvidence(config, { plainText }) {
  const token = String(config.telegramBotToken || "").trim();
  const chatId = String(config.telegramChatId || "").trim();
  if (!token || !chatId) return;

  const text = String(plainText || "");

  try {
    await sendTelegramJson(token, "sendMessage", {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    });
    log("Đã gửi tin nhắn text Telegram");
  } catch (e) {
    log(`sendMessage FAIL: ${e.message}`);
  }
}
