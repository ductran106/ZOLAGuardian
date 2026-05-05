#!/usr/bin/env bash
set -e
cd /home/duc/zalo-guardian-clean
git config user.email "duc@i32100-local"
git config user.name "i32100"
git commit -m "i32100 zalo-guardian-clean: Web UI Zalo QR, DOCX, export, non-fatal Zalo login"
git log -1 --oneline
