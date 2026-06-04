# Leadership Analytics (MF-6)

Tracks leadership engagement across ministry and operational unit assignments.

## Metrics

- Active assignments
- Average assignment duration
- Meetings attended (as attendee)
- Reports submitted (audit trail)
- Activity level: high | medium | low | inactive

## API

- `GET /leadership/analytics`
- `GET /leadership/analytics/:memberId`

Access is audited (`CHURCH_LEADERSHIP_ANALYTICS_VIEWED`).
