# Platform HTTP guards — wave 2

## Scope

Extend `@RequireUiCapability` to protocol API surface, church timetable, global reports export, and admin import.

## Migrated controllers

| Controller | UI capabilities | Notes |
|------------|-----------------|-------|
| `protocol.controller` | team-leadership, admin-hub, team-leader-manage, manage, report-team-ops, team-manage, team-approve-publish, attendance-manage, replacement-manage, rankings-oversight, report | Mutations + officer dashboards; member read routes stay legacy |
| `church-schedule-timetable.controller` | view-queue, manage, resolve | Timetable GET still legacy `CHURCH_SCHEDULE_VIEW` |
| `reports.controller` | `report-export` | All export/summary routes |
| `pilot-ready.controller` | `admin-import`, `protocol-attendance-manage` | Imports + bulk protocol attendance |

## Tests

```bash
cd backend && npm test -- --testPathPatterns="platform-http-access|platform-ui-capability"
cd backend && npm run build
```

## Deferred

- Protocol read-only list/search routes (`protocol.view` baseline)
- `church-intelligence.controller`, `system.controller` stats
- Pilot bulk members/notify (no platform UI cap yet)
- Service-layer assert parity
