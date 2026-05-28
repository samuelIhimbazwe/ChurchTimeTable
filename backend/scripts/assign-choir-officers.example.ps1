# Example: assign choir officer roles to real church emails
# Edit emails, then run from backend folder:
#   powershell -File .\scripts\assign-choir-officers.example.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$assign = { param($email, $role)
  npx ts-node scripts/assign-user-role.ts $email $role --replace
}

& $assign "perezida@yourchurch.local" "CHOIR_PRESIDENT"
& $assign "vice.perezida@yourchurch.local" "CHOIR_VICE_PRESIDENT"
& $assign "umunyamabanga@yourchurch.local" "CHOIR_SECRETARY"
& $assign "umubitsi@yourchurch.local" "CHOIR_TREASURER"
& $assign "imyitozo@yourchurch.local" "CHOIR_REHEARSAL_DIRECTOR"
& $assign "ibikoresho@yourchurch.local" "CHOIR_LOGISTICS"

Write-Host "Done. Each officer must log out and log in again." -ForegroundColor Green
