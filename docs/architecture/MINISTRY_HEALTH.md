# Ministry Health (MF-6)

## MinistryHealthScore

Per-ministry computed scores:

- `engagementScore` — member activity vs membership
- `leadershipScore` — active leadership assignments
- `activityScore` — meetings and platform activity
- `communicationScore` — announcements, devotions, documents
- `operationalScore` — operational units
- `overallScore` — weighted composite

## Status bands

| Score | Status |
|-------|--------|
| ≥ 85 | EXCELLENT |
| ≥ 70 | HEALTHY |
| ≥ 50 | WATCHLIST |
| ≥ 25 | AT_RISK |
| < 25 | INACTIVE |

Inactive ministries (`isActive: false`) map to INACTIVE regardless of score.

## API

- `GET /church/intelligence/ministry-health`
- `GET /church/intelligence/ministry-health/:ministryId`
