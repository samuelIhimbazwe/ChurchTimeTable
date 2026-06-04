# Ministry Reporting (MF-3)

Operational reporting for ministry leaders and church admins.

## Endpoints

| Method | Path | Output |
|--------|------|--------|
| GET | `/ministries/:id/dashboard` | Live dashboard aggregates |
| GET | `/ministries/:id/reports/summary` | JSON metrics |
| GET | `/ministries/:id/reports/csv` | CSV export |
| GET | `/ministries/:id/reports/pdf` | PDF export (pdfkit) |

## Metrics

Member count, growth (30-day joins), leadership count, operational units, meetings, documents, announcements, recent activity snapshot.

## Rules

- `MinistrySettings.allowReporting` for exports where enforced.
- Permission: `ministry.report.view` or `ministry.manage`.
- Audit on export: `MINISTRY_REPORT_EXPORTED`.
