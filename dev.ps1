# Factory Digital Twin - Local Dev Start
# Usage: .\dev.ps1

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=== Factory Digital Twin Dev Start ===" -ForegroundColor Cyan

# 1. Podman VM
Write-Host "[1/4] Podman machine start..." -ForegroundColor Yellow
podman machine start 2>&1 | Out-Null
Write-Host "  OK" -ForegroundColor Gray

# 2. Containers
Write-Host "[2/4] podman-compose up..." -ForegroundColor Yellow
Set-Location $ROOT
podman-compose up -d

# Redis 준비될 때까지 대기 (최대 30초)
Write-Host "  Waiting for Redis..." -ForegroundColor Gray
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    $result = podman-compose exec redis redis-cli ping 2>$null
    if ($result -match "PONG") { $ready = $true; break }
    Start-Sleep -Seconds 1
}
if ($ready) { Write-Host "  Redis ready." -ForegroundColor Gray }
else { Write-Host "  Redis not responding, starting agent anyway..." -ForegroundColor Red }

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
