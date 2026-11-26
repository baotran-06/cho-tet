@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1 || (echo Install Node.js 22 or newer from nodejs.org & pause & exit /b 1)
set TRAFFIC_PORT=3211
powershell -NoProfile -Command "try { $r=Invoke-RestMethod -TimeoutSec 2 http://127.0.0.1:3211/api/traffic/status; if($null -ne $r.epoch){exit 0} } catch {}; exit 1" >nul 2>&1
if not errorlevel 1 goto open
start "KET XE SERVER - KEEP OPEN" /D "%~dp0" cmd /k node bridge/traffic-server.js
for /L %%i in (1,1,15) do (
 powershell -NoProfile -Command "try { $r=Invoke-RestMethod -TimeoutSec 1 http://127.0.0.1:3211/api/traffic/status; if($null -ne $r.epoch){exit 0} } catch {}; exit 1" >nul 2>&1
 if not errorlevel 1 goto open
 timeout /t 1 /nobreak >nul
)
echo Server did not start. Check the KET XE SERVER window for the error.
pause
exit /b 1
:open
start "" http://127.0.0.1:3211/admin
if not exist "bridge\node_modules\tiktok-live-connector\package.json" (
 echo Installing LIVE connector. Game demo is already available.
 call npm ci --prefix bridge
 if errorlevel 1 (echo LIVE connector install failed. Game demo remains available. & pause & exit /b 1)
)
exit /b 0
