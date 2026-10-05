@echo off
title HealthEase AI Launcher
echo ===================================================
echo    Starting 🏥 HealthEase AI - HealthTech Platform
echo ===================================================
echo.

echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "HealthEase Backend" cmd /k "python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "HealthEase Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo HealthEase AI is launching!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo ===================================================
timeout /t 5
start http://localhost:5173
