#!/usr/bin/env bash
set -e
cd /home/duc/zalo-guardian-clean
git add .gitignore
git commit -m "gitignore: ignore data/*.bak (zalo credentials backups)"
