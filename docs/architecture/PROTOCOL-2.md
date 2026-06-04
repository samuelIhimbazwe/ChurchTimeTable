# Protocol Operations Refinement (PROTOCOL-2)

Extends [PROTOCOL-1](./PROTOCOL_ENGINE.md) without replacing existing behaviour.

## Team leaders

Permanent `ProtocolTeamLeader` records (one per choir + one non-choir). Each `ProtocolOccurrenceTeam` gets exactly one leader via `ProtocolOccurrenceTeamLeader`.

Coordinator assigns or overrides; system recommends based on singing choir on the occurrence.

## Attendance scoring

Outcomes renamed: `ABSENT_SELF_REPLACED` (was `ABSENT_REPLACEMENT_FOUND`).

Default grades stored in `ProtocolEngineSettings`; `attendanceScoreEarned` persisted on each `ProtocolTeamAttendance`.

## Multi-category rankings

Categories: `ATTENDANCE`, `RELIABILITY`, `SERVICE_COUNT`, `REPLACEMENT_SUPPORT`, `TEAMWORK`, `OVERALL`.

Overall uses configurable weights (default 30/30/20/10/10).

## Backups

`ProtocolOccurrenceTeamBackup` — recommended pool (default 3) not counted unless called.

## Team reports

`ProtocolTeamReport` — submitted by team leader after service.

## Visibility

| Role | Access |
|------|--------|
| Coordinator | All rankings, members, backups, reports |
| Team leader | Own teams, attendance, reports |
| Member | `GET /protocol/my-ranking`, `GET /protocol/my-statistics` only |

## API (PROTOCOL-2)

```
GET/POST  /protocol/team-leaders
GET/PATCH /protocol/team-leaders/:id
POST      /protocol/teams/:teamId/leader
GET       /protocol/backups?teamId=
GET       /protocol/rankings/categories
GET       /protocol/my-ranking
GET       /protocol/my-statistics
POST      /protocol/reports
GET       /protocol/dashboard/team-leader
```

## Low-participation engine

`GET /protocol/occurrences/:id/low-participation` — recommends members with lower recent service counts for special events and non-Sunday services.
