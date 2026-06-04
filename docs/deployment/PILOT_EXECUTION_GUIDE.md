# Pilot Execution Guide

## Week 0 — Install

1. Deploy backend and web.
2. Run migrations and seed (`prisma:seed`, `prisma:seed:pilot`).
3. Open **Deployment center** → **Church setup wizard**.
4. Complete all 7 steps and review readiness score.

## Week 0 — Data

1. Open **Import center** (`/dashboard/admin/deployment/imports`).
2. Import members, then choir/protocol/ministries as needed.
3. Use preview and conflict strategy before each confirm.
4. Review **Import history** for errors.

## Week 0 — Operations

1. Open **Reminder dashboard** (`/dashboard/admin/reminders`).
2. Confirm `REHEARSAL_TOMORROW` and `EVENT_REMINDER` rules are enabled.
3. Optionally `POST /api/v1/reminders/run-now` after seeding test events.
4. Download **Go-live report** from reminders page or API.

## Week 1 — Pilot users

- Distribute accounts from `docs/pilot/ACCOUNTS.md`.
- Members use mobile **Member portal** (home, membership, broadcasts, invitations, requests).
- Leaders use web dashboards per role.

## Verification

```bash
cd backend
npm run test:e2e -- --testPathPattern="import-confirmation|setup-wizard|mobile-member-portal|notification-integration|go-live-ready"
```

Set `CMMS_E2E_VERIFIED=true` in production env after a green run.

## Support

- Deployment docs: `docs/deployment/`
- No raw API required for administrators when using Import Center and setup wizard.
