# One-shot pilot environment setup (SQLite dev)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "=== CMMS Pilot Setup ===" -ForegroundColor Cyan

if (-not (Test-Path .env)) {
  Copy-Item .env.example .env -ErrorAction SilentlyContinue
  Write-Host "Created .env — review DATABASE_URL and JWT_SECRET" -ForegroundColor Yellow
}

npx prisma generate
npx prisma db push
npm run prisma:seed
npm run prisma:seed:pilot

Write-Host "`nFor video walkthroughs, run (API must be up for schedule):" -ForegroundColor Cyan
Write-Host "  powershell -File .\scripts\prepare-demo-recording.ps1 -ScheduleOnly" -ForegroundColor DarkGray
Write-Host "  See docs/pilot/DEMO_RECORDING.md" -ForegroundColor DarkGray

Write-Host "`nStarting smoke test (API must be running in another terminal: npm run start:dev)..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
  powershell -File .\scripts\smoke-test.ps1
} catch {
  Write-Host "Smoke test skipped — start API with: npm run start:dev" -ForegroundColor Yellow
}

Write-Host "`nPilot setup done." -ForegroundColor Green
Write-Host "  API:     http://localhost:3000/api/v1"
Write-Host "  Admin:   admin@church.local / Admin@123"
Write-Host "  Leaders: choir.president@church.local | protocol.leader@church.local / Pilot@123"
