@echo off
echo [DEPLOY] Syncing zalo-guardian to duc-ProBook...

REM Thay YOUR_PROBOOK_IP bằng IP thật của duc-ProBook
set PROBOOK_IP=192.168.1.24
set REMOTE_USER=duc
set REMOTE_PATH=/home/duc/zalo-guardian

REM Tạo thư mục nếu chưa có
ssh %REMOTE_USER%@%PROBOOK_IP% "mkdir -p %REMOTE_PATH%/data %REMOTE_PATH%/docs"

REM Sync các file code (không sync node_modules, data, config.json)
scp index.js %REMOTE_USER%@%PROBOOK_IP%:%REMOTE_PATH%/
scp package.json %REMOTE_USER%@%PROBOOK_IP%:%REMOTE_PATH%/
scp -r core %REMOTE_USER%@%PROBOOK_IP%:%REMOTE_PATH%/
scp -r modules %REMOTE_USER%@%PROBOOK_IP%:%REMOTE_PATH%/
scp -r webui %REMOTE_USER%@%PROBOOK_IP%:%REMOTE_PATH%/
scp -r docs %REMOTE_USER%@%PROBOOK_IP%:%REMOTE_PATH%/

echo [DEPLOY] Sync done.
echo [DEPLOY] Chay lenh sau tren duc-ProBook:
echo   cd ~/zalo-guardian
echo   npm install
echo   node index.js
pause
