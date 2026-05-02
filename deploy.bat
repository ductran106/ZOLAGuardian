@echo off
setlocal enabledelayedexpansion
echo [DEPLOY] Syncing zalo-guardian to duc-ProBook via Tailscale...

REM Tailscale IP cua duc-ProBook
set PROBOOK_IP=100.124.121.122
set REMOTE_USER=duc
set REMOTE_PATH=/home/duc/zalo-guardian
set KEY_FILE=%USERPROFILE%\.ssh\id_ed25519_guardian
set SSH_OPTS=-i "%KEY_FILE%" -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new

REM Tạo thư mục nếu chưa có
ssh %SSH_OPTS% %REMOTE_USER%@%PROBOOK_IP% "mkdir -p %REMOTE_PATH%/data %REMOTE_PATH%/docs"
if errorlevel 1 goto :fail

REM Sync các file code (không sync node_modules, data, config.json)
scp %SSH_OPTS% index.js %REMOTE_USER%@%PROBOOK_IP%:%REMOTE_PATH%/
if errorlevel 1 goto :fail
scp %SSH_OPTS% package.json %REMOTE_USER%@%PROBOOK_IP%:%REMOTE_PATH%/
if errorlevel 1 goto :fail
scp %SSH_OPTS% -r core %REMOTE_USER%@%PROBOOK_IP%:%REMOTE_PATH%/
if errorlevel 1 goto :fail
scp %SSH_OPTS% -r modules %REMOTE_USER%@%PROBOOK_IP%:%REMOTE_PATH%/
if errorlevel 1 goto :fail
scp %SSH_OPTS% -r webui %REMOTE_USER%@%PROBOOK_IP%:%REMOTE_PATH%/
if errorlevel 1 goto :fail
scp %SSH_OPTS% -r docs %REMOTE_USER%@%PROBOOK_IP%:%REMOTE_PATH%/
if errorlevel 1 goto :fail

echo [DEPLOY] Sync done.
echo [DEPLOY] Chay lenh sau tren duc-ProBook:
echo   cd ~/zalo-guardian ^&^& npm install ^&^& node index.js
exit /b 0

:fail
echo [DEPLOY] FAILED. Kiem tra SSH key/password cho %REMOTE_USER%@%PROBOOK_IP%.
exit /b 1
