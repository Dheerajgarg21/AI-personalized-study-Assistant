@echo off
title AI Study Assistant - Launch All
echo ===================================================
echo   Starting AI-Based Personalized Study Assistant
echo ===================================================
echo.
start "Study Assistant - Backend" "%~dp0start_backend.bat"
timeout /t 3 /nobreak >nul
start "Study Assistant - Frontend" "%~dp0start_frontend.bat"
echo.
echo Application launched!
echo - Frontend: http://localhost:5173
echo - Backend:  http://127.0.0.1:8000
echo - Swagger:  http://127.0.0.1:8000/docs
echo.
timeout /t 5
