# Protocol Reporting

Comprehensive ministry analytics at `/protocol/reports`.

Last updated: July 2026

---

## Report hub tabs

| Tab | Purpose |
|-----|---------|
| **Overview** | Executive summary — health score, scheduling pipeline, officer SLA |
| **Scheduling** | Monthly choir plan status + protocol team build/publish counts |
| **Services** | Per-occurrence teams, roster size, attendance outcomes |
| **Attendance** | Member-level assigned vs attended, punctuality, absences |
| **Replacements** | Substitution requests (pending / approved / rejected) |
| **Reliability** | Lifetime reliability standings |
| **Quota** | Three-service rule compliance per member |
| **Team reports** | Post-service leader narratives |

All month-scoped tabs use the **period picker** (year + month).

---

## API endpoints

Base: `/api/v1/protocol/reports`

| Endpoint | Description |
|----------|-------------|
| `GET /summary?year=&month=` | Executive rollup for overview tab |
| `GET /health?year=&month=` | Ministry health score + grade |
| `GET /scheduling?year=&month=` | Choir plan + team pipeline |
| `GET /monthly-service?year=&month=` | Per-service team delivery |
| `GET /attendance?year=&month=` | Member attendance profiles |
| `GET /replacements?year=&month=` | Replacement activity |
| `GET /reliability` | Lifetime reliability (all active members) |
| `GET /quota?year=&month=` | Monthly assignment cap compliance |
| `GET /health-pack.pdf?year=&month=` | Full ministry PDF report |
| `GET /:type/export?year=&month=` | CSV export (`monthly-service`, `attendance`, `replacements`, `reliability`, `scheduling`, `quota`) |

Team leader narratives:

| Endpoint | Description |
|----------|-------------|
| `GET /protocol/reports` | List submitted narratives |
| `POST /protocol/reports` | Submit post-service report |

Officer SLA (overview): `GET /protocol/dashboard/officer-sla`

Rankings (linked): `/protocol/rankings`

---

## Health score

```
score = attendanceComponent - backlogPenalty - officerAttentionPenalty
```

| Factor | Source |
|--------|--------|
| Attendance component | Avg `attendanceRate` from active profiles (month) |
| Backlog penalty | Pending claims, replacements, draft teams (max 25) |
| Officer penalty | SLA attention + breach counts (max 20) |

Grades: A ≥90, B ≥75, C ≥60, D ≥40, F &lt;40

---

## Ministry report PDF

The **Full ministry report PDF** includes:

1. Health score breakdown
2. Monthly scheduling (plan status, choir rows, teams built/published)
3. Service delivery (roster slots, attendance rate)
4. Replacement summary
5. Quota violations
6. Officer SLA queue status
7. Per-service detail (up to 20 rows)

---

## Web UI

| Path | Component |
|------|-----------|
| `/protocol/reports` | `ProtocolReportsHub` |
| `/protocol/secretary` | Links to reports + register panel |
| `/protocol/rankings` | Monthly category rankings (separate) |

Key files:

- `web/components/protocol/reports/ProtocolReportsHub.tsx`
- `backend/src/protocol/protocol-reports.service.ts`
- `web/lib/protocol/report-types.ts`

---

## Permissions

Requires `protocol-report` capability for analytics tabs and exports.

Team narrative submit requires `protocol-report-team-ops`.

Officer SLA panel uses `protocol-report` on the reports page; API uses `protocol-rankings-oversight`.

---

## Related docs

- [`PROTOCOL_COMMITTEE_SPEC.md`](PROTOCOL_COMMITTEE_SPEC.md) — officer desks
- [`PROTOCOL_ENGINE.md`](PROTOCOL_ENGINE.md) — team workflow
- [`PROTOCOL_SYSTEM_STATUS.md`](../PROTOCOL_SYSTEM_STATUS.md) — module status
