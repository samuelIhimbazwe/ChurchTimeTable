# CMMS database setup - tries PostgreSQL (Docker) first, falls back to SQLite
param(
  [switch]$SqliteOnly
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
  Copy-Item .env.sqlite .env -Force
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
  npx prisma db push --accept-data-loss
}
npm run prisma:seed
Write-Host "Database ready."
