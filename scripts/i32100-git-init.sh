#!/usr/bin/env bash
# Chạy trên i32100: bash /tmp/i32100-git-init.sh
set -euo pipefail
cd /home/duc/zalo-guardian-clean
if [ -f "data/guardian.db"$'\r' ]; then
  rm -f "data/guardian.db"$'\r'
fi
{
  echo "data/zalo-credentials.json"
  echo "data/*.bak"
  echo "guardian.out"
  echo "run.log*"
  echo "_zca_study/"
} | while read -r line; do
  grep -qxF "$line" .gitignore 2>/dev/null || echo "$line" >> .gitignore
done
if [ ! -d .git ]; then
  git init
fi
git config user.email "duc@i32100-local"
git config user.name "i32100"
git reset 2>/dev/null || true
git add .
git status -sb
git commit -m "i32100 zalo-guardian-clean: Web UI Zalo QR, DOCX tracking, export; non-fatal Zalo login"
