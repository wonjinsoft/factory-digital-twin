# Factory Digital Twin — 로컬 개발 환경 한 번에 시작
# 사용법: PowerShell에서 .\dev.ps1

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=== Factory Digital Twin 개발 환경 시작 ===" -ForegroundColor Cyan

# 1. Podman VM 시작
Write-Host ""
Write-Host "[1/4] Podman VM 시작 중..." -ForegroundColor Yellow
podman machine start 2>&1 | ForEach-Object {
    if ($_ -match "already") { Write-Host "  이미 실행 중" -ForegroundColor Gray }
    else { Write-Host "  $_" }
}

# 2. 컨테이너 기동 (Redis, API, Prometheus, Grafana)
Write-Host ""
Write-Host "[2/4] 컨테이너 기동 중 (Redis / API / Prometheus / Grafana)..." -ForegroundColor Yellow
Set-Location $ROOT
podman-compose up -d

# 3. Mock Agent (새 창)
Write-Host ""
Write-Host "[3/4] Mock Agent 시작 (새 창)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd '$ROOT'; Write-Host 'Mock Agent 시작' -ForegroundColor Cyan; python agents/mock_agent.py"

# 4. Vite 개발 서버 (새 창)
Write-Host ""
Write-Host "[4/4] 웹 개발 서버 시작 (새 창)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd '$ROOT\web'; Write-Host 'Vite 개발 서버 시작' -ForegroundColor Cyan; npm run dev"

# 완료
Write-Host ""
Write-Host "=== 시작 완료 ===" -ForegroundColor Green
Write-Host ""
Write-Host "  웹 대시보드 : http://localhost:5173" -ForegroundColor White
Write-Host "  API 문서    : http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Grafana     : http://localhost:3000  (admin / admin)" -ForegroundColor White
Write-Host "  Prometheus  : http://localhost:9090" -ForegroundColor White
Write-Host ""
