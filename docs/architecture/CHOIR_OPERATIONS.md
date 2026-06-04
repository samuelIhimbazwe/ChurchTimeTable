# Choir Operations (CHOIR-2)

Choir Operations extends MF-7 (Operations Engine) and aligns with Protocol Operations maturity. It does **not** replace rehearsals MVP, legacy attendance, or protocol teams.

## Core concepts

- **ChoirActivity** — services, rehearsals, prayer, concerts, retreats, trainings, meetings.
- **ChoirServiceAssignment** — links a choir to an `OperationOccurrence` with role (PRIMARY, SUPPORTING, CHILDREN, SPECIAL_GUEST).
- **ChoirAttendance** — per-activity member outcomes with configurable score weights.
- **ChoirMemberParticipationProfile** — separate service, rehearsal, and prayer statistics plus overall score.
- **ChoirSchedulePlan** — monthly through annual generated plans with leader overrides.
- **ChoirCategoryRankingEntry** — rankings and badges.

## API

Base path: `/api/v1/choir/scheduling`

See also: `CHOIR_SCHEDULING.md`, `CHOIR_ATTENDANCE.md`, `CHOIR_PARTICIPATION.md`, `CHOIR_RANKINGS.md`, `CHOIR_REPORTING.md`.

## Permissions

- `choir.ops.view` — view activities, calendar, own stats
- `choir.ops.manage` — create activities, full ops
- `choir.ops.schedule` — assignments, plans, adjustments
- `choir.ops.attendance` — record attendance
- `choir.ops.ranking.view` — rankings (leaders); members see own via `rankings/me`
- `choir.ops.report` — reports and exports

Choir president roles receive the bundle via `CHOIR_OPS_ADMIN_PERMISSIONS` in seed.

## Service slot defaults

Configurable via `ChoirServiceEligibility` per choir (no hardcoded choir count):

| Template | Default slots |
|----------|----------------|
| SUNDAY_SERVICE_1 | 1 children + 2 primary |
| SUNDAY_SERVICE_2 | 2 primary |
| TUESDAY_SERVICE | 1 primary |
| IGABURO | 1 primary |
| Last Sunday (SS2) | 2 primary + 1 fifth-Sunday choir |

Leaders may override any assignment; all changes are audited.

## Calendar

`GET /operations/calendar` returns occurrences plus `choirActivities` from the choir scheduling engine.
