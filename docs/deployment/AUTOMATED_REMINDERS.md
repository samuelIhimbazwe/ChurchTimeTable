# Automated Reminders

## Scheduler

Hourly cron (`ReminderJobsTask`) runs:

- **REHEARSAL_TOMORROW** — 24 hours before `REHEARSAL` events; choir members receive date, time, location, choir name.
- **EVENT_REMINDER** — Configurable offsets (default 7, 2, 0 days before) for events with assignments.

## Rules

Managed in `NotificationRule` records. Disable a trigger to skip that job (logged as SKIPPED).

`EVENT_REMINDER` config example:

```json
{ "daysBefore": [7, 2, 0] }
```

## Delivery audit

Each send creates a `NotificationDeliveryLog` row: PENDING → SENT or FAILED. Dedupe keys prevent duplicate sends per event/member/day.

## Admin dashboard

`/dashboard/admin/reminders` — enabled rules, last/next execution, recipients, failures.

## Manual run (ops / e2e)

`POST /api/v1/reminders/run-now` (admin / pilot readiness permission).
