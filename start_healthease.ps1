# HealthEase AI - PowerShell Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   Starting 🏥 HealthEase AI - HealthTech Platform" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# 1. Start Backend in separate window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting HealthEase Backend...' -ForegroundColor Green; python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload"

# 2. Start Frontend in separate window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting HealthEase Frontend...' -ForegroundColor Green; cd frontend; npm run dev"

Write-Host "`nBackend API: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Backend Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "Frontend App: http://localhost:5173" -ForegroundColor Green
Write-Host "`nOpening application in browser..."
Start-Sleep -Seconds 4
Start-Process "http://localhost:5173"
