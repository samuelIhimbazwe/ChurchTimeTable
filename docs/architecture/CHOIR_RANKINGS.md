# Choir Rankings & Badges

## Categories

- SERVICE_ATTENDANCE
- REHEARSAL_ATTENDANCE
- PRAYER_ATTENDANCE
- RELIABILITY
- SERVICE_COUNT
- OVERALL

`POST /choir/scheduling/rankings/generate` rebuilds entries for a choir and period.

## Visibility

- Choir leaders with `choir.ops.ranking.view` see full rankings
- Members use `GET /rankings/me` for own placement only
- Church admins with oversight see all

## Badges

Awarded on ranking generation when thresholds are met:

Perfect Service Attendance, Perfect Rehearsal Attendance, Prayer Champion, Reliable Singer, Service Veteran, Choir Supporter, Attendance Champion, Faithful Member.
