# Choir-scoped HTTP guards — wave 3 (choir scheduling)

## Scope

Migrate the full `choir/scheduling` controller off legacy `@RequireAnyPermissions`.

## Registry additions

- **`ops-member-scheduling`** — member self-service (dashboard/me, attendance/me, recognition/me, rankings/me)
- **`ops-attendance-manage`** / **`ops-attendance-view`**
- **`ops-rankings-view`**
- **`ops-activities-hub`** — extended with `choir.rehearsal.view@choir`

## Route mapping

| Area | Capability |
|------|------------|
| Leader dashboard, calendar, assignment reads, plans, search | `ops-scheduling-hub` |
| Schedule mutations (accept/decline, adjustments, plans generate) | `ops-schedule-manage` |
| Activities CRUD | `ops-activities-manage` / `ops-activities-hub` |
| Church direct assign / auto-assign | `church-service-request-schedule` |
| Attendance record / list | `ops-attendance-manage` / `ops-attendance-view` |
| Member self routes | `ops-member-scheduling` |
| Rankings | `ops-rankings-view` |
| Inline reports | `ops-reports-hub` |

## Deferred

- Welfare, music, finance controllers
- Mobile parity

## Tests

```bash
cd backend && npm test -- --testPathPatterns="ops-http-access|ops-capability-contract"
cd backend && npm run build
```
