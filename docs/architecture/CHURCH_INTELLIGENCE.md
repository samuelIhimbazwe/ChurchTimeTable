# Church Intelligence (MF-6)

Church-wide governance and intelligence layer aggregating MF-1 through MF-5 data.

## Scope

- Church health summary and dashboard
- Ministry and operational unit health scoring
- Governance alerts
- Leadership analytics
- Church activity feed
- Reporting center (CSV/PDF)
- Succession tracking foundation (`LeadershipTerm`)

## Out of scope

Protocol workflows, national/regional reporting, multi-church BI, AI predictions.

## API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/church/intelligence/summary` | `church.intelligence.view` |
| GET | `/church/intelligence/dashboard` | `church.intelligence.view` |
| GET | `/church/intelligence/ministry-health` | `church.intelligence.view` |
| GET | `/church/intelligence/unit-health` | `church.intelligence.view` |
| GET | `/church/intelligence/alerts` | `church.governance.view` |
| GET | `/church/activity` | `church.intelligence.view` |
| GET | `/leadership/analytics` | `church.intelligence.view` |
| GET | `/church/intelligence/reports` | `church.reports.view` |

## Module

`backend/src/church-intelligence/`

Health scores are computed on read from meetings, announcements, devotions, membership, finance, and assets — no separate score tables required for MF-6 foundation.
