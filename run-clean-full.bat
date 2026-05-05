@echo off
cd /d "%~dp0"
REM Full stack: tat SKIP Zalo; dien ZALO_CREDENTIALS_PATH + ZCA_JS_PATH trong .env (td. copy tu may dev)
REM Cổng Web UI: theo config.json (ProBook thuong 3456, i32100 clean thuong 3457) — khong doi day.
set ZALO_GUARDIAN_SKIP_ZALO=
node index.js
pause
