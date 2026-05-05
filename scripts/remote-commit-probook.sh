#!/usr/bin/env bash
set -e
cd /home/duc/zalo-guardian
git add .gitignore README.md config.example.json run-clean-full.bat run-clean-webui.bat run-clean-webui.sh
git status -sb
git commit -m "Merge README + run-clean scripts, expand gitignore; local config keeps webuiPort 3456"
