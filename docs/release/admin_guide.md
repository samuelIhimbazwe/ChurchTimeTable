# Choir Module — Admin Guide

## Roles

Seed defines choir officer roles in `prisma/seed.ts`. Customize permissions per church policy — see `docs/pilot/CHOIR_OFFICER_ROLES.md`.

## Key permissions

| Permission | Capability |
|------------|------------|
| `choir.welfare.manage` | Create/review/assist/close cases |
| `choir.music.manage` | Manage song library |
| `choir.rehearsal.manage` | Plans, attendance |
| `choir.operations.manage` | Documents, meetings, uniforms, equipment |

## Seeding pilot users

```bash
cd backend
npm run prisma:seed:pilot
```

Default pilot password documented in seed-pilot output.

## Upgrades

1. Backup database
2. `npx prisma migrate deploy`
3. Deploy new API + web builds
4. Notify users to refresh mobile app

## Audit

Welfare case actions appear in case audit tab and system audit log (admin permission required).
