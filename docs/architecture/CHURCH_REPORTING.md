# Church Reporting (MF-6)

## Report catalog

- Ministry Health
- Operational Unit Health
- Leadership Activity
- Governance Alerts
- Church Activity
- Growth Summary

## API

- `GET /church/intelligence/reports` — catalog
- `GET /church/intelligence/reports/:reportType` — JSON data
- `GET /church/intelligence/reports/:reportType/csv` — export (`church.reports.export`)
- `GET /church/intelligence/reports/:reportType/pdf` — export

Report generation is audited (`CHURCH_INTELLIGENCE_REPORT_GENERATED`).
