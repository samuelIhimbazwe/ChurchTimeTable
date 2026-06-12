# Build CMMS pilot APK against cloud API (Render).
# Does NOT change Vercel web or local dev defaults.
#
# Prerequisites: Flutter SDK + Android SDK (Android Studio).
# Run from repo:  .\mobile\scripts\build-pilot-apk.ps1
#
# Output: mobile\build\app\outputs\flutter-apk\app-release.apk

param(
  [string]$ApiBase = "https://cmms-api-ywcy.onrender.com/api/v1",
  [string]$FlutterPath = ""
)

$ErrorActionPreference = "Stop"
$mobileRoot = Split-Path $PSScriptRoot -Parent
Set-Location $mobileRoot

function Resolve-Flutter {
  param([string]$Explicit)
  if ($Explicit -and (Test-Path $Explicit)) { return $Explicit }
  $cmd = Get-Command flutter -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $candidates = @(
    "$env:LOCALAPPDATA\flutter\bin\flutter.bat",
    "$env:USERPROFILE\flutter\bin\flutter.bat",
    "C:\flutter\bin\flutter.bat",
    "C:\src\flutter\bin\flutter.bat"
  )
  foreach ($p in $candidates) {
    if (Test-Path $p) { return $p }
  }
  return $null
}

$flutter = Resolve-Flutter -Explicit $FlutterPath
if (-not $flutter) {
  Write-Host ""
  Write-Host "Flutter not found." -ForegroundColor Red
  Write-Host "  1. Install: https://docs.flutter.dev/get-started/install/windows"
  Write-Host "  2. Add flutter\bin to PATH, or rerun with:"
  Write-Host "     .\mobile\scripts\build-pilot-apk.ps1 -FlutterPath C:\path\to\flutter\bin\flutter.bat"
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "=== CMMS pilot APK (cloud API) ===" -ForegroundColor Cyan
Write-Host "  API: $ApiBase"
Write-Host "  Web demo unchanged: https://church-time-table.vercel.app"
Write-Host ""

if (-not (Test-Path "android")) {
  Write-Host "Creating Android platform (first time only)..." -ForegroundColor Yellow
  & $flutter create --platforms android .
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Resolving dependencies..." -ForegroundColor Cyan
& $flutter pub get
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Building release APK (may take several minutes)..." -ForegroundColor Cyan
& $flutter build apk --release --dart-define="CMMS_API_BASE=$ApiBase"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$apk = Join-Path $mobileRoot "build\app\outputs\flutter-apk\app-release.apk"
if (Test-Path $apk) {
  $dest = Join-Path $mobileRoot "build\cmms-pilot-release.apk"
  Copy-Item $apk $dest -Force
  Write-Host ""
  Write-Host "APK ready:" -ForegroundColor Green
  Write-Host "  $dest"
  Write-Host ""
  Write-Host "Send APK to boss (WhatsApp / Drive / email)." -ForegroundColor Yellow
  Write-Host "Login: member1@church.local / Pilot@123"
  Write-Host "First open may wait ~1 min while API wakes up."
  Write-Host ""
} else {
  Write-Host "Build finished but APK not found at expected path." -ForegroundColor Red
  exit 1
}
