// core/zalo.js
// Mục đích: Login zca-js, khởi động listener, emit events lên eventBus
// Đây là cầu nối duy nhất giữa zca-js và phần còn lại của hệ thống

import { readFileSync } from "node:fs";
import eventBus from "./eventBus.js";
import db from "./db.js";

let api = null;

export async function startZalo(config) {
  const log = (msg) => console.log(`[${new Date().toISOString()}] [zalo] ${msg}`);

  log("Đang load zca-js...");
  const { Zalo } = await import(config.zcaPath);

  log("Đang đọc credentials...");
  const creds = JSON.parse(readFileSync(config.credentialsPath, "utf8"));

  log("Đang login...");
  const zalo = new Zalo({ logging: false });
  api = await zalo.login({
    imei: creds.imei,
    cookie: creds.cookie,
    userAgent: creds.userAgent,
    language: "vi",
  });

  log(`Logged in as ${api.getOwnId()}`);
  eventBus.emit("zalo:connect", { userId: api.getOwnId() });

  // Đăng ký listeners
  api.listener.on("message", (msg) => {
    const msgGroupId = msg.data?.idTo || msg.idTo || "";
    log(`MSG from group: ${msgGroupId}`);

    const gName = msg.data?.groupName || msg.groupName || "";
    if (msgGroupId && gName) {
      try {
        db.prepare(`
          INSERT INTO group_names (group_id, name, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(group_id) DO UPDATE SET name=excluded.name, updated_at=CURRENT_TIMESTAMP
        `).run(msgGroupId, gName);
      } catch {
        /* ignore */
      }
    }

    // Cache tất cả messages để phục vụ UNDO lookup
    const cacheContent = msg.data?.content || msg.content || "";
    const cacheMsgId = msg.data?.msgId || msg.msgId || "";
    const cacheSender = msg.data?.uidFrom || msg.uidFrom || "";
    const cacheTs = msg.data?.ts || Date.now();

    if (cacheMsgId) {
      try {
        const contentStr =
          typeof cacheContent === "object"
            ? JSON.stringify(cacheContent)
            : String(cacheContent || "");
        db.prepare(`
          INSERT OR IGNORE INTO messages
            (msg_id, group_id, user_id, display_name, content, ts,
             quote_msg_id, quote_owner_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          cacheMsgId,
          msgGroupId || "",
          cacheSender || "",
          msg.data?.dName || msg.dName || "",
          contentStr,
          cacheTs || Date.now(),
          String(msg.data?.quote?.globalMsgId || "") || null,
          String(msg.data?.quote?.ownerId || "") || null
        );
      } catch {
        /* ignore */
      }
    }

    // Không lọc theo config.watchGroups cứng.
    // Guardian sẽ tự lọc theo watch_groups (DB) + enabled realtime.
    eventBus.emit("zalo:message", { api, msg });
  });

  api.listener.on("undo", (data) => {
    eventBus.emit("zalo:undo", { api, data });
  });

  api.listener.start();
  log("Listener started.");

  // Cache tên groups (chỉ cache watched groups + batch để tránh lỗi API)
  try {
    const watchedIds = (config.watchGroups || []).map((g) => g.groupId);

    if (watchedIds.length > 0) {
      const groupInfoRes = await api.getGroupInfo(watchedIds);
      if (groupInfoRes?.gridInfoMap) {
        for (const [gid, info] of Object.entries(groupInfoRes.gridInfoMap)) {
          if (info?.name) {
            db.prepare(`
              INSERT INTO group_names (group_id, name, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(group_id) DO UPDATE SET name=excluded.name, updated_at=CURRENT_TIMESTAMP
            `).run(gid, info.name);
          }
        }
        log(`Cached ${Object.keys(groupInfoRes.gridInfoMap).length} group names OK`);
      }
    }
  } catch (e) {
    log(`Group name cache FAIL: ${e.message}`);
  }
}

export function getApi() {
  return api;
}
