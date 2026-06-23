# Platform capabilities — wave 5 (UI parity + admin/ministry routes)

## Scope

Unified platform capability checks on web and backend, plus remaining admin/ministry/setup HTTP routes.

## Web

- **`usePlatformUiCapability`** — single combined check: scoped auths from `/auth/me` **or** JWT permission mapping (no separate pre/post-hydration branches)
- Removes the old “auths empty → legacy only” split

## Registry additions

- **`ministry-platform-view`** — ministry dashboard/activity/reports
- **`pilot-readiness-view`** — setup, deployment status, pilot readiness endpoints
- **`admin-users-manage`** — now includes `admin.users.view@platform`

## Backend HTTP

| Controller | Capabilities |
|------------|--------------|
| `system-users.controller` | All routes → `admin-users-manage` |
| `ministry-platform.controller` | All routes → `ministry-platform-view` (CSV/PDF were unguarded) |
| `setup.controller` | `pilot-readiness-view`; configuration PATCH → `admin-settings-manage` |
| `deployment.controller` | Go-live report → `pilot-readiness-view` |
| `pilot-ready.controller` | Readiness GET → `pilot-readiness-view` |

`PlatformHttpAccessService` — combined scoped + permission check (matches web).

## Deferred

- Choir committee routes in `governance.controller`
- Choir-scoped controllers (welfare, music, finance, etc.)
- Mobile parity

## Tests

```bash
cd backend && npm test -- --testPathPatterns="platform-http-access|platform-ui-capability-contract"
cd backend && npm run build
```
