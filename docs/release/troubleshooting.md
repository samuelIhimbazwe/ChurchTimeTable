# Troubleshooting

## E2E / local dev

| Symptom | Fix |
|---------|-----|
| `Response from the Engine was empty` | Run `npm run test:e2e` (auto setup) or `.\scripts\setup-db.ps1 -SqliteOnly -AllowDbPush` |
| `P3019` migration provider mismatch | Use Postgres for migrate deploy; SQLite uses `db push` |
| Login fails after seed | Use `admin@church.local` / `Admin@123` |

## Production

| Symptom | Fix |
|---------|-----|
| 403 on choir routes | Verify role permissions in Admin → roles or re-run seed on staging |
| Welfare PDF empty | Check `ReportsService` logs; verify case data exists |
| Mobile offline stale | Pull to refresh; clear app data if needed |

## Support escalation

1. Capture request ID / timestamp
2. Check audit log for welfare/contribution actions
3. Restore from backup if data integrity issue
