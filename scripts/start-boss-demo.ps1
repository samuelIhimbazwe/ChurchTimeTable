# One-command boss demo: production web + API proxy + optional Cloudflare tunnel.
# Run from repo root:  .\scripts\start-boss-demo.ps1 -NoTunnel
# Optional remote link (less reliable):  .\scripts\start-boss-demo.ps1

param(
  [switch]$NoTunnel,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$backendRoot = Join-Path $repoRoot "backend"
$webRoot = Join-Path $repoRoot "web"

function Stop-PortListener([int]$Port) {
  $lines = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING"
  foreach ($line in $lines) {
    $pid = ($line -split '\s+')[-1]
    if ($pid -match '^\d+$' -and [int]$pid -gt 0) {
      Write-Host "Stopping PID $pid on port $Port..." -ForegroundColor Yellow
      Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
  }
}

Write-Host ""
Write-Host "=== CMMS Boss Demo ===" -ForegroundColor Cyan
Write-Host ""

Stop-PortListener 3000
Stop-PortListener 3001
Start-Sleep -Seconds 1

# Backend
Write-Host "Starting API on :3000..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
  param($dir)
  Set-Location $dir
  npm run start:dev 2>&1
} -ArgumentList $backendRoot

# Wait for API health
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/v1/health" -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) { $ready = $true; break }
  } catch { Start-Sleep -Seconds 1 }
}
if (-not $ready) {
  Write-Host "API did not start in time. Check backend job output:" -ForegroundColor Red
  Receive-Job $backendJob -Keep | Select-Object -Last 20
  exit 1
}
Write-Host "API ready." -ForegroundColor Green

# Web (production — stable through tunnels; no HMR flake)
Set-Location $webRoot
if (-not $SkipBuild) {
  Write-Host "Building web (first run ~2 min)..." -ForegroundColor Cyan
  $env:DEMO_BUILD = "1"
  npm run build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Starting web (production) on :3001..." -ForegroundColor Cyan
$webJob = Start-Job -ScriptBlock {
  param($dir)
  Set-Location $dir
  $env:API_PROXY_TARGET = "http://127.0.0.1:3000"
  npm run start 2>&1
} -ArgumentList $webRoot

$webReady = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:3001/login" -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) { $webReady = $true; break }
  } catch { Start-Sleep -Seconds 1 }
}
if (-not $webReady) {
  Write-Host "Web did not start in time." -ForegroundColor Red
  Receive-Job $webJob -Keep | Select-Object -Last 20
  exit 1
}
Write-Host "Web ready." -ForegroundColor Green

# Smoke test login through proxy
try {
  $body = '{"email":"member1@church.local","password":"Pilot@123"}'
  $login = Invoke-RestMethod -Method POST -Uri "http://127.0.0.1:3001/api/v1/auth/login" `
    -ContentType "application/json" -Body $body
  $token = $login.data.accessToken
  Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/v1/auth/me" `
    -Headers @{ Authorization = "Bearer $token" } | Out-Null
  Write-Host "Login smoke test: OK" -ForegroundColor Green
} catch {
  Write-Host "Login smoke test FAILED — fix before demo:" -ForegroundColor Red
  Write-Host $_.Exception.Message
  exit 1
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "LOCAL (most reliable — screen share this):" -ForegroundColor Green
Write-Host "  http://localhost:3001/login" -ForegroundColor White
Write-Host "  member1@church.local / Pilot@123" -ForegroundColor White
Write-Host "  church.coord@church.local / Pilot@123" -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor Cyan

if ($NoTunnel) {
  Write-Host ""
  Write-Host "Screen-share tip: Zoom/Teams -> Share screen -> open localhost:3001" -ForegroundColor Yellow
  Write-Host "Keep this window open. Ctrl+C stops demo jobs." -ForegroundColor Yellow
  Write-Host ""
  while ($true) { Start-Sleep -Seconds 60 }
}

$cf = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $cf)) {
  $cf = "cloudflared"
}

Write-Host ""
Write-Host "Starting Cloudflare quick tunnel (keep this window open)..." -ForegroundColor Cyan
Write-Host "If login fails remotely, use screen share on localhost instead." -ForegroundColor Yellow
Write-Host ""

& $cf tunnel --url http://127.0.0.1:3001
