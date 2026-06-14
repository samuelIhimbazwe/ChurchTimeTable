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

- `/protocol` — member and officer dashboard (composed nav)
- `/protocol/teams` — team list + publish queue
- `/protocol/replacements` — replacement console
- `/protocol/claims` — membership claims console
- `/protocol/rankings` — monthly standings
- `/protocol/reports` — team leader reports + CSV exports
- `/portal/protocol` — member stats

## Mobile

Route: `/protocol` — assignments, attendance history, stats (offline cache).
