# Protocol Operations Engine (PROTOCOL-1)

## Purpose

Temporary protocol teams are generated **per operation occurrence** (MF-7), not as permanent monthly teams.

```
OperationOccurrence → ProtocolOccurrenceTeam → Attendance → Statistics → Archive
```

Legacy `ProtocolServiceTeam` (month/year) remains for backward compatibility; new flows use `ProtocolOccurrenceTeam`.

## Foundation

| MF | Usage |
|----|--------|
| MF-1 | Deacons ministry |
| MF-2 | `PROTOCOL_TEAM` operational unit |
| MF-7 | `OperationOccurrence` + `PROTOCOL_TEAM` assignment slot |
| MF-6 | Audit + permissions |

## API

Base path: `/api/v1/protocol`

| Endpoint | Description |
|----------|-------------|
| `GET /dashboard` | Leader summary |
| `GET /dashboard/me` | Member summary |
| `POST /teams/generate` | Generate occurrence team |
| `PATCH /teams/:id/status` | Workflow: GENERATED → REVIEWED → APPROVED → PUBLISHED → COMPLETED |
| `POST /attendance` | Record outcome (drives statistics) |
| `POST /replacements` | Self-found replacement request |
| `PATCH /replacements/:id` | Approve/reject |
| `POST /rankings/generate` | Monthly rankings + badges |

## Auto-generation

When an MF-7 occurrence is **published** and includes a `PROTOCOL_TEAM` assignment, a protocol team is auto-generated.

## Settings

Singleton `ProtocolEngineSettings`:

- `maxOfficialServicesPerMonth` (default 3)
- `maxNonChoirMembers` (default 3)
- Grading weights (PRESENT_FULL = 100, etc.)
