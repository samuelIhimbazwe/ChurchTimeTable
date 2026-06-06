# Restore PostgreSQL / deployment settings. Run from backend/: .\scripts\use-deployment-mode.ps1
param(
  [switch]$SkipMigrate
)

$ErrorActionPreference = "Stop"
$backendRoot = Split-Path $PSScriptRoot -Parent
Set-Location $backendRoot

function Set-SchemaProvider([string]$Provider) {
  $schemaPath = Join-Path $backendRoot "prisma\schema.prisma"
  $schema = Get-Content $schemaPath -Raw
  if ($Provider -eq "postgresql") {
    if ($schema -match 'provider = "sqlite"') {
      $schema = $schema -replace 'provider = "sqlite"', 'provider = "postgresql"'
      Set-Content $schemaPath $schema -NoNewline
      Write-Host "schema.prisma -> postgresql" -ForegroundColor Green
    }
  }
}

Write-Host "=== CMMS deployment mode (PostgreSQL) ===" -ForegroundColor Cyan

Set-SchemaProvider "postgresql"

if (Test-Path .env.deployment.backup) {
  Copy-Item .env.deployment.backup .env -Force
  Write-Host "Restored .env from .env.deployment.backup" -ForegroundColor Green
} else {
  Copy-Item .env.example .env -Force
  Write-Host "Restored .env from .env.example (set DATABASE_URL for your server)" -ForegroundColor Yellow
}

npx prisma generate

if (-not $SkipMigrate) {
  Write-Host "Run migrations against your Postgres DATABASE_URL:" -ForegroundColor Cyan
  Write-Host "  npx prisma migrate deploy"
  Write-Host "  npm run prisma:seed   # if needed on fresh DB"
}

Write-Host ""
Write-Host "Commit schema.prisma only when provider is postgresql." -ForegroundColor Yellow
