@echo off
title GPlan Backend Server
echo ====================================
echo   GPlan Backend - Starting...
echo ====================================
echo.
cd /d "d:\projects\fyear\backend"

echo Checking Python environment...
if not exist ".venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found!
    echo Please run: python -m venv .venv
    pause
    exit /b 1
)

echo Starting FastAPI backend on port 8000...
echo.
echo Keep this window OPEN while using the app.
echo Press Ctrl+C to stop the server.
echo.
echo ====================================
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
echo.
echo Server stopped.
pause
