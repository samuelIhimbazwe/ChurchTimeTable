# Restore Guide

## Database restore (PostgreSQL)

```bash
# Stop API to prevent writes
pg_restore -h HOST -U USER -d cmms --clean --if-exists cmms-YYYY-MM-DD.dump
cd backend && npx prisma migrate deploy
npm run start:prod
```

## Partial restore

- **Contributions:** Restore full DB — do not partial-restore finance tables alone (Sprint 10 ledger integrity)
- **Welfare:** Cases are additive; restore from backup if corruption suspected

## Mobile offline cache

Users may need to pull-to-refresh after restore — Hive cache is device-local.

## Rollback application

Deploy previous known-good Docker image / release tag without DB restore if issue is code-only.
