# CMMS API smoke test — run while `npm run start:dev` is up
$base = "http://localhost:3000/api/v1"
$headers = @{ "Content-Type" = "application/json"; "Accept-Language" = "rw" }

Write-Host "=== CMMS Smoke Test ===" -ForegroundColor Cyan

$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Headers $headers `
  -Body '{"email":"admin@church.local","password":"Admin@123"}'
$token = $login.data.accessToken
$auth = @{ Authorization = "Bearer $token"; "Accept-Language" = "rw" }
Write-Host "[OK] Login" -ForegroundColor Green

$events = Invoke-RestMethod -Uri "$base/events?limit=5" -Headers $auth
$count = $events.data.items.Count
Write-Host "[OK] Events list ($count items)" -ForegroundColor Green

$dash = Invoke-RestMethod -Uri "$base/dashboard/leader-summary" -Headers $auth
Write-Host "[OK] Leader dashboard (upcoming=$($dash.data.upcomingEvents), swaps=$($dash.data.pendingSwaps))" -ForegroundColor Green

$members = Invoke-RestMethod -Uri "$base/members?limit=3" -Headers $auth
Write-Host "[OK] Members list ($($members.data.items.Count) items)" -ForegroundColor Green

$sync = Invoke-RestMethod -Uri "$base/sync/conflicts" -Headers $auth
Write-Host "[OK] Sync conflicts ($($sync.data.Count) rows)" -ForegroundColor Green

Write-Host "`nAll smoke checks passed." -ForegroundColor Cyan
