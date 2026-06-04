# Protocol Attendance

## Outcomes

| Outcome | Meaning |
|---------|---------|
| `PRESENT_FULL` | On time, finished |
| `PRESENT_LEFT_EARLY` | On time, left early |
| `PRESENT_LATE` | Late, finished |
| `PRESENT_LATE_LEFT_EARLY` | Late, left early |
| `ABSENT_EXCUSED` | Did not attend, approved reason |
| `ABSENT_SELF_REPLACED` | Did not attend, found replacement |
| `ABSENT_UNEXCUSED` | Did not attend, no excuse |

## Service credit

**Only recorded attendance updates statistics.** Scheduling alone gives zero credit.

Credit outcomes: all `PRESENT_*` types. Replacement members receive credit when they serve with a present outcome.

## Grading (configurable)

| Outcome | Default grade |
|---------|---------------|
| PRESENT_FULL | 100 |
| PRESENT_LATE | 90 |
| PRESENT_LEFT_EARLY | 85 |
| PRESENT_LATE_LEFT_EARLY | 70 |
| ABSENT_SELF_REPLACED | 40 |
| ABSENT_EXCUSED | 20 |
| ABSENT_UNEXCUSED | 0 |

## API

`POST /api/v1/protocol/attendance` with `{ teamMemberId, outcome, notes? }`

Team must be at least `REVIEWED` before attendance is accepted.
