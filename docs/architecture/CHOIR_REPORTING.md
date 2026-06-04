# Choir Reporting

## Reports

| Endpoint | Purpose |
|----------|---------|
| `GET /reports/participation` | Member participation profiles |
| `GET /reports/attendance?type=SERVICE\|REHEARSAL\|PRAYER` | Attendance by activity type |
| `GET /reports/health` | Choir health summary (avg participation, at-risk count) |

Exports are audited (`CHOIR_REPORT_EXPORTED`). CSV/PDF export hooks are reserved for a follow-up UI sprint.

## Search

`GET /choir/scheduling/search?q=` returns activities, plans, rankings, and badges matching the query (leaders/oversight).
