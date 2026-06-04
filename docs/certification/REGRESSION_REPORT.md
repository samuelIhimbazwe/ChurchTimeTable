# Backend E2E Regression Report

**Date:** 2026-05-31  
**Command:** `cd backend && npm run test:e2e`  
**Result:** ✅ **PASS** — 32 suites, **171 tests**, 0 failures

## Summary

| Metric | Value |
|--------|-------|
| Test suites | 32 |
| Tests | 171 |
| Failures | 0 |
| Duration | ~172s (serial) |
| Workers | 1 (`jest-e2e.json`) |

## Fixes applied this sprint

1. **Missing database** — E2E previously crashed with `Response from the Engine was empty` when no `.env` / DB existed.
2. **E2E global setup** — Added `test/e2e-global-setup.ts` + `e2e-setup-env.ts`:
   - Isolated SQLite DB: `prisma/e2e-test.db`
   - `prisma db push` + `npm run prisma:seed` before tests
3. **Provider mismatch** — Production migrations target PostgreSQL (`migration_lock.toml`); E2E uses SQLite schema push (documented limitation).

## Choir-related suites (included in 171)

- `choir-welfare.e2e-spec.ts`
- `choir-welfare-reporting.e2e-spec.ts`
- `choir-music.e2e-spec.ts`
- `choir-rehearsals.e2e-spec.ts`
- `choir-reporting-center.e2e-spec.ts`
- `choir-launch-closure.e2e-spec.ts`
- `search.e2e-spec.ts` (choir search extensions)
- Sprint 10 contribution/family suites (frozen architecture — unchanged)

## Known limitations

| Area | Limitation |
|------|------------|
| SQLite vs Postgres | E2E runs on SQLite via `db push`; CI/production should use `prisma migrate deploy` on PostgreSQL |
| Parallelism | `maxWorkers: 1` avoids Prisma engine contention on Windows |
| Notifications | Occasional engine flake if multiple Nest apps share one DB without setup (mitigated by isolated e2e DB) |
| Seed dependency | Tests assume `prisma/seed.ts` admin user `admin@church.local` |

## Re-run instructions

```bash
cd backend
npm run test:e2e
```

No manual `.env` required for E2E; setup runs automatically.
