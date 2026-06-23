# Platform capabilities — wave 6 (church schedule read surface)

## Scope

Finish platform HTTP guards for church schedule **read** routes, facilities list, ministry announcement reads, and church service ops list endpoints. Light UI page gates for parity.

## Registry additions

- **`church-schedule-view`** — submit, view, manage, view.queue
- **`church-facility-view`** — facility view + manage
- **`ministry-announcement-view`** — ministry view + announcement view/manage
- **`church-service-requests-view`** — governance view/manage, operations, choir oversight, ops schedule
- **`church-service-assignments-view`** — schedule queue/manage/resolve + governance manage

## Backend HTTP

| Controller | Routes | Capability |
|------------|--------|------------|
| `church-schedule-submissions` | GET scopes/mine/:id, POST cancel | `church-schedule-view` |
| `church-schedule-timetable` | GET timetable | `church-schedule-view` |
| `church-facilities` | GET list | `church-facility-view` |
| `ministry-announcements` | GET :id, POST read, nested GET list | `ministry-announcement-view` |
| `choir-service-ops` | GET service-requests, assignments, conflicts | `church-service-requests-view` / `church-service-assignments-view` |

## Web UI

Page-level `CapabilityGate` on timetable, mine submissions, facilities, and service assignments.

## Deferred

- Choir committee routes in `governance.controller`
- Choir-scoped preparation routes in `choir-service-ops`
- Choir domains (welfare, music, finance, etc.)
- Mobile parity

## Tests

```bash
cd backend && npm test -- --testPathPatterns="platform-http-access|platform-ui-capability-contract"
cd backend && npm run build
```
