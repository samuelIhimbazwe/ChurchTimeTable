# Platform HTTP guards — wave 3

## Scope

Church intelligence, system admin, audit, announcements, and service-request HTTP guards.

## Registry additions

- **`church-intelligence-view`** — `church.intelligence.view`, `church.governance.view`, `church.reports.view`, and manage aliases
- **`admin-settings-manage`** — now includes `admin.settings.view@platform` (settings view-only admins)

## Migrated controllers

| Controller | Capabilities |
|------------|--------------|
| `church-intelligence.controller` (+ activity, leadership analytics) | `church-intelligence-view`, `church-governance-manage`, `report-export` |
| `system.controller` | `admin-settings-manage` |
| `audit.controller` | `admin-audit-view` |
| `church.controller` | `church-announcements-manage` (POST broadcasts; was unguarded) |
| `ministry-announcements.controller` | `ministry-announcement-manage` (mutations) |
| `choir-service-ops.controller` | `church-service-request-create`, `church-service-request-schedule`, `church-governance-manage` |

## Deferred

- Protocol read/list routes (`protocol.view` baseline)
- Mixed pilot/setup/deployment routes
- `ministry-platform.controller`, sync/roles controllers
- Remove legacy permission fallback on web once auths always hydrate

## Tests

```bash
cd backend && npm test -- --testPathPatterns="platform-http-access|platform-ui-capability-contract"
cd backend && npm run build
```
