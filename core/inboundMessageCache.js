// core/inboundMessageCache.js
// Ghi cache tin nhóm vào SQLite — một nguồn duy nhất, giữ quote + global id để xuất DOCX nối cụm đúng.

/**
 * @param {unknown} msg — payload zca-js (GroupMessage).data hoặc tương đương
 */
export function extractQuotePersist(msg) {
  const d = msg?.data || msg || {};
  let q = d.quote;
  if (
    !q &&
    d.content &&
    typeof d.content === "object" &&
    !Array.isArray(d.content)
  ) {
    q = d.content.quote;
  }
  if (!q || typeof q !== "object") {
    return { quoteMsgId: "", quoteOwnerId: "" };
  }
  const usableRef = (v) => {
    const s = v == null ? "" : String(v).trim();
    return s && s !== "0" ? s : "";
  };
  const g = usableRef(q.globalMsgId);
  const m = usableRef(q.msgId);
  const c = usableRef(q.cliMsgId);
  // Ưu globalMsgId (scheduler / TAKE) rồi msgId / cliMsgId.
  // zca-js có thể trả globalMsgId=0 cho self-quote; 0 là sentinel, không phải ref cha.
  const quoteMsgId = g || m || c || "";
  const quoteOwnerId =
    q.ownerId != null && String(q.ownerId).trim() !== ""
      ? String(q.ownerId).trim()
      : "";
  return { quoteMsgId, quoteOwnerId };
}

/**
 * globalMsgId gốc của chính tin (nếu server gửi) — dùng để match quote_msg_id của tin con.
 */
export function extractRootGlobalMsgId(msg) {
  const d = msg?.data || msg || {};
  const v = d.globalMsgId ?? d.global_msg_id;
  if (v == null || v === "") return "";
  const s = String(v).trim();
  return s === "0" ? "" : s;
}

/**
 * @param {import("better-sqlite3").Database} db
 */
export function upsertInboundGroupMessage(db, msg) {
  const d = msg?.data || msg || {};
  const cacheContent = d.content ?? msg?.content ?? "";
  const cacheMsgId = d.msgId || msg?.msgId || "";
  if (!cacheMsgId) return;
  const msgGroupId = d.idTo || msg?.idTo || "";
  const cacheSender = d.uidFrom || msg?.uidFrom || "";
  const cacheTs = d.ts || Date.now();
  const contentStr =
    typeof cacheContent === "object"
      ? JSON.stringify(cacheContent)
      : String(cacheContent || "");
  const { quoteMsgId, quoteOwnerId } = extractQuotePersist(msg);
  const globalMsgId = extractRootGlobalMsgId(msg);
  const cliMsgId = d.cliMsgId == null ? "" : String(d.cliMsgId).trim();

  db.prepare(
    `INSERT INTO messages
      (msg_id, group_id, user_id, display_name, content, ts,
       quote_msg_id, quote_owner_id, global_msg_id, cli_msg_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(msg_id) DO UPDATE SET
       group_id = excluded.group_id,
       user_id = excluded.user_id,
       display_name = excluded.display_name,
       content = excluded.content,
       ts = CASE
         WHEN excluded.ts > messages.ts THEN excluded.ts
         ELSE messages.ts
       END,
       quote_msg_id = COALESCE(
         NULLIF(TRIM(excluded.quote_msg_id), ''),
         NULLIF(TRIM(messages.quote_msg_id), '')
       ),
       quote_owner_id = COALESCE(
         NULLIF(TRIM(excluded.quote_owner_id), ''),
         NULLIF(TRIM(messages.quote_owner_id), '')
       ),
       global_msg_id = COALESCE(
         NULLIF(TRIM(excluded.global_msg_id), ''),
         NULLIF(TRIM(messages.global_msg_id), '')
       ),
       cli_msg_id = COALESCE(
         NULLIF(TRIM(excluded.cli_msg_id), ''),
         NULLIF(TRIM(messages.cli_msg_id), '')
       )`
  ).run(
    String(cacheMsgId),
    String(msgGroupId || ""),
    String(cacheSender || ""),
    String(d.dName || msg?.dName || ""),
    contentStr,
    Number(cacheTs) || Date.now(),
    quoteMsgId || null,
    quoteOwnerId || null,
    globalMsgId || null,
    cliMsgId || null
  );
}
