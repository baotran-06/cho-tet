@echo off
setlocal
powershell -NoProfile -Command "$p=Get-CimInstance Win32_Process -Filter 'Name = ''node.exe''' | Where-Object { $_.CommandLine -match 'bridge[\\/]traffic-server\.js' }; if($p){ $p | ForEach-Object { Stop-Process -Id $_.ProcessId -ErrorAction SilentlyContinue }; Write-Host 'KET XE stopped.' } else { Write-Host 'KET XE is not running.' }"
pause
