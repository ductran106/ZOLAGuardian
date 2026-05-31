# Hardening ProBook Zalo Guardian

Date: 2026-05-28 05:20 GMT+7  
Owner: Cu Đệ  
Target host: `duc-ProBook`  
Target repo: `/home/duc/zalo-guardian`  
Service: `zalo-guardian.service`  
Unit: `/etc/systemd/system/zalo-guardian.service`  
Port: `3456`  
DB: `/home/duc/zalo-guardian/data/guardian.db`

## 0. Objective

Make the ProBook runtime stable like the proven i32100 lane.

The fix must address the real failure mode observed on 2026-05-28:

- Service remained `active (running)` while Zalo listener/session was dead.
- DB ingest for `[1-1 RETURN] Tái định cư` stopped at `2026-05-28 01:54:21`.
- Latest DB ingest on ProBook stopped at `2026-05-28 02:04:40`.
- Listener failed with `code=1006`.
- Watchdog quick-restart failed repeatedly.
- App attempted process-level self-spawn.
- After restart path, Zalo login failed with `fetch failed`.
- A manual `systemctl restart zalo-guardian.service` timed out.

Success means:

1. `systemctl restart zalo-guardian.service` returns cleanly.
2. Exactly one runtime process owns port `3456`.
3. App either connects to Zalo or clearly reports auth/network failure.
4. No app-level self-spawn is used for recovery.
5. DB ingest resumes for watch groups, especially `[1-1 RETURN] Tái định cư`.
6. Health/status reflects real listener/ingest state, not only web process liveness.

## 1. Current evidence baseline

### ProBook

Observed service state:

- `zalo-guardian.service`
- `Active: active (running) since Thu 2026-05-28 02:09:19 +07`
- `Main PID: 604986`
- command: `/usr/bin/node /home/duc/zalo-guardian/index.js`
- restart counter: `7`
- port: `3456`

Observed DB state:

- DB file: `/home/duc/zalo-guardian/data/guardian.db`
- target room: `[1-1 RETURN] Tái định cư`
- ProBook target `group_id`: `8912027696462383403`
- target latest message: `2026-05-28 01:54:21`
- whole DB latest message: `2026-05-28 02:04:40`

Key log evidence:

```text
Listener disconnected: code=1006 reason=
Listener closed: code=1006 reason=
Watchdog: thử restart listener mode=quick-restart
Listener hồi phục không bền ngay sau restart (1/3)
Listener hồi phục không bền ngay sau restart (2/3)
Listener hồi phục không bền ngay sau restart (3/3)
Watchdog: listener rơi lại nhiều lần ngay sau restart, escalates process-level restart.
Watchdog tầng 2: đã spawn process mới pid=604870
Đang login...
Không kết nối được Zalo lúc khởi động: fetch failed. Web UI / Guardian vẫn chạy — dùng Đăng nhập QR hoặc sửa file credentials.
Toàn hệ thống đã sẵn sàng.
```

Manual restart attempt:

```text
Failed to restart zalo-guardian.service: Connection timed out
```

### i32100 comparison lane

Observed good lane:

- host: `i32100`
- service: `zalo-guardian-clean.service`
- unit: `/home/duc/.config/systemd/user/zalo-guardian-clean.service`
- repo: `/home/duc/zalo-guardian-clean`
- node: `/home/duc/bin/node`
- port: `3457`
- active since: `Wed 2026-05-27 09:18:37 +07`
- build info commit: `4279326ee5455f3e473e13c7ccee445bd93b384d`
- branch: `main`
- deployed from: `/home/duc/ZOLAGuardian-canonical-src`

Observed DB ingest OK:

- i32100 target room `[1-1 RETURN] Tái định cư`
- i32100 target `group_id`: `7113055152681078901`
- recent ingest exists through `2026-05-28 04:54:05`

## 2. Non-goals / guardrails

Do not do these unless anh explicitly approves later:

- Do not delete DB.
- Do not wipe credentials without backup.
- Do not replace the repo wholesale from i32100.
- Do not push/merge/deploy to any public remote.
- Do not send external group messages as part of repair.
- Do not hide current dirty git state.

This work is local ProBook runtime hardening only.

## 3. Pre-change safety checkpoint

Before modifying anything, capture a dated backup and baseline.

### 3.1 Create backup directory

Use:

```bash
cd /home/duc/zalo-guardian
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/home/duc/zalo-guardian/.deploy-backups/probook-hardening-$STAMP"
mkdir -p "$BACKUP_DIR"
```

### 3.2 Save runtime/code/config evidence

Backup these files if present:

```bash
cp -a config.json .env package.json package-lock.json index.js core/zalo.js core/loadConfig.js webui/api/status.js "$BACKUP_DIR"/ 2>/dev/null || true
cp -a /etc/systemd/system/zalo-guardian.service "$BACKUP_DIR/zalo-guardian.service" 2>/dev/null || true
```

Save state reports:

```bash
git status --short > "$BACKUP_DIR/git-status.txt"
systemctl status zalo-guardian.service --no-pager -l > "$BACKUP_DIR/systemctl-status.txt" 2>&1 || true
journalctl -u zalo-guardian.service --since '24 hours ago' --no-pager > "$BACKUP_DIR/journal-24h.txt" 2>&1 || true
pgrep -af 'zalo-guardian|node .*index.js' > "$BACKUP_DIR/processes.txt" 2>&1 || true
ss -ltnp > "$BACKUP_DIR/ss-ltnp.txt" 2>&1 || true
```

Save DB timestamp evidence:

```bash
sqlite3 data/guardian.db <<'SQL' > "$BACKUP_DIR/db-baseline.txt"
.headers on
.mode column
SELECT datetime(MAX(ts)/1000,'unixepoch','localtime') AS max_msg_ts FROM messages;
SELECT datetime(MAX(ts)/1000,'unixepoch','localtime') AS target_tai_dinh_cu_last FROM messages WHERE group_id='8912027696462383403';
SELECT datetime(MAX(ts)/1000,'unixepoch','localtime') AS room_lich_last FROM messages WHERE group_id='2718828458346611005';
SQL
```

Do not copy `guardian.db` unless specifically needed; it is large and should not be mutated by this plan.

## 4. Diagnosis to preserve

Root problem is not DB corruption.

The failure is a runtime/session recovery failure:

1. Zalo listener died.
2. Watchdog detected it.
3. Listener quick-restart failed repeatedly.
4. App escalated to process-level recovery by spawning another Node process.
5. Login failed with `fetch failed`.
6. Service remained alive with WebUI running but no Zalo ingest.
7. `systemctl restart` later timed out, suggesting shutdown/restart handling is not clean.

Important design rule for the fix:

> systemd must be the only process supervisor. App code must not spawn a replacement copy of itself.

## 5. Change plan

### Phase A — Make recovery systemd-owned

Target file:

- `/home/duc/zalo-guardian/core/zalo.js`

Change behavior in process-level recovery path:

- Remove/disable self-spawn behavior using `spawn(process.execPath, ["index.js"], ...)`.
- Replace with clean process termination after logging:
  - set a guard to avoid duplicate exits
  - log reason/fingerprint
  - `setTimeout(() => process.exit(1), smallDelay).unref()`

Expected result:

- On unrecoverable listener failure, app exits non-zero.
- `systemd Restart=always` restarts the service.
- No orphan/manual child process is created.

Verification:

```bash
rg -n "spawn\(|process.exit|restartCurrentProcess|processRestartScheduled" core/zalo.js
```

There should be no process self-spawn for `index.js`.

### Phase B — Harden process signal/exit behavior

Target file:

- `/home/duc/zalo-guardian/index.js`

Ensure process guards do not block normal systemd stop/restart:

- `SIGTERM` logs and exits cleanly.
- `SIGINT` logs and exits cleanly.
- fatal startup/runtime recovery should not create child process manually.

Verification:

```bash
rg -n "SIGTERM|SIGINT|unhandledRejection|uncaughtException|scheduleFatalRecovery" index.js
```

### Phase C — Harden systemd unit

Target unit:

- `/etc/systemd/system/zalo-guardian.service`

Desired direction:

```ini
[Service]
Type=simple
WorkingDirectory=/home/duc/zalo-guardian
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /home/duc/zalo-guardian/index.js
Restart=always
RestartSec=20
TimeoutStopSec=20
KillMode=control-group
StandardOutput=append:/home/duc/zalo-guardian/guardian.service.log
StandardError=append:/home/duc/zalo-guardian/guardian.service.log
```

Notes:

- Preserve any existing required Environment lines.
- Do not change port here; port remains `3456`.
- After unit change, run `systemctl daemon-reload`.

Verification:

```bash
systemctl cat zalo-guardian.service
systemctl daemon-reload
```

### Phase D — Isolate guardian credentials from OpenClaw zalouser

Current ProBook config points to shared OpenClaw credential:

```text
/home/duc/.openclaw/credentials/zalouser/credentials.json
```

Target guardian-private credential path:

```text
/home/duc/zalo-guardian/data/zalo-credentials.json
```

Steps:

1. Backup current shared credential metadata only; do not print secrets.
2. If guardian-private credential does not exist, copy current credential once as seed:

```bash
install -m 600 /home/duc/.openclaw/credentials/zalouser/credentials.json /home/duc/zalo-guardian/data/zalo-credentials.json
```

3. Update `/home/duc/zalo-guardian/config.json`:

```json
"credentialsPath": "/home/duc/zalo-guardian/data/zalo-credentials.json"
```

Rationale:

- OpenClaw `zalouser` and `zalo-guardian` must not share mutable auth/session state.
- This reduces cross-runtime session breakage.

Verification:

```bash
node -e "const fs=require('fs'); const c=JSON.parse(fs.readFileSync('/home/duc/zalo-guardian/config.json','utf8')); console.log(c.credentialsPath); const st=fs.statSync(c.credentialsPath); console.log({exists:true,size:st.size,mode:(st.mode&0o777).toString(8),mtime:st.mtime.toISOString()});"
```

If login still fails with `fetch failed`, do not keep retrying blindly. Move to QR/login recovery using the WebUI auth lane or zca-js-specific login lane.

### Phase E — Improve health visibility

Target files:

- `/home/duc/zalo-guardian/core/zalo.js`
- `/home/duc/zalo-guardian/webui/api/status.js`

Health should expose enough state to distinguish these cases:

- app/web server alive but Zalo disconnected
- listener alive but no watched-group traffic
- listener recently down/restarted
- DB ingest stale
- last persist OK/fail

Minimum useful fields:

```text
zaloConnected
listenerLikelyDown
lastAnyMessageAt
lastWatchedMessageAt
lastWatchedGroupId
lastPersistOkAt
lastPersistOkGroupId
lastPersistOkMsgId
lastPersistFailAt
watchdogState
watchdogReason
watchdogAction
processFingerprint
```

Do not require this phase to be perfect before restoring ingest. It can be completed after Phase A-D if runtime repair is urgent.

### Phase F — Restart and verify runtime

After changes:

```bash
systemctl daemon-reload
systemctl restart zalo-guardian.service
systemctl status zalo-guardian.service --no-pager -l
```

Must not timeout.

Check process/port:

```bash
pgrep -af 'zalo-guardian|node .*index.js'
ss -ltnp | grep -E ':3456\b'
```

Expected:

- one service process under systemd
- one listener on `:3456`

Check logs:

```bash
tail -n 200 /home/duc/zalo-guardian/guardian.service.log | grep -Ei 'Khởi động|DB initialized|WebUI|load|credentials|login|connected|Không kết nối|fetch failed|Listener started|MSG from group|Persist OK|error|ready|Toàn hệ thống'
```

Check DB ingest:

```bash
sqlite3 /home/duc/zalo-guardian/data/guardian.db <<'SQL'
.headers on
.mode column
SELECT datetime(MAX(ts)/1000,'unixepoch','localtime') AS max_msg_ts FROM messages;
SELECT datetime(MAX(ts)/1000,'unixepoch','localtime') AS target_tai_dinh_cu_last FROM messages WHERE group_id='8912027696462383403';
SELECT datetime(MAX(ts)/1000,'unixepoch','localtime') AS room_lich_last FROM messages WHERE group_id='2718828458346611005';
SQL
```

Acceptance:

- target timestamp advances beyond `2026-05-28 01:54:21`, or if the room is quiet, another enabled watch group timestamp advances and logs show `Persist OK`.
- no `fetch failed` loop after credential fix, unless external network/Zalo auth is genuinely down.

## 6. If restart still times out

If `systemctl restart` still times out after Phase A-C:

1. Inspect process tree:

```bash
systemctl status zalo-guardian.service --no-pager -l
pgrep -af 'zalo-guardian|node .*index.js'
ps -o pid,ppid,stat,etime,cmd -p $(pgrep -d, -f 'node .*zalo-guardian/index.js')
```

2. Inspect port holder:

```bash
ss -ltnp | grep -E ':3456\b'
```

3. Use controlled stop path:

```bash
systemctl stop zalo-guardian.service
systemctl status zalo-guardian.service --no-pager -l
```

4. If systemd cannot stop the process, capture evidence first, then use `systemctl kill` or `kill` only with explicit acknowledgement in the run log.

Do not leave orphan Node processes holding `3456`.

## 7. Rollback plan

Rollback files from backup:

```bash
cp -a "$BACKUP_DIR/index.js" /home/duc/zalo-guardian/index.js
cp -a "$BACKUP_DIR/zalo.js" /home/duc/zalo-guardian/core/zalo.js
cp -a "$BACKUP_DIR/config.json" /home/duc/zalo-guardian/config.json
cp -a "$BACKUP_DIR/zalo-guardian.service" /etc/systemd/system/zalo-guardian.service
systemctl daemon-reload
systemctl restart zalo-guardian.service
```

If private guardian credential was created and is suspected bad:

- keep the file for forensic comparison but move it aside instead of deleting:

```bash
mv /home/duc/zalo-guardian/data/zalo-credentials.json /home/duc/zalo-guardian/data/zalo-credentials.json.bad-$(date +%Y%m%d-%H%M%S)
```

Then re-login cleanly.

## 8. Final report checklist

When the work is done, report these exact items to anh:

- Backup directory path.
- Files changed.
- Whether systemd unit changed.
- Whether credential path was isolated.
- `systemctl restart` result.
- process/port count for `3456`.
- Zalo connected/login result.
- latest DB timestamp for:
  - all messages
  - `8912027696462383403` / `[1-1 RETURN] Tái định cư`
  - `2718828458346611005` / `[1_1 RET 2 ] ROOM LỊCH`
- Any remaining blocker, especially QR login or external `fetch failed`.

## 9. Implementation order lock

Follow this exact order unless new evidence makes it unsafe:

1. Backup + baseline.
2. Patch self-spawn to systemd-owned exit.
3. Verify signal handling.
4. Patch systemd unit.
5. Isolate credential path.
6. Restart once through systemd.
7. Verify process/port/log/status.
8. Verify DB ingest.
9. Only then decide whether QR/login recovery is needed.

Do not skip from diagnosis directly to repeated restarts.
