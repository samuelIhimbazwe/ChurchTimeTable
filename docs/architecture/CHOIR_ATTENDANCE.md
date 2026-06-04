# Choir Attendance

## Outcomes

| Outcome | Default score |
|---------|---------------|
| PRESENT_FULL | 100 |
| PRESENT_LATE | 80 |
| PRESENT_LEFT_EARLY | 75 |
| PRESENT_LATE_LEFT_EARLY | 50 |
| ABSENT_EXCUSED | 20 |
| ABSENT_UNEXCUSED | 0 |

Weights are stored on `ChoirEngineSettings` (`id: default`) and configurable later.

## Recording

`POST /choir/scheduling/attendance` upserts `ChoirAttendance` and refreshes `ChoirMemberParticipationProfile` for the member's choir.

Service, rehearsal, and prayer statistics are tracked **independently** on the profile.

## Legacy rehearsals

`RehearsalPlan` / `RehearsalAttendance` remain unchanged. CHOIR-2 attendance is the participation engine for rankings and dashboards.
