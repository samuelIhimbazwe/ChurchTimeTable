# Succession Tracking (MF-6)

## LeadershipTerm

Foundation model for leadership history and future succession planning.

| Field | Purpose |
|-------|---------|
| assignmentScope | MINISTRY or OPERATIONAL_UNIT |
| assignmentId | Links to leadership assignment |
| startedAt | Term start |
| expectedEndAt | Planned end |
| endedAt | Actual end |
| notes | Free text |

No election workflow in MF-6.

## API

- `GET /church/intelligence/leadership-terms`
- `POST /church/intelligence/leadership-terms` (`church.governance.manage`)

Overdue terms (`expectedEndAt` passed, `endedAt` null) trigger `MISSING_SUCCESSION` alerts.
