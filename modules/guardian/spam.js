// modules/guardian/spam.js
// Mục đích: Detect các loại spam — link, repeat, emoji-only, sticker
// Rules từ config.json + spam_list trong DB

import { getEffectiveSpamConfig } from "../../core/spamRules.js";

const recentMessages = new Map();

/** Gom mọi giá trị nguyên thuỷ từ content (string / object lồng / mảng) để quét spam. */
function collectPrimitiveStrings(value, out, depth, seen) {
  if (depth > 12) return;
  if (value == null) return;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") {
    out.push(String(value));
    return;
  }
  if (t !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      for (const item of value) {
        collectPrimitiveStrings(item, out, depth + 1, seen);
      }
    } else {
      for (const k of Object.keys(value)) {
        collectPrimitiveStrings(value[k], out, depth + 1, seen);
      }
    }
  } finally {
    seen.delete(value);
  }
}

/**
 * Loại các URL/host được phép khỏi chuỗi quét link (ngoại lệ config.spam.linkAllowHosts).
 */
function scrubAllowListedHosts(haystack, hosts) {
  const list = hosts || [];
  if (!haystack || list.length === 0) return haystack;

  let out = haystack;
  for (const raw of list) {
    const host = String(raw || "").trim().toLowerCase();
    if (!host) continue;
    const escaped = host.replace(/\./g, "\\.");
    // subdomain + host (không khớp "evil"+binhminhsapa — cần dấu chấm tách subdomain hoặc thuần host)
    const label = new RegExp(
      "\\b(?:[\\w.-]+\\.)?" + escaped + "\\b(?::\\d+)?(?:/[^\\s]*)?",
      "gi"
    );
    out = out.replace(label, " ");
    out = out.replace(
      new RegExp("https?:\\/\\/[^\\s]*" + escaped + "[^\\s]*", "gi"),
      " "
    );
    out = out.replace(new RegExp("www\\.[^\\s]*" + escaped + "[^\\s]*", "gi"), " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Gỡ URL preview Zalo (CDN / static) — sau khi đã gỡ host cho phép, chuỗi còn https://stc-…zdn.vn
 * vẫn khớp pattern "https?://\\S+" và bị xóa nhầm.
 */
function scrubInfrastructureUrls(haystack) {
  if (!haystack) return haystack;
  const strip = (s, re) => s.replace(re, " ");
  let out = haystack;
  out = strip(
    out,
    /https?:\/\/[^\s]*(?:zdn\.vn|zadn\.vn|zing\.vn|zaloapp\.com|zalocdn\.com)[^\s]*/gi
  );
  out = strip(
    out,
    /\bwww\.[^\s]*(?:zdn\.vn|zadn\.vn|zing\.vn)[^\s]*/gi
  );
  return out.replace(/\s+/g, " ").trim();
}

/** Chuỗi dùng cho regex link — gom mọi primitive (title, href, …) tránh parse cả JSON một cục (metadata). */
function buildLinkHaystack(content, safeContent) {
  const parts = [];
  const seen = new WeakSet();
  collectPrimitiveStrings(content, parts, 0, seen);
  const flat = parts.join("\n").trim();
  return flat.length > 0 ? flat : safeContent;
}

/** Chuỗi dùng cho EMOJI_ONLY: ưu tiên text thuần từ object, tránh JSON làm hỏng isEmojiOnly. */
function buildEmojiProbe(content, safeContent) {
  const parts = [];
  const seen = new WeakSet();
  collectPrimitiveStrings(content, parts, 0, seen);
  const joined = parts.join(" ").trim();
  if (joined.length > 0) return joined;
  if (typeof content === "string") return content;
  return safeContent;
}

function isEmojiOnly(text) {
  if (!text || text.trim() === "") return false;
  // Match cả Unicode emoji lẫn Zalo shortcode dạng :x :D :p
  const withoutEmoji = text
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .replace(/:[a-zA-Z0-9_]+:/g, "")
    .replace(/:[a-z]/gi, "")
    .trim();
  return withoutEmoji.length === 0;
}

export function detectSpam(msg, config, adminIds = []) {
  const senderId = msg.data?.uidFrom || msg.uidFrom || "";
  const groupId  = msg.data?.idTo    || msg.idTo    || "";
  const content  = msg.data?.content || msg.content || "";
  const msgType  = msg.data?.msgType || msg.msgType || "text";

  const safeContent =
    typeof content === "object" && content !== null
      ? JSON.stringify(content)
      : String(content || "");

  const linkHaystack = buildLinkHaystack(content, safeContent);
  const emojiProbe = buildEmojiProbe(content, safeContent);

  const log = (m) => console.log(`[${new Date().toISOString()}] [spam] ${m}`);
  log(`CHECK sender=${senderId} type=${msgType} content=${JSON.stringify(safeContent)}`);

  if (adminIds.includes(senderId)) return null;

  const eff = getEffectiveSpamConfig(config);
  const spam = eff.spam;

  const allowTexts = spam.allowTextSubstrings || [];
  if (allowTexts.length > 0) {
    const blob = `${linkHaystack}\n${emojiProbe}\n${safeContent}`.toLowerCase();
    for (const raw of allowTexts) {
      const needle = String(raw || "").trim().toLowerCase();
      if (needle && blob.includes(needle)) return null;
    }
  }

  const linkScanText = scrubInfrastructureUrls(
    scrubAllowListedHosts(linkHaystack, spam.linkAllowHosts)
  );

  // 1. Link spam (sau khi bỏ host ngoại lệ — ví dụ site nội bộ được phép)
  for (const pattern of spam.linkPatterns) {
    if (new RegExp(pattern, "i").test(linkScanText)) {
      return { type: "LINK_SPAM", detail: `Pattern: ${pattern}`, content: safeContent };
    }
  }

  // 2. Sticker
  if (
    spam.blockSticker &&
    (msgType === "sticker" ||
      msgType === "chat.sticker" ||
      msgType === 3)
  ) {
    return { type: "STICKER", detail: "Sticker message", content: "[sticker]" };
  }

  // 3. Emoji only
  if (spam.blockEmojiOnly && isEmojiOnly(emojiProbe)) {
    return { type: "EMOJI_ONLY", detail: "Emoji only message", content: safeContent };
  }

  // 4. Repeat
  const key = `${senderId}_${groupId}`;
  const now = Date.now();
  const window = spam.repeatWindowSeconds * 1000;

  if (!recentMessages.has(key)) recentMessages.set(key, []);
  const history = recentMessages.get(key).filter((m) => now - m.ts < window);
  history.push({ content: safeContent, ts: now });
  recentMessages.set(key, history);

  const sameCount = history.filter((m) => m.content === safeContent).length;
  if (sameCount >= spam.repeatThreshold) {
    return {
      type: "REPEAT",
      detail: `Repeated ${sameCount}x in ${spam.repeatWindowSeconds}s`,
      content: safeContent,
    };
  }

  return null;
}
