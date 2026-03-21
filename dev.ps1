# Factory Digital Twin - Local Dev Start
# Usage: .\dev.ps1

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=== Factory Digital Twin Dev Start ===" -ForegroundColor Cyan

# 1. Podman VM
Write-Host "[1/4] Podman machine start..." -ForegroundColor Yellow
podman machine start

# 2. Containers
Write-Host "[2/4] podman-compose up..." -ForegroundColor Yellow
Set-Location $ROOT
podman-compose up -d

# 3. Mock Agent (new window)
Write-Host "[3/4] Mock Agent..." -ForegroundColor Yellow
$agentCmd = "cd `"$ROOT`"; python agents/mock_agent.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $agentCmd

# 4. Vite dev server (new window)
Write-Host "[4/4] Vite dev server..." -ForegroundColor Yellow
$webCmd = "cd `"$ROOT\web`"; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $webCmd

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "  Web   : http://localhost:5173"
Write-Host "  API   : http://localhost:8000/docs"
Write-Host "  Grafana   : http://localhost:3000  (admin/admin)"
Write-Host "  Prometheus: http://localhost:9090"
Write-Host ""
