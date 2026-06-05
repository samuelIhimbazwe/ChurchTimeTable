# CMMS backend — local staging deploy with demo data
# Usage: cd backend; .\scripts\deploy-staging.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host 'Created .env from .env.example — review DATABASE_URL before production.'
}

Write-Host '>> prisma generate'
npx prisma generate

Write-Host '>> prisma db push (fresh schema on staging DB)'
npx prisma db push --accept-data-loss

Write-Host '>> base seed — roles, choirs, templates, admin'
npm run prisma:seed

Write-Host '>> pilot seed — demo users and sample schedules'
npm run prisma:seed:pilot

Write-Host '>> build'
npm run build

Write-Host ''
Write-Host 'Staging ready. Start API with:'
Write-Host '  npm run start:prod'
Write-Host ''
Write-Host 'Test login:'
Write-Host '  POST http://localhost:3000/api/v1/auth/login'
Write-Host '  body: email admin@church.local password Admin@123'
Write-Host ''
Write-Host 'More pilot accounts: docs/pilot/ACCOUNTS.md password Pilot@123'
