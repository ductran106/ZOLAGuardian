#!/usr/bin/env bash
# Chạy trên ProBook: bash scripts/probook-git-init.sh
set -euo pipefail
cd /home/duc/zalo-guardian
# Xóa file tên lỗi do CRLF (nếu còn)
if [ -f "data/guardian.db"$'\r' ]; then
  rm -f "data/guardian.db"$'\r'
fi
{
  echo ""
  echo "guardian.out"
  echo "run.log*"
} >> .gitignore
git config user.email "duc@local" 2>/dev/null || true
git config user.name "duc-probook" 2>/dev/null || true
if [ ! -d .git ]; then
  git init
fi
git reset
git add .
git status -sb
git commit -m "ProBook: Web UI Zalo QR, DOCX tracking, export API; non-fatal Zalo login on boot"
