#!/usr/bin/env bash
# Restart zalo-guardian trên ProBook: tránh hai process (EADDRINUSE), giữ log.
# Quan trọng: giải phóng cổng 3456 TRƯỚC pkill — instance cũ giữ LISTEN thì process mới thấy EADDRINUSE
# nhưng instance cũ vẫn phục vụ HTTP (curl 401), log chỉ thấy lỗi của bản mới.
set -euo pipefail
ROOT="${HOME}/zalo-guardian"
cd "$ROOT" || exit 1

echo "[restart] stopping user systemd unit if present..."
systemctl --user stop zalo-guardian.service 2>/dev/null || true

echo "[restart] freeing port 3456 first (whoever holds WebUI)..."
if command -v fuser >/dev/null 2>&1; then
  for _ in 1 2 3 4 5; do
    fuser -k 3456/tcp 2>/dev/null || true
    sleep 1
    if command -v ss >/dev/null 2>&1 && ! ss -tlnp 2>/dev/null | grep -q ':3456'; then
      break
    fi
  done
fi
sleep 2

echo "[restart] killing node index.js under $ROOT..."
pkill -f "${ROOT}/index.js" 2>/dev/null || true
sleep 2
pkill -9 -f "${ROOT}/index.js" 2>/dev/null || true
sleep 3

if command -v ss >/dev/null 2>&1 && ss -tlnp 2>/dev/null | grep -q ':3456'; then
  echo "[restart] WARN: 3456 still busy — fuser again"
  fuser -k 3456/tcp 2>/dev/null || true
  sleep 2
  pkill -9 -f "${ROOT}/index.js" 2>/dev/null || true
  sleep 2
fi

if [[ -f run.log ]]; then
  BAK="run.log.bak.$(date +%Y%m%d_%H%M%S)"
  echo "[restart] rotate run.log -> $BAK"
  mv run.log "$BAK"
fi

echo "[restart] starting node in background..."
nohup node index.js >> run.log 2>&1 &
sleep 5
if ss -tlnp 2>/dev/null | grep -q ':3456'; then
  echo "[restart] OK: something listens on 3456"
else
  echo "[restart] WARN: port 3456 not listening yet — check run.log"
fi
tail -n 35 run.log
