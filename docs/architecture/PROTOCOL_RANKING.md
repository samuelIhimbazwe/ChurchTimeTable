# Protocol Ranking

## Engines

- **Performance** — monthly/lifetime service counts from attendance
- **Reliability** — late, early, absences (reporting only, not assignment)
- **Ranking** — monthly ordered list with grade score

## Visibility

| Role | View |
|------|------|
| Protocol leaders / admins | Full ranking table (`protocol.ranking.view`) |
| Members | Own rank, grade, stats only |
| Optional | `membersCanViewFullRanking` setting |

## Badges

- Faithful Servant — 100% attendance
- Emergency Helper — many replacement services
- Team Supporter — replacement-found absences
- Reliable Member — no unexcused absences
- Most Active — highest monthly services

## API

```
POST /api/v1/protocol/rankings/generate { year, month }
GET  /api/v1/protocol/rankings/monthly?year=&month=
GET  /api/v1/protocol/rankings/lifetime
```
