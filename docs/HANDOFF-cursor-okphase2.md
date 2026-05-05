# HANDOFF — Cursor, sau Phase 2 (zalo-guardian)

Tài liệu này giúp agent / dev mới nối việc **không mất ngữ cảnh**: đã merge Phase 2 (scheduler, jobs, scores, Web UI mở rộng), xuất DOCX quote, deploy ProBook, và vài bẫy vận hành.

**Repo:** `zalo-guardian` (remote ví dụ: `github.com/ductran106/ZOLAGuardian`, nhánh `main`).  
**Commit gần (đặc trưng):** `dfb51c8` — *feat: Phase 2 — Scheduler, Scorer, Web UI scores/jobs* (đẩy đủ phase 2 + docx + docs).

---

## 1. Kiến trúc nhanh

| Khu | Vai trò |
|-----|---------|
| `index.js` | Entry: DB → Guardian → Scheduler → WebUI → Zalo |
| `core/db.js` | SQLite + migrations; bảng `jobs`, `daily_scores`, `messages` (quote fields), v.v. |
| `core/zalo.js` | Lưu tin vào DB; `quote` → `quote_msg_id` / `quote_owner_id` từ `msg.data.quote.globalMsgId` |
| `modules/guardian/` | Spam, violations, notifier, telegram… |
| `modules/scheduler/` | Parser/scorer/job lifecycle: POST → MATCHED → CONFIRMED / CANCELLED; điểm EXPLICIT + BAREM |
| `webui/server.js` | Express + WS; có xử lý lỗi listen (EADDRINUSE) để không crash im lặng sai chỗ |
| `webui/api/` | `scores.js`, `jobs.js`, `export.js` (CSV BOM), `features.js`, `violations.js`, `spamRoutes.js`, `status.js` |
| `webui/lib/quoteDocxBuild.js` | Xuất DOCX cụm quote — **chỉ cụm ≥2 tin** nối quote; union-find; màu **theo cụm** xanh/đỏ; spacing kiểu Word/vibecode |

**Parser tin nhắn cho downstream:** format dòng `[dd/mm/yyyy HH:MM:SS] Name: content` (tương thích `vibecode-docx-processor` / `CHAT_LINE_RE`).

---

## 2. Xuất DOCX (quote clusters)

- **API:** `GET /api/export/quote-docx?date=&time_start=&time_end=&group_id=` (timezone window VN).
- **Logic:** Mở rộng cha quote (ngoài khung → `*Missing*` trong content); **chỉ giữ cụm có ≥ 2 tin** liên kết quote trong tập; cụm sắp theo `min(ts)` cụm; trong cụm theo `ts`; **xen kẽ màu xanh/đỏ theo cụm**; một đoạn trống giữa cụm; `"free"` highlight vàng.
- **Tech:** Thư viện `docx` (highlight GREEN/RED/YELLOW — không dựa vào `paragraph.shading` vì OOXML rỗng trên docx v9).
- **Admin @All:** Khối riêng sau body (dedupe msg id); lưu ý filter admin có thể cần chỉnh nếu muốn hiện blast không trùng body.

---

## 3. Web UI (trạng thái UI mong muốn)

- Tab chỉ còn **Bảng điểm** + **Lịch xe** (nav trên).
- **📄 Xuất DOCX** là **panel cố định**, luôn hiện: **ngay sau “Tổng quan”**, **trước “Nhóm & Guardian”**.
- **Nhóm & Guardian:** mặc định **ẩn nhóm tắt Shield** (`showEnabledOnlyGroups === true`); nút **「Hiện tất cả nhóm」** để bật lại danh đầy đủ.

---

## 4. ProBook (duc) — deploy & bẫy

- **IP Tailscale (đã dùng deploy):** `100.124.121.122`, user `duc`, path `~/zalo-guardian`.
- **Deploy từ Windows:** `deploy.bat` (scp `index.js`, `package.json`, `core/`, `modules/`, `webui/`, `docs/` — không sync `node_modules`, `data`, `config.json`).
- **Sau deploy:** trên máy chủ `npm install` và chạy process (xem dưới).
- **EADDRINUSE port 3456:** Thường do **hai process** (ví dụ `nohup node index.js` **và** `systemctl --user start zalo-guardian`, hoặc process cũ chưa chết). Cách sạch: `systemctl --user stop zalo-guardian` → `fuser -k 3456/tcp` → `sleep` → `systemctl --user start …` (hoặc chỉ một kiểu chạy).
- **journalctl:** `zalo-guardian.service` có thể báo fail khi trùng cổng; sau kill + restart thường `active` và log có MSG/spam/scheduler.

---

## 5. Cấu hình & bí mật

- **`config.json`** trên máy chủ **không** đồng bộ từ repo (local).
- **Web UI Basic Auth:** biến môi trường `WEBUI_BASIC_USER`, `WEBUI_BASIC_PASSWORD` (`.env` trên server).
- **Credentials Zalo:** đường dẫn trong `config.json` (`credentialsPath`, `zcaPath`).

---

## 6. Tài liệu / báo cáo trong repo

- `docs/baocaotoandien-cursor.md` — snapshot dự án + ProBook DB counts/schema (một thời điểm).
- `docs/OPERATIONS.md`, `docs/HANDOFF.md` — vận hành cũ; **bổ sung** bằng file này cho Phase 2 + Cursor.

---

## 7. Việc có thể nối tiếp (gợi ý)

- Đồng bộ single-run: **hoặc** systemd **hoặc** nohup — tránh double listener.
- Thu nhỏ/commit `_zca_study/` nếu chỉ là thử nghiệm (đã nằm trong commit Phase 2 — kiểm tra ý định repo).
- DOCX: merge timeline admin @All theo `ts` nếu cần một dòng thời gian duy nhất.
- Quote không vào DB (`quote_msg_id` rỗng) → cụm có thể thành singleton → không xuất — có thể mở rộng heuristic sau (chỉ khi product yêu cầu).

---

## 8. Lệnh nhắc nhanh

```bash
# Dev local
cd zalo-guardian && npm install && node index.js

# ProBook (sau scp)
cd ~/zalo-guardian && npm install && node index.js
# hoặc user systemd unit zalo-guardian — không chạy song song hai kiểu trên cùng port 3456
```

---

*Nếu agent mới chỉnh code: giữ convention hiện có (ít refactor lan man); kiểm tra `webui/lib/quoteDocxBuild.js` + `webui/api/export.js` khi đổi export.*
