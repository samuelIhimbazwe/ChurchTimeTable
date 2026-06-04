# Protocol Reporting

## Reports

| Report | Endpoint |
|--------|----------|
| Monthly service | `GET /protocol/reports/monthly-service` |
| Attendance | Derived from member profiles |
| Replacements | `ProtocolReplacementsService` list |
| Reliability | `GET /protocol/reports/reliability/export` |
| Ranking | Monthly ranking entries |
| Member performance | Member profile + badges |

## Export

CSV via:

```
GET /api/v1/protocol/reports/monthly-service/export?year=&month=
GET /api/v1/protocol/reports/reliability/export
```

Requires `protocol.report`.

## Web dashboards

- `/dashboard/protocol`
- `/dashboard/protocol/teams`
- `/dashboard/protocol/attendance`
- `/dashboard/protocol/replacements`
- `/dashboard/protocol/rankings`
- `/dashboard/protocol/reports`
- `/dashboard/protocol/members`

## Mobile

Route: `/protocol` — assignments, attendance history, stats (offline cache).
