#!/usr/bin/env bash
set -e
cd /home/duc/zalo-guardian-clean
git add .gitignore README.md index.js config.example.json run-clean-full.bat run-clean-webui.bat run-clean-webui.sh
git status -sb
git commit -m "Sync README + index try/catch + run-clean scripts + gitignore _zca_study; local config keeps webuiPort 3457"
