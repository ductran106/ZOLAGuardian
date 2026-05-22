# i32100 Phase 1 Monitor Checklist

Ngày: 2026-05-23
Mục tiêu: giữ i32100 ổn định vài ngày sau Phase 1, chỉ theo dõi và xác nhận an toàn trước khi nghĩ tới production ProBook.

## 1. Điều kiện xanh tối thiểu

- `systemctl --user status zalo-guardian-clean.service` = active/running
- `curl -fsS http://127.0.0.1:3457/api/health/full` trả HTTP 200
- `db.ok = true`
- `zalo.connected = true`
- `zalo.watchdog.watchdogActive = true`
- `zalo.watchdog.listenerLikelyDown = false`
- `zalo.watchdog.lastWatchedMessageAt` có tiến triển khi có message group mới
- `zalo.watchdog.watchdogRestarting = false` trong trạng thái bình thường
- `webui` mở bình thường, `/` và `/api/runtime/build` vẫn trả 200

## 2. Kiểm tra nhanh mỗi ngày

Chạy trên i32100:

```bash
systemctl --user status zalo-guardian-clean.service --no-pager -l
curl -fsS http://127.0.0.1:3457/api/health/full | node -e '
const fs = require("fs");
const j = JSON.parse(fs.readFileSync(0, "utf8"));
console.log(JSON.stringify({
  ok: j.ok,
  dbOk: j.db && j.db.ok,
  connected: j.zalo && j.zalo.connected,
  watchdog: j.zalo && j.zalo.watchdog && j.zalo.watchdog.watchdogActive,
  listenerLikelyDown: j.zalo && j.zalo.watchdog && j.zalo.watchdog.listenerLikelyDown,
  lastWatchedMessageAt: j.zalo && j.zalo.watchdog && j.zalo.watchdog.lastWatchedMessageAt,
  buildSource: j.timestamp
}, null, 2));
'
curl -fsS http://127.0.0.1:3457/api/runtime/build | node -e '
const fs = require("fs");
const j = JSON.parse(fs.readFileSync(0, "utf8"));
console.log(JSON.stringify({
  ok: j.ok,
  source: j.source,
  commit: j.commit,
  branch: j.branch,
  buildInfoExists: j.buildInfoExists
}, null, 2));
'
journalctl --user -u zalo-guardian-clean.service -n 80 --no-pager
```

## 3. Red flags

- `db.ok = false`
- `zalo.connected = false` kéo dài
- `listenerLikelyDown = true`
- `watchdog.watchdogRestarting = true` lặp lại nhiều lần
- service tự restart liên tục
- `/api/health/full` lỗi hoặc timeout
- `/api/runtime/build` không còn phản ánh commit đúng
- log có `Fatal`, `uncaughtException`, `unhandledRejection`, hoặc DB open error

## 4. Nếu có vấn đề

### Mức nhẹ
- chỉ mất `connected` nhưng service còn sống:
  - kiểm tra QR/login Zalo
  - xem `journalctl`
  - không đụng ProBook

### Mức nặng
- service fail/restart loop:
  - dừng lại
  - giữ runtime artifacts
  - thu log
  - rollback chỉ trên i32100 nếu cần

### Không làm
- không deploy ProBook
- không sửa file runtime trực tiếp trên ProBook
- không xóa `data/`, `config.json`, credentials khi chưa backup

## 5. Mốc ổn định

- Nếu i32100 xanh liên tục vài ngày và log sạch, mới mở lại quyết định cho production ProBook.
- Cho đến lúc đó, GitHub `main` + i32100 là lane active.
