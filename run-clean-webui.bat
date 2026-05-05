@echo off
cd /d "%~dp0"
REM Chi Web UI + DB (data/guardian.db) — khong can cookie Zalo. Cổng: theo config.json (xem README).
set ZALO_GUARDIAN_SKIP_ZALO=1
node index.js
pause
