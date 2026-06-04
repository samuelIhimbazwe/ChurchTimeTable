# Data Migration Review

**Date:** 2026-05-31

## Production path (PostgreSQL)

1. `npx prisma migrate deploy` — applies 10 migrations in `prisma/migrations/`
2. `npm run prisma:seed` — roles, permissions, admin user
3. Optional: `npm run prisma:seed:pilot` — sample choir users

## Upgrade scenarios

| Data | Migration | Risk |
|------|-----------|------|
| Existing members | Additive schema — member table unchanged core | Low |
| Leadership history | `FamilyLeadershipHistory` additive | Low |
| Contributions (Sprint 10) | No schema redesign this sprint | None |
| Welfare cases | New tables via choir migrations | Low — empty on first deploy |
| Music / rehearsals | New tables | Low |
| Choir documents/meetings/uniforms/equipment | New tables | Low |

## SQLite dev vs Postgres prod

| Environment | Tool |
|-------------|------|
| Local dev / E2E | `prisma db push` on SQLite |
| Production | `prisma migrate deploy` on PostgreSQL |

**Important:** `migration_lock.toml` specifies `postgresql`. Do not run `migrate deploy` against SQLite without provider alignment.

## Rollback

- Database: restore from backup (see `docs/release/restore.md`)
- Application: deploy previous container/image tag

## Verdict

**Additive migrations only** for choir module — existing church data (members, contributions, events) preserved.  
**Validate on staging:** Run full migrate + seed against copy of production DB before go-live.
