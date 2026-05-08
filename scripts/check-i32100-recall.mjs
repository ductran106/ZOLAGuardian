import db from "../core/db.js";
import { loadConfig } from "../core/loadConfig.js";

const cfg = loadConfig();
console.log("CONFIG", JSON.stringify({ botUserId: cfg.botUserId, hasTelegramToken: !!cfg.telegramBotToken, hasTelegramChat: !!cfg.telegramChatId }));

const startMs = Date.parse("2026-05-05T00:00:00+07:00");
const endMs = Date.parse("2026-05-05T23:59:59.999+07:00");
const rows = db.prepare(`
  SELECT msg_id, user_id, display_name, group_id, ts, substr(content,1,220) AS content_head
  FROM messages
  WHERE ts BETWEEN ? AND ?
    AND content LIKE '%Tin nhắn thu hồi%'
  ORDER BY ts DESC
  LIMIT 20
`).all(startMs, endMs);
console.log("ROWS", JSON.stringify(rows, null, 2));

