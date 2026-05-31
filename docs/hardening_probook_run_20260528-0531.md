# Hardening ProBook execution report

Date: 2026-05-28 05:31-05:36 GMT+7
Plan: /home/duc/zalo-guardian/docs/hardening_probook.md
Backup: /home/duc/zalo-guardian/.deploy-backups/probook-hardening-20260528-053207

## Actions completed

- Created pre-change backup and baseline under: /home/duc/zalo-guardian/.deploy-backups/probook-hardening-20260528-053207
- Patched /home/duc/zalo-guardian/core/zalo.js:
  - removed app-level self-spawn of replacement Node process
  - process-level recovery now exits current process so systemd owns restart
- Verified syntax:
  - node --check core/zalo.js
  - node --check index.js
  - node --check webui/api/status.js
- Hardened /etc/systemd/system/zalo-guardian.service:
  - RestartSec=20
  - TimeoutStopSec=20
  - KillMode=control-group
  - preserved User=duc, Group=duc, WorkingDirectory, ExecStart, log append
- Isolated guardian credential:
  - from /home/duc/.openclaw/credentials/zalouser/credentials.json
  - to /home/duc/zalo-guardian/data/zalo-credentials.json
  - mode: 600
- Ran systemctl daemon-reload.
- Restarted zalo-guardian.service through systemd.

## Verification after restart

- systemctl restart result: PASS, returned in ~0.073s.
- Active service timestamp: Thu 2026-05-28 05:34:33 +07.
- Main PID after restart: 703443.
- Port 3456 holder: single Node process PID 703443.
- Zalo login: PASS.
- Logged in as: 2287316777534438968.
- Status ownName: Soi Lỗi.
- Listener start: PASS.
- Health/status endpoint reachable after app startup.

## Current health nuance

Immediately after restart, health reports degraded because the listener is inside startup/recovery verification window and has not yet seen real watched-group traffic:

```text
reason: listener recently started/restarted; waiting for real traffic verification
listenerConnected: true
listenerLikelyDown: false
watchGroupsEnabledCount: 2
```

This is expected until new watched-group traffic arrives.

## DB ingest checkpoint

Before restart:

- all messages latest: 2026-05-28 02:04:40
- [1-1 RETURN] Tái định cư / 8912027696462383403: 2026-05-28 01:54:21
- [1_1 RET 2 ] ROOM LỊCH / 2718828458346611005: 2026-05-28 02:04:40

Immediate after restart:

- all messages latest: 2026-05-28 02:04:40
- [1-1 RETURN] Tái định cư / 8912027696462383403: 2026-05-28 01:54:21
- [1_1 RET 2 ] ROOM LỊCH / 2718828458346611005: 2026-05-28 02:04:40

Interpretation: runtime is repaired and connected, but ingest cannot be marked PASS until real group traffic is observed.

## Remaining follow-up

- Recheck after a short interval for:
  - MSG from group
  - Persist OK
  - DB timestamp advancement
  - health ok/degraded state
- If no group traffic occurs, ask anh to send/test one harmless message in a watched room or wait for organic traffic.
