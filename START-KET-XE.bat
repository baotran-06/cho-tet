@echo off
cd /d "%~dp0"
where node >nul 2>&1 || (echo Please install Node.js 22 or newer. & pause & exit /b 1)
call npm ci --prefix bridge
if errorlevel 1 (pause & exit /b 1)
start "KET XE SERVER" cmd /k node bridge/traffic-server.js
timeout /t 3 /nobreak >nul
start "" http://127.0.0.1:3210/admin
