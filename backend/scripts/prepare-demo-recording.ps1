# Reset presentation-ready demo data for product walkthrough videos.
# Usage:
#   powershell -File scripts/prepare-demo-recording.ps1
#   powershell -File scripts/prepare-demo-recording.ps1 -ScheduleOnly
param(
  [switch]$ScheduleOnly
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$base = "http://localhost:3000/api/v1"

function Invoke-DemoLogin {
  param([string]$Email)
  $login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body (@{ email = $Email; password = "Pilot@123" } | ConvertTo-Json)
  return @{
    Authorization = "Bearer $($login.data.accessToken)"
    "Content-Type"  = "application/json"
  }
}

if (-not $ScheduleOnly) {
  Write-Host "=== Demo recording prepare ===" -ForegroundColor Cyan
  Write-Host ">> prisma:seed (baseline roles & catalog)" -ForegroundColor DarkGray
  npm run prisma:seed | Out-Null
  Write-Host ">> prisma:seed:pilot (accounts & occurrences)" -ForegroundColor DarkGray
  npm run prisma:seed:pilot | Out-Null
  Write-Host ">> prisma:seed:demo-recording (presentation data)" -ForegroundColor DarkGray
  npm run prisma:seed:demo-recording
}

Write-Host ""
Write-Host ">> Protocol monthly schedule (requires running API)" -ForegroundColor Cyan
try {
  $auth = Invoke-DemoLogin "protocol.coordinator@church.local"
  $year = (Get-Date).Year
  $month = (Get-Date).Month

  $plans = Invoke-RestMethod -Uri "$base/protocol/scheduling/plans" -Headers $auth
  $existing = @($plans.data) | Where-Object {
    $_.year -eq $year -and $_.month -eq $month
  } | Select-Object -First 1

  if ($existing) {
    $planId = $existing.id
    Write-Host "  Using existing plan for $month/$year ($($existing.status))" -ForegroundColor Yellow
  } else {
    $gen = Invoke-RestMethod -Uri "$base/protocol/scheduling/plans/generate" -Method POST -Headers $auth `
      -Body (@{ year = $year; month = $month } | ConvertTo-Json)
    $planId = $gen.data.id
    Write-Host "  Generated schedule plan $planId" -ForegroundColor Green
  }

  $plan = Invoke-RestMethod -Uri "$base/protocol/scheduling/plans/$planId" -Headers $auth
  if ($plan.data.status -eq "GENERATED" -or $plan.data.status -eq "DRAFT") {
    Invoke-RestMethod -Uri "$base/protocol/scheduling/plans/$planId/approve" -Method POST -Headers $auth | Out-Null
    Write-Host "  Approved schedule" -ForegroundColor Green
  }
  if ($plan.data.status -ne "PUBLISHED") {
    Invoke-RestMethod -Uri "$base/protocol/scheduling/plans/$planId/publish" -Method POST -Headers $auth | Out-Null
    Write-Host "  Published schedule" -ForegroundColor Green
  } else {
    Write-Host "  Schedule already published" -ForegroundColor DarkGray
  }

  $print = Invoke-RestMethod -Uri "$base/protocol/scheduling/plans/$planId/print" -Headers $auth
  $weeks = @($print.data.weeks).Count
  Write-Host "  Bulletin grid: $weeks weeks ready" -ForegroundColor Green
} catch {
  Write-Host "  Schedule step skipped — start API first: npm run start:dev" -ForegroundColor Yellow
  Write-Host "  Then re-run: powershell -File scripts/prepare-demo-recording.ps1 -ScheduleOnly" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Ready to record at http://localhost:3001/login" -ForegroundColor Cyan
Write-Host "  Protocol:  protocol.coordinator@church.local / Pilot@123" -ForegroundColor DarkGray
Write-Host "  Treasurer: choir.treasurer@church.local / Pilot@123" -ForegroundColor DarkGray
Write-Host "  See docs/pilot/DEMO_RECORDING.md for the checklist." -ForegroundColor DarkGray
