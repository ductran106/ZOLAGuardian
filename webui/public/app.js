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
  if (!el) return;
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

let zaloQrPollTimer = null;

function updateZaloAuthFromStatus(j) {
  const hintEl = document.getElementById("zalo-auth-hint");
  const startBtn = document.getElementById("zalo-qr-start");
  const abortBtn = document.getElementById("zalo-qr-abort");
  const logoutBtn = document.getElementById("zalo-logout");
  if (!hintEl || !startBtn || !abortBtn || !logoutBtn) return;

  const a = j.zaloAuth || {};
  const connected = !!j.zaloConnected;
  const polling = zaloQrPollTimer != null;

  let hint = "";
  if (a.skipZalo) {
    hint =
      "Đang bỏ qua Zalo (ZALO_GUARDIAN_SKIP_ZALO=1). Để dùng đăng nhập QR: tắt biến này, cấu hình zcaPath + đường dẫn file credentials, khởi động lại.";
  } else if (!a.zcaPathConfigured) {
    hint = "Chưa cấu hình zcaPath (file dist/index.js của zca-js).";
  } else if (!a.zcaModuleExists) {
    hint =
      "Không tìm thấy file zca-js tại zcaPath — kiểm tra đường dẫn hoặc chạy npm install zca-js trong thư mục dự án.";
  } else if (!a.credentialsPathConfigured) {
    hint =
      "Chưa cấu hình đường dẫn credentials (ZALO_CREDENTIALS_PATH / config.json).";
  } else if (connected) {
    hint =
      "Đã kết nối Zalo. Log out: sao lưu credentials (.bak), xóa file đăng nhập, dừng tiến trình — restart node index.js (hoặc systemd) để hoàn tất.";
  } else {
    hint =
      "Chưa kết nối Zalo. Quét QR để tạo file credentials; sau khi thành công, restart tiến trình để bot bắt tin.";
  }
  hintEl.textContent = hint;

  logoutBtn.hidden = !connected;
  /** Luôn hiện nút QR khi chưa kết nối — chỉ disable khi môi trường chưa cho phép (vd. SKIP_ZALO). */
  startBtn.hidden = connected;
  const canQr = !!a.qrLoginAvailable && !connected && !polling;
  startBtn.disabled = !canQr;
  let qrTitle = "";
  if (connected) qrTitle = "";
  else if (polling) qrTitle = "Đang chờ quét mã QR…";
  else if (a.skipZalo) {
    qrTitle =
      "Đang bỏ qua Zalo (SKIP=1). Tắt ZALO_GUARDIAN_SKIP_ZALO trong script/khởi chạy, restart tiến trình, rồi bấm lại.";
  } else if (!a.zcaPathConfigured) {
    qrTitle = "Cấu hình zcaPath trỏ tới zca-js dist/index.js.";
  } else if (!a.zcaModuleExists) {
    qrTitle = "Không thấy file zca-js — npm install zca-js hoặc sửa zcaPath.";
  } else if (!a.credentialsPathConfigured) {
    qrTitle = "Cấu hình đường dẫn file credentials (config / ZALO_CREDENTIALS_PATH).";
  } else {
    qrTitle = "Mở phiên đăng nhập bằng QR (điện thoại quét).";
  }
  startBtn.title = qrTitle;
  abortBtn.hidden = !polling;
}

function stopZaloQrPoll() {
  if (zaloQrPollTimer) {
    clearInterval(zaloQrPollTimer);
    zaloQrPollTimer = null;
  }
}

function applyQrPollPayload(j) {
  const q = j.qr || {};
  const wrap = document.getElementById("zalo-qr-wrap");
  const img = document.getElementById("zalo-qr-img");
  const st = document.getElementById("zalo-qr-status");
  const restartMsg = document.getElementById("zalo-restart-msg");
  const abortBtn = document.getElementById("zalo-qr-abort");
  const startBtn = document.getElementById("zalo-qr-start");
  const phase = q.phase || "idle";
  const busy = !!q.busy;

  if (wrap && img && q.imageDataUrl) {
    wrap.hidden = false;
    img.src = q.imageDataUrl;
  }
  const lines = {
    starting: "Đang lấy mã QR…",
    await_scan: "Quét mã QR bằng Zalo trên điện thoại.",
    await_confirm:
      (q.scannedName ? "Tài khoản: " + q.scannedName + ". " : "") +
      "Xác nhận đăng nhập trên điện thoại.",
    writing: "Đang lưu file đăng nhập…",
    done: "Đã lưu credentials.",
    expired: "Mã QR hết hạn — đang chờ mã mới hoặc thử lại.",
    declined: "Đã từ chối trên điện thoại.",
    aborted: "Đã hủy.",
    error: q.error ? "Lỗi: " + q.error : "Lỗi không xác định.",
  };
  if (st) st.textContent = lines[phase] || phase;

  const terminalDone =
    phase === "done" && q.credentialsWritten && !busy;
  const terminalFail =
    ["error", "aborted", "declined"].includes(phase) && !busy;

  if (terminalDone || terminalFail) {
    stopZaloQrPoll();
    if (abortBtn) abortBtn.hidden = true;
    if (startBtn) startBtn.disabled = false;
    if (wrap) wrap.hidden = true;
    if (phase === "done" && restartMsg) {
      restartMsg.hidden = false;
      restartMsg.textContent =
        "Đã lưu credentials. Restart tiến trình (node index.js hoặc systemd) để kết nối Zalo và bật listener.";
    } else if (restartMsg) restartMsg.hidden = true;
    if (phase === "done") toast("Đăng nhập QR thành công. Restart tiến trình.");
    else if (phase === "error") toast(lines.error || phase, true);
    else if (phase === "aborted") toast("Đã hủy QR.");
    else if (phase === "declined") toast("Đã từ chối trên điện thoại.", true);
    loadStatus().catch(() => {});
  }
}

function startZaloQrPoll() {
  stopZaloQrPoll();
  const tick = () => {
    fetch("/api/zalo/qr-state", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => {
        if (!j || j.ok === false) return;
        applyQrPollPayload(j);
      })
      .catch(() => {});
  };
  tick();
  zaloQrPollTimer = setInterval(tick, 1500);
}

async function onZaloQrStartClick() {
  try {
    const res = await fetch("/api/zalo/qr-start", {
      method: "POST",
      credentials: "same-origin",
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || String(res.status));
    const restartMsg = document.getElementById("zalo-restart-msg");
    if (restartMsg) restartMsg.hidden = true;
    const ab = document.getElementById("zalo-qr-abort");
    if (ab) ab.hidden = false;
    const st = document.getElementById("zalo-qr-start");
    if (st) st.disabled = true;
    startZaloQrPoll();
  } catch (e) {
    toast(e.message, true);
  }
}

async function onZaloQrAbortClick() {
  try {
    await fetchJSON("/api/zalo/qr-abort", { method: "POST" });
  } catch (e) {
    toast(e.message, true);
  }
  stopZaloQrPoll();
  const wrap = document.getElementById("zalo-qr-wrap");
  if (wrap) wrap.hidden = true;
  const ab = document.getElementById("zalo-qr-abort");
  if (ab) ab.hidden = true;
  loadStatus().catch(() => {});
}

async function onZaloLogoutClick() {
  if (
    !confirm(
      "Log out Zalo: sao lưu credentials (.bak), xóa file đăng nhập, dừng tiến trình. Anh restart service/node sau. Tiếp tục?"
    )
  )
    return;
  try {
    await fetchJSON("/api/zalo/logout", { method: "POST" });
    toast("Đã đăng xuất — tiến trình sẽ dừng. Restart khi cần.");
  } catch (e) {
    toast(e.message, true);
  }
}

function wireZaloAuthButtons() {
  document
    .getElementById("zalo-qr-start")
    ?.addEventListener("click", onZaloQrStartClick);
  document
    .getElementById("zalo-qr-abort")
    ?.addEventListener("click", onZaloQrAbortClick);
  document
    .getElementById("zalo-logout")
    ?.addEventListener("click", onZaloLogoutClick);
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
  updateZaloAuthFromStatus(j);
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
/** Mặc định true: chỉ hiện nhóm Shield bật — UI gọn; bấm nút để xem tất cả. */
let showEnabledOnlyGroups = true;
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

/** Thời điểm tin mới nhất trong DB cho panel DOCX */
function formatDocxLastMsg(ts) {
  if (ts == null || ts === "") return "Chưa có tin trong DB";
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return "Chưa có tin trong DB";
  return formatLookupTs(n);
}

/** Cùng dòng với tên nhóm — gọn khi chưa có tin */
function formatDocxLastMsgInline(ts) {
  if (ts == null || ts === "") return "—";
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return formatLookupTs(n);
}

async function refreshDocxWatchedPanel() {
  const panel = document.getElementById("export-docx-watched-panel");
  if (!panel) return;
  panel.innerHTML = '<p class="muted">Đang tải…</p>';
  try {
    const j = await fetchJSON("/api/export/docx-tracked-snapshot");
    const items = Array.isArray(j.items) ? j.items : [];
    if (items.length === 0) {
      panel.innerHTML =
        '<p class="docx-watched-title">Theo dõi xuất DOCX</p><p class="docx-watched-empty">Chưa có nhóm trong danh sách. Chọn nhóm ở ô trên rồi bấm «Thêm nhóm…».</p>';
      return;
    }
    panel.innerHTML = "";
    const title = document.createElement("p");
    title.className = "docx-watched-title";
    title.textContent =
      "Theo dõi xuất DOCX — bấm dòng để chọn nhóm xuất; cột phải = tin mới nhất trong DB (cache listener)";
    panel.appendChild(title);
    for (const it of items) {
      const gid = String(it.group_id || "");
      const row = document.createElement("div");
      row.className = "docx-watched-row";

      const main = document.createElement("button");
      main.type = "button";
      main.className = "docx-watched-row-main docx-watched-row-main-inline";
      const nameEl = document.createElement("span");
      nameEl.className = "docx-watched-name";
      nameEl.textContent = `${String(it.name || "(Không tên)")} · ${gid}`;
      const tsEl = document.createElement("span");
      tsEl.className = "docx-watched-ts";
      tsEl.textContent = formatDocxLastMsgInline(it.last_message_ts);
      tsEl.title =
        formatDocxLastMsg(it.last_message_ts) === "Chưa có tin trong DB"
          ? "Chưa có tin trong DB (listener chưa ghi msg_id cho nhóm này)"
          : "Thời điểm tin mới nhất đã lưu trong DB (Asia/Ho_Chi_Minh theo trình duyệt)";
      main.append(nameEl, tsEl);
      main.addEventListener("click", () => {
        const sel = document.getElementById("export-docx-group");
        if (!sel) return;
        if ([...sel.options].some((o) => o.value === gid)) {
          sel.value = gid;
          toast("Đã chọn nhóm xuất DOCX.");
        } else {
          toast(
            "Nhóm này chưa có trong dropdown — đồng bộ nhóm hoặc thêm group_id vào watch_groups.",
            true
          );
        }
      });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn secondary docx-watched-remove";
      removeBtn.textContent = "Xóa";
      removeBtn.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        try {
          await fetchJSON("/api/export/docx-tracked", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ group_id: gid, remove: true }),
          });
          toast("Đã gỡ nhóm khỏi theo dõi xuất DOCX.");
          await refreshDocxWatchedPanel();
        } catch (e) {
          toast(e.message, true);
        }
      });

      row.append(main, removeBtn);
      panel.appendChild(row);
    }
  } catch (e) {
    panel.innerHTML = `<p class="docx-watched-empty">${escapeHtml(
      e.message
    )}</p>`;
  }
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

function renderScoreGroupOptions() {
  const sel = document.getElementById("score-group");
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Tất cả group</option>';
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

function renderExportDocxGroupOptions() {
  const sel = document.getElementById("export-docx-group");
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">— Chọn nhóm —</option>';
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
    const qs = String(document.getElementById("group-search")?.value ?? "").trim();
    let msg =
      "Không có nhóm khớp ô tìm kiếm.";
    if (
      !qs &&
      showEnabledOnlyGroups &&
      cachedGroupItems.some((g) => Number(g.enabled) !== 1)
    ) {
      msg =
        'Đang ẩn nhóm tắt Shield. Bấm <strong>Hiện tất cả nhóm</strong> để xem đầy đủ.';
    }
    root.innerHTML = `<div class="empty">${msg}</div>`;
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
    const wmode = String(g.watchdog_quiet_mode || "inherit").toLowerCase();
    const wstart = normalizeTimeInputValue(g.watchdog_quiet_start || "23:00");
    const wend = normalizeTimeInputValue(g.watchdog_quiet_end || "05:00");
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
          <summary class="group-extra-summary">Giờ nghỉ watchdog (GMT+7)</summary>
          <p class="hint muted small watchdog-quiet-hint">
            Khung im lặng cho riêng nhóm này. «Không nghỉ» = nhóm luôn được tính là cần có tin — watchdog không bị tắt chỉ vì nhóm này đêm khuya.
          </p>
          <div class="watchdog-quiet-row">
            <label class="watchdog-quiet-label">Chế độ
              <select class="watchdog-quiet-mode">
                <option value="inherit">Giống mặc định (config)</option>
                <option value="custom">Tùy chỉnh</option>
                <option value="off">Không nghỉ (luôn kiểm tra)</option>
              </select>
            </label>
            <span class="watchdog-quiet-custom-wrap">
              <label>Từ <input type="time" class="watchdog-quiet-start" step="60" value="${escapeHtml(wstart)}" /></label>
              <label>Đến <input type="time" class="watchdog-quiet-end" step="60" value="${escapeHtml(wend)}" /></label>
            </span>
            <button type="button" class="btn-mini primary save-watchdog-quiet-btn">Lưu</button>
          </div>
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
    const modeSel = row.querySelector(".watchdog-quiet-mode");
    const customWrap = row.querySelector(".watchdog-quiet-custom-wrap");
    const startInp = row.querySelector(".watchdog-quiet-start");
    const endInp = row.querySelector(".watchdog-quiet-end");
    if (modeSel) {
      modeSel.value = ["inherit", "custom", "off"].includes(wmode)
        ? wmode
        : "inherit";
      const syncCustom = () => {
        const on = modeSel.value === "custom";
        if (customWrap) customWrap.hidden = !on;
        if (startInp) startInp.disabled = !on;
        if (endInp) endInp.disabled = !on;
      };
      syncCustom();
      modeSel.addEventListener("change", syncCustom);
    }
    const saveWd = row.querySelector(".save-watchdog-quiet-btn");
    saveWd?.addEventListener("click", async () => {
      const mode = String(modeSel?.value || "inherit");
      const body = { mode };
      if (mode === "custom") {
        body.watchdogQuietStart = normalizeTimeInputValue(startInp?.value);
        body.watchdogQuietEnd = normalizeTimeInputValue(endInp?.value);
      }
      saveWd.disabled = true;
      try {
        await fetchJSON(
          `/api/groups/${encodeURIComponent(id)}/watchdog-quiet`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        toast("Đã lưu giờ nghỉ watchdog nhóm.");
        await loadGroups();
      } catch (e) {
        toast(e.message, true);
      } finally {
        saveWd.disabled = false;
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

function normalizeTimeInputValue(s) {
  const t = String(s ?? "").trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return "23:00";
  const hh = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

async function loadWatchdogDefaults() {
  const st = document.getElementById("watchdog-default-start");
  const en = document.getElementById("watchdog-default-end");
  if (!st || !en) return;
  try {
    const j = await fetchJSON("/api/settings/watchdog-quiet");
    st.value = normalizeTimeInputValue(j.watchdogQuietStart);
    en.value = normalizeTimeInputValue(j.watchdogQuietEnd);
  } catch {
    st.value = "23:00";
    en.value = "05:00";
  }
}

async function loadGroups() {
  const root = document.getElementById("groups-list");
  if (!root) return;
  try {
    const j = await fetchJSON("/api/groups/");
    cachedGroupItems = j.items || [];
    renderLookupGroupOptions();
    renderScoreGroupOptions();
    renderExportDocxGroupOptions();
    void refreshDocxWatchedPanel();
    applyGroupFilter();
  } catch (e) {
    cachedGroupItems = [];
    root.innerHTML = `<div class="empty">${escapeHtml(e.message)}</div>`;
    void refreshDocxWatchedPanel();
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

// ── System Health (Phase 1) ─────────────────────────────────────────────
function formatBytes(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return "—";
  if (v < 1024) return `${v} B`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
  if (v < 1024 * 1024 * 1024) return `${(v / 1024 / 1024).toFixed(1)} MB`;
  return `${(v / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDuration(sec) {
  const s = Number(sec);
  if (!Number.isFinite(s) || s < 0) return "—";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

function formatTsMaybe(ts) {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return formatLookupTs(n);
}

function healthRow(label, value, status) {
  const cls = status ? ` row-${status}` : "";
  return `<div class="health-row${cls}"><span class="health-label">${escapeHtml(
    label
  )}</span><span class="health-val">${value}</span></div>`;
}

function renderHealth(h, build) {
  const grid = document.getElementById("health-grid");
  if (!grid) return;
  if (!h || h.ok === false) {
    grid.innerHTML = `<div class="health-card err">Lỗi: ${escapeHtml(
      String(h?.error || "Không tải được /api/health/full")
    )}</div>`;
    return;
  }
  const proc = h.process || {};
  const dbH = h.db || {};
  const cfg = h.config || {};
  const zalo = h.zalo || {};
  const wd = (zalo && zalo.watchdog) || {};
  const dbOk = dbH.ok === true;
  const zaloOk = zalo.connected === true;
  const listenerDownStatus = wd.listenerLikelyDown ? "warn" : "ok";

  const buildIdent = build && build.ok !== false
    ? `${escapeHtml(String(build.name || "?"))}@${escapeHtml(
        String(build.version || "?")
      )} <code class="subtle">${escapeHtml(
        String(build.commit ? build.commit.slice(0, 12) : "no-commit")
      )}</code> <span class="muted">[${escapeHtml(String(build.source || "?"))}]</span>${
        build.branch ? ` <span class="muted">${escapeHtml(String(build.branch))}</span>` : ""
      }${
        build.deployedAt
          ? ` <span class="muted">· deployed ${escapeHtml(String(build.deployedAt))}</span>`
          : ""
      }`
    : '<span class="muted">—</span>';

  const processCard = [
    `<h3 class="health-card-title">Process</h3>`,
    healthRow("Host / PID", `${escapeHtml(String(proc.hostname || "—"))} · ${escapeHtml(String(proc.pid || "—"))}`),
    healthRow("Node", escapeHtml(String(proc.node || "—"))),
    healthRow("Uptime", escapeHtml(formatDuration(proc.uptimeSec))),
    healthRow("Started", escapeHtml(String(proc.startedAt || "—"))),
    healthRow(
      "Memory (RSS / heap)",
      `${escapeHtml(formatBytes(proc.memory?.rss))} / ${escapeHtml(
        formatBytes(proc.memory?.heapUsed)
      )}`
    ),
    healthRow("Load avg (1/5/15)", escapeHtml(
      Array.isArray(proc.loadAvg)
        ? proc.loadAvg.map((v) => Number(v).toFixed(2)).join(" · ")
        : "—"
    )),
  ].join("");

  const configCard = [
    `<h3 class="health-card-title">Config</h3>`,
    healthRow("Web UI port", escapeHtml(String(cfg.webuiPort || "—"))),
    healthRow(
      "Skip Zalo",
      cfg.skipZalo
        ? '<span class="badge warn">ON</span>'
        : '<span class="badge ok">off</span>'
    ),
    healthRow(
      "Basic Auth",
      cfg.basicAuthEnabled
        ? '<span class="badge ok">ON</span>'
        : '<span class="badge">off</span>'
    ),
    healthRow(
      "Telegram",
      cfg.hasTelegram
        ? '<span class="badge ok">configured</span>'
        : '<span class="badge">not set</span>'
    ),
    healthRow(
      "Quiet hours",
      `${escapeHtml(String(cfg.watchdogQuietStart || "—"))} → ${escapeHtml(
        String(cfg.watchdogQuietEnd || "—")
      )}`
    ),
    healthRow(
      "Credentials path",
      cfg.credentialsPathConfigured
        ? '<span class="badge ok">set</span>'
        : '<span class="badge warn">missing</span>'
    ),
  ].join("");

  const dbCard = [
    `<h3 class="health-card-title">Database</h3>`,
    healthRow(
      "Connection",
      dbOk
        ? '<span class="badge ok">OK</span>'
        : `<span class="badge err">FAIL</span>${
            dbH.probeError ? ` <code class="subtle">${escapeHtml(String(dbH.probeError))}</code>` : ""
          }`,
      dbOk ? "ok" : "err"
    ),
    healthRow("Messages", escapeHtml(String(dbH.messagesTotal ?? "—"))),
    healthRow("Last message ts", escapeHtml(formatTsMaybe(dbH.lastMessageTs))),
    healthRow(
      "Watch groups (enabled / total)",
      `${escapeHtml(String(dbH.watchGroupsEnabled ?? "—"))} / ${escapeHtml(
        String(dbH.watchGroupsTotal ?? "—")
      )}`
    ),
    healthRow(
      "Violations (24h / total)",
      `${escapeHtml(String(dbH.violationsLast24h ?? "—"))} / ${escapeHtml(
        String(dbH.violationsTotal ?? "—")
      )}`
    ),
  ].join("");

  const zaloCard = [
    `<h3 class="health-card-title">Zalo · Watchdog</h3>`,
    healthRow(
      "Connected",
      zaloOk
        ? '<span class="badge ok">YES</span>'
        : '<span class="badge">no</span>',
      zaloOk ? "ok" : null
    ),
    healthRow("Own ID", escapeHtml(String(zalo.ownId || "—"))),
    healthRow(
      "Listener likely down",
      wd.listenerLikelyDown
        ? '<span class="badge warn">YES</span>'
        : '<span class="badge ok">no</span>',
      listenerDownStatus
    ),
    healthRow(
      "Last any msg",
      escapeHtml(formatTsMaybe(wd.lastAnyMessageAt))
    ),
    healthRow(
      "Last watched msg",
      escapeHtml(formatTsMaybe(wd.lastWatchedMessageAt))
    ),
    healthRow(
      "Last watched group",
      escapeHtml(String(wd.lastWatchedGroupId || "—"))
    ),
    healthRow(
      "Watchdog timer",
      wd.watchdogActive
        ? '<span class="badge ok">active</span>'
        : '<span class="badge">idle</span>'
    ),
    healthRow(
      "Consecutive failures",
      escapeHtml(String(wd.watchdogConsecutiveFailures ?? "—"))
    ),
  ].join("");

  const buildCard = [
    `<h3 class="health-card-title">Build</h3>`,
    healthRow("Identity", buildIdent),
  ].join("");

  grid.innerHTML = [processCard, dbCard, zaloCard, configCard, buildCard]
    .map((html) => `<div class="health-card">${html}</div>`)
    .join("");

  const raw = document.getElementById("health-raw");
  if (raw) raw.textContent = JSON.stringify({ health: h, build }, null, 2);

  const ref = document.getElementById("health-refreshed");
  if (ref) ref.textContent = `Cập nhật: ${formatLookupTs(Date.now())}`;
}

async function loadHealthFull() {
  let h = null;
  let build = null;
  try {
    h = await fetchJSON("/api/health/full");
  } catch (e) {
    h = { ok: false, error: e.message };
  }
  try {
    build = await fetchJSON("/api/runtime/build");
  } catch (e) {
    build = { ok: false, error: e.message };
  }
  renderHealth(h, build);
}

document
  .getElementById("health-refresh-btn")
  ?.addEventListener("click", () => loadHealthFull());

async function loadAll() {
  await Promise.all([
    loadStatus(),
    loadGroups(),
    loadViolations(),
    loadSpamLists(),
    loadWatchdogDefaults(),
    loadHealthFull(),
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

wireZaloAuthButtons();
loadAll();
connectWS();
setInterval(loadAll, 20000);

// ── Tab navigation (Phase 2: scores / jobs) ─────────────────────────────
function showTab(name) {
  document.querySelectorAll(".tab-content").forEach((el) => {
    el.style.display = "none";
  });
  const el = document.getElementById("tab-" + name);
  if (el) el.style.display = "block";
  document.querySelectorAll(".tab-nav .tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === name);
  });
}

async function loadScores() {
  const date = document.getElementById("score-date")?.value || "";
  const group = document.getElementById("score-group")?.value || "";
  let url = "/api/scores?";
  if (date) url += "date=" + encodeURIComponent(date) + "&";
  if (group) url += "group_id=" + encodeURIComponent(group);
  const res = await fetch(url, { credentials: "same-origin" });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.ok === false) {
    toast(j.error || `Lỗi ${res.status}`, true);
    return;
  }
  const data = Array.isArray(j.data) ? j.data : [];
  const tbody = document.getElementById("scores-body");
  if (!tbody) return;
  if (data.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="empty muted">Không có dữ liệu cho ngày / bộ lọc này.</td></tr>';
    return;
  }
  tbody.innerHTML = data
    .map(
      (r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(String(r.display_name ?? ""))}</td>
      <td>${escapeHtml(String(r.jobs_posted ?? ""))}</td>
      <td>${escapeHtml(String(r.jobs_taken ?? ""))}</td>
      <td style="color:var(--ok)">+${escapeHtml(String(r.points_earned ?? ""))}</td>
      <td style="color:var(--danger)">-${escapeHtml(String(r.points_deducted ?? ""))}</td>
      <td style="font-weight:600">${escapeHtml(String(r.net_points ?? ""))}</td>
    </tr>
  `
    )
    .join("");
}

function exportScores() {
  const date = document.getElementById("score-date")?.value || "";
  const group = document.getElementById("score-group")?.value || "";
  let url = "/api/export/scores?";
  if (date) url += "date=" + encodeURIComponent(date) + "&";
  if (group) url += "group_id=" + encodeURIComponent(group);
  window.location.href = url;
}

async function loadJobs() {
  const date = document.getElementById("job-date")?.value || "";
  const status = document.getElementById("job-status")?.value || "";
  let url = "/api/jobs?";
  if (date) url += "date=" + encodeURIComponent(date) + "&";
  if (status) url += "status=" + encodeURIComponent(status);
  const res = await fetch(url, { credentials: "same-origin" });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.ok === false) {
    toast(j.error || `Lỗi ${res.status}`, true);
    return;
  }
  const data = Array.isArray(j.data) ? j.data : [];
  const tbody = document.getElementById("jobs-body");
  if (!tbody) return;
  if (data.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="empty muted">Không có lịch cho ngày / trạng thái này.</td></tr>';
    return;
  }
  tbody.innerHTML = data
    .map((r) => {
      const pts = r.override_points != null ? r.override_points : r.base_points;
      const src =
        r.override_points != null ? "✏️ OVERRIDE" : r.points_source;
      const st = String(r.status || "").toLowerCase();
      const badgeClass =
        r.override_points != null
          ? "badge-override"
          : r.points_source === "EXPLICIT"
            ? "badge-green"
            : "badge-gray";
      return `
      <tr>
        <td>${escapeHtml(String(r.poster_name ?? ""))}</td>
        <td>${escapeHtml(String(r.taker_name || "-"))}</td>
        <td>${escapeHtml(String(r.price ?? ""))}k</td>
        <td>${escapeHtml(String(r.trip_type ?? ""))}</td>
        <td>${escapeHtml(String(pts ?? ""))}đ</td>
        <td><span class="${badgeClass}">${escapeHtml(String(src ?? ""))}</span></td>
        <td><span class="job-status job-status-${st}">${escapeHtml(String(r.status ?? ""))}</span></td>
        <td class="job-override-cell">
          <input type="number" step="0.25" min="0" max="10"
            id="override-${r.id}" value="${escapeHtml(String(pts ?? ""))}" class="override-inp" />
          <input type="text" placeholder="ghi chú"
            id="note-${r.id}" class="override-note" />
          <button type="button" class="btn-mini primary" onclick="overrideJob(${r.id})">✓</button>
        </td>
      </tr>
    `;
    })
    .join("");
}

async function overrideJob(id) {
  const pi = document.getElementById("override-" + id);
  const ni = document.getElementById("note-" + id);
  const points = pi?.value;
  const note = ni?.value ?? "";
  const res = await fetch("/api/jobs/" + id + "/override", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ points: parseFloat(points), note }),
  });
  const data = await res.json().catch(() => ({}));
  if (data.ok) {
    toast("Đã lưu override điểm.");
    await loadJobs();
  } else {
    toast(data.error || "Lỗi override", true);
  }
}

function exportQuoteDocx() {
  const date = document.getElementById("export-docx-date")?.value || "";
  const timeStart = document.getElementById("export-docx-start")?.value || "";
  const timeEnd = document.getElementById("export-docx-end")?.value || "";
  const groupId = document.getElementById("export-docx-group")?.value || "";
  if (!date) {
    toast("Chọn ngày xuất.", true);
    return;
  }
  if (!groupId) {
    toast("Chọn nhóm.", true);
    return;
  }
  const norm = (t) => (t && t.length === 5 ? `${t}:00` : t);
  let url = "/api/export/quote-docx?";
  url += `date=${encodeURIComponent(date)}&`;
  url += `time_start=${encodeURIComponent(norm(timeStart) || "00:00:00")}&`;
  url += `time_end=${encodeURIComponent(norm(timeEnd) || "23:59:59")}&`;
  url += `group_id=${encodeURIComponent(groupId)}`;
  if (document.getElementById("export-docx-atall-admin-only")?.checked) {
    url += `&at_all_scope=admin`;
  }
  window.location.href = url;
}

async function sendQuoteDocxToTelegram() {
  const date = document.getElementById("export-docx-date")?.value || "";
  const timeStart = document.getElementById("export-docx-start")?.value || "";
  const timeEnd = document.getElementById("export-docx-end")?.value || "";
  const groupId = document.getElementById("export-docx-group")?.value || "";
  const btn = document.getElementById("export-docx-send-telegram");
  if (!date) {
    toast("Chọn ngày xuất.", true);
    return;
  }
  if (!groupId) {
    toast("Chọn nhóm.", true);
    return;
  }
  const norm = (t) => (t && t.length === 5 ? `${t}:00` : t);
  const body = {
    date,
    time_start: norm(timeStart) || "00:00:00",
    time_end: norm(timeEnd) || "23:59:59",
    group_id: groupId,
  };
  if (document.getElementById("export-docx-atall-admin-only")?.checked) {
    body.at_all_scope = "admin";
  }
  if (btn) btn.disabled = true;
  try {
    const j = await fetchJSON("/api/export/quote-docx/send-telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    toast(`Đã gửi Telegram: ${j.filename || "DOCX"}`);
  } catch (e) {
    toast(`Gửi Telegram thất bại: ${e.message}`, true);
  } finally {
    if (btn) btn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().slice(0, 10);
  const sd = document.getElementById("score-date");
  const jd = document.getElementById("job-date");
  const ed = document.getElementById("export-docx-date");
  if (sd) sd.value = today;
  if (jd) jd.value = today;
  if (ed) ed.value = today;
  document
    .getElementById("export-docx-add-tracked")
    ?.addEventListener("click", async () => {
      const sel = document.getElementById("export-docx-group");
      const gid = String(sel?.value || "").trim();
      if (!gid) {
        toast("Chọn nhóm ở dropdown trước.", true);
        return;
      }
      try {
        await fetchJSON("/api/export/docx-tracked", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ group_id: gid }),
        });
        toast("Đã thêm nhóm vào theo dõi xuất DOCX.");
        await refreshDocxWatchedPanel();
      } catch (e) {
        toast(e.message, true);
      }
    });
  document
    .getElementById("export-docx-sync-all-groups")
    ?.addEventListener("click", async () => {
      const btn = document.getElementById("export-docx-sync-all-groups");
      if (btn) btn.disabled = true;
      try {
        const j = await fetchJSON("/api/groups/sync?mode=all", {
          method: "POST",
        });
        const n = Number(j.count);
        toast(
          Number.isFinite(n)
            ? `Đã đồng bộ ${n} nhóm từ Zalo vào danh sách (ô chọn nhóm).`
            : "Đã đồng bộ nhóm."
        );
        await loadGroups();
      } catch (e) {
        toast(e.message, true);
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  void refreshDocxWatchedPanel();

  document.getElementById("watchdog-default-save")?.addEventListener(
    "click",
    async () => {
      const btn = document.getElementById("watchdog-default-save");
      const st = document.getElementById("watchdog-default-start");
      const en = document.getElementById("watchdog-default-end");
      if (!st || !en) return;
      if (btn) btn.disabled = true;
      try {
        await fetchJSON("/api/settings/watchdog-quiet", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            watchdogQuietStart: normalizeTimeInputValue(st.value),
            watchdogQuietEnd: normalizeTimeInputValue(en.value),
          }),
        });
        toast("Đã lưu giờ nghỉ watchdog mặc định.");
      } catch (e) {
        toast(e.message, true);
      } finally {
        if (btn) btn.disabled = false;
      }
    }
  );
});
