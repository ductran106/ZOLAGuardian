// modules/guardian/spam.js
// Mục đích: Detect các loại spam — URL, keyword, repeat, emoji-only, sticker
// Rules từ config.json + spam_list trong DB
//
// REPEAT:
// - Cửa sổ thời gian: cùng người + cùng nhóm + cùng nội dung, đủ repeatThreshold lần trong repeatWindowSeconds.
// - Hoặc chuỗi liền kề theo timeline nhóm: cùng người + cùng nội dung liên tiếp, đủ repeatConsecutiveThreshold.

import { getEffectiveSpamConfig } from "../../core/spamRules.js";

/** Cửa sổ REPEAT: key sender+group+content -> timestamps[] */
const repeatWindowMap = new Map();
/** Chuỗi liền kề trong timeline nhóm: key group -> { senderId, content, count } */
const groupConsecutiveMap = new Map();

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

function isEmojiOnly(text, mode = "strict") {
  const src = String(text || "").normalize("NFKC").trim();
  if (!src) return false;

  const emojiRe = /[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Emoji}]/gu;
  const joinerRe = /[\u200D\uFE0F\u20E3]/g;
  const keycapRe = /[0-9#*]\u20E3/g;
  const shortcodeRe = /:[a-zA-Z0-9_+-]+:/g;
  const emoticonTokenRe = /(?:^|\s)[:;=8xX]-?[a-z_+)(dpov3]+(?=\s|$)/gi;
  const slashIconTokenRe = /(?:^|\s)\/-[a-z0-9_+-]+(?=\s|$)/gi;

  // Yêu cầu vận hành:
  // - strict: không có chữ/số + có emoji/emoticon => spam
  // - balanced: thêm kiểm tra residue để giảm false-positive
  const plainAfterEmoji = src
    .replace(emojiRe, "")
    .replace(joinerRe, "")
    .replace(keycapRe, "")
    .replace(shortcodeRe, " ")
    .replace(emoticonTokenRe, " ")
    .replace(slashIconTokenRe, " ")
    .replace(/[\p{P}\p{S}\s]/gu, "")
    .trim();
  const hasText = /[\p{L}\p{N}]/u.test(plainAfterEmoji);
  if (hasText) return false;

  const hasUnicodeEmoji =
    /[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Emoji}]/u.test(src);
  const hasZaloEmoticon =
    /:[a-zA-Z0-9_+-]+:|(?:^|\s)[:;=8xX]-?[a-z_+)(dpov3]+(?=\s|$)|(?:^|\s)\/-[a-z0-9_+-]+(?=\s|$)/i.test(
      src
    );
  if (!hasUnicodeEmoji && !hasZaloEmoticon) return false;

  if (mode === "strict") return true;

  const residue = src
    .replace(emojiRe, "")
    .replace(joinerRe, "")
    .replace(keycapRe, "")
    .replace(shortcodeRe, " ")
    .replace(emoticonTokenRe, " ")
    .replace(slashIconTokenRe, " ")
    .replace(/[\p{P}\p{S}\s]/gu, "")
    .trim();
  return residue.length === 0;
}

/**
 * Tin có biến thể chữ ok (ok, Ok, 0k, ook...) — không áp dụng REPEAT_SPAM (theo yêu cầu vận hành).
 * Cùng ý tưởng ranh giới từ với notifier UNDO (tránh khớp nhầm trong từ dài).
 */
function contentExemptFromRepeatSpam(text) {
  const raw = String(text ?? "").normalize("NFKC");
  return /(^|[^a-z0-9])(?:[oO0]+[kK]+)+(?:[^a-z0-9]|$)/.test(raw);
}

/**
 * Bỏ qua message hệ thống liên quan xóa/thu hồi (admin xóa tin, recall event...)
 * để tránh false-positive spam cho admin.
 */
function isSystemDeleteAction(msgType, content, safeContent) {
  const mt = String(msgType ?? "").toLowerCase();
  if (Number(msgType) === 3) return true;
  const hasDeleteMarkerDeep = (v, depth = 0) => {
    if (depth > 6 || v == null) return false;
    if (Array.isArray(v)) {
      for (const item of v) {
        if (hasDeleteMarkerDeep(item, depth + 1)) return true;
      }
      return false;
    }
    if (typeof v !== "object") return false;
    if (
      "globalDelMsgId" in v ||
      "clientDelMsgId" in v ||
      "delMsgId" in v
    ) {
      return true;
    }
    if (Number(v.type) === 3 && Number(v.actionType) >= 0) return true;
    for (const k of Object.keys(v)) {
      if (hasDeleteMarkerDeep(v[k], depth + 1)) return true;
    }
    return false;
  };
  if (hasDeleteMarkerDeep(content)) return true;
  const s = String(safeContent || "");
  if (
    /globaldelmsgid/i.test(s) ||
    /clientdelmsgid/i.test(s) ||
    /\"type\"\s*:\s*3\s*,\s*\"actiontype\"\s*:/i.test(s)
  ) {
    return true;
  }
  if (
    /\[?\s*tin nhắn đã xóa\s*\]?/i.test(s) ||
    /\[?\s*tin nhắn đã bị xóa\s*\]?/i.test(s) ||
    /đã xóa tin nhắn này/i.test(s) ||
    /\[?\s*tin nhắn chưa hỗ trợ ở phiên bản hiện tại\s*\]?/i.test(s)
  ) {
    return true;
  }
  if (mt.includes("undo") || mt.includes("recall") || mt.includes("revoke")) return true;
  return false;
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

  if (isSystemDeleteAction(msgType, content, safeContent)) {
    return null;
  }

  const repeatExemptOk = contentExemptFromRepeatSpam(safeContent);

  const linkHaystack = buildLinkHaystack(content, safeContent);
  const emojiProbe = buildEmojiProbe(content, safeContent);

  const log = (m) => console.log(`[${new Date().toISOString()}] [spam] ${m}`);
  log(`CHECK sender=${senderId} type=${msgType} content=${JSON.stringify(safeContent)}`);

  // Luôn cập nhật streak liền kề theo timeline nhóm (kể cả admin) để đảm bảo
  // chỉ đúng khi thực sự "liền nhau", không ai xen giữa.
  // Tin chứa ok/0k… không tính vào lặp — reset streak để không chuỗi liền qua tin đó.
  const gid = String(groupId || "").trim();
  const sid = String(senderId || "").trim();
  let groupStreak = groupConsecutiveMap.get(gid);
  if (!groupStreak) groupStreak = { senderId: "", content: "", count: 0 };
  if (repeatExemptOk) {
    groupStreak = { senderId: "", content: "", count: 0 };
  } else if (groupStreak.senderId === sid && groupStreak.content === safeContent) {
    groupStreak.count += 1;
  } else {
    groupStreak.senderId = sid;
    groupStreak.content = safeContent;
    groupStreak.count = 1;
  }
  groupConsecutiveMap.set(gid, groupStreak);

  /** UID so khớp kiểu string/number; danh sách lấy từ DB/config — không đồng bộ khi Zalo gỡ admin */
  const adminSet = new Set(
    (adminIds || []).map((id) => String(id ?? "").trim()).filter(Boolean)
  );
  if (adminSet.has(sid)) return null;

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

  const testUrlPattern = (pattern, haystack) => {
    try {
      return new RegExp(pattern, "i").test(haystack);
    } catch (e) {
      console.error(
        `[spam] Bỏ qua URL pattern không hợp lệ: ${String(pattern)} (${e.message})`
      );
      return false;
    }
  };

  // 1. URL blacklist (sau khi bỏ host ngoại lệ — ví dụ site nội bộ được phép)
  const urlPatterns = spam.urlPatterns || spam.linkPatterns || [];
  for (const pattern of urlPatterns) {
    if (testUrlPattern(pattern, linkScanText)) {
      return {
        type: "URL_BLACKLIST",
        detail: `URL pattern: ${pattern}`,
        content: safeContent,
      };
    }
  }

  // 2. Keyword spam (substring, không cần có link)
  const keywordPatterns = spam.keywordPatterns || [];
  const keywordBlob = `${emojiProbe}\n${safeContent}`.toLowerCase();
  for (const raw of keywordPatterns) {
    const needle = String(raw || "").trim().toLowerCase();
    if (needle && keywordBlob.includes(needle)) {
      return {
        type: "KEYWORD_SPAM",
        detail: `Keyword: ${needle}`,
        content: safeContent,
      };
    }
  }

  // 3. Sticker
  if (
    spam.blockSticker &&
    (msgType === "sticker" ||
      msgType === "chat.sticker")
  ) {
    return { type: "STICKER_SPAM", detail: "Sticker message", content: "[sticker]" };
  }

  // 4. Emoji spam
  const emojiMode = String(spam.emojiMode || "strict").toLowerCase() === "balanced"
    ? "balanced"
    : "strict";
  if (spam.blockEmojiOnly && isEmojiOnly(emojiProbe, emojiMode)) {
    return {
      type: "EMOJI_SPAM",
      detail: `Emoji-only message (${emojiMode})`,
      content: safeContent,
    };
  }

  // 5. REPEAT:
  // - 5 lần trong 20 giây (config)
  // - HOẶC 3 tin liền nhau theo timeline nhóm (config)
  // Tin chứa ok/0k/…: không đếm cửa sổ / không vi phạm lặp (các rule khác vẫn áp dụng).
  if (!repeatExemptOk) {
    let need = Number(spam.repeatThreshold);
    if (!Number.isFinite(need) || need < 1) need = 3;
    need = Math.max(2, need);
    let winSec = Number(spam.repeatWindowSeconds);
    if (!Number.isFinite(winSec) || winSec < 1) winSec = 20;
    winSec = Math.max(1, winSec);
    let needConsecutive = Number(spam.repeatConsecutiveThreshold);
    if (!Number.isFinite(needConsecutive) || needConsecutive < 1) needConsecutive = 3;
    needConsecutive = Math.max(2, needConsecutive);

    const now = Number(msg.data?.ts || msg.ts || Date.now());
    const contentKey = `${sid}_${gid}_${safeContent}`;
    const cutoff = now - winSec * 1000;
    const arr = repeatWindowMap.get(contentKey) || [];
    const kept = arr.filter((t) => Number(t) >= cutoff);
    kept.push(now);
    repeatWindowMap.set(contentKey, kept);

    if (kept.length >= need) {
      repeatWindowMap.set(contentKey, []);
      return {
        type: "REPEAT_SPAM",
        detail: `${need} tin giống hệt trong ${winSec}s`,
        content: safeContent,
      };
    }

    if (
      groupStreak.senderId === sid &&
      groupStreak.content === safeContent &&
      groupStreak.count >= needConsecutive
    ) {
      groupConsecutiveMap.set(gid, { senderId: "", content: "", count: 0 });
      return {
        type: "REPEAT_SPAM",
        detail: `${needConsecutive} tin giống hệt liền nhau (không ai xen giữa)`,
        content: safeContent,
      };
    }
  }

  return null;
}
