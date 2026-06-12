// core/groupMembers.js
// Sync/cache Zalo group members without mutating Zalo state.

import db from "./db.js";
import { getApi } from "./zalo.js";

const MEMBER_INFO_CHUNK = 100;

function compactString(v) {
  if (v == null) return "";
  return String(v).trim();
}

function pushUnique(ids, v) {
  const s = compactString(v);
  if (s && !ids.includes(s)) ids.push(s);
}

function extractIdFromMemVerEntry(item) {
  if (typeof item === "string" || typeof item === "number") return compactString(item);
  if (!item || typeof item !== "object") return "";
  return compactString(item.uid ?? item.userId ?? item.user_id);
}

export function extractMemberIds(groupMeta) {
  const ids = [];
  const list = groupMeta?.memVerList ?? groupMeta?.memberIds ?? groupMeta?.member_ids ?? groupMeta?.currentMems;
  if (!Array.isArray(list)) return ids;
  for (const item of list) pushUnique(ids, extractIdFromMemVerEntry(item));
  return ids;
}

export function normalizeMember(raw, fallbackUserId = "") {
  const userId = compactString(
    raw?.user_id ?? raw?.userId ?? raw?.uid ?? raw?.id ?? fallbackUserId
  );
  const displayName = compactString(
    raw?.display_name ?? raw?.displayName ?? raw?.dName ?? raw?.name ?? raw?.zaloName
  );
  const zaloName = compactString(raw?.zalo_name ?? raw?.zaloName ?? raw?.name);
  return {
    user_id: userId,
    display_name: displayName || zaloName || userId,
    zalo_name: zaloName,
    avatar: compactString(raw?.avatar ?? raw?.avatarUrl ?? raw?.avt),
    account_status: Number.isFinite(Number(raw?.accountStatus ?? raw?.account_status))
      ? Number(raw?.accountStatus ?? raw?.account_status)
      : null,
    type: Number.isFinite(Number(raw?.type)) ? Number(raw?.type) : null,
    global_id: compactString(raw?.globalId ?? raw?.global_id),
    last_update_time: Number.isFinite(Number(raw?.lastUpdateTime ?? raw?.last_update_time))
      ? Number(raw?.lastUpdateTime ?? raw?.last_update_time)
      : null,
  };
}

export function dedupeMembersForSheet(members) {
  const seen = new Set();
  const out = [];
  for (const m of members || []) {
    const uid = compactString(m?.user_id);
    const name = compactString(m?.display_name);
    const key = uid ? `uid:${uid}` : `name:${name}`;
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...m, display_name: name });
  }
  return out;
}

function rowsToMembers(rows) {
  return rows.map((r) => ({
    user_id: r.user_id,
    display_name: r.display_name || "",
    zalo_name: r.zalo_name || "",
    avatar: r.avatar || "",
    account_status: r.account_status,
    type: r.type,
    global_id: r.global_id || "",
    last_update_time: r.last_update_time,
    last_sync_ts: r.last_sync_ts,
    is_active: Number(r.is_active ?? 1),
    left_ts: r.left_ts ?? null,
  }));
}

export function getCachedGroupMembers(groupId) {
  const gid = compactString(groupId);
  const rows = db
    .prepare(
      `SELECT user_id, display_name, zalo_name, avatar, account_status, type,
              global_id, last_update_time, last_sync_ts, is_active, left_ts
       FROM group_members
       WHERE group_id = ? AND COALESCE(is_active, 1) = 1
       ORDER BY rowid ASC`
    )
    .all(gid);
  const last = rows.reduce((m, r) => Math.max(m, Number(r.last_sync_ts || 0)), 0);
  return { groupId: gid, count: rows.length, members: rowsToMembers(rows), lastSyncTs: last || null };
}

function profileId(raw) {
  return compactString(raw?.user_id ?? raw?.userId ?? raw?.uid ?? raw?.id);
}

function profileMapFromResponse(res) {
  const map = res?.profiles ?? res?.changed_profiles ?? res?.memberMap ?? res?.userInfoMap ?? res ?? {};
  return map;
}

function lookupRequestedProfile(map, uid) {
  if (Array.isArray(map)) {
    return map.find((x) => profileId(x) === uid) || null;
  }
  if (map && typeof map === "object") {
    const raw = map[uid];
    if (!raw) return null;
    const rawId = profileId(raw);
    if (rawId && rawId !== uid) return null;
    return raw;
  }
  return null;
}

export async function syncGroupMembers(groupId) {
  const gid = compactString(groupId);
  if (!gid) throw new Error("Thiếu groupId");
  const api = getApi();
  if (!api) {
    const err = new Error("Zalo chưa đăng nhập");
    err.statusCode = 503;
    throw err;
  }

  const infoRes = await api.getGroupInfo([gid]);
  const meta = infoRes?.gridInfoMap?.[gid] ?? infoRes?.[gid] ?? null;
  if (!meta) {
    const err = new Error("Không tìm thấy metadata nhóm từ Zalo API");
    err.statusCode = 404;
    throw err;
  }

  const memberIds = extractMemberIds(meta);
  const syncedAt = Date.now();
  if (!memberIds.length) {
    const err = new Error("Không tìm thấy memVerList/memberIds hợp lệ; không prune cache để tránh đánh dấu sai toàn bộ nhóm inactive");
    err.statusCode = 422;
    err.code = "GROUP_MEMBER_IDS_NOT_FOUND";
    throw err;
  }
  const requested = new Set(memberIds);

  const normalized = [];
  for (let i = 0; i < memberIds.length; i += MEMBER_INFO_CHUNK) {
    const slice = memberIds.slice(i, i + MEMBER_INFO_CHUNK);
    const res = await api.getGroupMembersInfo(slice);
    const map = profileMapFromResponse(res);
    for (const uid of slice) {
      const raw = lookupRequestedProfile(map, uid) ?? { uid };
      const m = normalizeMember(raw, uid);
      if (m.user_id && requested.has(m.user_id)) normalized.push(m);
    }
  }

  const tx = db.transaction((items) => {
    const up = db.prepare(`
      INSERT INTO group_members (
        group_id, user_id, display_name, zalo_name, avatar, account_status,
        type, global_id, last_update_time, last_sync_ts, is_active, left_ts
      ) VALUES (
        @group_id, @user_id, @display_name, @zalo_name, @avatar, @account_status,
        @type, @global_id, @last_update_time, @last_sync_ts, 1, NULL
      )
      ON CONFLICT(group_id, user_id) DO UPDATE SET
        display_name = excluded.display_name,
        zalo_name = excluded.zalo_name,
        avatar = excluded.avatar,
        account_status = excluded.account_status,
        type = excluded.type,
        global_id = excluded.global_id,
        last_update_time = excluded.last_update_time,
        last_sync_ts = excluded.last_sync_ts,
        is_active = 1,
        left_ts = NULL
    `);
    for (const item of items) up.run({ group_id: gid, ...item, last_sync_ts: syncedAt });

    const placeholders = memberIds.map(() => "?").join(",");
    db.prepare(`
      UPDATE group_members
      SET is_active = 0, left_ts = ?
      WHERE group_id = ? AND user_id NOT IN (${placeholders})
    `).run(syncedAt, gid, ...memberIds);
  });
  tx(normalized);

  return { groupId: gid, count: normalized.length, members: normalized, syncedAt };
}
