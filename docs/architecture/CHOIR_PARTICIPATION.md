# Choir Participation

## Profile fields

- `officialServices`, `extraServices`, `serviceAttendanceRate`
- `rehearsalsScheduled`, `rehearsalsAttended`, `rehearsalAttendanceRate`
- `prayerSessionsScheduled`, `prayerSessionsAttended`, `prayerAttendanceRate`
- `lateArrivals`, `earlyDepartures`, `excusedAbsences`, `unexcusedAbsences`
- `overallParticipationScore`, `lifetimeParticipationScore`, `yearsActive`

## Overall score weights (default)

| Component | Weight |
|-----------|--------|
| Service attendance | 30% |
| Rehearsal attendance | 25% |
| Prayer attendance | 15% |
| Reliability | 20% |
| Service count | 10% |

## Dashboards

- `GET /choir/scheduling/dashboard` — leader view (upcoming activities, trends, missing members, rankings overview)
- `GET /choir/scheduling/dashboard/me` — member view (next service/rehearsal/prayer, badges, history)
