@echo off
title GPlan - Start All
echo ====================================
echo   GPlan - Starting Backend + Frontend
echo ====================================
echo.

echo Starting BACKEND in a new window...
start "GPlan Backend" cmd /k "cd /d d:\projects\fyear\backend && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"

timeout /t 3 /nobreak > nul

echo Starting FRONTEND in a new window...
start "GPlan Frontend" cmd /k "cd /d d:\projects\fyear && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo - Backend: http://localhost:8000
echo - Frontend: http://localhost:5173
echo.
echo Close those windows to stop the servers.
pause
