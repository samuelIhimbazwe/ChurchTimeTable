# Protocol monthly scheduling smoke test — API must be running
$ErrorActionPreference = "Stop"
$base = "http://localhost:3000/api/v1"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "=== Protocol Scheduling Test ===" -ForegroundColor Cyan

$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Headers $headers `
  -Body '{"email":"protocol.coordinator@church.local","password":"Pilot@123"}'
$token = $login.data.accessToken
$auth = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
Write-Host "OK Login as protocol coordinator" -ForegroundColor Green

$year = (Get-Date).Year
$month = (Get-Date).Month

$plans = Invoke-RestMethod -Uri "$base/protocol/scheduling/plans" -Headers $auth
Write-Host "OK List plans ($($plans.data.Count) existing)" -ForegroundColor Green

$existing = $plans.data | Where-Object { $_.year -eq $year -and $_.month -eq $month -and $_.status -ne 'PUBLISHED' }
if ($existing) {
  Write-Host "SKIP Draft plan already exists for ${month}/${year}" -ForegroundColor Yellow
  $planId = $existing[0].id
} else {
  $gen = Invoke-RestMethod -Uri "$base/protocol/scheduling/plans/generate" -Method POST -Headers $auth `
    -Body (@{ year = $year; month = $month } | ConvertTo-Json)
  $planId = $gen.data.id
  $entryCount = $gen.data.entries.Count
  Write-Host "OK Generated schedule for ${month}/${year} with $entryCount entries" -ForegroundColor Green
}

$plan = Invoke-RestMethod -Uri "$base/protocol/scheduling/plans/$planId" -Headers $auth
Write-Host "OK Plan status: $($plan.data.status), entries: $($plan.data.entries.Count)" -ForegroundColor Green

$print = Invoke-RestMethod -Uri "$base/protocol/scheduling/plans/$planId/print" -Headers $auth
$weekCount = $print.data.weeks.Count
$serviceCount = ($print.data.weeks | ForEach-Object { $_.services.Count } | Measure-Object -Sum).Sum
Write-Host "OK Print grid: $weekCount weeks, $serviceCount services" -ForegroundColor Green

if ($plan.data.status -eq 'GENERATED' -or $plan.data.status -eq 'DRAFT') {
  Invoke-RestMethod -Uri "$base/protocol/scheduling/plans/$planId/approve" -Method POST -Headers $auth | Out-Null
  Write-Host "OK Approved schedule" -ForegroundColor Green
}

if ($plan.data.status -ne 'PUBLISHED') {
  $pub = Invoke-RestMethod -Uri "$base/protocol/scheduling/plans/$planId/publish" -Method POST -Headers $auth
  Write-Host "OK Published schedule (status: $($pub.data.status))" -ForegroundColor Green
} else {
  Write-Host "SKIP Already published" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "All protocol scheduling checks passed." -ForegroundColor Cyan
Write-Host "Web UI: http://localhost:3001/en/protocol/scheduling/$planId" -ForegroundColor Cyan
