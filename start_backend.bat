@echo off
title AI Study Assistant - Backend Server
cd /d "%~dp0backend"
echo Starting FastAPI Backend Server on http://127.0.0.1:8000...
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
