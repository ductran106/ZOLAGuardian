// core/groupDiscovery.js — Đọc metadata nhóm Zalo để biết bot có phải admin/trưởng nhóm không

export function extractAdminCandidates(meta) {
  const out = new Set();
  const add = (v) => {
    if (v === undefined || v === null || v === "") return;
    out.add(String(v));
  };
  const m = meta && typeof meta === "object" ? meta : {};

  add(m.creatorId);
  add(m.creator_id);
  add(m.ownerId);
  add(m.previewCreatorUid);
  add(m.previewCreatorId);
  add(m.preview_creator_id);

  const arrs = [
    m.adminIds,
    m.admin_id,
    m.admins,
    m.groupAdmins,
    m.groupAdminIds,
    m.setting?.admins,
    m.groupSetting?.admins,
    m.setting?.adminIds,
    m.group_setting?.admins,
  ];

  for (const arr of arrs) {
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (item && typeof item === "object") {
        add(
          item.id ??
            item.uid ??
            item.userId ??
            item.memberId ??
            item.member_id
        );
      } else add(item);
    }
  }

  const memLists = [
    m.memVerList,
    m.members,
    m.memberList,
    m.participants,
    m.previewMembers,
    m.previewMems,
  ];
  for (const list of memLists) {
    if (!Array.isArray(list)) continue;
    for (const mem of list) {
      if (!mem || typeof mem !== "object") continue;
      const adm =
        mem.isAdmin === true ||
        mem.is_admin === true ||
        mem.admin === true ||
        mem.admin === 1 ||
        Number(mem.role) === 1 ||
        mem.role === "admin" ||
        mem.role === "ADMIN";
      if (adm) {
        add(
          mem.uidFrom ??
            mem.id ??
            mem.userId ??
            mem.memberId ??
            mem.member_id
        );
      }
      if (mem.creator === true || mem.owner === true) {
        add(mem.uidFrom ?? mem.id ?? mem.userId);
      }
    }
  }

  return out;
}

export function isBotGroupAdmin(botId, meta) {
  return extractAdminCandidates(meta).has(String(botId));
}
