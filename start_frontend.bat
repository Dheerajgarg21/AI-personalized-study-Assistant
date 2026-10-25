@echo off
title AI Study Assistant - Frontend Web App
cd /d "%~dp0frontend"
echo Starting Vite Frontend Web App on http://localhost:5173...
set "PATH=C:\Program Files\nodejs;%PATH%"
cmd.exe /c "npm run dev"
pause
