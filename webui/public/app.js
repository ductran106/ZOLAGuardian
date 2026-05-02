async function fetchJSON(url, opts = {}) {
  const { headers: hdrs, ...rest } = opts;
  const r = await fetch(url, {
    ...rest,
    credentials: "same-origin",
    headers: { ...(hdrs || {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `${url} ${r.status}`);
  return j;
}

function toast(text, err) {
  const el = document.getElementById("toast");
  el.textContent = text;
  el.hidden = false;
  el.classList.toggle("err", !!err);
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.hidden = true;
  }, 3800);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function flagLabel(key) {
  if (key === "bot") return "Bot hoạt động";
  if (key === "guardian") return "Shield Guardian";
  return key;
}

function renderFlags(flags) {
  const el = document.getElementById("flags-list");
  if (!el) return;
  el.innerHTML = "";
  if (!flags || flags.length === 0) {
    el.innerHTML = '<span class="muted">Không có flag</span>';
    return;
  }
  for (const f of flags) {
    const on = Number(f.enabled) === 1;
    const chip = document.createElement("span");
    chip.className = "flag-chip" + (on ? "" : " off");
    const label = document.createElement("span");
    label.textContent = `${flagLabel(f.key)} (${on ? "ON" : "OFF"})`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-mini";
    btn.textContent = on ? "Tắt" : "Bật";
    btn.dataset.key = f.key;
    btn.dataset.next = on ? "off" : "on";
    btn.addEventListener("click", async () => {
      try {
        await fetchJSON("/api/features/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: f.key, enabled: btn.dataset.next === "on" }),
        });
        toast("Đã lưu feature flag.");
        await loadAll();
      } catch (e) {
        toast(e.message, true);
      }
    });
    chip.append(label, btn);
    el.appendChild(chip);
  }
}

function renderStatus(j) {
  const grid = document.getElementById("status-grid");
  if (!grid) return;

  const zOk = !!j.zaloConnected;
  const own = j.ownId != null ? String(j.ownId) : "—";

  grid.innerHTML = `
    <div class="status-card">
      <strong>Kết nối Zalo</strong>
      <div class="val"><span class="status-dot ${zOk ? "ok" : "off"}"></span>${
        zOk ? "Đã đăng nhập" : "Chưa sẵn sàng"
      }</div>
    </div>
    <div class="status-card">
      <strong>Bot</strong>
      <div class="val" title="${escapeHtml(own)}">
        ${
          j.ownName
            ? `<span class="bot-name">${escapeHtml(String(j.ownName))}</span>`
            : ""
        }
        <code class="subtle">${escapeHtml(own)}</code>
      </div>
    </div>
    <div class="status-card">
      <strong>Shield và Bot</strong>
      <div class="flag-badges">${summaryFlagBadges(j.flags)}</div>
    </div>
  `;

  renderFlags(j.flags || []);
}

function summaryFlagBadges(flags) {
  if (!flags || !flags.length) return '<span class="muted">—</span>';
  const bot = flags.find((f) => f.key === "bot");
  const g = flags.find((f) => f.key === "guardian");
  const parts = [];
  if (bot != null) {
    const on = Number(bot.enabled) === 1;
    parts.push(
      `<span class="badge ${on ? "on" : "off"}">Bot: ${on ? "bật" : "tắt"}</span>`
    );
  }
  if (g != null) {
    const on = Number(g.enabled) === 1;
    parts.push(
      `<span class="badge ${on ? "on" : "off"}">Shield Guardian: ${on ? "bật" : "tắt"}</span>`
    );
  }
  return parts.length ? parts.join("") : '<span class="muted">—</span>';
}

async function loadStatus() {
  try {
    const j = await fetchJSON("/api/status/");
    renderStatus(j);
  } catch (e) {
    const grid = document.getElementById("status-grid");
    if (grid) {
      grid.innerHTML = `<div class="status-card"><div class="val err">${escapeHtml(
        e.message
      )}</div></div>`;
    }
  }
}

let cachedGroupItems = [];
let showEnabledOnlyGroups = false;
const VIOLATION_TYPES = [
  "URL_BLACKLIST",
  "KEYWORD_SPAM",
  "REPEAT_SPAM",
  "EMOJI_SPAM",
  "STICKER_SPAM",
  "MESSAGE_RECALLED_SELF",
  "MESSAGE_DELETED_BY_ADMIN",
];
const VIOLATION_LABELS = {
  URL_BLACKLIST: "URL_BLACKLIST (link/url cấm)",
  KEYWORD_SPAM: "KEYWORD_SPAM (từ khóa cấm)",
  REPEAT_SPAM: "REPEAT_SPAM (lặp tin)",
  EMOJI_SPAM: "EMOJI_SPAM",
  STICKER_SPAM: "STICKER_SPAM",
  MESSAGE_RECALLED_SELF: "MESSAGE_RECALLED_SELF (tự thu hồi)",
  MESSAGE_DELETED_BY_ADMIN: "MESSAGE_DELETED_BY_ADMIN (admin xóa)",
};

function formatLookupTs(ts) {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function renderLookupGroupOptions() {
  const sel = document.getElementById("uid-lookup-group");
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Tất cả nhóm</option>';
  const items = sortGroupsGuardianFirst(cachedGroupItems);
  for (const g of items) {
    const op = document.createElement("option");
    op.value = String(g.group_id || "");
    op.textContent = `${String(g.name || "(Không tên)")} (${String(g.group_id || "")})`;
    sel.appendChild(op);
  }
  if ([...sel.options].some((o) => o.value === current)) {
    sel.value = current;
  }
}

function setUidLookupMsg(text, err) {
  const el = document.getElementById("uid-lookup-msg");
  if (!el) return;
  el.hidden = !text;
  el.textContent = text || "";
  el.classList.toggle("err", !!err);
}

function renderUidLookupRows(items) {
  const tbody = document.getElementById("uid-lookup-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!items || !items.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty muted">Không tìm thấy kết quả</td></tr>';
    return;
  }
  for (const it of items) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(it.display_name || "")}</td>
      <td><code>${escapeHtml(it.user_id || "")}</code></td>
      <td>${escapeHtml(it.group_label || it.group_id || "")}</td>
      <td>${escapeHtml(String(it.hits ?? 0))}</td>
      <td>${escapeHtml(formatLookupTs(it.last_ts))}</td>
    `;
    tbody.appendChild(tr);
  }
}

function filterGroupsBySearch(items, q) {
  const s = String(q || "").trim().toLowerCase();
  let out = items;
  if (showEnabledOnlyGroups) {
    out = out.filter((g) => Number(g.enabled) === 1);
  }
  if (!s) return out;
  return out.filter((g) => {
    const name = String(g.name || "").toLowerCase();
    const id = String(g.group_id);
    return name.includes(s) || id.includes(s);
  });
}

/** Shield bật (enabled) lên trên, rồi tên nhóm, rồi group_id */
function sortGroupsGuardianFirst(items) {
  return [...items].sort((a, b) => {
    const ea = Number(a.enabled) === 1 ? 1 : 0;
    const eb = Number(b.enabled) === 1 ? 1 : 0;
    if (eb !== ea) return eb - ea;
    const na = String(a.name || "").toLowerCase();
    const nb = String(b.name || "").toLowerCase();
    const c = na.localeCompare(nb, "vi");
    if (c !== 0) return c;
    return String(a.group_id).localeCompare(String(b.group_id));
  });
}

function applyGroupFilter() {
  const root = document.getElementById("groups-list");
  if (!root) return;
  const q = document.getElementById("group-search")?.value ?? "";
  const filtered = sortGroupsGuardianFirst(
    filterGroupsBySearch(cachedGroupItems, q)
  );
  renderGroupCards(filtered);
}

function renderGroupCards(items) {
  const root = document.getElementById("groups-list");
  if (!root) return;
  root.innerHTML = "";
  if (cachedGroupItems.length === 0) {
    root.innerHTML =
      '<div class="empty">Chưa có nhóm. Bấm <strong>Đồng bộ</strong> phía trên.</div>';
    return;
  }
  if (items.length === 0) {
    root.innerHTML =
      '<div class="empty">Không có nhóm khớp ô tìm kiếm.</div>';
    return;
  }
  for (const g of items) {
    const on = Number(g.enabled) === 1;
    const id = String(g.group_id);
    const row = document.createElement("div");
    row.className = "group-card";
    let adminLines = "";
    try {
      const arr = JSON.parse(g.admin_ids || "[]");
      adminLines = Array.isArray(arr) ? arr.join("\n") : "";
    } catch {
      adminLines = "";
    }
    const rules = g.violation_rules && typeof g.violation_rules === "object"
      ? g.violation_rules
      : {};
    const togglesHtml = VIOLATION_TYPES.map((t) => {
      const onRule = rules[t] !== false;
      return `<label class="vio-rule-item">
          <input type="checkbox" class="vio-rule-toggle" data-type="${escapeHtml(t)}" ${onRule ? "checked" : ""} />
          <span>${escapeHtml(VIOLATION_LABELS[t] || t)}</span>
        </label>`;
    }).join("");
    row.innerHTML = `
        <div class="group-card-top">
          <div class="group-meta">
            <div class="group-title-row">
              <strong>${escapeHtml(g.name || "(Không tên)")}</strong>
              <button type="button" class="btn-mini leave leave-group-btn" data-gid="${escapeHtml(id)}" title="Rời nhóm Zalo và gỡ khỏi danh sách">Thoát nhóm</button>
            </div>
            <code>${escapeHtml(id)}</code>
          </div>
          <div class="toggle-wrap">
            <input type="checkbox" class="switch" ${on ? "checked" : ""} aria-label="Guardian ${escapeHtml(id)}" data-gid="${escapeHtml(id)}" />
            <label>Shield</label>
          </div>
        </div>
        <details class="group-extra-box">
          <summary class="group-extra-summary">Bật/tắt vi phạm theo room</summary>
          <div class="vio-rules-grid">${togglesHtml}</div>
          <button type="button" class="btn-mini primary save-rules-btn">Lưu rule vi phạm</button>
        </details>
        <details class="group-extra-box">
          <summary class="group-extra-summary">Miễn kiểm spam (admin)</summary>
          <div class="group-admin-edit">
            <label class="admin-edit-label">UID Zalo, một dòng một ID</label>
            <textarea class="admin-ids-input" rows="3" placeholder="Để trống = không ai được miễn" spellcheck="false">${escapeHtml(adminLines)}</textarea>
            <button type="button" class="btn-mini primary save-admins-btn">Lưu admin</button>
          </div>
        </details>
      `;
    const leaveBtn = row.querySelector(".leave-group-btn");
    leaveBtn?.addEventListener("click", async () => {
      if (
        !confirm(
          `Rời nhóm "${g.name || id}" và xóa khỏi danh sách watch?\nKhông hoàn tác.`
        )
      )
        return;
      leaveBtn.disabled = true;
      try {
        await fetchJSON(`/api/groups/leave/${encodeURIComponent(id)}`, {
          method: "POST",
        });
        toast("Đã thoát nhóm.");
        await loadGroups();
      } catch (e) {
        toast(e.message, true);
        leaveBtn.disabled = false;
      }
    });
    const chk = row.querySelector("input.switch");
    chk.addEventListener("change", async () => {
      const gid = chk.getAttribute("data-gid");
      chk.disabled = true;
      try {
        await fetchJSON(`/api/groups/${encodeURIComponent(gid)}/enabled`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: chk.checked }),
        });
        toast("Đã lưu nhóm.");
      } catch (e) {
        toast(e.message, true);
        chk.checked = !chk.checked;
      } finally {
        chk.disabled = false;
      }
    });
    const saveAdmins = row.querySelector(".save-admins-btn");
    const ta = row.querySelector(".admin-ids-input");
    saveAdmins?.addEventListener("click", async () => {
      const lines = String(ta?.value || "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      saveAdmins.disabled = true;
      try {
        await fetchJSON(`/api/groups/${encodeURIComponent(id)}/admins`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminIds: lines }),
        });
        toast("Đã lưu danh sách admin miễn trừ.");
        await loadGroups();
      } catch (e) {
        toast(e.message, true);
      } finally {
        saveAdmins.disabled = false;
      }
    });
    const saveRules = row.querySelector(".save-rules-btn");
    saveRules?.addEventListener("click", async () => {
      const ruleInputs = [...row.querySelectorAll(".vio-rule-toggle")];
      const bodyRules = {};
      for (const inp of ruleInputs) {
        bodyRules[inp.getAttribute("data-type")] = !!inp.checked;
      }
      saveRules.disabled = true;
      try {
        await fetchJSON(`/api/groups/${encodeURIComponent(id)}/rules`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rules: bodyRules }),
        });
        toast("Đã lưu rule vi phạm.");
        await loadGroups();
      } catch (e) {
        toast(e.message, true);
      } finally {
        saveRules.disabled = false;
      }
    });
    root.appendChild(row);
  }
}

async function loadGroups() {
  const root = document.getElementById("groups-list");
  if (!root) return;
  try {
    const j = await fetchJSON("/api/groups/");
    cachedGroupItems = j.items || [];
    renderLookupGroupOptions();
    applyGroupFilter();
  } catch (e) {
    cachedGroupItems = [];
    root.innerHTML = `<div class="empty">${escapeHtml(e.message)}</div>`;
  }
}

function setSyncMsg(text, err) {
  const el = document.getElementById("groups-sync-msg");
  el.hidden = !text;
  el.textContent = text || "";
  el.classList.toggle("err", !!err);
}

document.getElementById("sync-admin")?.addEventListener("click", async () => {
  const btn = document.getElementById("sync-admin");
  btn.disabled = true;
  try {
    const j = await fetchJSON("/api/groups/sync?mode=admin", { method: "POST" });
    setSyncMsg(`Đồng bộ (Admin): đã nhập/cập nhật ${j.count || 0} nhóm.`);
    toast(`Đồng bộ admin · ${j.count || 0} nhóm`);
    await loadGroups();
  } catch (e) {
    setSyncMsg(e.message, true);
    toast(e.message, true);
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("group-search")?.addEventListener("input", () => {
  applyGroupFilter();
});

document.getElementById("toggle-enabled-only-groups")?.addEventListener("click", () => {
  showEnabledOnlyGroups = !showEnabledOnlyGroups;
  const btn = document.getElementById("toggle-enabled-only-groups");
  if (btn) {
    btn.textContent = showEnabledOnlyGroups ? "Hiện tất cả nhóm" : "Ẩn nhóm tắt Shield";
  }
  applyGroupFilter();
});

document.getElementById("disable-all-groups")?.addEventListener("click", async () => {
  if (
    !confirm(
      "Tắt Shield Guardian cho toàn bộ nhóm trong danh sách? (Không rời nhóm Zalo)"
    )
  )
    return;
  const btn = document.getElementById("disable-all-groups");
  btn.disabled = true;
  try {
    const j = await fetchJSON("/api/groups/bulk/disable-shield", {
      method: "POST",
    });
    toast(`Đã tắt Shield · ${j.updated ?? 0} nhóm`);
    await loadGroups();
  } catch (e) {
    toast(e.message, true);
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("uid-lookup-form")?.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const q = String(document.getElementById("uid-lookup-q")?.value || "").trim();
  const groupId = String(document.getElementById("uid-lookup-group")?.value || "").trim();
  if (q.length < 2) {
    setUidLookupMsg("Vui lòng nhập ít nhất 2 ký tự.", true);
    return;
  }
  const btn = ev.target.querySelector("button[type='submit']");
  if (btn) btn.disabled = true;
  try {
    const url = `/api/groups/lookup-users?q=${encodeURIComponent(q)}${
      groupId ? `&groupId=${encodeURIComponent(groupId)}` : ""
    }`;
    const j = await fetchJSON(url);
    renderUidLookupRows(j.items || []);
    setUidLookupMsg(`Tìm thấy ${j.items?.length || 0} kết quả.`);
  } catch (e) {
    setUidLookupMsg(e.message, true);
  } finally {
    if (btn) btn.disabled = false;
  }
});

async function loadSpamLists() {
  try {
    const j = await fetchJSON("/api/spam-rules/");
    renderRuleTable("allow-tbody", j.allow || [], "allow");
    renderRuleTable("block-tbody", j.block || [], "block");
    const msg = document.getElementById("spam-sync-msg");
    if (msg) {
      const sync = j.sync || { configOnly: 0, dbOnly: 0 };
      const same = Number(sync.configOnly) === 0 && Number(sync.dbOnly) === 0;
      msg.hidden = false;
      msg.classList.toggle("err", !same);
      const fmt = (label, arr) => {
        if (!arr || !arr.length) return "";
        const lines = arr
          .slice(0, 8)
          .map(
            (x) =>
              `${x.listType}/${x.kind}: ${String(x.pattern).slice(0, 120)}`
          )
          .join("; ");
        const more =
          arr.length > 8 ? ` … (+${arr.length - 8} mục)` : "";
        return `${label}: ${lines}${more}`;
      };
      const detail =
        (!same &&
          (sync.configOnlySamples?.length || sync.dbOnlySamples?.length)) ?
          `\n${fmt("Chỉ có trong config", sync.configOnlySamples)}\n${fmt(
            "Chỉ có trong DB",
            sync.dbOnlySamples
          )}`.trim()
          : "";
      msg.textContent = same
        ? "config.json và DB đang đồng bộ."
        : `Lệch dữ liệu: config-only ${sync.configOnly}, db-only ${sync.dbOnly}.${detail ? "\n" + detail : ""}`;
    }
  } catch (e) {
    const ac = document.getElementById("allow-list-count");
    const bc = document.getElementById("block-list-count");
    if (ac) ac.textContent = "—";
    if (bc) bc.textContent = "—";
    const a = document.getElementById("allow-tbody");
    const b = document.getElementById("block-tbody");
    const msg = document.getElementById("spam-sync-msg");
    if (msg) {
      msg.hidden = false;
      msg.classList.add("err");
      msg.textContent = e.message;
    }
    if (a)
      a.innerHTML = `<tr><td colspan="3" class="empty">${escapeHtml(
        e.message
      )}</td></tr>`;
    if (b) b.innerHTML = "";
  }
}

const KIND_OPTIONS_ALLOW = [
  { v: "host", l: "Host (domain)" },
  { v: "substring", l: "Chuỗi trong tin" },
];
const KIND_OPTIONS_BLOCK = [
  { v: "substring", l: "Keyword blacklist" },
  { v: "regex", l: "URL/Link regex blacklist" },
];

function renderRuleTable(tbodyId, rows, listKey) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const countId = listKey === "allow" ? "allow-list-count" : "block-list-count";
  const countEl = document.getElementById(countId);
  if (countEl) {
    countEl.textContent =
      rows.length === 0 ? "0 mục" : `${rows.length} mục`;
  }
  tbody.innerHTML = "";
  const opts = listKey === "allow" ? KIND_OPTIONS_ALLOW : KIND_OPTIONS_BLOCK;
  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="3" class="empty muted">Trống</td>`;
    tbody.appendChild(tr);
    return;
  }
  for (const r of rows) {
    const tr = document.createElement("tr");
    const sel = document.createElement("select");
    sel.className = "rule-kind-select";
    sel.setAttribute("aria-label", "Loại rule");
    for (const o of opts) {
      const op = document.createElement("option");
      op.value = o.v;
      op.textContent = o.l;
      if (o.v === r.kind) op.selected = true;
      sel.appendChild(op);
    }
    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "rule-pattern-input";
    inp.value = r.pattern;
    inp.maxLength = 800;
    inp.autocomplete = "off";
    inp.setAttribute("aria-label", "Giá trị pattern");

    const td1 = document.createElement("td");
    td1.appendChild(sel);
    const td2 = document.createElement("td");
    td2.appendChild(inp);
    const td3 = document.createElement("td");
    td3.className = "rule-actions";

    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.className = "btn-mini primary";
    btnSave.textContent = "Lưu";
    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "btn-mini";
    btnDel.textContent = "Xóa";

    const rid = Number(r.id);
    btnSave.addEventListener("click", async () => {
      btnSave.disabled = true;
      btnDel.disabled = true;
      try {
        await fetchJSON(`/api/spam-rules/${rid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pattern: inp.value.trim(),
            kind: sel.value,
          }),
        });
        toast("Đã lưu rule.");
        await loadSpamLists();
      } catch (e) {
        toast(e.message, true);
      } finally {
        btnSave.disabled = false;
        btnDel.disabled = false;
      }
    });
    btnDel.addEventListener("click", async () => {
      if (!confirm("Xóa mục whitelist/blacklist này?")) return;
      btnDel.disabled = true;
      btnSave.disabled = true;
      try {
        await fetchJSON(`/api/spam-rules/${rid}`, { method: "DELETE" });
        toast("Đã xóa.");
        await loadSpamLists();
      } catch (e) {
        toast(e.message, true);
        btnDel.disabled = false;
        btnSave.disabled = false;
      }
    });

    td3.append(btnSave, btnDel);
    tr.append(td1, td2, td3);
    tbody.appendChild(tr);
  }
}

document.getElementById("allow-form")?.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const pattern = String(fd.get("pattern") || "").trim();
  const kind = String(fd.get("kind") || "host");
  try {
    await fetchJSON("/api/spam-rules/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listType: "allow", pattern, kind }),
    });
    toast("Đã thêm whitelist.");
    ev.target.reset();
    await loadSpamLists();
  } catch (e) {
    toast(e.message, true);
  }
});

document.getElementById("block-form")?.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const pattern = String(fd.get("pattern") || "").trim();
  const kind = String(fd.get("kind") || "substring");
  try {
    await fetchJSON("/api/spam-rules/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listType: "block", pattern, kind }),
    });
    toast("Đã thêm blacklist.");
    ev.target.reset();
    await loadSpamLists();
  } catch (e) {
    toast(e.message, true);
  }
});

document.getElementById("sync-config-to-db")?.addEventListener("click", async () => {
  const btn = document.getElementById("sync-config-to-db");
  if (btn) btn.disabled = true;
  try {
    const j = await fetchJSON("/api/spam-rules/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "config_to_db" }),
    });
    toast(`Đã nạp config vào DB (${j.inserted || 0} mục mới).`);
    await loadSpamLists();
  } catch (e) {
    toast(e.message, true);
  } finally {
    if (btn) btn.disabled = false;
  }
});

document.getElementById("sync-db-to-config")?.addEventListener("click", async () => {
  const btn = document.getElementById("sync-db-to-config");
  if (btn) btn.disabled = true;
  try {
    const j = await fetchJSON("/api/spam-rules/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "db_to_config" }),
    });
    const w = j.written || {};
    toast(
      `Đã ghi config.json (hosts ${w.linkAllowHosts || 0}, allow-text ${w.allowTextSubstrings || 0}, url-regex ${w.urlPatterns || 0}, keyword ${w.keywordPatterns || 0}).`
    );
    await loadSpamLists();
  } catch (e) {
    toast(e.message, true);
  } finally {
    if (btn) btn.disabled = false;
  }
});

async function loadViolations() {
  const root = document.getElementById("viol-groups");
  if (!root) return;
  try {
    const j = await fetchJSON("/api/violations/");
    const items = j.items || [];
    root.innerHTML = "";
    if (!items.length) {
      root.innerHTML = `<div class="empty muted">Không có bản ghi</div>`;
      return;
    }
    const byGid = new Map();
    for (const v of items) {
      const gid = String(v.group_id);
      const label = String(v.group_label || gid).trim();
      if (!byGid.has(gid)) byGid.set(gid, { label, rows: [] });
      byGid.get(gid).rows.push(v);
    }
    for (const [gid, grp] of byGid) {
      const details = document.createElement("details");
      details.className = "viol-group";
      details.open = false;
      details.innerHTML = `
        <summary>
          <span class="viol-group-title">${escapeHtml(grp.label)}</span>
          <code class="subtle">${escapeHtml(gid)}</code>
          <span class="viol-count">${grp.rows.length} vi phạm</span>
        </summary>
        <div class="viol-group-body table-wrap"></div>`;
      const wrap = details.querySelector(".viol-group-body");
      wrap.innerHTML = `
        <table class="vio-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người gửi</th>
              <th>Loại</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>`;
      const tbody = wrap.querySelector("tbody");
      for (const v of grp.rows) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(v.ts)}</td>
          <td>${escapeHtml(v.display_name || v.user_id || "")}</td>
          <td>${escapeHtml(v.type)}</td>
          <td>${escapeHtml(v.detail)}</td>`;
        tbody.appendChild(tr);
      }
      root.appendChild(details);
    }
  } catch (e) {
    root.innerHTML = `<div class="empty err">${escapeHtml(e.message)}</div>`;
  }
}

async function loadAll() {
  await Promise.all([
    loadStatus(),
    loadGroups(),
    loadViolations(),
    loadSpamLists(),
  ]);
}

function connectWS() {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  const pill = document.getElementById("ws-pill");
  const ws = new WebSocket(`${proto}//${location.host}`);
  ws.onopen = () => {
    pill.textContent = "Realtime";
    pill.classList.add("on");
  };
  ws.onmessage = () => {
    loadAll();
  };
  ws.onclose = () => {
    pill.textContent = "Offline";
    pill.classList.remove("on");
    setTimeout(connectWS, 3000);
  };
}

loadAll();
connectWS();
setInterval(loadAll, 20000);
