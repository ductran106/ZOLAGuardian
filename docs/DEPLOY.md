# Zalo Guardian Deploy / Rollback Runbook

Scope hiện tại: **i32100 staging + GitHub only**.

Production ProBook đang được giữ nguyên để lấy dữ liệu thật. Không chạy deploy/restart ProBook từ runbook này cho tới khi anh mở lại production lane.

## 1. Topology

| Lane | Path | Service | Port | Status |
|---|---|---|---:|---|
| GitHub canonical | `https://github.com/ductran106/ZOLAGuardian` | n/a | n/a | source of truth |
| i32100 staging | `/home/duc/zalo-guardian-clean` | `zalo-guardian-clean.service` | `3457` | active test lane |
| ProBook production | `/home/duc/zalo-guardian` | `zalo-guardian.service` | `3456` | intentionally gated out |

## 2. Safety rules

- Không chạy script dưới `root`.
- Mọi hành động mutate đều cần `--confirm`.
- `--dry-run` dùng để xem kế hoạch trước.
- Script preserve runtime artifacts:
  - `config.json`
  - `.env`, `.env.*`
  - `data/`
  - credentials
  - logs
  - `node_modules/`
  - backups/deploy receipts
- Mỗi deploy tạo backup code timestamped trong:
  - `~/zalo-guardian-backups/i32100/<YYYYMMDD-HHMMSS>/`
- Mỗi deploy/rollback ghi receipt trong:
  - `~/zalo-guardian-deploys/i32100/`

## 3. Deploy i32100

Chạy trên i32100 với **source clone tách khỏi runtime target**. Không dùng chính `~/zalo-guardian-clean` làm source vì đó là target đang chạy.

Ví dụ source clone riêng:

```bash
git clone https://github.com/ductran106/ZOLAGuardian.git ~/ZOLAGuardian-canonical-src
cd ~/zalo-guardian-clean
bash scripts/deploy-i32100.sh --source ~/ZOLAGuardian-canonical-src --dry-run
bash scripts/deploy-i32100.sh --source ~/ZOLAGuardian-canonical-src --confirm
```

Nếu đã có clone/source canonical khác:

```bash
bash scripts/deploy-i32100.sh --source /path/to/canonical/clone --dry-run
bash scripts/deploy-i32100.sh --source /path/to/canonical/clone --confirm
```

Script sẽ:

1. kiểm tra source/target giống Zalo Guardian repo
2. backup code-managed files
3. rsync source vào target nhưng giữ runtime data/config
4. ghi `build-info.json`
5. restart `zalo-guardian-clean.service`
6. poll `http://127.0.0.1:3457/api/health/full`
7. require `ok=true` và `db.ok=true`
8. ghi receipt JSON

## 4. Rollback i32100

Liệt kê backup:

```bash
cd ~/zalo-guardian-clean
bash scripts/rollback-i32100.sh --list
```

Rollback bản mới nhất:

```bash
bash scripts/rollback-i32100.sh --confirm
```

Rollback bản cụ thể:

```bash
bash scripts/rollback-i32100.sh --to 20260523-045509 --dry-run
bash scripts/rollback-i32100.sh --to 20260523-045509 --confirm
```

Rollback sẽ tạo thêm một backup pre-rollback trước khi restore, để có đường quay lại nếu rollback làm xấu hơn.

## 5. Health verification

Sau deploy/rollback:

```bash
curl -fsS http://127.0.0.1:3457/api/health/full | /home/duc/bin/node -e '
const fs = require("fs");
const j = JSON.parse(fs.readFileSync(0, "utf8"));
console.log(JSON.stringify({
  ok: j.ok,
  dbOk: j.db && j.db.ok,
  connected: j.zalo && j.zalo.connected,
  watchdog: j.zalo && j.zalo.watchdog && j.zalo.watchdog.watchdogActive,
  listenerLikelyDown: j.zalo && j.zalo.watchdog && j.zalo.watchdog.listenerLikelyDown,
  lastWatchedMessageAt: j.zalo && j.zalo.watchdog && j.zalo.watchdog.lastWatchedMessageAt,
  port: j.config && j.config.webuiPort
}, null, 2));
'
```

Green minimum:

- `ok=true`
- `dbOk=true`
- `connected=true` nếu live Zalo session còn đăng nhập
- `watchdog=true`
- `listenerLikelyDown=false`

## 6. ProBook gate

Không chạy production deploy/restart trong phase này.

Điều kiện mở lại ProBook:

1. i32100 chạy ổn vài ngày
2. không có restart loop/fatal
3. `/api/health/full` ổn định
4. anh đồng ý production restart window
5. có rollback path đã test trên i32100
