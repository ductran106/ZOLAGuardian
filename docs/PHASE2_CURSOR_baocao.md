# Báo cáo thi công — PHASE 2 Scheduler & Scorer

**Issued by:** `docs/PHASE2_CURSOR_PROMPT.md`  
**Ngày:** 2026-05-02  
**Môi trường:** PC-Boss `C:\Users\ANTRACH_DOUBLE\zalo-guardian\` → deploy → ProBook `/home/duc/zalo-guardian/`

> `docs/HANDOFF_ZCA.md` trên repo không có; bản nằm Desktop (`claude_ZaloGuard\HANDOFF_ZCA.md`) — nội dung nhiệm vụ lấy từ `PHASE2_CURSOR_PROMPT.md`.

---

## 1. Service sau deploy / restart

| Hạng mục | Kết quả |
|----------|---------|
| `systemctl --user is-active zalo-guardian.service` | **active** |
| Lỗi khởi động | Không (đã `stop` + `fuser -k 3456/tcp` trước `start` để tránh EADDRINUSE) |

---

## 2. Log — có dòng scheduler không?

Có dòng:

```text
[scheduler] Scheduler module started.
```

và ngay sau đó:

```text
[index] Scheduler started.
```

**Trích thêm (tin nhóm scheduler + POST mẫu):**

```text
May 02 15:24:53 ... [scheduler] Scheduler module started.
May 02 15:24:53 ... [index] Scheduler started.
...
May 02 15:24:57 ... [scheduler] POST: Đỗ Hoàn | 800k TINH_1C → 1.5đ
```

---

## 3. Bảng `jobs` và `daily_scores`

Lệnh: `sqlite3 ... ".tables"` trên ProBook.

- **`jobs`**: có trong danh sách bảng.
- **`daily_scores`**: có trong danh sách bảng.

Query nhanh:

| Metric | Giá trị (thời điểm verify) |
|--------|----------------------------|
| `SELECT COUNT(*) FROM jobs` | **5** |
| `SELECT COUNT(*) FROM daily_scores` | **0** *(chưa có luồng CONFIRMED — chỉ mới có POST/MATCHED/CANCEL khi phát sinh)* |

---

## 4. Job POST — 5 dòng đầu (theo yêu cầu “paste 5 dòng đầu”)

Query: `SELECT poster_name, price, trip_type, base_points, status, job_date FROM jobs ORDER BY id DESC LIMIT 10` — trích **5 dòng đầu** của kết quả (định dạng `poster|price|trip|points|status|date`):

```text
Airport Lh|300|TINH_1C|1.0|OPEN|2026-05-02
Thắng Vios|300|TINH_1C|1.0|OPEN|2026-05-02
Minh Hiếu|350|TINH_1C|1.0|OPEN|2026-05-02
Vận Tải Luxury|1000|TINH_1C|2.0|OPEN|2026-05-02
Đỗ Hoàn|800|TINH_1C|1.5|OPEN|2026-05-02
```

*(ORDER BY id DESC → đây là 5 bản ghi mới nhất tại thời điểm query.)*

---

## 5. File đã tạo / sửa

| File | Thao tác |
|------|----------|
| `core/db.js` | Thêm migrate `CREATE TABLE IF NOT EXISTS jobs`, `daily_scores` |
| `modules/scheduler/parser.js` | **Tạo mới** |
| `modules/scheduler/scorer.js` | **Tạo mới** (`import db` default export — sửa so với snippet prompt dùng `{ db }`) |
| `modules/scheduler/index.js` | **Tạo mới** (`import eventBus`, `import db` default) |
| `index.js` | `startScheduler()` sau `startGuardian()` |

---

## 6. Lỗi / lệch so với prompt

| Vấn đề | Xử lý |
|--------|--------|
| Prompt dùng `import { db }` / `import { eventBus }` | Code thực tế: `import db from "../../core/db.js"`, `import eventBus from "../../core/eventBus.js"` (đúng export default của project). |
| Không chờ 5–10 phút realtime | Đã có sẵn vài tin POST trong DB + log POST ngay sau restart — đủ verify pipeline. |
| Khác biệt khác | Không phát sinh lỗi runtime sau restart. |

---

## 7. Kết luận

- Scheduler đăng ký `zalo:message`, chỉ xử lý 2 group trong `SCHEDULER_GROUPS`.
- Parser rule-based; POST đã ghi `jobs` và log `[scheduler] POST: ...`.
- Điểm `daily_scores` chỉ tăng khi luồng **CONFIRMED** (quote confirm) — hiện **0** hàng là hợp lý nếu chưa ai confirm trong ngày verify.

**Next (theo prompt):** Web UI bảng điểm + Export — task riêng.
