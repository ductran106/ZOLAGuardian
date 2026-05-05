#!/usr/bin/env bash
# Chạy full stack từ thư mục repo. Node/npm user (Linux): có thể PREFIX ~/bin.
# Cổng Web UI lấy từ config.json — ProBook thường 3456, i32100 clean thường 3457 (không đổi trong script).
export PATH="$HOME/bin:/usr/bin:/bin"
cd "$(dirname "$0")"
# export ZALO_GUARDIAN_SKIP_ZALO=1   # bật nếu chỉ Web UI + DB, không kết nối Zalo
exec node index.js
