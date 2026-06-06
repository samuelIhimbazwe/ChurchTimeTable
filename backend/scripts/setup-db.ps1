# CMMS database setup - tries PostgreSQL (Docker) first, falls back to SQLite
param(
  [switch]$SqliteOnly,
  [switch]$AllowDbPush
)

$backendRoot = Split-Path $PSScriptRoot -Parent
Set-Location $backendRoot

function Use-Postgres {
  Copy-Item .env.example .env -Force
  $schema = Get-Content prisma\schema.prisma -Raw
  if ($schema -match 'provider = "sqlite"') {
    $schema = $schema -replace 'provider = "sqlite"', 'provider = "postgresql"'
    Set-Content prisma\schema.prisma $schema -NoNewline
  }
}

function Use-Sqlite {
  if (Test-Path .env.sqlite) {
    Copy-Item .env.sqlite .env -Force
  } elseif (Test-Path .env.sqlite.example) {
    Copy-Item .env.sqlite.example .env -Force
  } else {
    Write-Error "Missing .env.sqlite or .env.sqlite.example"
  }
  $schema = Get-Content prisma\schema.prisma -Raw
  if ($schema -match 'provider = "postgresql"') {
    $schema = $schema -replace 'provider = "postgresql"', 'provider = "sqlite"'
    $schema = $schema -replace '@db\.Decimal\(12, 2\)', ''
    Set-Content prisma\schema.prisma $schema -NoNewline
  }
}

if ($SqliteOnly) {
  Use-Sqlite
} else {
  Write-Host "Starting Docker PostgreSQL..."
  docker compose up -d
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Docker unavailable - using SQLite fallback (.env.sqlite)"
    Use-Sqlite
  } else {
    Use-Postgres
    Start-Sleep -Seconds 8
  }
}

npx prisma generate
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
  if ($AllowDbPush -or $SqliteOnly) {
    Write-Warning "migrate deploy failed - running db push (dev fallback only)."
    npx prisma db push --accept-data-loss
  } else {
    Write-Error @"
Prisma migrate deploy failed.

Production and CI must use migrations only. Fix the migration error, or for
local SQLite dev run: .\scripts\setup-db.ps1 -SqliteOnly -AllowDbPush
"@
    exit 1
  }
}
npm run prisma:seed
Write-Host "Database ready."
