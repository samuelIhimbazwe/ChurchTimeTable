# Switch to SQLite local dev (no Docker). Run from backend/: .\scripts\use-local-dev.ps1
param(
  [switch]$SkipSeed,
  [switch]$WithPilotAccounts
)

$ErrorActionPreference = "Stop"
$backendRoot = Split-Path $PSScriptRoot -Parent
Set-Location $backendRoot

function Set-SchemaProvider([string]$Provider) {
  $schemaPath = Join-Path $backendRoot "prisma\schema.prisma"
  $schema = Get-Content $schemaPath -Raw
  if ($Provider -eq "sqlite") {
    if ($schema -match 'provider = "postgresql"') {
      $schema = $schema -replace 'provider = "postgresql"', 'provider = "sqlite"'
      Set-Content $schemaPath $schema -NoNewline
      Write-Host "schema.prisma -> sqlite" -ForegroundColor Green
    }
  } else {
    if ($schema -match 'provider = "sqlite"') {
      $schema = $schema -replace 'provider = "sqlite"', 'provider = "postgresql"'
      Set-Content $schemaPath $schema -NoNewline
      Write-Host "schema.prisma -> postgresql" -ForegroundColor Green
    }
  }
}

Write-Host "=== CMMS local dev (SQLite) ===" -ForegroundColor Cyan

if (Test-Path .env) {
  Copy-Item .env .env.deployment.backup -Force
  Write-Host "Saved current .env -> .env.deployment.backup (restore with use-deployment-mode.ps1)" -ForegroundColor Yellow
}

Copy-Item .env.sqlite.example .env -Force
Set-SchemaProvider "sqlite"

Write-Host "Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate

Write-Host "Applying schema (db push)..." -ForegroundColor Cyan
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not $SkipSeed) {
  Write-Host "Seeding database..." -ForegroundColor Cyan
  npm run prisma:seed
  if ($WithPilotAccounts) {
    npm run prisma:seed:pilot
  }
}

Write-Host ""
Write-Host "Local dev ready." -ForegroundColor Green
Write-Host "  API:  npm run start:dev   -> http://localhost:3000/api/v1"
Write-Host "  Web:  npm run dev --prefix ../web   -> http://localhost:3001"
Write-Host "  Admin: admin@church.local / Admin@123"
if ($WithPilotAccounts) {
  Write-Host "  Member: member1@church.local / Pilot@123"
}
Write-Host ""
Write-Host "When deploying again: .\scripts\use-deployment-mode.ps1" -ForegroundColor Yellow
