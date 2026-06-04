# Training / Demo Mode

Generate pilot sample data without manual SQL.

## API

| Method | Path |
|--------|------|
| POST | `/api/v1/setup/demo/generate` |
| GET | `/api/v1/setup/demo/status` |

Runs `npm run prisma:seed:pilot` and sets `demoModeEnabled` on `ChurchConfiguration`.

## Accounts

See `docs/pilot/ACCOUNTS.md` — password `Pilot@123` for pilot users, `Admin@123` for admin.
