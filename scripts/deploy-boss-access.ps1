# One-time setup: permanent URL for boss to test anytime (no laptop, no tunnel).
# Run from repo root:  .\scripts\deploy-boss-access.ps1

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$backendRoot = Join-Path $repoRoot "backend"

Write-Host ""
Write-Host "=== CMMS — permanent boss access (free cloud) ===" -ForegroundColor Cyan
Write-Host ""

# 1. PostgreSQL schema (required for Neon / Render)
$schemaPath = Join-Path $backendRoot "prisma\schema.prisma"
$schema = Get-Content $schemaPath -Raw
if ($schema -match 'provider = "sqlite"') {
  Write-Host "Switching Prisma to PostgreSQL for cloud deploy..." -ForegroundColor Yellow
  & (Join-Path $backendRoot "scripts\use-deployment-mode.ps1") -SkipMigrate
}

Write-Host ""
Write-Host "STEP 1 — Free database (Neon)" -ForegroundColor Green
Write-Host "  1. Open https://neon.tech and sign up (free)"
Write-Host "  2. New project -> copy the Postgres connection string"
Write-Host "     (looks like: postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require)"
Write-Host ""

Write-Host "STEP 2 — Push code to GitHub" -ForegroundColor Green
Write-Host "  Render deploys from GitHub. Commit and push your latest code if you have not already."
Write-Host ""

Write-Host "STEP 3 — Deploy on Render (free)" -ForegroundColor Green
Write-Host "  1. Open https://dashboard.render.com"
Write-Host "  2. New -> Blueprint"
Write-Host "  3. Connect this repository"
Write-Host "  4. When asked for DATABASE_URL, paste your Neon connection string"
Write-Host "  5. Wait for both services (cmms-api + cmms-web) to finish building"
Write-Host ""

Write-Host "STEP 4 — Send boss ONE link" -ForegroundColor Green
Write-Host "  URL:  https://cmms-web.onrender.com  (or the name Render gives cmms-web)"
Write-Host "  Login:"
Write-Host "    member1@church.local / Pilot@123"
Write-Host "    church.coord@church.local / Pilot@123"
Write-Host "    choir.president@church.local / Pilot@123"
Write-Host ""

Write-Host "IMPORTANT" -ForegroundColor Yellow
Write-Host "  - Free tier sleeps after ~15 minutes with no visitors."
Write-Host "    First open after sleep may take up to ~1 minute — that is normal."
Write-Host "  - Your laptop can be OFF. Boss tests from phone or PC anytime."
Write-Host "  - No Zoom, no tunnel, no localhost."
Write-Host ""

Write-Host "After deploy, verify:" -ForegroundColor Cyan
Write-Host "  Open the web URL -> /login -> sign in as member1@church.local"
Write-Host ""

$open = Read-Host "Open Neon signup in browser now? (y/n)"
if ($open -eq 'y') { Start-Process "https://neon.tech" }
