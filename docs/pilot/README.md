# CMMS Pilot Package

Use this folder to run a **4–8 week pilot** with one choir + protocol team.

| Document | Purpose |
|----------|---------|
| [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md) | Sign-off gates before leaders use the app |
| [PILOT_RUNBOOK.md](./PILOT_RUNBOOK.md) | Weekly operations, roles, Sunday workflow |
| [ACCOUNTS.md](./ACCOUNTS.md) | Test accounts after `seed-pilot` |
| [RBAC_AND_ROLES.md](./RBAC_AND_ROLES.md) | Create roles, set permissions, assign leaders |
| [CHOIR_OFFICER_ROLES.md](./CHOIR_OFFICER_ROLES.md) | President, secretary, treasurer — separate access |
| [SPRINT_10.md](./SPRINT_10.md) | Choir family & contribution governance (v1.2 lock) |
| [SPRINT_10_2.md](./SPRINT_10_2.md) | **Next:** Contribution engine implementation spec |

## Quick start (development / church office LAN)

```powershell
# Terminal 1 — API
cd backend
.\scripts\pilot-setup.ps1    # DB + roles + sample data (once)
npm run start:dev

# Terminal 2 — smoke test
cd backend
.\scripts\smoke-test.ps1

# Terminal 3 — mobile (after Flutter install)
cd mobile
flutter pub get
flutter run --dart-define=CMMS_API_BASE=http://10.0.2.2:3000/api/v1
```

**Physical phone on same Wi‑Fi:** use your PC IP, e.g.  
`flutter run --dart-define=CMMS_API_BASE=http://192.168.1.20:3000/api/v1`

See root [README.md](../../README.md) for PostgreSQL production path when you outgrow SQLite.
